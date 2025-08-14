const ItemCondition = {
    NEW: 'New',
    LIKE_NEW: 'Like New',
    VERY_GOOD: 'Very Good',
    GOOD: 'Good',
    ACCEPTABLE: 'Acceptable',
    DAMAGED: 'Damaged'
}

export type ItemCondition = typeof ItemCondition[keyof typeof ItemCondition];

export const getPossibleItemConditions = (): ItemCondition[] => {
    return Object.values(ItemCondition);
};