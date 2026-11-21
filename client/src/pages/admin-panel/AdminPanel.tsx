import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import { useGetLanguages } from "../../api-handling/rtk-hooks/language/useGetLanguages";
import { useBooks } from "../../api-handling/rtk-hooks/useBooks";
import AuthorForm from "../../forms/AuthorForm";
import GenreForm from "../../forms/GenreForm";
import LanguageForm from "../../forms/LanguageForm";
import AwardForm from "../../forms/AwardForm";
import CountryForm from "../../forms/CountryForm";
import BookForm from "../../forms/BookForm";
import { AdminTable } from "./components/AdminTable";
import BooksAdminTable from "./components/BooksAdminTable";
import ChatbotAdminTab from "./ChatbotAdminTab";
import ActivityAdminTab from "./ActivityAdminTab";

const tabs = ["Authors", "Genres", "Languages", "Awards", "Countries", "Books", "Chatbot", "Activity"];
const READ_ONLY_TABS = new Set(["Chatbot", "Activity"]);

type SlideMode = "add" | "edit" | null;

export default function AdminPanel() {
    const { t } = useTranslation("front/admin");
    const [activeTab, setActiveTab] = useState("Books");
    const [slideMode, setSlideMode] = useState<SlideMode>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const { data: languages = [], isLoading: langsLoading } = useGetLanguages();
    const { books, isLoading: booksLoading } = useBooks();

    const openAdd = () => { setEditingItem(null); setSlideMode("add"); };
    const openEdit = (item: any) => { setEditingItem(item); setSlideMode("edit"); };
    const closeSlide = () => { setSlideMode(null); setEditingItem(null); };

    const handleDelete = (item: any) => {
        console.log("delete", item);
    };

    const isReadOnlyTab = READ_ONLY_TABS.has(activeTab);
    const tabLabel = (tab: string) => (tab === "Activity" ? t("activity.title") : tab);

    const singularLabel = activeTab !== "Countries"
        ? activeTab.slice(0, -1)
        : "Country";

    const renderTable = () => {
        switch (activeTab) {
            case "Chatbot":
                return <ChatbotAdminTab />;
            case "Activity":
                return <ActivityAdminTab />;
            case "Books":
                return (
                    <BooksAdminTable
                        books={books}
                        isLoading={booksLoading}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                    />
                );
            case "Languages":
                return (
                    <AdminTable
                        data={languages}
                        columns={[{ key: "name", label: "Name" }]}
                        isLoading={langsLoading}
                        searchKeys={["name"]}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                    />
                );
            default:
                return (
                    <p className="opacity-40 text-sm">No table configured for {activeTab} yet.</p>
                );
        }
    };

    const renderForm = () => {
        switch (activeTab) {
            case "Authors": return <AuthorForm />;
            case "Genres": return <GenreForm />;
            case "Languages": return <LanguageForm onSuccess={closeSlide} initialData={editingItem} />;
            case "Awards": return <AwardForm />;
            case "Countries": return <CountryForm />;
            case "Books": return <BookForm />;
            default: return null;
        }
    };

    return (
        <div className="w-full min-h-screen md:h-screen flex flex-col md:flex-row bg-backgroundLight dark:bg-backgroundDark text-fontPrimaryLight dark:text-fontPrimaryDark">

            <aside className="w-full md:w-44 shrink-0 border-b md:border-b-0 md:border-r border-dividerLight dark:border-dividerDark p-3 md:p-4 flex flex-wrap md:flex-col md:flex-nowrap gap-1">
                <p className="hidden md:block text-xs uppercase tracking-widest opacity-40 mb-3 px-2">Admin</p>
                {tabs.map((tab) => (
                    <Button
                        key={tab}
                        variant={activeTab === tab ? "primary" : "ghost"}
                        size="sm"
                        aria-current={activeTab === tab ? "page" : undefined}
                        onClick={() => { setActiveTab(tab); closeSlide(); }}
                        className={`min-h-10 md:justify-start ${activeTab === tab ? "" : "opacity-70 hover:opacity-100"}`}
                    >
                        {tabLabel(tab)}
                        {tab === "Chatbot" && (
                            <span className="ml-1.5 text-[10px] opacity-60 align-middle">✦</span>
                        )}
                    </Button>
                ))}
            </aside>

            <div className="flex-1 min-w-0 relative md:overflow-hidden flex flex-col">
                <div className="px-4 md:px-6 py-3 md:py-4 flex flex-wrap gap-2 justify-between items-center border-b border-dividerLight dark:border-dividerDark shrink-0">
                    <h1 className="text-base md:text-lg font-libre">{tabLabel(activeTab)}</h1>
                    {!isReadOnlyTab && (
                        <Button variant="secondary" size="sm" leftIcon={Plus} onClick={openAdd} className="min-h-10">
                            Add {singularLabel}
                        </Button>
                    )}
                </div>
                <div className="flex-1 md:overflow-hidden px-4 md:px-6 py-4">
                    {renderTable()}
                </div>
            </div>

            {slideMode && !isReadOnlyTab && (
                <div className="fixed md:absolute inset-0 md:inset-auto md:top-0 md:right-0 z-[999] w-full md:w-2/5 h-full bg-paperLight dark:bg-paperDark md:border-l border-dividerLight dark:border-dividerDark shadow-cardShadowLight dark:shadow-cardShadowDark animate-slide-in flex flex-col">
                    <div className="flex justify-between items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-dividerLight dark:border-dividerDark shrink-0">
                        <h2 className="text-base font-libre">
                            {slideMode === "edit" ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
                        </h2>
                        <Button variant="ghost" size="sm" leftIcon={X} onClick={closeSlide} className="min-h-10">
                            Close
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                        {renderForm()}
                    </div>
                </div>
            )}
        </div>
    );
}
