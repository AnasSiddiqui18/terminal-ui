import { useChatMessages } from "@ai-sdk-tools/store";
import { useEffect } from "react";

export function Test() {
    const messages = useChatMessages();

    useEffect(() => {
        const message = messages[0];
        console.log("part", message?.parts);
    }, [messages]);

    return "";
}
