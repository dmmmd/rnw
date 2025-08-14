import type {AIProvider} from "./aiProvider.ts";
import {createOpenAIProvider} from "./openai/openAIProvider.ts";

let aiProvider: AIProvider | undefined;

export const getAIProvider = (): AIProvider => {
    if (!aiProvider) {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) throw new Error('Missing OpenAI API key');

        aiProvider = createOpenAIProvider(apiKey);
    }
    return aiProvider;
};