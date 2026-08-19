// Utilities for dependency-ordered bulk loading of seed fixtures.
// Useful when loading many collections from JSON files where some documents
// reference others (e.g. posts reference users by username → ObjectId).

export type Resolver<TRaw, TResolved> = (
  raw: TRaw,
  context: Record<string, unknown[]>
) => TResolved;

// Apply a resolver to every raw document, passing the full seeded context
export const resolveAll = <TRaw, TResolved>(
  raw: TRaw[],
  resolve: Resolver<TRaw, TResolved>,
  context: Record<string, unknown[]>
): TResolved[] => raw.map(item => resolve(item, context));

// Topological sort of a dependency graph — returns insertion order
export const computeImportOrder = (deps: Record<string, string[]>): string[] => {
  const visited = new Set<string>();
  const order: string[] = [];

  const visit = (node: string) => {
    if (visited.has(node)) return;
    (deps[node] ?? []).forEach(visit);
    visited.add(node);
    order.push(node);
  };

  Object.keys(deps).forEach(visit);
  return order;
};

// Collection dependency graph for this app — extend as you add collections
export const COLLECTION_DEPS: Record<string, string[]> = {
  users:    [],
  posts:    ['users'],
  comments: ['users', 'posts'],
};

export const IMPORT_ORDER = computeImportOrder(COLLECTION_DEPS);
