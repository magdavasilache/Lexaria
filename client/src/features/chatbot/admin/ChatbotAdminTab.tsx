import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";
import { ChatbotSubTab } from "../chatbotTypes";
import IntentsSection from "./IntentsSection";
import ResponsesSection from "./ResponseSection";
import TrainingSection from "./TrainingSection";
import HistorySection from "./HistorySection";
import TestSection from "./TestSection";
import AnalyticsSection from "./AnalyticsSection";

const SUB_TABS: ChatbotSubTab[] = ["intents", "responses", "test", "training", "history", "analytics"];

export default function ChatbotAdminTab() {
    const { t } = useTranslation("front/admin");
    const [activeSubTab, setActiveSubTab] = useState<ChatbotSubTab>("intents");

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="mb-4 flex shrink-0 gap-1 overflow-x-auto border-b border-dividerLight pb-3 dark:border-dividerDark">
                {SUB_TABS.map((key) => (
                    <Button
                        key={key}
                        variant="menu"
                        size="sm"
                        aria-current={activeSubTab === key ? "page" : undefined}
                        onClick={() => setActiveSubTab(key)}
                        className="min-h-10 shrink-0"
                    >
                        {t(`chatbot.tabs.${key}`)}
                    </Button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                {activeSubTab === "intents" && <IntentsSection />}
                {activeSubTab === "responses" && <ResponsesSection />}
                {activeSubTab === "test" && <TestSection />}
                {activeSubTab === "training" && <TrainingSection />}
                {activeSubTab === "history" && <HistorySection />}
                {activeSubTab === "analytics" && <AnalyticsSection />}
            </div>
        </div>
    );
}
