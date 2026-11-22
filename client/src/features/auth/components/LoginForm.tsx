import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../hooks/useLogin"
import { LoginFormData, loginSchema } from "../schemas/loginSchema";
import { PASSWORD_RULES, USERNAME_RULES } from "../schemas/userRules";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import FormField from "../../../shared/forms/fields/FormField";
import CheckboxField from "../../../shared/forms/fields/CheckboxField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { useNavigate } from "react-router-dom";
import { useId } from "react";
import { LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import { useAuthModalStore } from "../stores/useAuthModalStore";

export default function LoginForm() {
    const loginOpen = useAuthModalStore(state => state.activeModal === "login")
    const openModal = useAuthModalStore(state => state.openModal)
    const closeModal = useAuthModalStore(state => state.closeModal)
    const formId = useId()
    const { t } = useTranslation(["front/users", "front/common"])

    const { register, handleSubmit, setError, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onTouched",
        defaultValues: { username: "", password: "", remember_me: false },
    })
    const login = useLogin()
    const fieldStatus = useFieldStatus(loginSchema, control)
    const navigate = useNavigate();

    const closeLoginForm = () => {
        closeModal()
        reset()
    }

    const handleSubmitForm = async (data: LoginFormData) => {
        try {
            await login.mutateAsync(data)
            closeLoginForm()
            navigate('/homepage')
        } catch (error) {
            applyFieldErrors(error, setError, ["username", "password"])
        }
    }

    return (
        <>
            <Button fullWidth onClick={() => openModal("login")}>{t("login.open")}</Button>
            <Modal
                open={loginOpen}
                onClose={closeLoginForm}
                title={t("login.title")}
                icon={LogIn}
                description={t("login.description")}
                dismissible={!isSubmitting}
                unsavedChanges={isDirty}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={closeLoginForm} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
                        <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("login.submitting")}>{t("login.submit")}</Button>
                    </>
                }
            >
                <form id={formId} noValidate className="flex flex-col gap-3" onSubmit={handleSubmit(handleSubmitForm)}>
                    <FormField
                        label={t("fields.username")}
                        type="text"
                        autoComplete="username"
                        required
                        maxLength={USERNAME_RULES.maxLength}
                        error={errors.username}
                        status={fieldStatus("username")}
                        {...register("username")}
                    />
                    <FormField
                        label={t("fields.password")}
                        type="password"
                        autoComplete="current-password"
                        required
                        maxLength={PASSWORD_RULES.loginMaxLength}
                        error={errors.password}
                        status={fieldStatus("password")}
                        {...register("password")}
                    />
                    <CheckboxField
                        label={t("login.rememberMe")}
                        helperText={t("login.rememberMeHelp")}
                        {...register("remember_me")}
                    />
                    <RequiredFieldsNote />
                </form>
            </Modal>
        </>
    )
}
