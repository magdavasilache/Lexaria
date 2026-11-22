import { create } from "zustand";

interface ReadingSessionState {
    minimized: boolean;
}

interface ReadingSessionActions {
    setMinimized: (minimized: boolean) => void;
}

export const useReadingSessionStore = create<ReadingSessionState & ReadingSessionActions>()((set) => ({
    minimized: false,
    setMinimized: (minimized) => set({ minimized }),
}));
