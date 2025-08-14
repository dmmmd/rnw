import type {ItemCondition} from "./ItemCondition.ts";

export type UserItem = {
    name: string;
    condition: ItemCondition;
    description: string;
}
