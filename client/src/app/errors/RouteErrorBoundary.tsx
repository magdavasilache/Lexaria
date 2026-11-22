import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import PageErrorFallback from "./PageErrorFallback";

export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();

    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary FallbackComponent={PageErrorFallback} onReset={reset} resetKeys={[pathname]}>
                    {children}
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    );
}
