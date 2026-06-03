import { create } from "zustand";

interface SnackbarState {
    open: boolean;
    message: string | null;
    hint: string | null;
    type: "success" | "error" | "warning" | "info";
    duration: number;
}

interface SnackbarActions {
    showSnackBar: (
        message: string,
        type?: SnackbarState["type"],
        duration?: number,
        hint?: string | null
    ) => void;
    closeSnackBar: () => void;
}

export const useSnackbarStore = create<SnackbarState & SnackbarActions>((set) => ({
    open: false,
    message: null,
    hint: null,
    type: "info",
    duration: 6000,

    showSnackBar: (
        message,
        type = "info",
        duration = 2000,
        hint = null
    ) =>
        set({
            open: true,
            message,
            type,
            duration,
            hint,
        }),

    closeSnackBar: () => set({ open: false }),
}));
