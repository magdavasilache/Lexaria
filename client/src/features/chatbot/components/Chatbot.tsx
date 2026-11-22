import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import ChatWindow from "./ChatWindow";
import { useAuthStore } from "../../auth/stores/useAuthStore";

export default function Chatbot() {
    const { t } = useTranslation("front/chatbot");
    const [open, setOpen] = useState(false);
    const authenticated = useAuthStore((state) => state.status === "authenticated");

    if (!authenticated) return null;

    return (
        <>
            {open && <ChatWindow onClose={() => setOpen(false)} />}
            <Button
                variant="secondary"
                size="lg"
                icon={open ? X : Bot}
                aria-label={t(open ? "close" : "open")}
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
                className="fixed bottom-20 right-4 z-50 hover:scale-105"
            />
        </>
    );
}
