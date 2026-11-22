import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import { splitSpoilers } from "../utils/spoilers";

function Spoiler({ text }: { text: string }) {
    const { t } = useTranslation("front/common");
    const [shown, setShown] = useState(false);
    if (shown) return <span className="rounded-control bg-panelSelectedLight px-1 dark:bg-panelSelectedDark">{text}</span>;
    return (
        <Button variant="spoiler" size="sm" aria-label={t("spoiler.reveal")} title={t("spoiler.reveal")} onClick={() => setShown(true)}>
            {text}
        </Button>
    );
}

export default function SpoilerText({ text, className = "" }: { text: string; className?: string }) {
    return (
        <p className={`whitespace-pre-line break-words ${className}`}>
            {splitSpoilers(text).map((segment, index) =>
                segment.hidden ? <Spoiler key={index} text={segment.text} /> : <span key={index}>{segment.text}</span>
            )}
        </p>
    );
}
