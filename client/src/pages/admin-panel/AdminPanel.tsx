import { useState } from "react";
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

const tabs = ["Authors", "Genres", "Languages", "Awards", "Countries", "Books", "Chatbot"];

type SlideMode = "add" | "edit" | null;

export default function AdminPanel() {
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

    const isChatbotTab = activeTab === "Chatbot";

    const singularLabel = activeTab !== "Countries"
        ? activeTab.slice(0, -1)
        : "Country";

    const renderTable = () => {
        switch (activeTab) {
            case "Chatbot":
                return <ChatbotAdminTab />;
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
        <div className="w-full h-screen flex bg-backgroundLight dark:bg-backgroundDark text-fontPrimaryLight dark:text-fontSecondaryDark">

            <aside className="w-[180px] shrink-0 h-full border-r border-dividerLight dark:border-dividerDark p-4 flex flex-col gap-1">
                <p className="text-xs uppercase tracking-widest opacity-40 mb-3 px-2">Admin</p>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); closeSlide(); }}
                        className={`
                            px-3 py-2 rounded-xs text-left text-sm transition-all
                            ${activeTab === tab
                                ? "bg-primaryLight dark:bg-primaryDark text-white shadow-buttonShadow dark:shadow-buttonShadowDark"
                                : "hover:bg-inputLight dark:hover:bg-inputDark opacity-70 hover:opacity-100"
                            }
                        `}
                    >
                        {tab}
                        {tab === "Chatbot" && (
                            <span className="ml-1.5 text-[10px] opacity-60 align-middle">✦</span>
                        )}
                    </button>
                ))}
            </aside>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                <div className="px-6 py-4 flex justify-between items-center border-b border-dividerLight dark:border-dividerDark shrink-0">
                    <h1 className="text-lg font-libre">{activeTab}</h1>
                    {!isChatbotTab && (
                        <button
                            onClick={openAdd}
                            className="px-4 py-2 text-sm rounded-xs bg-secondaryLight dark:bg-primaryDark dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:scale-105 transition"
                        >
                            + Add {singularLabel}
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-hidden px-6 py-4">
                    {renderTable()}
                </div>
            </div>

            {slideMode && !isChatbotTab && (
                <div className="absolute top-0 z-[999] right-0 w-[40%] h-full bg-paperLight dark:bg-paperDark border-l border-dividerLight dark:border-dividerDark shadow-cardShadowLight dark:shadow-cardShadowDark animate-slide-in flex flex-col">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-dividerLight dark:border-dividerDark shrink-0">
                        <h2 className="text-base font-libre">
                            {slideMode === "edit" ? `Edit ${singularLabel}` : `Add ${singularLabel}`}
                        </h2>
                        <button
                            onClick={closeSlide}
                            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                        >
                            ✕ Close
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {renderForm()}
                    </div>
                </div>
            )}
        </div>
    );
}