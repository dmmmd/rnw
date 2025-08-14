/**
 * Core idea
 * - Load the official taxonomy text file (ID —> breadcrumb path)
 * - Tokenize category names and the input title
 * - Build a light TF–IDF index over categories
 * - Score categories with cosine similarity + small depth/phrase boosts
 * - Return top-N candidates with normalized probabilities
 */

// ------------------------------ Types ------------------------------
export type TaxonomyEntry = {
    id: number;
    /** Full breadcrumb, e.g., "Electronics > Communications > Telephony > Mobile Phones" */
    path: string;
    /** Leaf category name, last segment of the path */
    leaf: string;
    /** Number of segments in the path */
    depth: number;
};

type Candidate = {
    id: number;
    path: string;
    leaf: string;
    depth: number;
    score: number; // raw score
    probability: number; // softmax-normalized
};

export type DetectorOptions = {
    /**
     * Top-K candidates to return.
     * @default 8
     */
    topK?: number;
    /**
     * Temperature for softmax; lower -> peakier probabilities.
     * @default 0.7
     */
    temperature?: number;
    /**
     * If true, we add small boosts for deeper categories & exact phrase matches.
     * @default true
     */
    enableHeuristics?: boolean;
    /**
     * Minimum leaf-depth to consider; higher filters very generic categories.
     * @default 1 (no filter)
     */
    minDepth?: number;
};

// ------------------------------ Utils ------------------------------

const DEFAULT_STOPWORDS = new Set<string>([
    // Common English stopwords + ecommerce fluff
    "a","an","the","and","or","but","for","nor","so","of","in","on","to","with","by","at","from",
    "is","are","was","were","be","been","being",
    "this","that","these","those","it","its","as","if","than","too","very","can","will","just",
    // listing noise
    "new","used","like","grade","refurbished","sale","deal","bundle","set","pack","compatible","for",
    // units/variants
    "gb","tb","inch","inches","mm","cm","xl","xxl","pro","max","mini","ultra","series","gen","generation"
]);

function normalize(text: string): string {
    return text
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'") // curly quotes → straight
        .replace(/[^a-z0-9\s'+&/-]/g, " ") // keep some symbols useful for models (e.g., dslr, wi-fi)
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(text: string): string[] {
    const norm = normalize(text);
    const raw = norm.split(/[^a-z0-9+]+/g);
    const tokens = raw
        .filter(t => t.length > 1)
        .filter(t => !DEFAULT_STOPWORDS.has(t));
    return tokens;
}

function softmax(scores: number[], temperature: number): number[] {
    const t = Math.max(temperature, 1e-4);
    const max = Math.max(...scores);
    const exps = scores.map(s => Math.exp((s - max) / t));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => (sum === 0 ? 0 : e / sum));
}

// ------------------------------ Index ------------------------------

type Vector = Map<string, number>; // token -> weight (tf-idf)

export class TaxonomyDetector {
    private entries: TaxonomyEntry[] = [];
    private idf: Map<string, number> = new Map();
    private vectors: Vector[] = []; // aligned to entries
    private tokenDocFreq: Map<string, number> = new Map();

    /**
     * Ingest entries and build the TF–IDF index.
     */
    ingest(entries: TaxonomyEntry[]) {
        this.entries = entries;
        // 1) Document frequency per token
        this.tokenDocFreq.clear();
        const docs: string[][] = entries.map(e => this.categoryTokens(e));

        for (const doc of docs) {
            const unique = new Set(doc);
            for (const tok of unique) {
                this.tokenDocFreq.set(tok, (this.tokenDocFreq.get(tok) || 0) + 1);
            }
        }

        // 2) IDF
        const N = entries.length;
        this.idf.clear();
        for (const [tok, df] of this.tokenDocFreq) {
            const idf = Math.log((N + 1) / (df + 1)) + 1; // smoothed IDF
            this.idf.set(tok, idf);
        }

        // 3) Category vectors (tf-idf)
        this.vectors = docs.map(doc => this.tfIdfVector(doc));
    }

    /**
     * Tokenization for a category: use all path segments, but weight will be learned in tf–idf.
     */
    private categoryTokens(e: TaxonomyEntry): string[] {
        const pathTokens: string[] = [];
        for (const seg of e.path.split(" > ")) {
            pathTokens.push(...tokenize(seg));
        }
        return pathTokens;
    }

    private tfIdfVector(tokens: string[]): Vector {
        const tf = new Map<string, number>();
        for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
        // log-normalized term frequency
        for (const [t, f] of tf) tf.set(t, 1 + Math.log(f));

        const vec: Vector = new Map();
        let normSq = 0;
        for (const [t, w] of tf) {
            const idf = this.idf.get(t) || 0;
            const weight = w * idf;
            if (weight === 0) continue;
            vec.set(t, weight);
            normSq += weight * weight;
        }
        const norm = Math.sqrt(normSq) || 1;
        for (const [t, w] of vec) vec.set(t, w / norm);
        return vec;
    }

    private cosineSim(v1: Vector, v2: Vector): number {
        // iterate over smaller vector for speed
        const [small, big] = v1.size <= v2.size ? [v1, v2] : [v2, v1];
        let dot = 0;
        for (const [t, w] of small) {
            const w2 = big.get(t);
            if (w2 !== undefined) dot += w * w2;
        }
        return dot; // both vectors are already L2-normalized
    }

    /**
     * Main API: get top-N categories for a title.
     */
    detect(title: string, opts: DetectorOptions = {}): Candidate[] {
        console.log({title});

        if (!this.entries.length) throw new Error("No taxonomy loaded. Call ingest() first.");

        const { topK = 8, temperature = 0.7, enableHeuristics = true, minDepth = 1 } = opts;

        const qTokens = tokenize(title);
        // If the title is very short, include the raw title words; otherwise qTokens suffices
        const qVec = this.tfIdfVector(qTokens);

        const scores: number[] = new Array(this.entries.length);

        for (let i = 0; i < this.entries.length; i++) {
            const e = this.entries[i];
            if (e.depth < minDepth) { scores[i] = -Infinity; continue; }
            let s = this.cosineSim(qVec, this.vectors[i]);

            if (enableHeuristics) {
                // Depth boost: deeper leaves tend to be more specific; cap the boost
                const depthBoost = Math.min(1 + (e.depth - 1) * 0.06, 1.35);
                s *= depthBoost;

                // Exact leaf phrase boost if the leaf occurs verbatim in the title
                // e.g., "DSLR Camera", "Hearing Aid", "Baby Stroller"
                const leafLower = e.leaf.toLowerCase();
                const titleLower = title.toLowerCase();
                if (leafLower.length > 3 && titleLower.includes(leafLower)) {
                    s += 0.15;
                }

                // Penalize very generic high-level buckets slightly
                if (e.depth <= 2) s *= 0.92;
            }

            scores[i] = s;
        }

        // Take top-K indices
        const idx = Array.from(scores.keys())
            .filter(i => Number.isFinite(scores[i]))
            .sort((a, b) => (scores[b] - scores[a]))
            .slice(0, topK);

        const normProbs = softmax(idx.map(i => scores[i]), temperature);

        return idx.map((i, j) => ({
            id: this.entries[i].id,
            path: this.entries[i].path,
            leaf: this.entries[i].leaf,
            depth: this.entries[i].depth,
            score: scores[i],
            probability: normProbs[j],
        }));
    }
}

// ------------------------------ Convenience: loader helpers ------------------------------

/**
 * Parse the official taxonomy format from a URL (Node.js only; falls back to fetch if available).
 * Note: In browsers this URL may be blocked by CORS; prefer bundling the file.
 */
export async function loadTaxonomyFromUrl(url: string): Promise<TaxonomyEntry[]> {
    // Node 18+ has global fetch; otherwise you can swap to https.get
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch taxonomy: ${res.status} ${res.statusText}`);
    const text = await res.text();
    return parseTaxonomyText(text);
}

/**
 * Load and parse the taxonomy from the official Google text file format.
 * The file has lines like: "2271 - Animals & Pet Supplies > Pet Supplies > Bird Supplies"
 * You can pass the file contents directly (recommended for browser builds)
 * or fetch it on Node.js and then call this with the text.
 */
const parseTaxonomyText = (taxonomyText: string): TaxonomyEntry[] => {
    const lines = taxonomyText.split(/\r?\n/);
    const entries: TaxonomyEntry[] = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue; // skip empty and comments
        const match = trimmed.match(/^(\d+)\s*-\s*(.+)$/);
        if (!match) continue;
        const id = Number(match[1]);
        const path = match[2].trim();
        const segments = path.split(" > ").map(s => s.trim());
        const leaf = segments[segments.length - 1];
        entries.push({ id, path, leaf, depth: segments.length });
    }
    return entries;
}
