import { create } from "zustand"
import { ReviewOut } from "../../types/reviews/reviewTypes"

// store -> used for filters
export interface BookReviewsState{
    error: string | null
    loading: boolean
    reviews: ReviewOut[]
    setReviews: (reviews: any[]) => void
    setError: (error: string | null) => void
    setLoading: (loading: boolean) => void
}

export const useBookReviewsStore = create<BookReviewsState>((set) => ({
    error: null,
    loading: false,
    reviews: [],
    setReviews: (reviews) => set({ reviews }),
    setError: (error) => set({ error }),
    setLoading: (loading) => set({ loading }),
  }));