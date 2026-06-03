import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SubmitButton from "../global-components/buttons/SubmitButton"
import { useLogin } from "../api-handling/authentication/useLogin"
import { LoginFormData, loginSchema } from "../schemas/loginSchema";
import { useNavigate } from "react-router-dom";
import React from "react";
import SimpleButton from "../global-components/buttons/SimpleButton";

export default function LoginForm() {
  const [loginOpen, setLoginOpen] = React.useState<boolean>(false)

  const openLoginForm = () => {
    setLoginOpen(true)
  }
  const closeLoginForm = () => {
    setLoginOpen(false)
  }

  const { register, handleSubmit, formState: { errors, isSubmitting, touchedFields }, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })
  const login = useLogin()
  const username = watch('username')
  const password = watch('password')
  const navigate = useNavigate();
  
  const handleSubmitForm = async (data: LoginFormData) => {
    try {
      await login.mutateAsync(data)
      closeLoginForm()
      navigate('/homepage')
    } catch (error) {
      console.error(error)
    }
  }
  const getBorderColor = (field: keyof LoginFormData) => {
    if (username && password) return "border-successLight dark:border-successDark";
    if (touchedFields[field] && !watch(field)) return "border-errorLight dark:border-errorDark";
    return "border-dividerLight dark:border-dividerDark";
  };
  return (
    <>
      <SimpleButton text="Login" buttonFunction={openLoginForm} />
      {loginOpen &&
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]"></div>
          <div className="fixed inset-0 z-[80] flex justify-center items-center">
            <div className="relative w-full max-w-xl shadow-sm rounded-xs">
              {/* Header modal */}
              <div className="flex items-center justify-between p-4 bg-paperLight dark:bg-paperDark border-b border-dividerLight dark:border-dividerDark rounded-t-xs">
                <h3 className="text-lg font-bold font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Login Form</h3>
                <button
                  onClick={closeLoginForm}
                  className="text-fontPrimaryLight dark:text-fontSecondaryDark hover:curson-pointer rounded-full w-8 h-8 flex justify-center items-center transition"
                >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7l-6 6" />
                  </svg>
                </button>
              </div>

              {/* Body modal */}
              <form className="space-y-4 bg-paperLight dark:bg-paperDark p-6" onSubmit={handleSubmit(handleSubmitForm)}>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Username</label>
                    <input
                      type="text"
                      {...register("username")}
                      className={`w-full p-2 border rounded-xs shadow-md mt-1 bg-inputLight dark:bg-inputDark ${getBorderColor("username")} mb-2`}
                      required
                    />
                    {errors.username && (
                      <span className="text-red-600 text-xs mt-1 block">{errors.username.message}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-libre text-fontPrimaryLight dark:text-fontSecondaryDark">Password</label>
                    <input
                      type="password"
                      {...register("password")}
                      className={`w-full p-2 border rounded-xs shadow-md bg-inputLight dark:bg-inputDark mt-1 ${getBorderColor("password")}`}
                      required
                    />
                    {errors.password && (
                      <span className="text-red-600 text-xs mt-1 block">{errors.password.message}</span>
                    )}
                  </div>
                </div>
                <div className="w-full">
                  <SubmitButton loading={isSubmitting} buttonText="Login" />
                </div>
              </form>
            </div>
          </div>
        </>
      }
    </>
  )

}