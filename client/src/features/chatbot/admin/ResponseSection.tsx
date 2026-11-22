import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, MessageSquareText, Plus, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import DataTable, { Column, TableFilter } from "../../../shared/components/table/DataTable";
import ResponseModal, { ResponseRow } from "./ResponseModal";
import { RESPONSE_LANGUAGES } from "../schemas/chatbotRules";
import { useDeleteResponse, useIntents } from "../hooks/useChatbot";

type ResponseDialog = { mode: "add" } | { mode: "edit"; id: number } | null;

export default function ResponsesSection() {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const [dialog, setDialog] = useState<ResponseDialog>(null);
    const [toDelete, setToDelete] = useState<ResponseRow | null>(null);

    const intents = useIntents();
    const deleteResponse = useDeleteResponse();

    const rows = (intents.data ?? []).flatMap((intent) =>
        intent.responses.map((response) => ({ id: response.id, response: response.response, language: response.language, intentId: intent.id, intentTag: intent.tag }))
    );
    const editing = dialog?.mode === "edit" ? rows.find((row) => row.id === dialog.id) ?? null : null;
    const intentOptions = (intents.data ?? []).map((intent) => ({ id: intent.id, name: intent.tag }));

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
            key: "language",
            label: t("chatbot.responses.language"),
            width: "7rem",
            render: (row) => t(`chatbot.responses.languages.${row.language}`),
        },
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
            kind: "select",
            key: "language",
            label: t("chatbot.responses.language"),
            icon: Languages,
            options: [
                { value: "", label: t("chatbot.responses.allLanguages") },
                ...RESPONSE_LANGUAGES.map((language) => ({ value: language, label: t(`chatbot.responses.languages.${language}`) })),
            ],
            matches: (row, value) => row.language === value,
        },
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
