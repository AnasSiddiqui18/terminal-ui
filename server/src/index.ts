import { Hono } from "hono";
import { model } from "@/lib/ai/google";
import { smoothStream, streamText } from "ai";
import { cors } from "hono/cors";

const promptHandler = (userPrompt: string) => `

You are an AI assistant. Your task is to answer the user's questions clearly and concisely in **plain text**. 
- Do NOT respond with code, scripts, or formatting instructions.
- Keep your answers straightforward, informative, and conversational.
- Only provide extra explanations if they help clarify your answer.

USER PROMPT:
${userPrompt}

Your response should be text-only:
`;

const app = new Hono();

app.use(
    "*",
    cors({
        origin: "*",
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["*"],
        credentials: true,
    }),
);

app.post("/chat", async (c) => {
    try {
        const { prompt } = await c.req.json();

        if (!prompt)
            return c.json({ message: "prompt not found", type: "error" }, 404);

        const stream = new ReadableStream({
            async start(controller) {
                const result = streamText({
                    model,
                    prompt: promptHandler(prompt),
                    experimental_transform: smoothStream({
                        delayInMs: 30,
                        chunking: "word",
                    }),
                    onError: (error) => {
                        console.error("error happened!!!", error);

                        controller.enqueue(
                            JSON.stringify({
                                type: "error",
                                message: "Streaming failed....",
                            }) + "\n",
                        );
                        controller.close();
                    },
                });

                for await (const chunk of result.textStream) {
                    controller.enqueue(
                        JSON.stringify({
                            type: "token",
                            value: chunk,
                        }) + "\n",
                    );
                }

                controller.close();
            },
        });

        return new Response(stream);
    } catch (error) {
        return c.json(
            {
                type: "error",
                message:
                    "failed to generate answer, check server logs for more details...",
            },
            500,
        );
    }
});

export default { fetch: app.fetch, idleTimeout: 60 };
