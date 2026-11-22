import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookCopy, Trash2 } from "lucide-react";
import DataTable, { Column, TableFilter } from "../../../global-components/table/DataTable";
import Button from "../../../global-components/buttons/Button";
import Modal from "../../../global-components/modal/Modal";
import EditionForm from "../../../forms/EditionForm";
import { useAdminEditions, useDeleteEdition } from "../../../api-handling/rtk-hooks/reading/useEditions";
import { EDITION_FORMATS, type EditionAdmin } from "../../../types/reading-types/editionTypes";

export default function EditionsAdminTable() {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const navigate = useNavigate();
    const { data: editions = [], isLoading, isError, refetch } = useAdminEditions();
    const deleteEdition = useDeleteEdition();
    const [editing, setEditing] = useState<EditionAdmin | null>(null);
    const [deleting, setDeleting] = useState<EditionAdmin | null>(null);

    const filters: TableFilter<EditionAdmin>[] = [
        {
            kind: "select",
            key: "format",
            label: t("editionsAdmin.columns.format"),
            icon: BookCopy,
            options: [
                { value: "", label: t("editionsAdmin.anyFormat") },
                ...EDITION_FORMATS.map((value) => ({ value, label: t(`formats.${value}`) })),
            ],
            matches: (edition, value) => edition.format === value,
        },
    ];

    const columns: Column<EditionAdmin>[] = [
        {
            key: "book_title",
            label: t("editionsAdmin.columns.book"),
            render: (edition) => <span className="line-clamp-2 font-semibold break-words">{edition.book_title}</span>,
        },
        { key: "format", label: t("editionsAdmin.columns.format"), width: "7rem", render: (edition) => t(`formats.${edition.format}`) },
        { key: "pages", label: t("editionsAdmin.columns.pages"), width: "4.5rem", align: "right" },
        { key: "language_name", label: t("editionsAdmin.columns.language"), width: "8rem" },
        { key: "translator", label: t("editionsAdmin.columns.translator") },
        { key: "publisher", label: t("editionsAdmin.columns.publisher") },
        { key: "isbn", label: t("editionsAdmin.columns.isbn"), width: "9rem", className: "tabular-nums" },
        { key: "created_by_username", label: t("editionsAdmin.columns.addedBy"), width: "8rem" },
    ];

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await deleteEdition.mutateAsync(deleting.id);
            setDeleting(null);
        } catch {
            return;
        }
    };

    return (
        <>
            <DataTable
                stateKey="admin.editions"
                data={editions}
                columns={columns}
                isLoading={isLoading}
                isError={isError}
                onRetry={() => void refetch()}
                searchKeys={["book_title", "translator", "publisher", "isbn", "language_name"]}
                filters={filters}
                rowLabel={(edition) => t("editionsAdmin.rowLabel", { title: edition.book_title, format: t(`formats.${edition.format}`) })}
                onView={(edition) => navigate(`/book/${edition.book_id}`)}
                onEdit={setEditing}
                onDelete={setDeleting}
                emptyMessage={t("editionsAdmin.empty")}
            />

            {editing && (
                <EditionForm bookId={editing.book_id} edition={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
            )}

            <Modal
                open={deleting !== null}
                onClose={() => setDeleting(null)}
                size="sm"
                icon={Trash2}
                title={t("editionsAdmin.deleteTitle")}
                dismissible={!deleteEdition.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(null)} disabled={deleteEdition.isPending} className="min-h-10">
                            {t("front/common:actions.cancel")}
                        </Button>
                        <Button variant="danger" size="sm" leftIcon={Trash2} onClick={confirmDelete} loading={deleteEdition.isPending} loadingText={t("editionsAdmin.deleting")} className="min-h-10">
                            {t("editionsAdmin.delete")}
                        </Button>
                    </>
                }
            >
                <p className="text-sm break-words">
                    {deleting && t("editionsAdmin.deleteConfirm", { title: deleting.book_title, format: t(`formats.${deleting.format}`) })}
                </p>
            </Modal>
        </>
    );
}
