export interface Category {
    id: number;
    path: string;
}

class SimpleCategory implements Category {
    private readonly id: number;
    private readonly path: string;

    constructor(id: number, path: string) {
        this.id = id;
        this.path = path;
    }
}

export function createCategory(id: number, path: string): Category {
    return new SimpleCategory(id, path);
}