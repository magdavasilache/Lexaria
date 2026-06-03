import { useState } from "react";
import { ChatbotSubTab } from "../../types/chatbot-types";
import IntentsSection from "./components/IntentsSection";
import ResponsesSection from "./components/ResponseSection";
import TrainingSection from "./components/TrainingSection";
import HistorySection from "./components/HistorySection";

export function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
}

const subTabs: { key: ChatbotSubTab; label: string }[] = [
    { key: "intents", label: "Intents" },
    { key: "responses", label: "Responses" },
    { key: "training", label: "Training" },
    { key: "history", label: "History" },
];

export default function ChatbotAdminTab() {
    const [activeSubTab, setActiveSubTab] = useState<ChatbotSubTab>("intents");

    return (
        <div className="flex flex-col h-full gap-0 overflow-hidden">
            <div className="flex gap-1 border-b border-dividerLight dark:border-dividerDark pb-3 mb-4 shrink-0 flex-wrap">
                {subTabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveSubTab(key)}
                        className={`text-sm px-3 py-1.5 rounded-xs transition-all ${activeSubTab === key
                                ? "bg-primaryLight dark:bg-primaryDark text-white shadow-buttonShadow dark:shadow-buttonShadowDark"
                                : "opacity-60 hover:opacity-100 hover:bg-inputLight dark:hover:bg-inputDark dark:hover:text-fontPrimaryLight"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden">
                {activeSubTab === "intents" && <IntentsSection />}
                {activeSubTab === "responses" && <ResponsesSection />}
                {activeSubTab === "training" && <TrainingSection />}
                {activeSubTab === "history" && <HistorySection />}
            </div>
        </div>
    );
}