import {type Category, createCategory} from "./Category.ts";
import {loadTaxonomyFromUrl, TaxonomyDetector} from "./TaxonomyDetector.ts";
import type {DetectorOptions} from "./TaxonomyDetector.ts";

let detector: TaxonomyDetector | undefined;

// const originalUrl = 'https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt';
const corsedUrl = 'https://cdn.jsdelivr.net/gh/dmmmd/google-product-taxonomy-cache@main/latest.txt';

const getDetector = async (): Promise<TaxonomyDetector> => {
    if (!detector) {
        const entries = await loadTaxonomyFromUrl(corsedUrl);
        console.log({entries});
        detector = new TaxonomyDetector(entries);
        detector.ingest(entries);
    }
    return detector;
}

export const detectCategory = async (itemName: string): Promise<Category> => {
    const options: DetectorOptions = {topK: 6, minDepth: 2};
    const detector = await getDetector();
    const candidates = detector.detect(itemName, options);
    if (candidates.length === 0) {
        throw new Error(`No category found for "${itemName}"`);
    }

    console.log({candidates});

    const chosenCandidate = candidates[0];
    return createCategory(chosenCandidate.id, chosenCandidate.path);
};