export function mappedErrorMessage(
  error: unknown,
  messages: Readonly<Record<string, string>>,
  fallback: string,
): string {
  if (!(error instanceof Error)) return fallback;

  const semanticCode =
    "errorCode" in error && typeof error.errorCode === "string"
      ? error.errorCode
      : undefined;

  return (
    (semanticCode ? messages[semanticCode] : undefined) ??
    messages[error.message] ??
    error.message ??
    fallback
  );
}
