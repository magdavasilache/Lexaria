import { memo } from "react";
import { BookResponseBase } from "../../../types/book-types/bookTypes";

interface Props {
    book: BookResponseBase;
    isSelected: boolean;
    onSelect: (book: BookResponseBase) => void;
}

const BookThumbnail = memo(function BookThumbnail({ book, isSelected, onSelect }: Props) {
    return (
        <div
            onClick={() => onSelect(book)}
            className={`
        bg-paperLight dark:bg-paperDark flex flex-col items-center gap-2 p-2
        rounded-xs shadow-sm hover:cursor-pointer transition-all duration-300
        ${isSelected ? "w-40 scale-95 opacity-80" : "w-52"}
      `}
        >
            <div className="w-full h-60 rounded-xs overflow-hidden bg-dividerLight dark:bg-dividerDark">
                <img
                    src={book.image ?? "/default-cover.jpg"}
                    alt={book.title}
                    className="w-full h-full object-contain"
                />
            </div>

            <div className="text-center w-full px-1">
                <p className="font-libre text-fontPrimaryLight dark:text-fontSecondaryDark text-sm font-semibold line-clamp-2">
                    {book.title}
                </p>
                {book.author_name && (
                    <p className="font-libre text-fontPrimaryLight dark:text-fontSecondaryDark text-xs opacity-70 line-clamp-1">
                        {book.author_name}
                    </p>
                )}
            </div>
        </div>
    );
});

export default BookThumbnail;