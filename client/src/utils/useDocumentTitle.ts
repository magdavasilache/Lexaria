import { useEffect } from "react"

export const APP_NAME = "Lexaria"

export function useDocumentTitle(title?: string | null) {
    useEffect(() => {
        document.title = title ? `${APP_NAME} | ${title}` : APP_NAME
        return () => {
            document.title = APP_NAME
        }
    }, [title])
}
