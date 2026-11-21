import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BookResponseBase } from "../../../types/book-types/bookTypes";
import { memo, useMemo } from "react";
import Button from "../../../global-components/buttons/Button";
import { COVER_PLACEHOLDER } from "../../../utils/assets";

interface Props {
    book: BookResponseBase;
    onClose: () => void;
}

const BookCard = memo(function BookCard({ book, onClose }: Props) {
    const { t } = useTranslation("front/books");

    const truncatedSynopsis = useMemo(
        () => (book.synopsis ? `${book.synopsis.slice(0, 220)}...` : ""),
        [book.synopsis]
    );

    const tags = useMemo(() => book.tags?.join(", "), [book.tags]);

    return (
        <div className="h-auto w-full p-2 sm:p-3 overflow-hidden">
            <Button
                variant="ghost"
                icon={ArrowLeft}
                aria-label={t("card.close")}
                onClick={onClose}
                className="mb-2 min-h-10 min-w-10"
            />

            <div className="w-full flex flex-col items-start p-3 gap-4 bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark shadow-soft-md dark:shadow-deep-md rounded-panel overflow-hidden">
                <img
                    src={book.image ?? COVER_PLACEHOLDER}
                    alt={book.title}
                    className="max-h-[60vh] max-w-full object-contain self-center sm:self-start"
                />

                <div className="min-w-0 w-full text-fontPrimaryLight dark:text-fontPrimaryDark">
                    <h2 className="font-libre text-xl sm:text-2xl font-bold mb-1 break-words">
                        <Link
                            to={`/book/${book.id}`}
                            className="underline rounded-control hover:text-primaryLight dark:hover:text-primaryDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                        >
                            {book.title}
                        </Link>
                    </h2>

                    {book.author_name && (
                        <p className="font-libre mb-2 italic">{t("card.by", { author: book.author_name })}</p>
                    )}

                    <p className="font-libre text-sm mb-4 break-words">{truncatedSynopsis}</p>

                    <dl className="font-libre text-sm space-y-1">
                        {book.language_name && <div><dt className="inline font-bold">{t("card.language")}:</dt> <dd className="inline">{book.language_name}</dd></div>}
                        {book.pages && <div><dt className="inline font-bold">{t("card.pages")}:</dt> <dd className="inline">{book.pages}</dd></div>}
                        {tags && <div><dt className="inline font-bold">{t("card.tags")}:</dt> <dd className="inline break-words">{tags}</dd></div>}
                    </dl>
                </div>
            </div>
        </div>
    );
});

export default BookCard;
