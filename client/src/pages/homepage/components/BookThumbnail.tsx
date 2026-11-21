import { memo } from "react";
import { BookResponseBase } from "../../../types/book-types/bookTypes";
import { COVER_PLACEHOLDER } from "../../../utils/assets";
import Button from "../../../global-components/buttons/Button";

interface Props {
    book: BookResponseBase;
    isSelected: boolean;
    onSelect: (book: BookResponseBase) => void;
}

const BookThumbnail = memo(function BookThumbnail({ book, isSelected, onSelect }: Props) {
    return (
        <Button variant="card" fullWidth aria-pressed={isSelected} onClick={() => onSelect(book)} className="min-w-0">
            <span className="flex flex-col gap-2">
                <span className="block w-full aspect-[2/3] rounded-control overflow-hidden bg-panelSelectedLight dark:bg-panelSelectedDark">
                    <img
                        src={book.image ?? COVER_PLACEHOLDER}
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </span>

                <span className="block text-center px-1">
                    <span className="block font-semibold line-clamp-2 break-words">
                        {book.title}
                    </span>
                    {book.author_name && (
                        <span className="block text-xs opacity-70 line-clamp-1">
                            {book.author_name}
                        </span>
                    )}
                </span>
            </span>
        </Button>
    );
});

export default BookThumbnail;
