import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Bot, BookOpen, RotateCcw, Star, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { useDeleteConversation, useLatestConversation, useSendChatMessage, useSetFeedback } from "../hooks/useChatbot";
import { useAuthStore } from "../../auth/stores/useAuthStore";
import { ApiError } from "../../../shared/api/apiTypes";
import { lineText, replyText } from "../replyText";
import { CHATBOT_RULES } from "../schemas/chatbotRules";
import { ChatMessageValues, chatMessageSchema } from "../schemas/chatbotSchemas";
import type { ChatBook, ChatFeedback, ChatHistoryMessage, ChatMessage, Conversation, ReplyLine } from "../chatbotTypes";
import { USER_ROLE } from "../../auth/userTypes";
import { serverAssetUrl } from "../../../shared/utils/assets";
import { timeZone } from "../../../shared/utils/timeZone";
import ChatBookActions from "./ChatBookActions";

const useFormats = () => {
    const { i18n } = useTranslation();
    return {
        time: new Intl.DateTimeFormat(i18n.resolvedLanguage, { hour: "2-digit", minute: "2-digit" }),
        rating: new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 }),
        percent: new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 }),
    };
};

function BotAvatar() {
    return (
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primaryLight text-onPrimaryLight dark:bg-primaryDark dark:text-onPrimaryDark">
            <Bot size={14} />
        </span>
    );
}

function BookLink({ book }: { book: ChatBook }) {
    const { t } = useTranslation("front/chatbot");
    const formats = useFormats();
    const cover = serverAssetUrl(book.cover_url);

    return (
        <li className="flex flex-col gap-0.5">
            <Link
                to={`/book/${book.id}`}
                aria-label={t("openBook", { title: book.title })}
                className="flex min-h-10 items-center gap-2 rounded-control p-1.5 transition-colors hover:bg-panelHoverLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-primaryLight dark:hover:bg-panelHoverDark dark:focus-visible:outline-primaryDark"
            >
                <span className="flex h-10 w-7 shrink-0 items-center justify-center overflow-hidden rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark">
                    {cover ? <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <BookOpen size={14} aria-hidden="true" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{book.title}</span>
                    {book.author_name && <span className="truncate text-xs text-fontMutedLight dark:text-fontMutedDark">{t("byAuthor", { author: book.author_name })}</span>}
                </span>
                {book.average_rating !== null && (
                    <span className="flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-fontMutedLight dark:text-fontMutedDark">
                        <Star size={12} aria-hidden="true" className="fill-current" />
                        <span aria-hidden="true">{formats.rating.format(book.average_rating)}</span>
                        <span className="sr-only">{t("rating", { rating: formats.rating.format(book.average_rating) })}</span>
                    </span>
                )}
            </Link>
            {(book.reason || book.actions.length > 0) && (
                <div className="flex flex-col gap-0.5 pl-11">
                    {book.reason && <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{lineText(book.reason)}</p>}
                    <ChatBookActions book={book} />
                </div>
            )}
        </li>
    );
}

const FEEDBACK_OPTIONS: { value: ChatFeedback; icon: typeof ThumbsUp }[] = [
    { value: "up", icon: ThumbsUp },
    { value: "down", icon: ThumbsDown },
];

function FeedbackButtons({ feedback, onRate }: { feedback: ChatFeedback | null; onRate: (feedback: ChatFeedback | null) => void }) {
    const { t } = useTranslation("front/chatbot");
    return (
        <span role="group" aria-label={t("feedback.label")} className="flex items-center">
            {FEEDBACK_OPTIONS.map(({ value, icon }) => (
                <Button
                    key={value}
                    variant="ghost"
                    size="sm"
                    icon={icon}
                    aria-label={t(`feedback.${value}`)}
                    aria-pressed={feedback === value}
                    title={t(`feedback.${value}`)}
                    onClick={() => onRate(feedback === value ? null : value)}
                    className={`min-h-10 min-w-10 justify-center ${feedback === value ? "text-primaryLight dark:text-primaryDark [&_svg]:fill-current" : ""}`}
                />
            ))}
        </span>
    );
}

type BubbleProps = { message: ChatMessage; showIntent: boolean; onRate?: (feedback: ChatFeedback | null) => void };

function MessageBubble({ message, showIntent, onRate }: BubbleProps) {
    const { t } = useTranslation("front/chatbot");
    const formats = useFormats();
    const isUser = message.role === "user";
    const bubble = isUser
        ? "rounded-panel rounded-br-none bg-primaryLight text-onPrimaryLight dark:bg-primaryDark dark:text-onPrimaryDark"
        : "rounded-panel rounded-bl-none border border-panelBorderLight bg-panelLight dark:border-panelBorderDark dark:bg-panelDark";

    return (
        <li className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
            {!isUser && <BotAvatar />}
            <div className={`flex min-w-0 max-w-[85%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <span className="sr-only">{t(isUser ? "you" : "assistant")}</span>
                <div className={`flex flex-col gap-1 px-3 py-2 text-sm leading-relaxed break-words ${bubble}`}>
                    {isUser ? <p className="whitespace-pre-wrap">{message.text}</p> : <p>{replyText(message.lines)}</p>}
                    {!isUser && message.books.length > 0 && (
                        <ul className="-mx-1.5 flex flex-col gap-2">
                            {message.books.map((book) => <BookLink key={book.id} book={book} />)}
                        </ul>
                    )}
                </div>
                <span className="flex flex-wrap items-center gap-x-2 px-1 text-xs text-fontMutedLight dark:text-fontMutedDark">
                    {!isUser && showIntent && message.intent && message.confidence !== null && (
                        <span className="font-mono">{t("intent", { intent: message.intent, confidence: formats.percent.format(message.confidence) })}</span>
                    )}
                    <time dateTime={message.timestamp.toISOString()}>{formats.time.format(message.timestamp)}</time>
                    {!isUser && onRate && <FeedbackButtons feedback={message.feedback} onRate={onRate} />}
                </span>
            </div>
        </li>
    );
}

function TypingIndicator() {
    const { t } = useTranslation("front/chatbot");
    return (
        <li className="flex items-end gap-2">
            <BotAvatar />
            <span role="status" className="flex h-9 items-center gap-1 rounded-panel rounded-bl-none border border-panelBorderLight bg-panelLight px-3 dark:border-panelBorderDark dark:bg-panelDark">
                <span className="sr-only">{t("typing")}</span>
                {[0, 150, 300].map((delay) => (
                    <span key={delay} aria-hidden="true" className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-40" style={{ animationDelay: `${delay}ms` }} />
                ))}
            </span>
        </li>
    );
}

let lastMessageId = 0;
const nextMessageId = () => ++lastMessageId;

const fromHistory = (message: ChatHistoryMessage): ChatMessage =>
    message.role === "user"
        ? { id: nextMessageId(), role: "user", text: message.text, timestamp: new Date(message.created_at) }
        : {
              id: nextMessageId(),
              role: "bot",
              messageId: message.id,
              lines: message.lines,
              books: message.books,
              intent: message.intent,
              confidence: null,
              feedback: message.feedback,
              timestamp: new Date(message.created_at),
          };

const welcome = (): ChatMessage => ({
    id: 0,
    role: "bot",
    messageId: null,
    lines: [{ key: null, params: {}, text: "" }],
    books: [],
    intent: null,
    confidence: null,
    feedback: null,
    timestamp: new Date(),
});

export default function ChatWindow({ onClose }: { onClose: () => void }) {
    const latest = useLatestConversation();
    const ready = !latest.isPending;
    return <ChatSession key={ready ? "ready" : "loading"} initial={ready ? latest.data ?? null : null} loading={!ready} onClose={onClose} />;
}

type ChatSessionProps = { initial: Conversation | null; loading: boolean; onClose: () => void };

function ChatSession({ initial, loading, onClose }: ChatSessionProps) {
    const { t } = useTranslation(["front/chatbot", "front/common"]);
    const [messages, setMessages] = useState<ChatMessage[]>(() => [welcome(), ...(initial?.messages ?? []).map(fromHistory)]);
    const [conversationId, setConversationId] = useState<number | null>(initial && initial.messages.length > 0 ? initial.id : null);
    const [suggestions, setSuggestions] = useState<ReplyLine[]>([]);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const bottomRef = useRef<HTMLLIElement>(null);
    const isAdmin = useAuthStore((state) => state.user?.role === USER_ROLE.ADMIN);
    const sendMessage = useSendChatMessage();
    const deleteConversation = useDeleteConversation();
    const setFeedback = useSetFeedback();

    const { register, control, handleSubmit, reset, setFocus, formState: { errors } } = useForm<ChatMessageValues>({
        resolver: zodResolver(chatMessageSchema),
        mode: "onTouched",
        defaultValues: { message: "" },
    });
    const status = useFieldStatus(chatMessageSchema, control);
    const draft = useWatch({ control, name: "message" });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, sendMessage.isPending]);

    useEffect(() => {
        setFocus("message");
    }, [setFocus]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const restart = () => {
        setMessages([welcome()]);
        setConversationId(null);
        setSuggestions([]);
        reset({ message: "" });
        sendMessage.reset();
        setFocus("message");
    };

    const confirmDelete = () => {
        if (conversationId === null) return;
        deleteConversation.mutate(conversationId, {
            onSuccess: () => {
                setConfirmingDelete(false);
                restart();
            },
        });
    };

    const send = (message: string) => onSubmit({ message });

    const applyFeedback = (messageId: number, feedback: ChatFeedback | null) =>
        setMessages((previous) => previous.map((item) => (item.role === "bot" && item.messageId === messageId ? { ...item, feedback } : item)));

    const rate = (messageId: number, previous: ChatFeedback | null, feedback: ChatFeedback | null) => {
        applyFeedback(messageId, feedback);
        setFeedback.mutate({ messageId, feedback }, { onError: () => applyFeedback(messageId, previous) });
    };

    const onSubmit = ({ message }: ChatMessageValues) => {
        if (sendMessage.isPending) return;
        const id = nextMessageId();
        setSuggestions([]);
        setMessages((previous) => [...previous, { id, role: "user", text: message, timestamp: new Date() }]);
        reset({ message: "" });

        sendMessage.mutate(
            { message, conversation_id: conversationId, tz: timeZone() },
            {
                onSuccess: (reply) => {
                    setConversationId(reply.conversation_id);
                    setSuggestions(reply.suggestions);
                    setMessages((previous) => [
                        ...previous,
                        {
                            id: nextMessageId(),
                            role: "bot",
                            messageId: reply.message_id,
                            lines: reply.lines,
                            books: reply.books,
                            intent: reply.intent,
                            confidence: reply.confidence,
                            feedback: null,
                            timestamp: new Date(),
                        },
                    ]);
                },
                onError: (error) => {
                    if (error instanceof ApiError && error.code === "CONVERSATION_NOT_FOUND") setConversationId(null);
                    setMessages((previous) => previous.filter((item) => item.id !== id));
                    reset({ message });
                },
                onSettled: () => setFocus("message"),
            }
        );
    };

    const field = register("message");

    return (
        <section
            aria-label={t("title")}
            className="fixed inset-x-2 bottom-36 z-50 flex max-h-[min(36rem,calc(100dvh-10rem))] flex-col overflow-hidden rounded-panel border border-panelBorderLight bg-panelLight shadow-soft-sm animate-slide-in dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-sm sm:left-auto sm:right-4 sm:w-96"
        >
            <header className="flex shrink-0 items-center gap-2 border-b border-panelBorderLight px-3 py-2 dark:border-panelBorderDark">
                <BotAvatar />
                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-libre text-sm">{t("title")}</h2>
                    <p className="truncate text-xs text-fontMutedLight dark:text-fontMutedDark">{sendMessage.isPending ? t("typing") : t("subtitle")}</p>
                </div>
                {conversationId !== null && (
                    <Button variant="ghost" size="sm" icon={Trash2} aria-label={t("deleteConversation")} onClick={() => setConfirmingDelete(true)} />
                )}
                <Button variant="ghost" size="sm" icon={RotateCcw} aria-label={t("newConversation")} onClick={restart} />
                <Button variant="ghost" size="sm" icon={X} aria-label={t("close")} onClick={onClose} />
            </header>

            <ol aria-label={t("messages")} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
                {messages.map((message) => {
                    if (message.id === 0 && message.role === "bot") {
                        return <MessageBubble key={0} message={{ ...message, lines: [{ key: null, params: {}, text: t("welcome") }] }} showIntent={false} />;
                    }
                    const rated = message.role === "bot" && message.messageId !== null ? { id: message.messageId, feedback: message.feedback } : null;
                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            showIntent={isAdmin}
                            onRate={rated ? (feedback) => rate(rated.id, rated.feedback, feedback) : undefined}
                        />
                    );
                })}
                {(sendMessage.isPending || loading) && <TypingIndicator />}
                <li ref={bottomRef} aria-hidden="true" />
            </ol>

            {suggestions.length > 0 && !sendMessage.isPending && (
                <ul aria-label={t("suggestions")} className="flex shrink-0 flex-wrap gap-1.5 border-t border-panelBorderLight px-2 pt-2 dark:border-panelBorderDark">
                    {suggestions.map((suggestion) => {
                        const label = lineText(suggestion);
                        return (
                            <li key={`${suggestion.key}-${label}`}>
                                <Button variant="outline" size="sm" rounded onClick={() => send(label)} className="min-h-10">
                                    {label}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex shrink-0 items-start gap-2 border-t border-panelBorderLight p-2 dark:border-panelBorderDark">
                <div className="min-w-0 flex-1">
                    <TextAreaField
                        label={t("message")}
                        hideLabel
                        rows={1}
                        placeholder={t("placeholder")}
                        helperText={t("hint")}
                        maxLength={CHATBOT_RULES.messageMaxLength}
                        showCount={draft.length > CHATBOT_RULES.messageMaxLength * 0.8}
                        error={errors.message}
                        status={draft ? status("message") : "neutral"}
                        {...field}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSubmit(onSubmit)();
                            }
                        }}
                    />
                </div>
                <Button type="submit" size="md" icon={ArrowUp} aria-label={t("send")} disabled={!draft.trim()} loading={sendMessage.isPending} className="mt-0.5 shrink-0" />
            </form>

            <Modal
                open={confirmingDelete}
                onClose={() => setConfirmingDelete(false)}
                size="sm"
                icon={Trash2}
                title={t("deleteTitle")}
                dismissible={!deleteConversation.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={deleteConversation.isPending}>
                            {t("front/common:actions.cancel")}
                        </Button>
                        <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteConversation.isPending} loadingText={t("deleting")}>
                            {t("delete")}
                        </Button>
                    </>
                }
            >
                <p className="text-sm">{t("deleteConfirm")}</p>
            </Modal>
        </section>
    );
}
