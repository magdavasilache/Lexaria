import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, Award, BookOpen, Bot, Globe, Languages, LucideIcon, Plus, ShieldCheck, Tags, Trash2, UserRound, X } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import Modal from "../../global-components/modal/Modal";
import { useGetLanguages } from "../../api-handling/rtk-hooks/language/useGetLanguages";
import { useGetFormAuthors } from "../../api-handling/rtk-hooks/author/useGetFormAuthors";
import { useGetFormCountries } from "../../api-handling/rtk-hooks/country/useGetFormCountries";
import { useAdminBooks } from "../../api-handling/rtk-hooks/books/useAdminBooks";
import { useDeleteBook } from "../../api-handling/rtk-hooks/books/useBookMutations";
import AuthorForm from "../../forms/AuthorForm";
import GenreForm from "../../forms/GenreForm";
import LanguageForm from "../../forms/LanguageForm";
import AwardForm from "../../forms/AwardForm";
import CountryForm from "../../forms/CountryForm";
import BookForm from "../../forms/BookForm";
import type { Language } from "../../types/language/languageTypes";
import type { BookListItem } from "../../types/book-types/bookTypes";
import DataTable, { Column } from "../../global-components/table/DataTable";
import BooksAdminTable from "./components/BooksAdminTable";
import ChatbotAdminTab from "./ChatbotAdminTab";
import ActivityAdminTab from "./ActivityAdminTab";
import { useScopedFilters } from "../../state_management/useFiltersStore";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const TABS = ["authors", "genres", "languages", "awards", "countries", "books", "chatbot", "activity"] as const;
type Tab = (typeof TABS)[number];
type EditableTab = Exclude<Tab, "chatbot" | "activity">;

const TAB_ICONS: Record<Tab, LucideIcon> = {
    authors: UserRound,
    genres: Tags,
    languages: Languages,
    awards: Award,
    countries: Globe,
    books: BookOpen,
    chatbot: Bot,
    activity: Activity,
};

const isEditable = (tab: Tab): tab is EditableTab => tab !== "chatbot" && tab !== "activity";

const DEFAULT_VIEW: { tab: Tab } = { tab: "books" };

type SlideMode = "add" | "edit" | null;
type NamedRow = { id: number; name: string };
type BookModal = { mode: "add" } | { mode: "edit"; bookId: number } | null;

export default function AdminPanel() {
    const { t } = useTranslation(["front/admin", "front/books", "front/common"]);
    useDocumentTitle(t("front/common:pageTitle.adminPanel"));
    const [searchParams, setSearchParams] = useSearchParams();
    const { filters: { tab: storedTab }, setFilters: setView } = useScopedFilters("admin.panel", DEFAULT_VIEW);
    const activeTab = TABS.includes(storedTab) ? storedTab : DEFAULT_VIEW.tab;
    const [slideMode, setSlideMode] = useState<SlideMode>(null);
    const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
    const [bookModal, setBookModal] = useState<BookModal>(null);
    const [bookToDelete, setBookToDelete] = useState<BookListItem | null>(null);

    const { data: languages = [], isLoading: langsLoading } = useGetLanguages();
    const { data: authors = [], isLoading: authorsLoading } = useGetFormAuthors();
    const { data: countries = [], isLoading: countriesLoading } = useGetFormCountries();
    const { data: books = [], isLoading: booksLoading } = useAdminBooks(activeTab === "books");

    const counts: Partial<Record<Tab, number | undefined>> = {
        authors: authorsLoading ? undefined : authors.length,
        languages: langsLoading ? undefined : languages.length,
        countries: countriesLoading ? undefined : countries.length,
        books: booksLoading ? undefined : books.length,
    };
    const activeCount = counts[activeTab];
    const nameColumns: Column<NamedRow>[] = [{ key: "name", label: t("panel.nameColumn") }];
    const deleteBook = useDeleteBook();

    const addBookRequested = searchParams.get("new") === "book";
    const shownBookModal: BookModal = addBookRequested ? { mode: "add" } : bookModal;

    const closeSlide = () => { setSlideMode(null); setEditingLanguage(null); };
    const closeBookModal = () => {
        setBookModal(null);
        if (addBookRequested) setSearchParams({}, { replace: true });
    };

    const openAdd = () => {
        if (activeTab === "books") setBookModal({ mode: "add" });
        else { setEditingLanguage(null); setSlideMode("add"); }
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;
        try {
            await deleteBook.mutateAsync({ bookId: bookToDelete.id, title: bookToDelete.title });
            setBookToDelete(null);
        } catch {
            return;
        }
    };

    const renderTable = () => {
        switch (activeTab) {
            case "chatbot":
                return <ChatbotAdminTab />;
            case "activity":
                return <ActivityAdminTab />;
            case "books":
                return (
                    <BooksAdminTable
                        books={books}
                        isLoading={booksLoading}
                        onEdit={(book) => setBookModal({ mode: "edit", bookId: book.id })}
                        onDelete={setBookToDelete}
                    />
                );
            case "languages":
                return (
                    <DataTable
                        stateKey="admin.languages"
                        data={languages}
                        columns={nameColumns}
                        isLoading={langsLoading}
                        searchKeys={["name"]}
                        rowLabel={(language) => language.name}
                        onEdit={(language) => { setEditingLanguage(language); setSlideMode("edit"); }}
                    />
                );
            case "authors":
                return <DataTable stateKey="admin.authors" data={authors} columns={nameColumns} isLoading={authorsLoading} searchKeys={["name"]} />;
            case "countries":
                return <DataTable stateKey="admin.countries" data={countries} columns={nameColumns} isLoading={countriesLoading} searchKeys={["name"]} />;
            default:
                return <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("panel.notConfigured")}</p>;
        }
    };

    const renderForm = () => {
        switch (activeTab) {
            case "authors": return <AuthorForm />;
            case "genres": return <GenreForm />;
            case "languages": return <LanguageForm onSuccess={closeSlide} initialData={editingLanguage} />;
            case "awards": return <AwardForm />;
            case "countries": return <CountryForm />;
            default: return null;
        }
    };

    return (
        <div className="relative w-full h-[calc(100dvh-60px)] overflow-hidden flex flex-col md:flex-row bg-backgroundLight dark:bg-backgroundDark text-fontPrimaryLight dark:text-fontPrimaryDark">

            <aside className="relative z-10 w-full md:w-48 lg:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-2 md:p-3 font-libre border-b md:border-b-0 md:border-r border-panelBorderLight dark:border-panelBorderDark bg-panelLight/95 dark:bg-panelDark/95 backdrop-blur-md shadow-soft-sm dark:shadow-deep-sm">
                <p className="hidden md:flex items-center gap-2 px-2 pt-1 pb-3 mb-1 border-b border-panelBorderLight dark:border-panelBorderDark text-sm font-semibold text-primaryLight dark:text-primaryDark">
                    <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {t("panel.heading")}
                </p>
                <nav aria-label={t("panel.heading")} className="contents">
                    {TABS.map((tab) => (
                        <Button
                            key={tab}
                            variant="menu"
                            size="sm"
                            leftIcon={TAB_ICONS[tab]}
                            aria-current={activeTab === tab ? "page" : undefined}
                            onClick={() => { setView({ tab }); closeSlide(); }}
                            className="min-h-10 shrink-0 md:justify-start"
                        >
                            {t(`tabs.${tab}`)}
                        </Button>
                    ))}
                </nav>
            </aside>

            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                <div className="px-4 md:px-6 py-3 md:py-4 flex flex-wrap gap-2 justify-between items-center border-b border-dividerLight dark:border-dividerDark shrink-0">
                    <h1 className="flex items-center gap-2 text-base md:text-lg font-libre">
                        {t(`tabs.${activeTab}`)}
                        {activeCount !== undefined && (
                            <span className="inline-flex items-center rounded-full border border-countChipBorderLight bg-countChipLight px-2 py-0.5 text-xs font-semibold tabular-nums text-countChipTextLight dark:border-countChipBorderDark dark:bg-countChipDark dark:text-countChipTextDark">
                                <span aria-hidden="true">{activeCount}</span>
                                <span className="sr-only">{t("panel.count", { count: activeCount })}</span>
                            </span>
                        )}
                    </h1>
                    {isEditable(activeTab) && (
                        <Button variant="secondary" size="sm" leftIcon={Plus} onClick={openAdd} className="min-h-10">
                            {t(`add.${activeTab}`)}
                        </Button>
                    )}
                </div>
                <div className="flex-1 min-h-0 px-4 md:px-6 py-3 md:py-4 flex flex-col overflow-hidden">
                    {renderTable()}
                </div>
            </div>

            {slideMode && isEditable(activeTab) && activeTab !== "books" && (
                <div className="fixed md:absolute inset-0 md:inset-auto md:top-0 md:right-0 z-[999] w-full md:w-2/5 h-full bg-paperLight dark:bg-paperDark md:border-l border-dividerLight dark:border-dividerDark shadow-cardShadowLight dark:shadow-cardShadowDark animate-slide-in flex flex-col">
                    <div className="flex justify-between items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-dividerLight dark:border-dividerDark shrink-0">
                        <h2 className="text-base font-libre">{t(`${slideMode}.${activeTab}`)}</h2>
                        <Button variant="ghost" size="sm" leftIcon={X} onClick={closeSlide} className="min-h-10">
                            {t("panel.close")}
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
                        {renderForm()}
                    </div>
                </div>
            )}

            <BookForm
                open={shownBookModal !== null}
                bookId={shownBookModal?.mode === "edit" ? shownBookModal.bookId : null}
                onClose={closeBookModal}
            />

            <Modal
                open={bookToDelete !== null}
                onClose={() => setBookToDelete(null)}
                size="sm"
                icon={Trash2}
                title={t("front/books:admin.deleteTitle")}
                dismissible={!deleteBook.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setBookToDelete(null)} disabled={deleteBook.isPending}>{t("front/common:actions.cancel")}</Button>
                        <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteBook.isPending} loadingText={t("front/books:admin.deleting")}>
                            {t("front/books:admin.delete")}
                        </Button>
                    </>
                }
            >
                <p className="text-sm break-words">{t("front/books:admin.deleteConfirm", { title: bookToDelete?.title ?? "" })}</p>
            </Modal>
        </div>
    );
}
