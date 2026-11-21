import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Shapes, Trash2 } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import Modal from "../../../global-components/modal/Modal";
import DataTable, { Column, TableFilter } from "../../../global-components/table/DataTable";
import IntentModal from "./IntentModal";
import { INTENT_TYPES } from "../../../schemas/chatbotRules";
import { Intent } from "../../../types/chatbot-types";
import { useDeleteIntent, useGetIntents } from "../../../api-handling/rtk-hooks/chatbot/useIntents";

type IntentDialog = { mode: "add" } | { mode: "edit"; id: number } | null;

export default function IntentsSection() {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const [dialog, setDialog] = useState<IntentDialog>(null);
    const [toDelete, setToDelete] = useState<Intent | null>(null);

    const intents = useGetIntents();
    const deleteIntent = useDeleteIntent();
    const editing = dialog?.mode === "edit" ? intents.data?.find((intent) => intent.id === dialog.id) ?? null : null;

    const confirmDelete = async () => {
        if (!toDelete) return;
        try {
            await deleteIntent.mutateAsync(toDelete.id);
            setToDelete(null);
        } catch {
            return;
        }
    };

    const columns: Column<Intent>[] = [
        { key: "tag", label: t("chatbot.intents.tag"), render: (intent) => <span className="font-semibold break-words">{intent.tag}</span> },
        {
            key: "type",
            label: t("chatbot.intents.type"),
            width: "9rem",
            render: (intent) => (
                <span className="rounded-control border border-tableBorderLight bg-tableHoverLight/60 px-2 text-xs text-tableHeaderTextLight dark:border-tableBorderDark dark:bg-tableHoverDark dark:text-tableHeaderTextDark">
                    {t(`chatbot.intents.types.${intent.type}`)}
                </span>
            ),
        },
        { key: "patterns", label: t("chatbot.intents.patterns"), width: "6rem", align: "right", render: (intent) => intent.patterns.length },
        { key: "responses", label: t("chatbot.intents.responses"), width: "6rem", align: "right", render: (intent) => intent.responses.length },
    ];

    const filters: TableFilter<Intent>[] = [
        {
            kind: "select",
            key: "type",
            label: t("chatbot.intents.type"),
            icon: Shapes,
            options: [
                { value: "", label: t("chatbot.intents.allTypes") },
                ...INTENT_TYPES.map((type) => ({ value: type, label: t(`chatbot.intents.types.${type}`) })),
            ],
            matches: (intent, value) => intent.type === value,
        },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex shrink-0 justify-end">
                <Button variant="secondary" size="sm" leftIcon={Plus} onClick={() => setDialog({ mode: "add" })} className="min-h-10">
                    {t("chatbot.intents.add")}
                </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <DataTable
                    stateKey="admin.chatbot.intents"
                    data={intents.data ?? []}
                    columns={columns}
                    filters={filters}
                    searchKeys={["tag"]}
                    isLoading={intents.isLoading}
                    isError={intents.isError}
                    onRetry={() => intents.refetch()}
                    rowLabel={(intent) => intent.tag}
                    onEdit={(intent) => setDialog({ mode: "edit", id: intent.id })}
                    onDelete={setToDelete}
                />
            </div>

            <IntentModal
                open={dialog !== null}
                intent={editing}
                onClose={() => setDialog(null)}
                onCreated={(intent) => setDialog({ mode: "edit", id: intent.id })}
            />

            <Modal
                open={toDelete !== null}
                onClose={() => setToDelete(null)}
                size="sm"
                icon={Trash2}
                title={t("chatbot.intents.deleteTitle")}
                dismissible={!deleteIntent.isPending}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(null)} disabled={deleteIntent.isPending}>{t("front/common:actions.cancel")}</Button>
                        <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteIntent.isPending} loadingText={t("chatbot.intents.deleting")}>
                            {t("chatbot.intents.delete")}
                        </Button>
                    </>
                }
            >
                <p className="text-sm break-words">{t("chatbot.intents.deleteConfirm", { tag: toDelete?.tag ?? "" })}</p>
            </Modal>
        </div>
    );
}
