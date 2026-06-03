import { useState } from "react";
import { Intent } from "../../../types/chatbot-types";

import {
    useGetIntents,
    useCreateResponse,
    useUpdateResponse,
    useDeleteResponse,
} from "../../../api-handling/rtk-hooks/chatbot/useIntents";

function Spinner() {
    return (
        <div className="w-4 h-4 rounded-full border-2 border-dividerLight dark:border-dividerDark border-t-primaryLight dark:border-t-primaryDark animate-spin" />
    );
}

function ErrorNote({ message }: { message: string }) {
    return <p className="text-xs text-errorLight dark:text-errorDark px-1">{message}</p>;
}


type ResponseRowProps = {
    response: { id: number; response: string };
};

function ResponseRow({ response }: ResponseRowProps) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(response.response);

    const updateResponse = useUpdateResponse();
    const deleteResponse = useDeleteResponse();

    const isLoading = updateResponse.isPending || deleteResponse.isPending;

    const save = () => {
        if (!value.trim() || value === response.response) {
            setValue(response.response);
            setEditing(false);
            return;
        }
        updateResponse.mutate(
            { responseId: response.id, data: { response: value.trim() } },
            { onSuccess: () => setEditing(false) }
        );
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
        if (e.key === "Escape") { setValue(response.response); setEditing(false); }
    };

    if (editing) {
        return (
            <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xs bg-inputLight text-fontPrimaryLight dark:bg-inputDark border border-primaryLight dark:border-primaryDark">
                <textarea
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={save}
                    rows={3}
                    className="w-full bg-transparent text-sm focus:outline-none resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between">
                    <span className="text-[10px] opacity-30">Enter to save · Esc to cancel</span>
                    {updateResponse.isPending && <Spinner />}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start justify-between px-3 py-2.5 rounded-xs bg-inputLight text-fontPrimaryLight dark:bg-inputDark text-sm group gap-3">
            <span
                className="flex-1 leading-relaxed cursor-text"
                onDoubleClick={() => setEditing(true)}
                title="Double-click to edit"
            >
                {response.response}
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                {isLoading ? <Spinner /> : (
                    <>
                        <button
                            onClick={() => setEditing(true)}
                            className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                            title="Edit"
                        >
                            ✎
                        </button>
                        <button
                            onClick={() => deleteResponse.mutate(response.id)}
                            className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                            title="Delete"
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
export default function ResponsesSection() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [newResponse, setNewResponse] = useState("");

    const { data: intents = [], isLoading, isError } = useGetIntents();
    const createResponse = useCreateResponse();

    // Derive selected intent from live query data — never stale
    const selected: Intent | null = intents.find(i => i.id === selectedId) ?? null;

    const handleAddResponse = () => {
        if (!newResponse.trim() || !selected || createResponse.isPending) return;
        createResponse.mutate(
            { intentId: selected.id, data: { response: newResponse.trim() } },
            { onSuccess: () => setNewResponse("") }
        );
    };

    return (
        <div className="flex gap-4 h-full">

            {/* ── Left: intent picker ────────────────────────────────────── */}
            <div className="w-[200px] shrink-0 flex flex-col gap-1 overflow-y-auto">
                <p className="text-xs uppercase tracking-widest opacity-40 mb-1">Intent</p>

                {isLoading && (
                    <div className="flex justify-center pt-4">
                        <Spinner />
                    </div>
                )}
                {isError && <ErrorNote message="Failed to load intents." />}

                {!isLoading && intents.length === 0 && (
                    <p className="text-xs opacity-40">No intents yet. Create some in the Intents tab.</p>
                )}

                {!isLoading && intents.map(intent => (
                    <button
                        key={intent.id}
                        onClick={() => setSelectedId(intent.id)}
                        className={`
                            flex items-center justify-between
                            px-3 py-2 rounded-xs text-left text-sm transition-all
                            ${selectedId === intent.id
                                ? "bg-primaryLight dark:bg-primaryDark text-white shadow-buttonShadow"
                                : "hover:bg-inputLight dark:hover:bg-inputDark opacity-80 hover:opacity-100 hover:text-fontPrimaryLight"
                            }
                        `}
                    >
                        <span className="truncate flex-1">{intent.tag}</span>
                        <span className={`text-[10px] ml-1 shrink-0 opacity-50 ${selectedId === intent.id ? "text-white" : ""}`}>
                            {intent.responses.length}r
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Right: responses editor ────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                {selected ? (
                    <>
                        <div className="flex items-center gap-2 shrink-0">
                            <h3 className="font-libre text-base">{selected.tag}</h3>
                            <span className="text-xs opacity-40 ml-auto">
                                {selected.responses.length} response{selected.responses.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <p className="text-[11px] opacity-30 -mt-2 shrink-0">
                            Double-click a response to edit it inline.
                        </p>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                            {selected.responses.length === 0 && (
                                <p className="text-xs opacity-40">No responses yet. Add one below.</p>
                            )}
                            {selected.responses.map(r => (
                                <ResponseRow key={r.id} response={r} />
                            ))}
                        </div>

                        <div className="border-t border-dividerLight dark:border-dividerDark pt-3 flex flex-col gap-2 shrink-0">
                            <textarea
                                value={newResponse}
                                onChange={e => setNewResponse(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddResponse();
                                    }
                                }}
                                placeholder="Add a response message… (Enter to save, Shift+Enter for new line)"
                                rows={2}
                                className="w-full px-3 py-2 text-sm rounded-xs border text-fontPrimaryLight border-dividerLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none resize-none"
                            />
                            {createResponse.isError && (
                                <ErrorNote message="Failed to add response. Please try again." />
                            )}
                            <button
                                onClick={handleAddResponse}
                                disabled={createResponse.isPending || !newResponse.trim()}
                                className="self-end text-sm px-4 py-1.5 rounded-xs bg-secondaryLight dark:bg-primaryDark dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                            >
                                {createResponse.isPending ? <Spinner /> : "Add Response"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm opacity-40">Select an intent to manage its responses.</p>
                    </div>
                )}
            </div>
        </div>
    );
}