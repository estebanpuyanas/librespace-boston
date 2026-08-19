// Pass-through resolver for leaf collections (e.g. users, tags) that have
// no cross-collection references to resolve before insertion.
export const identityResolver = <T>(raw: T): T => raw;
