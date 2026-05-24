export interface TestItemLike {
  id: string;
  label: string;
}

export function isTestItemLike(value: unknown): value is TestItemLike {
  return typeof value === "object" && value !== null && "id" in value && "label" in value;
}

export function resolveCommandTargets<T>(
  args: unknown[],
  guard: (value: unknown) => value is T
): T[] {
  if (args.length === 0) {
    return [];
  }

  const first = args[0];

  if (guard(first)) {
    return [first];
  }

  if (Array.isArray(first)) {
    return first.filter(guard);
  }

  return [];
}

export function collectRequestedTests<T>(include: readonly T[] | undefined, all: readonly T[]): T[] {
  if (include && include.length > 0) {
    return [...include];
  }

  return [...all];
}
