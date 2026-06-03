import { useNavigate } from "react-router-dom";
import { BookResponseBase } from "../../../types/book-types/bookTypes";
import { memo, useMemo } from "react";

interface Props {
    book: BookResponseBase;
    onClose: () => void;
}

const BookCard = memo(function BookCard({ book, onClose }: Props) {
    const navigate = useNavigate();

    const truncatedSynopsis = useMemo(
        () => (book.synopsis ? `${book.synopsis.slice(0, 220)}...` : ""),
        [book.synopsis]
    );

    const tags = useMemo(() => book.tags?.join(", "), [book.tags]);

    return (
        <div className="h-auto w-full p-3 overflow-hidden">

            {/* Close button */}
            <button
                onClick={onClose}
                className="block mb-2 px-3 py-1 text-sm rounded-xs font-libre"
                aria-label="Close book card"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                    className="size-6 text-fontPrimaryLight dark:text-fontSecondaryDark"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
                </svg>
            </button>

            <div className="w-full flex flex-col items-start p-3 gap-4 bg-backgroundLight dark:bg-backgroundDark shadow-sm rounded-xs overflow-hidden">

                {/* Image — already a data URI from getBooks, no URL construction needed */}
                {book.image && (
                    <img
                        src={book.image}
                        alt={book.title}
                        className="max-h-[500px] max-w-full object-contain"
                    />
                )}

                <div className="text-fontPrimaryLight dark:text-fontSecondaryDark">
                    <h2
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="font-libre text-2xl font-bold mb-1 underline hover:cursor-pointer"
                    >
                        {book.title}
                    </h2>

                    {book.author_name && (
                        <p className="font-libre mb-2 italic">by {book.author_name}</p>
                    )}

                    <p className="font-libre text-sm mb-4">{truncatedSynopsis}</p>

                    <div className="font-libre text-sm space-y-1">
                        {book.language_name && <p><strong>Language:</strong> {book.language_name}</p>}
                        {book.pages && <p><strong>Pages:</strong> {book.pages}</p>}
                        {tags && <p><strong>Tags:</strong> {tags}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BookCard;