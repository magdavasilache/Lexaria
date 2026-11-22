import { useId } from "react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordRequirements from "./PasswordRequirements";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { useRegistration } from "../hooks/useRegistration";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterFormData, registerSchema } from "../schemas/registerSchema";
import { USERNAME_RULES } from "../schemas/userRules";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import { useAuthModalStore } from "../stores/useAuthModalStore";

export default function RegisterForm() {
  const registerOpen = useAuthModalStore(state => state.activeModal === "register")
  const openModal = useAuthModalStore(state => state.openModal)
  const closeModal = useAuthModalStore(state => state.closeModal)
  const formId = useId()
  const { t } = useTranslation(["front/users", "front/common"])

  const { register, handleSubmit, setError, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { username: "", password: "", confirmPassword: "" },
  })

  const registerUser = useRegistration()
  const navigate = useNavigate();
  const password = useWatch({ control, name: "password" })
  const fieldStatus = useFieldStatus(registerSchema, control)

  const closeRegisterForm = () => {
    closeModal()
    reset()
  }

  const handleSubmitForm = async ({ username, password }: RegisterFormData) => {
    try {
      await registerUser.mutateAsync({ username, password })
      closeRegisterForm()
      navigate('/homepage')
    } catch (error) {
      applyFieldErrors(error, setError, ["username", "password"])
    }
  }

  return (
    <>
      <Button fullWidth onClick={() => openModal("register")}>{t("register.open")}</Button>
      <Modal
        open={registerOpen}
        onClose={closeRegisterForm}
        title={t("register.title")}
        icon={UserPlus}
        description={t("register.description")}
        dismissible={!isSubmitting}
        unsavedChanges={isDirty}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeRegisterForm} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
            <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("register.submitting")}>{t("register.submit")}</Button>
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
            helperText={t("usernameHelper")}
            error={errors.username}
            status={fieldStatus("username")}
            {...register("username")}
          />
          <FormField
            label={t("fields.password")}
            type="password"
            autoComplete="new-password"
            required
            helperText={<PasswordRequirements value={password} />}
            error={errors.password}
            status={fieldStatus("password")}
            {...register("password")}
          />
          <FormField
            label={t("fields.confirmPassword")}
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword}
            status={fieldStatus("confirmPassword")}
            {...register("confirmPassword")}
          />
          <RequiredFieldsNote />
        </form>
      </Modal>
    </>
  )
}
