import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Plus, Shapes, Trash2, Upload } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import DataTable, { Column, TableFilter } from "../../../shared/components/table/DataTable";
import IntentModal from "./IntentModal";
import ImportModal from "./ImportModal";
import { INTENT_TYPES } from "../schemas/chatbotRules";
import { Intent } from "../chatbotTypes";
import { useDeleteIntent, useExportIntents, useIntents } from "../hooks/useChatbot";

type IntentDialog = { mode: "add" } | { mode: "edit"; id: number } | null;

const download = (data: unknown, filename: string) => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export default function IntentsSection() {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const [dialog, setDialog] = useState<IntentDialog>(null);
    const [toDelete, setToDelete] = useState<Intent | null>(null);
    const [importing, setImporting] = useState(false);
    const exportIntents = useExportIntents();

    const intents = useIntents();
    const deleteIntent = useDeleteIntent();
    const editing = dialog?.mode === "edit" ? intents.data?.find((intent) => intent.id === dialog.id) ?? null : null;

    const exportAll = () =>
        exportIntents.mutate(undefined, {
            onSuccess: (data) => download(data, `lexaria-chatbot-intents-${new Date().toISOString().slice(0, 10)}.json`),
        });

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
        {
            key: "tag",
            label: t("chatbot.intents.tag"),
            render: (intent) => (
                <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold break-words">{intent.tag}</span>
                    {intent.handled && (
                        <span title={t("chatbot.intents.handledHint")} className="rounded-control bg-infoLightTone px-2 text-xs text-infoTextLight dark:bg-infoDarkTone dark:text-infoTextDark">
                            {t("chatbot.intents.handled")}
                        </span>
                    )}
                </span>
            ),
        },
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
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" leftIcon={Download} onClick={exportAll} loading={exportIntents.isPending} loadingText={t("chatbot.intents.exporting")} className="min-h-10">
                    {t("chatbot.intents.export")}
                </Button>
                <Button variant="outline" size="sm" leftIcon={Upload} onClick={() => setImporting(true)} className="min-h-10">
                    {t("chatbot.intents.import")}
                </Button>
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

            <ImportModal open={importing} onClose={() => setImporting(false)} />

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
