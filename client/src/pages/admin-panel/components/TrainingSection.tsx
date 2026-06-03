import { useEffect, useRef, useState } from "react";
import { useTraining } from "../../../api-handling/rtk-hooks/chatbot/useTraining";

export default function TrainingSection() {
    const [epochs, setEpochs] = useState(1000);
    const { status, logs, progress, startTraining, reset } = useTraining();
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs]);

    const handleStart = () => startTraining(epochs);

    return (
        <div className="flex flex-col gap-5 h-full">

            {/* ── Config row ─────────────────────────────────────────────── */}
            <div className="flex items-end gap-4 flex-wrap shrink-0">
                <div className="flex flex-col gap-1">
                    <label className="text-xs opacity-50 uppercase tracking-widest">Epochs</label>
                    <input
                        type="number"
                        value={epochs}
                        min={1}
                        onChange={e => setEpochs(Math.max(1, Number(e.target.value)))}
                        disabled={status === "running"}
                        className="w-28 px-3 py-1.5 text-sm rounded-xs border border-dividerLight dark:border-dividerDark bg-inputLight dark:bg-inputDark text-fontPrimaryLight focus:outline-none disabled:opacity-40"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleStart}
                        disabled={status === "running"}
                        className="text-sm px-4 py-1.5 rounded-xs bg-secondaryLight dark:bg-primaryDark dark:text-fontPrimaryDark shadow-buttonShadow text-fontPrimaryLight dark:shadow-buttonShadowDark hover:scale-105 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {status === "running" ? "Training…" : "▶ Start Training"}
                    </button>
                    {status !== "idle" && (
                        <button
                            onClick={reset}
                            disabled={status === "running"}
                            className="text-sm px-4 py-1.5 rounded-xs border border-dividerLight dark:border-dividerDark opacity-60 hover:opacity-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={status === "running" ? "Wait for training to finish" : "Clear logs"}
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Status pill */}
                {status !== "idle" && (
                    <span className={`
                        text-xs px-2.5 py-1 rounded-full font-medium ml-auto
                        ${status === "running" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : ""}
                        ${status === "done"    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                        ${status === "error"   ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : ""}
                    `}>
                        {status === "running" && "● Training"}
                        {status === "done"    && "✓ Complete"}
                        {status === "error"   && "✕ Failed"}
                    </span>
                )}
            </div>

            {status !== "idle" && (
                <div className="flex flex-col gap-1.5 shrink-0">
                    <div className="flex justify-between text-xs opacity-50">
                        <span>Progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full text-fontPrimaryLight bg-inputLight dark:bg-inputDark overflow-hidden">
                        <div
                            className={`
                                h-full rounded-full transition-all duration-500
                                ${status === "done"  ? "bg-green-500 dark:bg-green-400" : ""}
                                ${status === "error" ? "bg-errorLight dark:bg-errorDark" : ""}
                                ${status === "running" ? "bg-primaryLight dark:bg-primaryDark" : ""}
                            `}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {status === "done" && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                            Model saved and reloaded — new conversations will use it immediately.
                        </p>
                    )}
                    {status === "error" && (
                        <p className="text-xs text-errorLight dark:text-errorDark">
                            Training failed. Check the logs below for details.
                        </p>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col gap-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                    <p className="text-xs uppercase tracking-widest opacity-40">Logs</p>
                    {logs.length > 0 && (
                        <span className="text-[10px] opacity-30">{logs.length} lines</span>
                    )}
                </div>
                <div
                    ref={logRef}
                    className="flex-1 overflow-y-auto rounded-xs text-fontPrimaryLight bg-inputLight dark:bg-inputDark p-3 font-mono text-xs leading-relaxed"
                >
                    {logs.length === 0 ? (
                        <span className="opacity-30">
                            {status === "idle"
                                ? "Logs will appear here once training starts."
                                : "Connecting to training stream…"
                            }
                        </span>
                    ) : (
                        logs.map((line, i) => (
                            <div
                                key={i}
                                className={
                                    line.startsWith("[✓]")    ? "text-green-600 dark:text-green-400" :
                                    line.startsWith("[ERROR]") ? "text-errorLight dark:text-errorDark" :
                                    line.startsWith("[WARN]")  ? "text-warningLight dark:text-warningDark" :
                                    line.startsWith("[INFO]")  ? "opacity-60" :
                                    "opacity-80"
                                }
                            >
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}