import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, UserRound } from "lucide-react";
import DataTable, { Column } from "../../../../global-components/table/DataTable";
import Button from "../../../../global-components/buttons/Button";
import Modal from "../../../../global-components/modal/Modal";
import NameForm from "../../../../forms/catalog/NameForm";
import CountryForm from "../../../../forms/catalog/CountryForm";
import AwardForm from "../../../../forms/catalog/AwardForm";
import AuthorForm from "../../../../forms/catalog/AuthorForm";
import {
    entryName,
    useAuthors,
    useAwards,
    useCountries,
    useDeleteCatalogEntry,
    useGenres,
    useLanguages,
} from "../../../../api-handling/rtk-hooks/catalog/useCatalog";
import type { Author, Award, CatalogKind, Country, Genre, Language } from "../../../../types/catalog-types/catalogTypes";
import { serverAssetUrl } from "../../../../utils/assets";

type Entry = Language | Country | Genre | Award | Author;

type ListQuery<T> = { data?: T[]; isLoading: boolean; isError: boolean; refetch: () => unknown };

type TableProps<T extends Entry> = {
    kind: CatalogKind;
    query: ListQuery<T>;
    columns: Column<T>[];
    searchKeys: (keyof T)[];
    adding: boolean;
    onAddClose: () => void;
    renderForm: (entry: T | null, close: () => void) => ReactNode;
    usage: (entry: T) => string[];
};

function CatalogTable<T extends Entry>({ kind, query, columns, searchKeys, adding, onAddClose, renderForm, usage }: TableProps<T>) {
    const { t } = useTranslation(["front/catalog", "front/common"]);
    const deleteEntry = useDeleteCatalogEntry(kind);
    const [editing, setEditing] = useState<T | null>(null);
    const [deleting, setDeleting] = useState<T | null>(null);

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await deleteEntry.mutateAsync({ id: deleting.id, name: entryName(deleting) });
            setDeleting(null);
        } catch {
            return;
        }
    };

    const closeForm = () => {
        setEditing(null);
        onAddClose();
    };

    return (
        <>
            <DataTable
                stateKey={`admin.${kind}`}
                data={query.data ?? []}
                columns={columns}
                isLoading={query.isLoading}
                isError={query.isError}
                onRetry={() => void query.refetch()}
                searchKeys={searchKeys}
                rowLabel={entryName}
                onEdit={setEditing}
                onDelete={setDeleting}
                emptyMessage={t(`admin.empty.${kind}`)}
            />

            {(adding || editing) && renderForm(editing, closeForm)}

            <Modal
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                size="sm"
                icon={Trash2}
                title={t(`admin.deleteTitle.${kind}`)}
                dismissible={!deleteEntry.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(null)} disabled={deleteEntry.isPending} className="min-h-10">
                            {t("front/common:actions.cancel")}
                        </Button>
                        <Button variant="danger" size="sm" leftIcon={Trash2} onClick={confirmDelete} loading={deleteEntry.isPending} loadingText={t("admin.deleting")} className="min-h-10">
                            {t("admin.delete")}
                        </Button>
                    </>
                }
            >
                {deleting && (
                    <div className="flex flex-col gap-2 text-sm break-words">
                        <p>{t(`admin.deleteConfirm.${kind}`, { name: entryName(deleting) })}</p>
                        {usage(deleting).map((line) => (
                            <p key={line} className="text-fontMutedLight dark:text-fontMutedDark">{line}</p>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}

const COUNT_COLUMN = { width: "6rem", align: "right" as const, className: "tabular-nums" };

type TabProps = { adding: boolean; onAddClose: () => void };

function LanguagesTab(props: TabProps) {
    const { t } = useTranslation("front/catalog");
    return (
        <CatalogTable<Language>
            kind="languages"
            query={useLanguages()}
            columns={[
                { key: "name", label: t("admin.columns.name") },
                { key: "books_count", label: t("admin.columns.books"), ...COUNT_COLUMN },
            ]}
            searchKeys={["name"]}
            renderForm={(entry, close) => <NameForm kind="languages" entry={entry} onClose={close} />}
            usage={(language) => (language.books_count ? [t("admin.usedByBooks", { count: language.books_count })] : [])}
            {...props}
        />
    );
}

function GenresTab(props: TabProps) {
    const { t } = useTranslation("front/catalog");
    return (
        <CatalogTable<Genre>
            kind="genres"
            query={useGenres()}
            columns={[
                { key: "name", label: t("admin.columns.name") },
                { key: "books_count", label: t("admin.columns.books"), ...COUNT_COLUMN },
            ]}
            searchKeys={["name"]}
            renderForm={(entry, close) => <NameForm kind="genres" entry={entry} onClose={close} />}
            usage={(genre) => (genre.books_count ? [t("admin.usedByBooks", { count: genre.books_count })] : [])}
            {...props}
        />
    );
}

function CountriesTab(props: TabProps) {
    const { t } = useTranslation("front/catalog");
    return (
        <CatalogTable<Country>
            kind="countries"
            query={useCountries()}
            columns={[
                { key: "name", label: t("admin.columns.name") },
                { key: "language_name", label: t("admin.columns.language"), width: "10rem" },
                { key: "authors_count", label: t("admin.columns.authors"), ...COUNT_COLUMN },
                { key: "books_count", label: t("admin.columns.books"), ...COUNT_COLUMN },
            ]}
            searchKeys={["name", "language_name"]}
            renderForm={(entry, close) => <CountryForm entry={entry} onClose={close} />}
            usage={(country) => [
                ...(country.books_count ? [t("admin.usedByBooks", { count: country.books_count })] : []),
                ...(country.authors_count ? [t("admin.usedByAuthors", { count: country.authors_count })] : []),
            ]}
            {...props}
        />
    );
}

function AwardsTab(props: TabProps) {
    const { t } = useTranslation("front/catalog");
    return (
        <CatalogTable<Award>
            kind="awards"
            query={useAwards()}
            columns={[
                { key: "name", label: t("admin.columns.name"), render: (award) => <span className="line-clamp-2 break-words">{award.name}</span> },
                { key: "year", label: t("admin.columns.year"), width: "5rem", className: "tabular-nums" },
                { key: "books_count", label: t("admin.columns.books"), ...COUNT_COLUMN },
            ]}
            searchKeys={["name", "description"]}
            renderForm={(entry, close) => <AwardForm entry={entry} onClose={close} />}
            usage={(award) => (award.books_count ? [t("admin.usedByAwardBooks", { count: award.books_count })] : [])}
            {...props}
        />
    );
}

function AuthorsTab(props: TabProps) {
    const { t, i18n } = useTranslation("front/catalog");
    const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
    return (
        <CatalogTable<Author>
            kind="authors"
            query={useAuthors()}
            columns={[
                {
                    key: "image_url",
                    label: t("admin.columns.portrait"),
                    width: "4.5rem",
                    render: (author) => {
                        const src = serverAssetUrl(author.image_url);
                        return src ? (
                            <img src={src} alt={t("form.image.alt", { name: author.full_name })} className="h-12 w-9 rounded-control object-cover" />
                        ) : (
                            <span className="flex h-12 w-9 items-center justify-center rounded-control bg-panelLight dark:bg-panelDark">
                                <UserRound className="h-4 w-4 text-fontMutedLight dark:text-fontMutedDark" aria-hidden="true" />
                            </span>
                        );
                    },
                },
                { key: "full_name", label: t("admin.columns.name"), render: (author) => <span className="font-semibold break-words">{author.full_name}</span> },
                { key: "country_name", label: t("admin.columns.country"), width: "9rem" },
                { key: "birthdate", label: t("admin.columns.birthdate"), width: "8rem", render: (author) => (author.birthdate ? formatDate(author.birthdate) : "—") },
                { key: "books_count", label: t("admin.columns.books"), ...COUNT_COLUMN },
            ]}
            searchKeys={["full_name", "country_name"]}
            renderForm={(entry, close) => <AuthorForm entry={entry} onClose={close} />}
            usage={(author) => (author.books_count ? [t("admin.usedByAuthorBooks", { count: author.books_count })] : [])}
            {...props}
        />
    );
}

const TABS: Record<CatalogKind, (props: TabProps) => ReactNode> = {
    languages: LanguagesTab,
    genres: GenresTab,
    countries: CountriesTab,
    awards: AwardsTab,
    authors: AuthorsTab,
};

export default function CatalogAdminTab({ kind, ...props }: TabProps & { kind: CatalogKind }) {
    const Tab = TABS[kind];
    return <Tab key={kind} {...props} />;
}
