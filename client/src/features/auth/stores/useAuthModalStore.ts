import { create } from "zustand";

type AuthModal = "login" | "register" | null

type AuthModalState = {
    activeModal: AuthModal
}

type AuthModalAction = {
    openModal: (modal: Exclude<AuthModal, null>) => void
    closeModal: () => void
}

export const useAuthModalStore = create<AuthModalState & AuthModalAction>()((set) => ({
    activeModal: null,
    openModal: (modal) => set({ activeModal: modal }),
    closeModal: () => set({ activeModal: null }),
}));
