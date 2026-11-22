import type { ErrorInfo } from "react";

type Kind = "uncaught" | "caught" | "recoverable";

export const reportRenderError = (kind: Kind) => (error: unknown, info: Pick<ErrorInfo, "componentStack">) => {
  console.error(`[lexaria] ${kind} render error`, error, info.componentStack ?? "");
};
