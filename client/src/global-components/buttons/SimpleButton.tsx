interface Props {
    text: string
    buttonFunction: () => void
}

export default function SimpleButton({ text, buttonFunction }: Props) {
    return (
        <button
            className="px-4 py-1.5 font-libre bg-primaryLight dark:bg-primaryDark text-fontSecondaryLight dark:text-fontPrimaryDark rounded-xs hover:bg-primaryLightDarkTone dark:hover:bg-primaryDarkDarkTone
            dark:hover:text-fontSecondaryDark
transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#472d0a] w-full"
            onClick={buttonFunction}
        >
            {text}
        </button>
    )
}