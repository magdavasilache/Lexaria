import { useNavigate } from "react-router-dom";
import { AdminTable, Column } from "./AdminTable";
import { BookResponseBase } from "../../../types/book-types/bookTypes";

interface Props {
    books: BookResponseBase[];
    isLoading: boolean;
    onEdit: (book: BookResponseBase) => void;
    onDelete: (book: BookResponseBase) => void;
}

const columns: Column<BookResponseBase>[] = [
    {
        key: "image",
        label: "",
        width: "56px",
        render: (book) => (
            <div className="w-9 h-12 rounded-xs overflow-hidden bg-dividerLight dark:bg-dividerDark shrink-0">
                <img
                    src={book.image ?? "/default-cover.jpg"}
                    alt={book.title}
                    className="w-full h-full object-cover"
                />
            </div>
        ),
    },
    {
        key: "title",
        label: "Title",
        render: (book) => (
            <span className="font-semibold line-clamp-1">{book.title}</span>
        ),
    },
    { key: "author_name", label: "Author" },
    { key: "language_name", label: "Language", width: "110px" },
    { key: "pages", label: "Pages", width: "80px" },
    {
        key: "average_rating",
        label: "Rating",
        width: "80px",
        render: (book) => (
            <span className="text-primaryLight dark:text-primaryDark font-semibold">
                {book.average_rating ?? "—"}
            </span>
        ),
    },
    {
        key: "tags",
        label: "Genres",
        render: (book) => (
            <div className="flex flex-wrap gap-1">
                {book.tags?.slice(0, 3).map((tag) => (
                    <span
                        key={tag}
                        className="px-1.5 py-0.5 text-xs rounded-full bg-primaryLight/10 dark:bg-primaryDark/15 text-primaryLight dark:text-primaryDark"
                    >
                        {tag}
                    </span>
                ))}
                {(book.tags?.length ?? 0) > 3 && (
                    <span className="text-xs opacity-40">+{book.tags!.length - 3}</span>
                )}
            </div>
        ),
    },
];

export default function BooksAdminTable({ books, isLoading, onEdit, onDelete }: Props) {
    const navigate = useNavigate();

    return (
        <AdminTable
            data={books}
            columns={columns}
            isLoading={isLoading}
            searchKeys={["title", "author_name", "language_name"]}
            onView={(book) => navigate(`/book/${book.id}`)}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}