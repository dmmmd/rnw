import type {UserItem} from "../goods/UserItem.ts";
import {createSimpleAIPrompt} from "./providers/aiProvider.ts";
import {generateSalesPitchPrompt} from "./pitchGenerator.ts";
import {getAIProvider} from "./providers/aiProviderManager.ts";

export const generateSalesPitch = (item: UserItem): Promise<string> => {
    const prompt = createSimpleAIPrompt(generateSalesPitchPrompt(item));
    return getAIProvider().generateText(prompt);
};