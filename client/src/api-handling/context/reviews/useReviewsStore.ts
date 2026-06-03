import { create } from "zustand";

const initialReviewForm = {
    review_content: '',
    rating: 0,
    book_id: null
}

interface ReviewStoreState{
    loading: boolean;
    error: string | null;
    reviews: any[]; 
    newReviewForm: any;
    openReviewForm: boolean;
}

interface ReviewStoreAction{
    setReviews: (reviews: any[]) => void;
    removeReview: (reviewId: string) => void;
    setOpenReviewForm: (isOpen: boolean) => void;
    setNewReviewForm: (form: any) => void;
}

export const useReviewsStore = create<ReviewStoreState & ReviewStoreAction>()(
    (set) => {
        return {
            loading: false,
            error: null,
            reviews: [],
            newReviewForm: {},
            openReviewForm: false,

            setReviews: (reviews) => {
                set({ reviews });
            },
            removeReview: (reviewId) => {
                set((state) => ({
                    reviews: state.reviews.filter(review => review.id !== reviewId)
                }));
            },
            setOpenReviewForm: (isOpen) => {
                set({ openReviewForm: isOpen });
            },
            setNewReviewForm: (form) => {
                set({ newReviewForm: form });
            }
        }
    }
);