import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";

interface Props {
    open: boolean;
    title: string;
    message: string;
    pending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmDelete({ open, title, message, pending, onCancel, onConfirm }: Props) {
    const { t } = useTranslation(["front/common", "front/reviews"]);

    return (
        <Modal
            open={open}
            onClose={onCancel}
            size="sm"
            icon={Trash2}
            title={title}
            dismissible={!pending}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>{t("actions.cancel")}</Button>
                    <Button variant="danger" size="sm" leftIcon={Trash2} onClick={onConfirm} loading={pending} loadingText={t("front/reviews:form.deleting")}>
                        {title}
                    </Button>
                </>
            }
        >
            <p className="text-sm break-words">{message}</p>
        </Modal>
    );
}
