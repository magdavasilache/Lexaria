import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Languages, Star, Tags, UserRound } from "lucide-react";
import DataTable, { Column, TableFilter } from "../../../shared/components/table/DataTable";
import type { BookListItem } from "../types/bookTypes";
import type { AutocompleteOption } from "../../../shared/forms/fields/AutocompleteField";
import { serverAssetUrl, useCoverPlaceholder } from "../../../shared/utils/assets";
import { authorOptions, useAuthors, useLanguages } from "../../catalog/hooks/useCatalog";
import { BOOK_RULES } from "../schemas/bookRules";

const GENRES_SHOWN = 3;
const RATINGS = Array.from({ length: BOOK_RULES.ratingMax }, (_, index) => index + 1);

interface Props {
    books: BookListItem[];
    isLoading: boolean;
    onEdit: (book: BookListItem) => void;
    onDelete: (book: BookListItem) => void;
}

const namesOf = (options: AutocompleteOption[], ids: number[]) =>
    new Set(options.filter((option) => ids.includes(option.id)).map((option) => option.name));

export default function BooksAdminTable({ books, isLoading, onEdit, onDelete }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const navigate = useNavigate();
    const placeholder = useCoverPlaceholder();
    const authors = authorOptions(useAuthors().data);
    const { data: languages = [] } = useLanguages();
    const ratingFormat = new Intl.NumberFormat(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 2 });

    const uniqueGenres = new Map(books.flatMap((book) => book.genres).map((genre) => [genre.id, genre]));
    const genres = [...uniqueGenres.values()].sort((a, b) => a.name.localeCompare(b.name, i18n.resolvedLanguage));

    const filters: TableFilter<BookListItem>[] = [
        {
            kind: "multi",
            key: "authors",
            label: t("filters.author"),
            icon: UserRound,
            placeholder: t("filters.addAuthor"),
            options: authors,
            matches: (book, ids) => namesOf(authors, ids).has(book.author_name ?? ""),
        },
        {
            kind: "multi",
            key: "languages",
            label: t("filters.language"),
            icon: Languages,
            placeholder: t("filters.addLanguage"),
            options: languages,
            matches: (book, ids) => namesOf(languages, ids).has(book.language_name ?? ""),
        },
        {
            kind: "multi",
            key: "genres",
            label: t("admin.columns.genres"),
            icon: Tags,
            placeholder: t("admin.addGenre"),
            options: genres,
            matches: (book, ids) => book.genres.some((genre) => ids.includes(genre.id)),
        },
        {
            kind: "select",
            key: "rating",
            label: t("filters.rating"),
            icon: Star,
            options: [
                { value: "", label: t("admin.anyRating") },
                ...RATINGS.map((rating) => ({ value: String(rating), label: t("filters.atLeastStars", { count: rating }) })),
            ],
            matches: (book, value) => book.average_rating !== null && book.average_rating >= Number(value),
        },
    ];

    const columns: Column<BookListItem>[] = [
        {
            key: "cover",
            label: t("admin.columns.cover"),
            width: "3rem",
            render: (book) => (
                <span className="block h-9 w-6 shrink-0 overflow-hidden rounded-xs">
                    <img src={serverAssetUrl(book.cover_url) ?? placeholder} alt="" loading="lazy" className="h-full w-full object-cover" />
                </span>
            ),
        },
        {
            key: "title",
            label: t("admin.columns.title"),
            render: (book) => <span className="line-clamp-2 font-semibold break-words">{book.title}</span>,
        },
        { key: "author_name", label: t("admin.columns.author") },
        { key: "language_name", label: t("admin.columns.language"), width: "8rem" },
        { key: "pages", label: t("admin.columns.pages"), width: "4.5rem", align: "right" },
        {
            key: "average_rating",
            label: t("admin.columns.rating"),
            width: "4.5rem",
            align: "right",
            render: (book) => (
                <span className="font-semibold text-primaryLight dark:text-primaryDark">
                    {book.average_rating === null ? "—" : ratingFormat.format(book.average_rating)}
                </span>
            ),
        },
        {
            key: "genres",
            label: t("admin.columns.genres"),
            render: (book) => (
                <span className="flex flex-wrap gap-1">
                    {book.genres.slice(0, GENRES_SHOWN).map((genre) => (
                        <span key={genre.id} className="rounded-control border border-tableBorderLight bg-tableHoverLight/60 px-2 text-xs text-tableHeaderTextLight dark:border-tableBorderDark dark:bg-tableHoverDark dark:text-tableHeaderTextDark">
                            {genre.name}
                        </span>
                    ))}
                    {book.genres.length > GENRES_SHOWN && (
                        <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("admin.moreGenres", { count: book.genres.length - GENRES_SHOWN })}</span>
                    )}
                </span>
            ),
        },
    ];

    return (
        <DataTable
            stateKey="admin.books"
            data={books}
            columns={columns}
            isLoading={isLoading}
            searchKeys={["title", "author_name", "language_name"]}
            filters={filters}
            rowLabel={(book) => book.title}
            onView={(book) => navigate(`/book/${book.id}`)}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}
