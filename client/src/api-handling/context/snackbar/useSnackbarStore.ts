import { create } from "zustand";
import { DisplayText } from "../../../i18n/message";

interface SnackbarState {
    open: boolean;
    message: DisplayText | null;
    hint: DisplayText | null;
    type: "success" | "error" | "warning" | "info";
    duration: number;
}

interface SnackbarActions {
    showSnackBar: (
        message: DisplayText,
        type?: SnackbarState["type"],
        duration?: number,
        hint?: DisplayText | null
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
