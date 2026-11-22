import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target } from "lucide-react";
import Button from "../global-components/buttons/Button";
import Modal from "../global-components/modal/Modal";
import NumberField from "./components/NumberField";
import { applyFieldErrors } from "./applyFieldErrors";
import { useFieldStatus } from "./useFieldStatus";
import { ReadingGoalValues, readingGoalSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useSetReadingGoal } from "../api-handling/rtk-hooks/reading/useReadingGoal";

const FIELDS = ["minutes"] as const;
const ALIASES = { daily_reading_goal_minutes: "minutes" } as const;
const GOAL_STEP = 5;

export default function ReadingGoalForm({ minutes, onClose }: { minutes: number | null; onClose: () => void }) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const formId = useId();
    const setGoal = useSetReadingGoal();
    const { handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ReadingGoalValues>({
        resolver: zodResolver(readingGoalSchema),
        mode: "onTouched",
        defaultValues: { minutes },
    });
    const fieldStatus = useFieldStatus(readingGoalSchema, control);

    const submit = async (values: ReadingGoalValues) => {
        try {
            await setGoal.mutateAsync({ daily_reading_goal_minutes: values.minutes });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS, ALIASES);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            icon={Target}
            title={t("goal.title")}
            description={t("goal.description")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("goal.submitting")} className="min-h-10">
                        {t("goal.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <Controller
                    name="minutes"
                    control={control}
                    render={({ field }) => (
                        <NumberField
                            label={t("goal.minutes")}
                            min={READING_RULES.goalMinutesMin}
                            max={READING_RULES.goalMinutesMax}
                            step={GOAL_STEP}
                            helperText={t("goal.minutesHelper")}
                            error={errors.minutes}
                            status={fieldStatus("minutes")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                    )}
                />
            </form>
        </Modal>
    );
}
