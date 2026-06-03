// api-handling/rtk-hooks/chatbot/useChat.ts

import { useMutation } from "@tanstack/react-query";
import { authorizedAxios } from "../../../api/authorizedAxios";
import { ChatApiResponse } from "../../../types/chatbot-types";

const INFERENCE_BASE = "ml-inference";


type SendMessageArgs = {
    message: string;
    conversation_id: number | null;
};

export const sendMessageMutation = async (
    args: SendMessageArgs
): Promise<ChatApiResponse> => {
    const response = await authorizedAxios(INFERENCE_BASE).post("/message", {
        message: args.message,
        conversation_id: args.conversation_id,
    });

    return response.data;
};


export const useSendMessage = () =>
    useMutation({
        mutationFn: sendMessageMutation,
    });