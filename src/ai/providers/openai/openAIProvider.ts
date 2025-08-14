import type {AIPrompt, AIProvider} from "../aiProvider.ts";

class OpenAIProvider implements AIProvider {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateText(prompt: AIPrompt): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{role: 'user', content: prompt.prompt}],
                temperature: 0.7,
                max_tokens: 256,
            }),
        });
        if (!response.ok) throw new Error('Cannot generate a sales pitch');

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI');
        return content;
    }
}

export const createOpenAIProvider = (apiKey: string): AIProvider => {
    return new OpenAIProvider(apiKey);
};