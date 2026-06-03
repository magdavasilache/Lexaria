import { useState } from "react";
import { Bot, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function Chatbot() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {open && <ChatWindow onClose={() => setOpen(false)} />}

            <button
                onClick={() => setOpen(prev => !prev)}
                aria-label={open ? "Close chat" : "Open chat"}
                className="
                    fixed bottom-20 right-4 z-50
                    bg-secondaryLight dark:bg-secondaryDark
                    hover:bg-secondaryLightDarkTone dark:hover:bg-secondaryDarkDarkTone
                    text-fontPrimaryLight dark:text-fontPrimaryDark
                    p-3 rounded-full shadow-md
                    hover:scale-105 active:scale-95
                    transition-all duration-200
                "
            >
                {open
                    ? <X size={22} />
                    : <Bot size={22} />
                }
            </button>
        </>
    );
}