import { useTranslation } from "react-i18next";

const DAY_MS = 24 * 60 * 60 * 1000
const LONG_QUOTE_LENGTH = 70
const SHORT_QUOTE_CLASS = "font-explora text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight"
const LONG_QUOTE_CLASS = "font-libre italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-snug"

const dayIndex = () => {
    const now = new Date()
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS)
}

export default function Quote() {
    const { t } = useTranslation("front/welcome")
    const quotes = t("quotes", { returnObjects: true })
    const quote = quotes[dayIndex() % quotes.length]

    return (
        <figure className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20 text-fontPrimaryLight dark:text-fontPrimaryDark">
            <blockquote className={`text-center break-words whitespace-pre-line ${quote.text.length > LONG_QUOTE_LENGTH ? LONG_QUOTE_CLASS : SHORT_QUOTE_CLASS}`}>
                {quote.text}
            </blockquote>
            <figcaption className="font-libre text-base sm:text-lg md:text-2xl text-center md:text-right mt-4 md:mt-6">
                — {quote.author}, <cite>{quote.source}</cite>
            </figcaption>
        </figure>
    )
}
