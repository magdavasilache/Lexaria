import React from "react";
import { RegisterFormState } from "../types/auth-types/registerType";
import PasswordTooltip from "./components/PasswordTooltip";
import SubmitButton from "../global-components/buttons/SubmitButton";
import { useRegistration } from "../api-handling/authentication/useRegistration";
import { useSnackbarStore } from "../api-handling/context/snackbar/useSnackbarStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterFormData, registerSchema } from "../schemas/registerSchema";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import SimpleButton from "../global-components/buttons/SimpleButton";

export default function RegisterForm() {
  const [registerOpen, setRegisterOpen] = React.useState<boolean>(false)
  const openRegisterForm = () => {
    setRegisterOpen(true)
  }
  const closeRegisterForm = () => {
    setRegisterOpen(false)
  }
  const showSnackBar = useSnackbarStore(state => state.showSnackBar)


  const { register, handleSubmit, formState: { errors, isSubmitting, touchedFields }, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const registerUser = useRegistration()
  const username = watch('username')
  const password = watch('password')
  const confirmPassword = watch('confirmPassword')
  const navigate = useNavigate();

  const handleSubmitForm = async (data: RegisterFormData) => {
    try {
      await registerUser.mutateAsync(data)
      closeRegisterForm()
      navigate('/homepage')
    } catch (error) {
      console.error(error)
    }
  }

  const passwordsMatch = password === confirmPassword;
  const allFieldsFilled = username && password && confirmPassword;

  const getBorderColor = (field: keyof RegisterFormState) => {
    if (allFieldsFilled && passwordsMatch) return "border-green-500";
    if ((field === "password" || field === "confirmPassword") && !passwordsMatch)
      return "border-[#D32F19]";
    if (touchedFields[field] && !watch(field)) return "border-red-500";
    return "border-gray-300";
  };

  React.useEffect(() => {
    const errorMessages = Object.values(errors)
      .map(error => error.message)
      .filter(Boolean);

    if (errorMessages.length > 0) {
      showSnackBar(errorMessages.join('\n'), 'warning');
    }
  }, [errors]);

  return (
    <>
      <SimpleButton text="Register" buttonFunction={openRegisterForm} />
      {registerOpen &&
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]"></div>
          <div className="fixed inset-0 z-[80] flex justify-center items-center">
            <div className="relative w-full max-w-xl bg-white shadow-sm rounded-xs">
              {/* Header modal */}
              <div className="flex items-center justify-between p-4 bg-paperLight dark:bg-paperDark border-b border-dividerLight dark:border-dividerDark rounded-t-xs">
                <h3 className="text-lg font-bold font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Register Form</h3>
                <button
                  onClick={closeRegisterForm}
                  className="text-fontPrimaryLight dark:text-fontSecondaryDark hover:curson-pointer w-8 h-8 flex justify-center items-center transition"
                >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6" />
                  </svg>
                </button>
              </div>

              {/* Body modal */}
              <form className="space-y-4 bg-paperLight dark:bg-paperDark p-3" onSubmit={handleSubmit(handleSubmitForm)}>
                <div className="flex flex-col gap-2 p-2">
                  <div>
                    <label className="block text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Username</label>
                    <input type="text" {...register('username')} className={`w-full p-2 border rounded-xs shadow-md bg-inputLight dark:bg-inputDark ${getBorderColor("username")} mb-2 mt-1`} required />
                    {errors.username ? <span>{errors.username.message}</span> : null}
                  </div>
                  <div className="w-full flex flex-col">
                    <label htmlFor="password" className="block text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">
                      Password
                    </label>

                    <div className="flex items-center gap-2 relative mb-2">
                      <input
                        id="password"
                        type="password"
                        {...register("password")}
                        className={`w-full p-2 border mb-2 rounded-xs shadow-md bg-inputLight dark:bg-inputDark mt-1 ${getBorderColor("password")}`}
                        required
                      />
                      <PasswordTooltip />
                      {errors.password ? <span>{errors.password.message}</span> : null}
                    </div>

                    <div>
                      <label className="block text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Confirm Password</label>
                      <input type="password"
                        {...register("confirmPassword")}
                        className={`w-full p-2 border rounded-xs shadow-md bg-inputLight dark:bg-inputDark mt-1 ${getBorderColor("confirmPassword")}`} required />
                      {errors.confirmPassword ? <span>{errors.confirmPassword.message}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="w-full p-2">
                  <SubmitButton loading={isSubmitting} buttonText="Register" />
                </div>
              </form>
            </div>
          </div>
        </>}
    </>
  )
}