import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PencilLine, Plus } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import Modal, { ModalSize } from "../../global-components/modal/Modal";
import type { CatalogKind } from "../../types/catalog-types/catalogTypes";

type Props = {
    kind: CatalogKind;
    formId: string;
    editing: boolean;
    isSubmitting: boolean;
    isDirty: boolean;
    onClose: () => void;
    size?: ModalSize;
    children: ReactNode;
};

export default function CatalogFormModal({ kind, formId, editing, isSubmitting, isDirty, onClose, size = "md", children }: Props) {
    const { t } = useTranslation(["front/catalog", "front/admin", "front/common"]);

    return (
        <Modal
            open
            onClose={onClose}
            size={size}
            icon={editing ? PencilLine : Plus}
            title={t(editing ? `front/admin:edit.${kind}` : `front/admin:add.${kind}`)}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">
                        {t("front/common:actions.cancel")}
                    </Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("form.submitting")} className="min-h-10">
                        {t(editing ? "form.submitEdit" : "form.submitAdd")}
                    </Button>
                </>
            }
        >
            {children}
        </Modal>
    );
}
