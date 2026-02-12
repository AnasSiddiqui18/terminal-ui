import { Text, Box, useInput } from "ink";
import Spinner from "ink-spinner";
import { useEffect, useState } from "react";
import z from "zod";
import TerminalRenderer from "marked-terminal";
import { marked } from "marked";
import fs from "fs";
import { jsonrepair } from "jsonrepair";

const TITLE = `
 ███╗   ███╗  █████╗   ██████╗  ██╗  ██████╗
 ████╗ ████║ ██╔══██╗ ██╔════╝  ██║ ██╔════╝
 ██╔████╔██║ ███████║ ██║  ███╗ ██║ ██║     
 ██║╚██╔╝██║ ██╔══██║ ██║   ██║ ██║ ██║     
 ██║ ╚═╝ ██║ ██║  ██║ ╚██████╔╝ ██║ ╚██████╗
 ╚═╝     ╚═╝ ╚═╝  ╚═╝  ╚═════╝  ╚═╝  ╚═════╝

 ██████╗   ██████╗  ████████╗
 ██╔══██╗ ██╔═══██╗ ╚══██╔══╝
 ██████╔╝ ██║   ██║    ██║   
 ██╔══██╗ ██║   ██║    ██║   
 ██████╔╝ ╚██████╔╝    ██║  
 ╚═════╝   ╚═════╝     ╚═╝ 
`;

type Message =
    | {
          content: string;
          id: string;
          type: "error" | "token";
          role: "assistant";
      }
    | {
          content: string;
          id: string;
          role: "user";
      };

// @ts-ignore
marked.setOptions({ renderer: new TerminalRenderer() });

const streamingResponseSchema = z.union([
    z.object({ type: z.literal("error"), message: z.string() }),
    z.object({ type: z.literal("token"), value: z.string() }),
]);

function logStreamError(error: any) {
    const logLine = `[${new Date().toUTCString()}] [ERROR] ${
        error.stack || error.message
    }\n`;

    fs.appendFile("stream-error.log", logLine, (err) => {
        console.error("failed to write log", err);
    });
}

export default function App() {
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);

    const [showCursor, setShowCursor] = useState(true);

    const [loading, setLoading] = useState(false);

    useInput(async (input, key) => {
        if (key.upArrow && messages.length) {
            const latestUserMessage = messages.at(-2);
            if (latestUserMessage) setInputValue(latestUserMessage.content);
        }

        if (key.return) {
            if (inputValue.trim()) {
                const userMessage = {
                    content: inputValue,
                    id: crypto.randomUUID(),
                    role: "user" as const,
                };

                setInputValue("");
                setMessages((prev) => [...prev, userMessage]);

                // sendMessage({text: inputValue});

                setLoading(true);

                try {
                    const response = await fetch("http://localhost:3000/chat", {
                        body: JSON.stringify({ prompt: inputValue }),
                        method: "POST",
                        headers: { Accept: "text/event-stream" },
                    });

                    const messageId = crypto.randomUUID();

                    const reader = response.body?.getReader();

                    setLoading(false);

                    const decoder = new TextDecoder("utf-8");

                    while (true && reader) {
                        const { done, value } = await reader.read();

                        if (done) break;

                        const textChunk = decoder.decode(value).trim();

                        const parsedChunk = JSON.parse(jsonrepair(textChunk));

                        const validatedData =
                            streamingResponseSchema.safeParse(parsedChunk);

                        const { data, success } = validatedData;

                        if (!success) {
                            setMessages((prevMessages) => [
                                ...prevMessages,
                                {
                                    content: "invalid response from server",
                                    role: "assistant",
                                    id: messageId,
                                    type: "error",
                                },
                            ]);

                            return;
                        }

                        if (data.type === "error") {
                            setMessages((prevMessages) => [
                                ...prevMessages,
                                {
                                    content: data.message,
                                    role: "assistant",
                                    id: messageId,
                                    type: "error",
                                },
                            ]);

                            return;
                        }

                        setMessages((prevMessages) => {
                            const existingMessage = prevMessages.find(
                                (message) => message.id === messageId
                            );

                            if (existingMessage)
                                return prevMessages.map((message) =>
                                    message.id === messageId
                                        ? {
                                              ...message,
                                              content:
                                                  message.content + data.value,
                                          }
                                        : message
                                );

                            return [
                                ...prevMessages,
                                {
                                    id: messageId,
                                    content: data.value,
                                    role: "assistant",
                                    type: "token",
                                },
                            ];
                        });
                    }

                    setInputValue("");
                } catch (error) {
                    logStreamError(error);

                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            content: "Something went wrong",
                            role: "assistant",
                            id: crypto.randomUUID(),
                            type: "error",
                        },
                    ]);

                    setLoading(false);
                }
            }
        } else if (key.backspace || key.delete) {
            setInputValue((prev) => prev.slice(0, -1));
        } else {
            setInputValue((prev) => prev + input);
        }
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box flexDirection="column" padding={1}>
            <Text color="white">{TITLE}</Text>

            <Box flexDirection="column" marginTop={1}>
                {messages.map((msg, index) => {
                    const isBot = msg.role === "assistant";

                    return (
                        <Box key={index} gap={1}>
                            <Text color={isBot ? "cyan" : "green"} bold>
                                {isBot ? "❯ Bot " : "❯ You "}
                            </Text>

                            <Text
                                color={
                                    msg.role === "assistant" &&
                                    msg.type === "error"
                                        ? "redBright"
                                        : "white"
                                }
                                wrap="wrap"
                            >
                                {marked(msg.content)}
                            </Text>
                        </Box>
                    );
                })}

                {loading && (
                    <Box gap={1}>
                        <Text color="cyan">
                            <Spinner type="dots" />
                        </Text>
                        <Text>Thinking...</Text>
                    </Box>
                )}
            </Box>

            <Box
                marginTop={1}
                borderStyle="single"
                paddingLeft={1}
                alignItems="flex-start"
            >
                <Text color="white">
                    {inputValue ? (
                        inputValue
                    ) : (
                        <Text color="blackBright">ask a question....</Text>
                    )}
                    <Text
                        backgroundColor={!showCursor ? "black" : "white"}
                        color="black"
                    >
                        {" "}
                    </Text>
                </Text>
            </Box>
        </Box>
    );
}
