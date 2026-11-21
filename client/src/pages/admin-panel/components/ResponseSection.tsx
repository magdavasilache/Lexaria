import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareText, Plus, Trash2 } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import Modal from "../../../global-components/modal/Modal";
import DataTable, { Column, TableFilter } from "../../../global-components/table/DataTable";
import ResponseModal, { ResponseRow } from "./ResponseModal";
import { useDeleteResponse, useGetIntents } from "../../../api-handling/rtk-hooks/chatbot/useIntents";

type ResponseDialog = { mode: "add" } | { mode: "edit"; id: number } | null;

export default function ResponsesSection() {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const [dialog, setDialog] = useState<ResponseDialog>(null);
    const [toDelete, setToDelete] = useState<ResponseRow | null>(null);

    const intents = useGetIntents();
    const deleteResponse = useDeleteResponse();

    const rows = useMemo<ResponseRow[]>(
        () => (intents.data ?? []).flatMap((intent) =>
            intent.responses.map((response) => ({ id: response.id, response: response.response, intentId: intent.id, intentTag: intent.tag }))
        ),
        [intents.data]
    );
    const editing = dialog?.mode === "edit" ? rows.find((row) => row.id === dialog.id) ?? null : null;
    const intentOptions = useMemo(() => (intents.data ?? []).map((intent) => ({ id: intent.id, name: intent.tag })), [intents.data]);

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await deleteResponse.mutateAsync(toDelete.id);
            setToDelete(null);
        } catch {
            return;
        }
    };

    const columns: Column<ResponseRow>[] = [
        { key: "response", label: t("chatbot.responses.response"), render: (row) => <span className="line-clamp-2 break-words">{row.response}</span> },
        {
            key: "intentTag",
            label: t("chatbot.responses.intent"),
            width: "12rem",
            render: (row) => (
                <span className="rounded-control border border-tableBorderLight bg-tableHoverLight/60 px-2 text-xs text-tableHeaderTextLight break-all dark:border-tableBorderDark dark:bg-tableHoverDark dark:text-tableHeaderTextDark">
                    {row.intentTag}
                </span>
            ),
        },
    ];

    const filters: TableFilter<ResponseRow>[] = [
        {
            kind: "multi",
            key: "intents",
            label: t("chatbot.responses.intent"),
            icon: MessageSquareText,
            placeholder: t("chatbot.responses.addIntentFilter"),
            options: intentOptions,
            matches: (row, ids) => ids.includes(row.intentId),
        },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex shrink-0 justify-end">
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={Plus}
                    onClick={() => setDialog({ mode: "add" })}
                    disabled={intentOptions.length === 0}
                    className="min-h-10"
                >
                    {t("chatbot.responses.add")}
                </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <DataTable
                    stateKey="admin.chatbot.responses"
                    data={rows}
                    columns={columns}
                    filters={filters}
                    searchKeys={["response", "intentTag"]}
                    isLoading={intents.isLoading}
                    isError={intents.isError}
                    onRetry={() => intents.refetch()}
                    rowLabel={(row) => row.response}
                    onEdit={(row) => setDialog({ mode: "edit", id: row.id })}
                    onDelete={setToDelete}
                />
            </div>

            <ResponseModal open={dialog !== null} response={editing} intents={intents.data ?? []} onClose={() => setDialog(null)} />

            <Modal
                open={toDelete !== null}
                onClose={() => setToDelete(null)}
                size="sm"
                icon={Trash2}
                title={t("chatbot.responses.deleteTitle")}
                dismissible={!deleteResponse.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(null)} disabled={deleteResponse.isPending}>{t("front/common:actions.cancel")}</Button>
                        <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteResponse.isPending} loadingText={t("chatbot.responses.deleting")}>
                            {t("chatbot.responses.delete")}
                        </Button>
                    </>
                }
            >
                <p className="text-sm break-words">{t("chatbot.responses.deleteConfirm", { tag: toDelete?.intentTag ?? "" })}</p>
            </Modal>
        </div>
    );
}
