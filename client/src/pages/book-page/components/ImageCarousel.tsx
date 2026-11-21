import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../global-components/buttons/Button";
import { COVER_PLACEHOLDER, serverAssetUrl } from "../../../utils/assets";

interface Props {
    title: string;
    imageUrls: string[];
}

export default function ImageCarousel({ title, imageUrls }: Props) {
    const { t } = useTranslation("front/books");
    const [index, setIndex] = useState(0);
    const count = imageUrls.length;
    const current = serverAssetUrl(imageUrls[index]) ?? COVER_PLACEHOLDER;
    const showControls = count > 1;

    const prev = () => setIndex((i) => (i === 0 ? count - 1 : i - 1));
    const next = () => setIndex((i) => (i === count - 1 ? 0 : i + 1));

    return (
        <div className="w-full max-w-xs mx-auto lg:mx-0 text-fontPrimaryLight dark:text-fontPrimaryDark">
            <div className="relative w-full aspect-[2/3] bg-panelLight dark:bg-panelDark rounded-panel overflow-hidden">
                <img
                    key={current}
                    src={current}
                    alt={t("carousel.alt", { title, index: index + 1, count: Math.max(count, 1) })}
                    className="w-full h-full object-contain animate-fade-in"
                />
                {showControls && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full bg-black/40 text-white">
                        {index + 1} / {count}
                    </span>
                )}
            </div>

            {showControls && (
                <div className="flex w-full gap-1 mt-1">
                    <Button variant="ghost" icon={ArrowLeft} aria-label={t("carousel.previous")} onClick={prev} className="flex-1 min-h-10" />
                    <Button variant="ghost" icon={ArrowRight} aria-label={t("carousel.next")} onClick={next} className="flex-1 min-h-10" />
                </div>
            )}
        </div>
    );
}
