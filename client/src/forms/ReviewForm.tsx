import { memo, useCallback, useState } from "react";
import { X } from "lucide-react";
import { StarsRating } from "./components/StarsRating";
import { useReviewsStore } from "../api-handling/context/reviews/useReviewsStore";
import { useCreateReviews } from "../api-handling/rtk-hooks/reviews/useCreateReviews";
import { useCurrentBookStore } from "../state_management/current-book/useCurrentBookStore";

const ReviewForm = memo(() => {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");
    const currentBook = useCurrentBookStore(state => state.currentBook)

    const open = useReviewsStore(state => state.openReviewForm);
    const setOpenReviewForm = useReviewsStore(state => state.setOpenReviewForm)
    const createReview = useCreateReviews()
    const handleSave = useCallback(() => {
        if (currentBook) {
            createReview.mutate({ book_id: currentBook.id, rating: rating, review_content: content })
        }
        setOpenReviewForm(false)
        return
    }, [rating, content]);
    const onClose = useCallback(() => {
        setOpenReviewForm(false);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="
      w-full max-w-md rounded-xl p-6 shadow-lg
      bg-paperLight dark:bg-paperDark
      text-fontPrimaryLight dark:text-fontSecondaryDark
    "
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        Write a review
                    </h2>
                    <button
                        onClick={onClose}
                        className="
                            p-1 rounded-md
                            hover:bg-dividerLight dark:hover:bg-dividerDark
                            "
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="mb-4">
                    <StarsRating value={rating} onChange={setRating} />
                </div>
                <textarea
                    className="
        w-full min-h-[120px] rounded-md p-3 text-sm
        bg-inputLight dark:bg-inputDark
        border border-dividerLight dark:border-dividerDark
        text-fontPrimaryLight dark:text-fontPrimaryDark
        focus:outline-none focus:ring-2
        focus:ring-primaryLight dark:focus:ring-primaryDark
      "
                    placeholder="Write your review..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="
          px-4 py-2 text-sm rounded-md border
          border-dividerLight dark:border-dividerDark
          bg-backgroundLight dark:bg-backgroundDark
          hover:bg-dividerLight dark:hover:bg-dividerDark
        "
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!rating || !content.trim()}
                        className="
          px-4 py-2 text-sm rounded-md
          bg-primaryLight dark:bg-primaryDark
          text-fontSecondaryLight dark:text-fontPrimaryDark
          hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark
          active:bg-primaryActiveLight dark:active:bg-primaryActiveDark
          disabled:bg-primaryDisabledLight dark:disabled:bg-primaryDisabledDark
          disabled:cursor-not-allowed
        "
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>

    );
});

export default ReviewForm;
