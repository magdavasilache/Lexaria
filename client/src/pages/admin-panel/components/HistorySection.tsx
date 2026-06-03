import { useState } from "react";
import { formatDate } from "../ChatbotAdminTab";
import Badge from "./Badge";
import { UnknownMessage } from "../../../types/chatbot-types";
import {
    useGetTrainingHistory,
    useGetUnknownMessages,
    useDeleteUnknown,
    usePromoteUnknown,
} from "../../../api-handling/rtk-hooks/chatbot/useHistory";
import { useGetIntents } from "../../../api-handling/rtk-hooks/chatbot/useIntents";


function Spinner() {
    return (
        <div className="w-4 h-4 rounded-full border-2 border-dividerLight dark:border-dividerDark border-t-primaryLight dark:border-t-primaryDark animate-spin" />
    );
}


type PromoteModalProps = {
    unknown: UnknownMessage;
    onClose: () => void;
};

function PromoteModal({ unknown, onClose }: PromoteModalProps) {
    const [selectedIntentId, setSelectedIntentId] = useState<number | "">("");
    const { data: intents = [], isLoading: intentsLoading } = useGetIntents();
    const promote = usePromoteUnknown();

    const handlePromote = () => {
        if (!selectedIntentId) return;
        promote.mutate(
            { id: unknown.id, intentId: Number(selectedIntentId) },
            { onSuccess: onClose }
        );
    };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-[420px] bg-paperLight dark:bg-paperDark border border-dividerLight dark:border-dividerDark rounded-xs shadow-cardShadowLight dark:shadow-cardShadowDark flex flex-col gap-4 p-5"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col gap-1">
                    <h3 className="font-libre text-base">Add as training pattern</h3>
                    <p className="text-xs opacity-50">
                        This message will be added as a pattern to the selected intent and removed from unknowns.
                    </p>
                </div>

                <div className="px-3 py-2.5 rounded-xs bg-inputLight dark:bg-inputDark text-sm leading-relaxed border border-dividerLight dark:border-dividerDark">
                    "{unknown.message}"
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        {(unknown.confidence * 100).toFixed(0)}% confidence
                    </span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-widest opacity-40">
                        Assign to intent
                    </label>
                    {intentsLoading ? (
                        <div className="flex justify-center py-2"><Spinner /></div>
                    ) : (
                        <select
                            value={selectedIntentId}
                            onChange={e => setSelectedIntentId(Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-sm rounded-xs border border-dividerLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none"
                        >
                            <option value="">Select an intent…</option>
                            {intents.map(intent => (
                                <option key={intent.id} value={intent.id}>
                                    {intent.tag}
                                    {" "}
                                    ({intent.patterns.length} pattern{intent.patterns.length !== 1 ? "s" : ""})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {promote.isError && (
                    <p className="text-xs text-errorLight dark:text-errorDark">
                        Failed to promote. Please try again.
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        onClick={onClose}
                        className="text-sm px-4 py-1.5 rounded-xs border border-dividerLight dark:border-dividerDark opacity-60 hover:opacity-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePromote}
                        disabled={!selectedIntentId || promote.isPending}
                        className="text-sm px-4 py-1.5 rounded-xs bg-primaryLight dark:bg-primaryDark text-white dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                        {promote.isPending ? <Spinner /> : "Add pattern"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <tr>
            <td colSpan={4} className="py-8 text-center text-sm opacity-40">
                {message}
            </td>
        </tr>
    );
}

export default function HistorySection() {
    const [subView, setSubView] = useState<"trainings" | "unknowns">("trainings");
    const [promotingUnknown, setPromotingUnknown] = useState<UnknownMessage | null>(null);

    const {
        data: trainings = [],
        isLoading: trainingsLoading,
        isError: trainingsError,
    } = useGetTrainingHistory();

    const {
        data: unknowns = [],
        isLoading: unknownsLoading,
        isError: unknownsError,
    } = useGetUnknownMessages();

    const deleteUnknown = useDeleteUnknown();

    return (
        <>
            {promotingUnknown && (
                <PromoteModal
                    unknown={promotingUnknown}
                    onClose={() => setPromotingUnknown(null)}
                />
            )}

            <div className="flex flex-col gap-4 h-full overflow-hidden">

                <div className="flex gap-1 p-1 rounded-xs bg-inputLight dark:bg-inputDark text-fontPrimaryLight  self-start shrink-0">
                    {(["trainings", "unknowns"] as const).map(v => (
                        <button
                            key={v}
                            onClick={() => setSubView(v)}
                            className={`text-sm px-3 py-1 rounded-xs transition-all ${subView === v
                                    ? "bg-paperLight dark:bg-paperDark dark:text-fontSecondaryLight shadow-buttonShadow dark:shadow-buttonShadowDark"
                                    : "opacity-60 hover:opacity-100"
                                }`}
                        >
                            {v === "trainings" ? "Training History" : (
                                <span className="flex items-center gap-1.5">
                                    Unknown Messages
                                    {unknowns.length > 0 && (
                                        <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                                            {unknowns.length}
                                        </span>
                                    )}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {subView === "trainings" && (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-dividerLight dark:border-dividerDark">
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">ID</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Epochs</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Status</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainingsLoading && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center">
                                            <div className="flex justify-center">
                                                <Spinner />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {trainingsError && (
                                    <EmptyState message="Failed to load training history." />
                                )}
                                {!trainingsLoading && trainings.length === 0 && (
                                    <EmptyState message="No training runs yet. Train the model from the Train Model tab." />
                                )}
                                {trainings.map(t => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-dividerLight dark:border-dividerDark hover:bg-inputLight dark:hover:bg-inputDark transition-colors"
                                    >
                                        <td className="py-2.5 px-3 opacity-50">#{t.id}</td>
                                        <td className="py-2.5 px-3">{t.epochs}</td>
                                        <td className="py-2.5 px-3"><Badge success={t.success} /></td>
                                        <td className="py-2.5 px-3 opacity-60 text-xs">{formatDate(t.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {subView === "unknowns" && (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-dividerLight dark:border-dividerDark">
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Message</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Confidence</th>
                                    <th className="text-left py-2 px-3 text-xs uppercase tracking-widest opacity-40 font-normal">Date</th>
                                    <th className="py-2 px-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {unknownsLoading && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center">
                                            <div className="flex justify-center">
                                                <Spinner />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {unknownsError && (
                                    <EmptyState message="Failed to load unknown messages." />
                                )}
                                {!unknownsLoading && unknowns.length === 0 && (
                                    <EmptyState message="No unknown messages yet. They appear here when the chatbot can't confidently classify a user's input." />
                                )}
                                {unknowns.map(u => (
                                    <tr
                                        key={u.id}
                                        className="border-b border-dividerLight dark:border-dividerDark hover:bg-inputLight dark:hover:bg-inputDark transition-colors group"
                                    >
                                        <td className="py-2.5 px-3 max-w-[280px]">
                                            <span className="block truncate" title={u.message}>
                                                {u.message}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                {(u.confidence * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 opacity-60 text-xs whitespace-nowrap">
                                            {formatDate(u.created_at)}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setPromotingUnknown(u)}
                                                    className="text-xs opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap"
                                                >
                                                    Add as pattern →
                                                </button>
                                                {deleteUnknown.isPending && deleteUnknown.variables === u.id ? (
                                                    <Spinner />
                                                ) : (
                                                    <button
                                                        onClick={() => deleteUnknown.mutate(u.id)}
                                                        className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                                                        title="Dismiss"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}