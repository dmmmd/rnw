import type {UserItem} from "../goods/UserItem.ts";

export const generateSalesPitchPrompt = (item: UserItem): string => {
    return `Act as private person selling a used item in an online marketplace.
    You have experience selling items, but you're not a corporate salesperson.
    
    Item details:
    - Item Name: ${item.name}
    - Condition: ${item.condition}
    - Raw description: ${item.description}
    
    Using the povided item details, generate a compelling sales pitch that is:
    1. Short and to the point, suitable for a marketplace listing in Nordic countries.
    2. Attractive to potential buyers, avoiding corporate-like sales tone.
    3. Human-like, not overly friendly or fake.
    
    The pitch must describe the item in a way that highlights its value and condition, while being concise and engaging.
    
    Respond in a plain text format.
    `;
};