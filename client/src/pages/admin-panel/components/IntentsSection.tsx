import { useState } from "react";
import { Intent } from "../../../types/chatbot-types";
import { useCreateIntent, useCreatePattern, useDeleteIntent, useDeletePattern, useGetIntents, useUpdateIntent, useUpdatePattern } from "../../../api-handling/rtk-hooks/chatbot/useIntents";


function Spinner() {
    return (
        <div className="w-4 h-4 rounded-full border-2 border-dividerLight dark:border-dividerDark border-t-primaryLight dark:border-t-primaryDark animate-spin" />
    );
}

function ErrorNote({ message }: { message: string }) {
    return (
        <p className="text-xs text-errorLight dark:text-errorDark px-1">{message}</p>
    );
}


type PatternRowProps = {
    pattern: { id: number; pattern: string };
    intentId: number;
};

function PatternRow({ pattern }: PatternRowProps) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(pattern.pattern);

    const updatePattern = useUpdatePattern();
    const deletePattern = useDeletePattern();

    const isLoading = updatePattern.isPending || deletePattern.isPending;

    const save = () => {
        if (!value.trim() || value === pattern.pattern) {
            setValue(pattern.pattern); 
            setEditing(false);
            return;
        }
        updatePattern.mutate(
            { patternId: pattern.id, data: { pattern: value.trim() } },
            { onSuccess: () => setEditing(false) }
        );
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") { setValue(pattern.pattern); setEditing(false); }
    };

    if (editing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs bg-inputLight dark:bg-inputDark border border-primaryLight dark:border-primaryDark text-fontPrimaryLight">
                <input
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={save}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                />
                {updatePattern.isPending && <Spinner />}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-xs bg-inputLight dark:bg-inputDark text-sm group text-fontPrimaryLight">
            <span
                className="flex-1 cursor-text"
                onDoubleClick={() => setEditing(true)}
                title="Double-click to edit"
            >
                {pattern.pattern}
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isLoading
                    ? <Spinner />
                    : (
                        <>
                            <button
                                onClick={() => setEditing(true)}
                                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                                title="Edit"
                            >
                                ✎
                            </button>
                            <button
                                onClick={() => deletePattern.mutate(pattern.id)}
                                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                                title="Delete"
                            >
                                ✕
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    );
}

export default function IntentsSection() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [newTag, setNewTag] = useState("");
    const [newType, setNewType] = useState<"informational" | "action" | "fallback">("informational");
    const [newPattern, setNewPattern] = useState("");
    const [search, setSearch] = useState("");
    const [editingIntentTag, setEditingIntentTag] = useState(false);
    const [editTagValue, setEditTagValue] = useState("");

    const { data: intents = [], isLoading, isError } = useGetIntents();
    const createIntent = useCreateIntent();
    const updateIntent = useUpdateIntent();
    const deleteIntent = useDeleteIntent();
    const createPattern = useCreatePattern();

    const selected: Intent | null = intents.find(i => i.id === selectedId) ?? null;

    const filtered = intents.filter(i =>
        i.tag.toLowerCase().includes(search.toLowerCase())
    );


    const handleAddIntent = () => {
        if (!newTag.trim() || createIntent.isPending) return;
        createIntent.mutate(
            { tag: newTag.trim(), type: newType },
            {
                onSuccess: (created) => {
                    setNewTag("");
                    setSelectedId(created.id);
                },
            }
        );
    };

    const handleDeleteIntent = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (deleteIntent.isPending) return;
        deleteIntent.mutate(id, {
            onSuccess: () => {
                if (selectedId === id) setSelectedId(null);
            },
        });
    };

    const startEditingTag = () => {
        if (!selected) return;
        setEditTagValue(selected.tag);
        setEditingIntentTag(true);
    };

    const saveEditedTag = () => {
        if (!selected || !editTagValue.trim()) return;
        if (editTagValue.trim() === selected.tag) { setEditingIntentTag(false); return; }
        updateIntent.mutate(
            { id: selected.id, data: { tag: editTagValue.trim() } },
            { onSuccess: () => setEditingIntentTag(false) }
        );
    };

    const handleAddPattern = () => {
        if (!newPattern.trim() || !selected || createPattern.isPending) return;
        createPattern.mutate(
            { intentId: selected.id, data: { pattern: newPattern.trim() } },
            { onSuccess: () => setNewPattern("") }
        );
    };

    return (
        <div className="flex gap-4 h-full">

            <div className="w-[240px] shrink-0 flex flex-col gap-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search intents…"
                    className="w-full px-3 py-1.5 text-sm rounded-xs border text-fontPrimaryLight border-dividerLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none"
                />

                <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-0">
                    {isLoading && (
                        <div className="flex justify-center pt-4"><Spinner /></div>
                    )}
                    {isError && (
                        <ErrorNote message="Failed to load intents." />
                    )}
                    {!isLoading && filtered.map(intent => (
                        <button
                            key={intent.id}
                            onClick={() => { setSelectedId(intent.id); setEditingIntentTag(false); }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xs text-left text-sm transition-all group ${
                                selectedId === intent.id
                                    ? "bg-primaryLight dark:bg-primaryDark text-white shadow-buttonShadow"
                                    : "hover:bg-inputLight dark:hover:bg-inputDark opacity-80 hover:opacity-100 hover:text-fontPrimaryLight dark:hover:text-fontPrimaryDark"
                            }`}
                        >
                            <span className="truncate flex-1">{intent.tag}</span>
                            <span className={`text-[10px] ml-1 shrink-0 opacity-40 ${selectedId === intent.id ? "text-white" : ""}`}>
                                {intent.patterns.length}p
                            </span>
                            <span
                                onClick={e => handleDeleteIntent(e, intent.id)}
                                className={`text-xs ml-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 ${
                                    selectedId === intent.id ? "text-white" : ""
                                }`}
                            >
                                ✕
                            </span>
                        </button>
                    ))}
                    {!isLoading && !isError && filtered.length === 0 && (
                        <p className="text-xs opacity-40 px-1">
                            {search ? "No intents match your search." : "No intents yet."}
                        </p>
                    )}
                </div>

                {/* Add intent form */}
                <div className="border-t border-dividerLight dark:border-dividerDark pt-3 flex flex-col gap-2 shrink-0">
                    <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddIntent()}
                        placeholder="New intent tag…"
                        className="w-full px-3 py-1.5 text-sm rounded-xs border border-dividerLight text-fontPrimaryLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none"
                    />
                    <select
                        value={newType}
                        onChange={e => setNewType(e.target.value as typeof newType)}
                        className="w-full px-3 py-1.5 text-sm rounded-xs border border-dividerLight text-fontPrimaryLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none"
                    >
                        <option value="informational">Informational</option>
                        <option value="action">Action</option>
                        <option value="fallback">Fallback</option>
                    </select>
                    {createIntent.isError && (
                        <ErrorNote message="Tag already exists or invalid." />
                    )}
                    <button
                        onClick={handleAddIntent}
                        disabled={createIntent.isPending || !newTag.trim()}
                        className="text-sm px-3 py-1.5 rounded-xs bg-secondaryLight dark:bg-primaryDark dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {createIntent.isPending ? <Spinner /> : "+ Add Intent"}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                {selected ? (
                    <>
                        <div className="flex items-center gap-3 shrink-0">
                            {editingIntentTag ? (
                                <input
                                    autoFocus
                                    value={editTagValue}
                                    onChange={e => setEditTagValue(e.target.value)}
                                    onBlur={saveEditedTag}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") saveEditedTag();
                                        if (e.key === "Escape") setEditingIntentTag(false);
                                    }}
                                    className="font-libre text-base bg-transparent border-b border-primaryLight dark:border-primaryDark focus:outline-none"
                                />
                            ) : (
                                <h3
                                    className="font-libre text-base cursor-pointer hover:opacity-70 transition-opacity"
                                    onDoubleClick={startEditingTag}
                                    title="Double-click to rename"
                                >
                                    {selected.tag}
                                </h3>
                            )}

                            <select
                                value={selected.type}
                                onChange={e =>
                                    updateIntent.mutate({
                                        id: selected.id,
                                        data: { type: e.target.value as typeof selected.type },
                                    })
                                }
                                className="text-xs border border-dividerLight dark:border-dividerDark px-2 py-0.5 rounded-xs bg-transparent focus:outline-none opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <option value="informational">informational</option>
                                <option value="action">action</option>
                                <option value="fallback">fallback</option>
                            </select>

                            {updateIntent.isPending && <Spinner />}

                            <span className="text-xs opacity-40 ml-auto">
                                {selected.patterns.length} pattern{selected.patterns.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <p className="text-[11px] opacity-30 -mt-2 shrink-0">
                            Double-click a pattern or the tag name to edit inline.
                        </p>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                            {selected.patterns.length === 0 && (
                                <p className="text-xs opacity-40">No patterns yet. Add one below.</p>
                            )}
                            {selected.patterns.map(p => (
                                <PatternRow key={p.id} pattern={p} intentId={selected.id} />
                            ))}
                        </div>

                        <div className="flex gap-2 border-t border-dividerLight dark:border-dividerDark pt-3 shrink-0">
                            <input
                                value={newPattern}
                                onChange={e => setNewPattern(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddPattern()}
                                placeholder="Add a pattern…"
                                className="flex-1 px-3 py-1.5 text-sm rounded-xs border border-dividerLight dark:border-dividerDark bg-inputLight dark:bg-inputDark focus:outline-none text-fontPrimaryLight"
                            />
                            <button
                                onClick={handleAddPattern}
                                disabled={createPattern.isPending || !newPattern.trim()}
                                className="text-sm px-4 py-1.5 rounded-xs bg-secondaryLight dark:bg-primaryDark dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                            >
                                {createPattern.isPending ? <Spinner /> : "Add"}
                            </button>
                        </div>
                        {createPattern.isError && (
                            <ErrorNote message="Pattern already exists on this intent." />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm opacity-40">Select an intent to manage its patterns.</p>
                    </div>
                )}
            </div>
        </div>
    );
}