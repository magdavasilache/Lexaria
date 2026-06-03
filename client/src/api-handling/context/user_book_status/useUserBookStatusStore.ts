import { create } from "zustand";
import { UserBookStatus } from "../../../types/user-book-status-types/UserBookStatusTypes";
import { persist } from "zustand/middleware";

interface UserBookStatusStoreState{
    loading: boolean;
    error: string | null;
    userBookStatsus: UserBookStatus | null;
}

interface UserBookStatusStoreAction{
    setUserBookStatus: (status: UserBookStatus) => void;
    removeUserBookStatus: () => void;
}

export const useUserBookStatusStore = create<UserBookStatusStoreState & UserBookStatusStoreAction>()(
    persist(
        (set) => {
            return{
                loading: false,
                error: null,
                userBookStatsus: null,

                setUserBookStatus: async (status: UserBookStatus) => {
                    set({ userBookStatsus: status});
                },
                removeUserBookStatus: () => {
                    set({ userBookStatsus: null });
                },
            }
        },
        {
            name: 'user-book-status-store',
        }
    )
);  