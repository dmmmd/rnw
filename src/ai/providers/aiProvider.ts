export interface AIPrompt {
    get prompt(): string;
}

class StringAIPrompt implements AIPrompt {
    public readonly prompt: string;

    constructor(prompt: string) {
        this.prompt = prompt;
    }
}

export const createSimpleAIPrompt = (prompt: string): AIPrompt => {
    return new StringAIPrompt(prompt);
};

export interface AIProvider {
    generateText(prompt: AIPrompt): Promise<string>;
}