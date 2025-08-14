// All of this should be server-side

import {type Category, createCategory} from "./Category.ts";
import {getAIProvider} from "../../ai/providers/aiProviderManager.ts";
import {createSimpleAIPrompt} from "../../ai/providers/aiProvider.ts";

// const originalUrl = 'https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt';
const corsedUrl = 'https://cdn.jsdelivr.net/gh/dmmmd/google-product-taxonomy-cache@main/latest.txt';

type CategoryCandidate = {
    id: number;
    /** Full breadcrumb, e.g., "Electronics > Communications > Telephony > Mobile Phones" */
    path: string;
    /** Leaf category name, last segment of the path */
    leaf: string;
    /** Number of segments in the path */
    depth: number;
};

let possibleCategoriesCache: Map<number, CategoryCandidate>|undefined;

const getPossibleCategories = async (): Promise<Map<number, CategoryCandidate>> => {
    if (undefined !== possibleCategoriesCache) {
        return Promise.resolve(possibleCategoriesCache);
    }

    const res = await fetch(corsedUrl);
    if (!res.ok) throw new Error(`Failed to fetch taxonomy: ${res.status} ${res.statusText}`);

    const text = await res.text();
    const entries = parseTaxonomyText(text);
    possibleCategoriesCache = new Map;
    entries.forEach(entry => {
        possibleCategoriesCache.set(entry.id, entry);
    });

    return possibleCategoriesCache;
};

/**
 * Load and parse the taxonomy from the official Google text file format.
 * The file has lines like: "2271 - Animals & Pet Supplies > Pet Supplies > Bird Supplies"
 * You can pass the file contents directly (recommended for browser builds)
 * or fetch it on Node.js and then call this with the text.
 */
const parseTaxonomyText = (taxonomyText: string): CategoryCandidate[] => {
    const lines = taxonomyText.split(/\r?\n/);
    const entries: CategoryCandidate[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue; // skip empty and comments
        const match = trimmed.match(/^(\d+)\s*-\s*(.+)$/);
        if (!match) continue;
        const id = Number(match[1]);
        const path = match[2].trim();
        const segments = path.split(" > ").map(s => s.trim());
        const topCategory = segments[0];
        if (topCategory !== 'Electronics') {
            // As part of the rough prototype, we're allowed to limit the amount of categories, and thus the size of the AI prompt
            continue;
        }

        const leaf = segments[segments.length - 1];
        entries.push({id: +id, path, leaf, depth: segments.length });
    }
    return entries;
}


export const detectCategory = async (itemName: string): Promise<Category|undefined> => {
    const candidates = await getPossibleCategories();
    const candidatesTsv = [...candidates.values()].map(e => `${e.id}\t${e.path}`).join("\n");

    const safeItemname = itemName.toLowerCase(); // @todo lots of stuff
    const prompt = `Given the list of potential product categories in TSV format below (as integer categoryId, string category path), detect and return the best matching category for the item "${safeItemname}".
    Return the response in text format, containing only the integer category ID.
    When you can find no matching category -- return zero.
    
    The TSV with possible categories:
    ${candidatesTsv}`;

    const candidateId = await getAIProvider().generateText(createSimpleAIPrompt(prompt));
    if (!Number.isInteger(+candidateId) || 0 >= +candidateId) {
        return undefined;
    }

    const candidate = candidates.get(+candidateId);
    if (!candidate) {
        // @todo Log the AI failure or throw
        return undefined;
    }

    return createCategory(candidate.id, candidate.path);
};