export const SINGLE_TEST_ID_SEPARATOR = "::";

export interface SingleTestIdentity {
  specItemId: string;
  testNamePattern: string;
}

export function buildSingleTestItemId(specItemId: string, testNamePattern: string): string {
  return `${specItemId}${SINGLE_TEST_ID_SEPARATOR}${testNamePattern}`;
}

export function parseSingleTestItemId(itemId: string): SingleTestIdentity | undefined {
  const separatorIndex = itemId.indexOf(SINGLE_TEST_ID_SEPARATOR);
  if (separatorIndex < 0) {
    return undefined;
  }

  const specItemId = itemId.slice(0, separatorIndex);
  const testNamePattern = itemId.slice(separatorIndex + SINGLE_TEST_ID_SEPARATOR.length);

  if (!specItemId || !testNamePattern) {
    return undefined;
  }

  return { specItemId, testNamePattern };
}
