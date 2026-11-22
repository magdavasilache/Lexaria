import { create } from "zustand";

interface ReviewStoreState {
    openReviewForm: boolean;
}

interface ReviewStoreAction {
    setOpenReviewForm: (isOpen: boolean) => void;
}

export const useReviewsStore = create<ReviewStoreState & ReviewStoreAction>()((set) => ({
    openReviewForm: false,
    setOpenReviewForm: (isOpen) => set({ openReviewForm: isOpen }),
}));
