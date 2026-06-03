import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, X } from "lucide-react";
import { useSendMessage } from "../../api-handling/rtk-hooks/chatbot/useChat";
import { ChatMessage } from "../../types/chatbot-types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-primaryLight dark:bg-primaryDark flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white dark:text-fontPrimaryDark" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-xs bg-paperLight dark:bg-paperDark border border-dividerLight dark:border-dividerDark">
                <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-fontPrimaryLight dark:bg-fontSecondaryDark opacity-40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-fontPrimaryLight dark:bg-fontSecondaryDark opacity-40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-fontPrimaryLight dark:bg-fontSecondaryDark opacity-40 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-primaryLight dark:bg-primaryDark flex items-center justify-center shrink-0 mb-0.5">
                    <Bot size={14} className="text-white dark:text-fontPrimaryDark" />
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                <div className={`
                    px-4 py-2.5 text-sm leading-relaxed
                    ${isUser
                        ? "bg-primaryLight dark:bg-primaryDark text-white dark:text-fontPrimaryDark rounded-2xl rounded-br-xs"
                        : "bg-paperLight dark:bg-paperDark text-fontPrimaryLight dark:text-fontSecondaryDark border border-dividerLight dark:border-dividerDark rounded-2xl rounded-bl-xs"
                    }
                `}>
                    {message.text}
                </div>

                {/* Intent debug badge — only on bot messages with a known intent */}
                {!isUser && message.intent && message.confidence !== undefined && (
                    <span className="text-[10px] opacity-40 px-1 font-mono">
                        {message.intent} · {(message.confidence * 100).toFixed(0)}%
                    </span>
                )}

                <span className="text-[10px] opacity-30">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ChatWindowProps = {
    onClose: () => void;
};

const makeWelcome = (): ChatMessage => ({
    id: 0,
    role: "bot",
    text: "Hello! I'm here to help you find your next great read. Ask me anything about books! 📚",
    timestamp: new Date(),
});

export default function ChatWindow({ onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([makeWelcome()]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<number | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const sendMessage = useSendMessage();

    // Auto-scroll on new messages or while typing indicator shows
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sendMessage.isPending]);

    // Focus input when window opens
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 350);
    }, []);

    const reset = () => {
        setMessages([makeWelcome()]);
        setConversationId(null);
        setInput("");
        sendMessage.reset(); // clears error state from the last mutation
    };

    const submit = () => {
        const text = input.trim();
        if (!text || sendMessage.isPending) return;

        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";

        // Optimistically append user message immediately — no waiting
        const userMsg: ChatMessage = {
            id: Date.now(),
            role: "user",
            text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);

        sendMessage.mutate(
            { message: text, conversation_id: conversationId },
            {
                onSuccess: (data) => {
                    // Store conversation_id from first response so subsequent
                    // messages get grouped into the same DB conversation
                    if (data.conversation_id && !conversationId) {
                        setConversationId(data.conversation_id);
                    }

                    const botMsg: ChatMessage = {
                        id: Date.now() + 1,
                        role: "bot",
                        text: data.response,
                        intent: data.intent ?? undefined,
                        confidence: data.confidence,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, botMsg]);
                },
            }
        );
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    return (
        <div className="
            fixed bottom-[10rem] right-4 z-50
            w-[360px] max-h-[560px]
            flex flex-col
            bg-backgroundLight dark:bg-backgroundDark
            border border-dividerLight dark:border-dividerDark
            rounded-2xl shadow-cardShadowLight dark:shadow-cardShadowDark
            animate-slide-in overflow-hidden
        ">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-dividerLight dark:border-dividerDark bg-paperLight dark:bg-paperDark shrink-0">
                <div className="w-8 h-8 rounded-full bg-primaryLight dark:bg-primaryDark flex items-center justify-center">
                    <Bot size={16} className="text-white dark:text-fontPrimaryDark" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-libre leading-none dark:text-fontSecondaryDark">Book Assistant</p>
                    <p className="text-[11px] opacity-50 mt-0.5 dark:text-fontSecondaryDark dark:opacity-75">
                        {sendMessage.isPending ? "Typing…" : "Ask me anything about books"}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={reset}
                        title="New conversation"
                        className="p-1.5 rounded-xs opacity-50 hover:opacity-100 hover:bg-inputLight hover:text-fontPrimaryLight dark:hover:bg-inputDark transition-all"
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        title="Close"
                        className="p-1.5 rounded-xs opacity-50 hover:opacity-100 hover:bg-inputLight hover:text-fontPrimaryLight dark:hover:bg-inputDark transition-all"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {sendMessage.isPending && <TypingIndicator />}

                {sendMessage.isError && (
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-xs text-center opacity-60 text-errorLight dark:text-errorDark">
                            Couldn't reach the server. Please try again.
                        </p>
                        <button
                            onClick={() => sendMessage.reset()}
                            className="text-xs opacity-50 hover:opacity-100 underline transition-opacity"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-dividerLight dark:border-dividerDark bg-paperLight dark:bg-paperDark shrink-0">
                <div className="flex items-end gap-2 bg-inputLight text-fontPrimaryLight dark:bg-inputDark rounded-xl px-3 py-2 border border-dividerLight dark:border-dividerDark focus-within:border-primaryLight dark:focus-within:border-primaryDark transition-colors">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={onInput}
                        onKeyDown={onKeyDown}
                        placeholder="Type a message… (Enter to send)"
                        rows={1}
                        disabled={sendMessage.isPending}
                        className="flex-1 bg-transparent resize-none text-sm text-fontPrimaryLight dark:text-fontPrimaryDark placeholder:opacity-40 focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto disabled:opacity-50"
                    />
                    <button
                        onClick={submit}
                        disabled={!input.trim() || sendMessage.isPending}
                        className="
                            shrink-0 w-7 h-7 rounded-lg mb-0.5
                            bg-primaryLight dark:bg-primaryDark
                            text-white dark:text-fontPrimaryDark
                            flex items-center justify-center
                            disabled:opacity-30 disabled:cursor-not-allowed
                            hover:scale-110 active:scale-95 transition-transform
                        "
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
                <p className="text-[10px] opacity-30 text-center mt-1.5">Shift+Enter for new line</p>
            </div>
        </div>
    );
}