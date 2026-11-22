import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, Award, Barcode, BookCopy, BookOpen, Bot, Globe, Languages, LucideIcon, Plus, ShieldCheck, Tags, Trash2, UserRound, Users } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import { useAuthors, useAwards, useCountries, useGenres, useLanguages } from "../../catalog/hooks/useCatalog";
import { useAdminBooks } from "../../books/hooks/useAdminBooks";
import { useDeleteBook } from "../../books/hooks/useBookMutations";
import { useAdminEditions } from "../../reading/hooks/useEditions";
import BookForm from "../../books/components/BookForm";
import IsbnImportModal from "../../imports/components/IsbnImportModal";
import type { BookListItem } from "../../books/types/bookTypes";
import type { CatalogKind } from "../../catalog/catalogTypes";
import BooksAdminTable from "../../books/components/BooksAdminTable";
import CatalogAdminTab from "../../catalog/components/CatalogAdminTab";
import EditionsAdminTable from "../../reading/components/EditionsAdminTable";
import ChatbotAdminTab from "../../chatbot/admin/ChatbotAdminTab";
import ActivityAdminTab from "../../audit/components/ActivityAdminTab";
import UsersAdminTable from "../../auth/components/UsersAdminTable";
import { useAdminUsers } from "../../auth/hooks/useAdminUsers";
import { useScopedFilters } from "../../../shared/stores/useFiltersStore";
import { useDocumentTitle } from "../../../shared/utils/useDocumentTitle";

const TABS = ["authors", "genres", "languages", "awards", "countries", "books", "editions", "users", "chatbot", "activity"] as const;
type Tab = (typeof TABS)[number];
type EditableTab = Exclude<Tab, "editions" | "users" | "chatbot" | "activity">;
const CATALOG_TABS: readonly Tab[] = ["authors", "genres", "languages", "awards", "countries"] satisfies readonly CatalogKind[];

const TAB_ICONS: Record<Tab, LucideIcon> = {
    authors: UserRound,
    genres: Tags,
    languages: Languages,
    awards: Award,
    countries: Globe,
    books: BookOpen,
    editions: BookCopy,
    users: Users,
    chatbot: Bot,
    activity: Activity,
};

const isEditable = (tab: Tab): tab is EditableTab => tab !== "editions" && tab !== "users" && tab !== "chatbot" && tab !== "activity";
const isCatalog = (tab: Tab): tab is CatalogKind => CATALOG_TABS.includes(tab);

const DEFAULT_VIEW: { tab: Tab } = { tab: "books" };

type BookModal = { mode: "add" } | { mode: "edit"; bookId: number } | null;

export default function AdminPanel() {
    const { t } = useTranslation(["front/admin", "front/books", "front/common"]);
    useDocumentTitle(t("front/common:pageTitle.adminPanel"));
    const [searchParams, setSearchParams] = useSearchParams();
    const { filters: { tab: storedTab }, setFilters: setView } = useScopedFilters("admin.panel", DEFAULT_VIEW);
    const activeTab = TABS.includes(storedTab) ? storedTab : DEFAULT_VIEW.tab;
    const [addingEntry, setAddingEntry] = useState(false);
    const [bookModal, setBookModal] = useState<BookModal>(null);
    const [bookToDelete, setBookToDelete] = useState<BookListItem | null>(null);
    const [importingIsbn, setImportingIsbn] = useState(false);

    const { data: languages } = useLanguages();
    const { data: authors } = useAuthors();
    const { data: countries } = useCountries();
    const { data: genres } = useGenres();
    const { data: awards } = useAwards();
    const { data: books = [], isLoading: booksLoading } = useAdminBooks(activeTab === "books");
    const { data: editions = [], isLoading: editionsLoading } = useAdminEditions(activeTab === "editions");
    const { data: users = [], isLoading: usersLoading } = useAdminUsers(activeTab === "users");

    const counts: Partial<Record<Tab, number | undefined>> = {
        authors: authors?.length,
        genres: genres?.length,
        languages: languages?.length,
        awards: awards?.length,
        countries: countries?.length,
        books: booksLoading ? undefined : books.length,
        editions: editionsLoading ? undefined : editions.length,
        users: usersLoading ? undefined : users.length,
    };
    const activeCount = counts[activeTab];
    const deleteBook = useDeleteBook();

    const addBookRequested = searchParams.get("new") === "book";
    const shownBookModal: BookModal = addBookRequested ? { mode: "add" } : bookModal;

    const closeBookModal = () => {
        setBookModal(null);
        if (addBookRequested) setSearchParams({}, { replace: true });
    };

    const openAdd = () => {
        if (activeTab === "books") setBookModal({ mode: "add" });
        else setAddingEntry(true);
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
        if (isCatalog(activeTab)) return <CatalogAdminTab kind={activeTab} adding={addingEntry} onAddClose={() => setAddingEntry(false)} />;
        switch (activeTab) {
            case "chatbot":
                return <ChatbotAdminTab />;
            case "activity":
                return <ActivityAdminTab />;
            case "editions":
                return <EditionsAdminTable />;
            case "users":
                return <UsersAdminTable />;
            case "books":
                return (
                    <BooksAdminTable
                        books={books}
                        isLoading={booksLoading}
                        onEdit={(book) => setBookModal({ mode: "edit", bookId: book.id })}
                        onDelete={setBookToDelete}
                    />
                );
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
                            onClick={() => { setView({ tab }); setAddingEntry(false); }}
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
                        <div className="flex flex-wrap gap-2">
                            {activeTab === "books" && (
                                <Button variant="outline" size="sm" leftIcon={Barcode} onClick={() => setImportingIsbn(true)} className="min-h-10">
                                    {t("add.isbn")}
                                </Button>
                            )}
                            <Button variant="secondary" size="sm" leftIcon={Plus} onClick={openAdd} className="min-h-10">
                                {t(`add.${activeTab}`)}
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-h-0 px-4 md:px-6 py-3 md:py-4 flex flex-col overflow-hidden">
                    {renderTable()}
                </div>
            </div>

            <BookForm
                open={shownBookModal !== null}
                bookId={shownBookModal?.mode === "edit" ? shownBookModal.bookId : null}
                onClose={closeBookModal}
            />

            {importingIsbn && <IsbnImportModal onClose={() => setImportingIsbn(false)} />}

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
