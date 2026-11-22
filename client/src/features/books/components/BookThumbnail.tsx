import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BookListItem } from "../types/bookTypes";
import { serverAssetUrl, useCoverPlaceholder } from "../../../shared/utils/assets";
import Button from "../../../shared/components/Button";

interface Props {
    book: BookListItem;
    isSelected: boolean;
    onSelect: (book: BookListItem) => void;
}

function BookThumbnail({ book, isSelected, onSelect }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const placeholder = useCoverPlaceholder();
    const rating = book.average_rating === null
        ? null
        : new Intl.NumberFormat(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(book.average_rating);

    return (
        <Button variant="card" fullWidth aria-pressed={isSelected} onClick={() => onSelect(book)} className="group min-w-0 h-full !justify-start">
            <span className="flex h-full flex-col gap-2.5">
                <span className="relative block w-full aspect-[2/3] overflow-hidden rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark shadow-book dark:shadow-bookDark">
                    <img
                        src={serverAssetUrl(book.cover_url) ?? placeholder}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                    />
                    {rating && (
                        <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-control bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-onImage backdrop-blur-sm">
                            <Star className="w-3 h-3 fill-ratingDark text-ratingDark" aria-hidden="true" />
                            <span aria-hidden="true">{rating}</span>
                            <span className="sr-only">{t("card.ratingSummary", { count: book.ratings_count, rating })}</span>
                        </span>
                    )}
                </span>

                <span className="flex flex-1 flex-col gap-0.5 px-0.5 pb-0.5">
                    <span className="block font-semibold leading-snug line-clamp-2 break-words">
                        {book.title}
                    </span>
                    {book.author_name && (
                        <span className="block text-xs italic text-fontMutedLight dark:text-fontMutedDark line-clamp-1 break-words">
                            {book.author_name}
                        </span>
                    )}
                </span>
            </span>
        </Button>
    );
}

export default BookThumbnail;
