import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/libre-caslon-text/400.css'
import '@fontsource/libre-caslon-text/400-italic.css'
import '@fontsource/libre-caslon-text/700.css'
import '@fontsource/explora/400.css'
import './index.css'
import './i18n'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import App from './app/App.tsx'
import AppErrorFallback from './app/errors/AppErrorFallback'
import { queryClient } from './app/queryClient'
import { reportRenderError } from './app/errors/errorReporting'

createRoot(document.getElementById('root')!, {
    onUncaughtError: reportRenderError('uncaught'),
    onCaughtError: reportRenderError('caught'),
    onRecoverableError: reportRenderError('recoverable'),
}).render(
    <StrictMode>
        <ErrorBoundary FallbackComponent={AppErrorFallback}>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ErrorBoundary>
    </StrictMode>,
)
