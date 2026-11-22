import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";
import { serverAssetUrl, useCoverPlaceholder } from "../../../shared/utils/assets";

interface Props {
    title: string;
    imageUrls: string[];
}

export default function ImageCarousel({ title, imageUrls }: Props) {
    const { t } = useTranslation("front/books");
    const placeholder = useCoverPlaceholder();
    const [index, setIndex] = useState(0);
    const count = imageUrls.length;
    const current = serverAssetUrl(imageUrls[index]) ?? placeholder;

    return (
        <div className="flex w-full flex-col gap-2">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-control bg-panelSelectedLight shadow-book dark:bg-panelSelectedDark dark:shadow-bookDark">
                <img
                    key={current}
                    src={current}
                    alt={t("carousel.alt", { title, index: index + 1, count: Math.max(count, 1) })}
                    className="h-full w-full object-cover animate-fade-in"
                />
            </div>

            {count > 1 && (
                <div role="group" aria-label={t("carousel.thumbnails")} className="flex justify-center gap-2">
                    {imageUrls.map((url, thumbIndex) => (
                        <Button
                            key={url}
                            variant="option"
                            aria-pressed={thumbIndex === index}
                            aria-label={t("carousel.show", { index: thumbIndex + 1, count })}
                            onClick={() => setIndex(thumbIndex)}
                            className="h-16 w-12 !p-1 aria-pressed:ring-2 aria-pressed:ring-primaryLight dark:aria-pressed:ring-primaryDark"
                        >
                            <span className="block h-full w-full overflow-hidden rounded-control">
                                <img src={serverAssetUrl(url) ?? placeholder} alt="" className="h-full w-full object-cover" />
                            </span>
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
