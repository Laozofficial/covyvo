"use client";

import Link from "next/link";
import { Eye, EyeClosed, Lock, Mail, User } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useToast } from "../../../src/store/toastState";
import {
  AuthBrand,
  AuthButton,
  AuthCard,
  AuthField,
  AuthHeading,
  AuthSeparator,
} from "../../../src/shared/auth/AuthUI";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  workMail: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<RegisterFormValues>({
    fullName: "",
    workMail: "",
    password: "",
  });
  const [touched, setTouched] = useState<
    Record<keyof RegisterFormValues, boolean>
  >({
    fullName: false,
    workMail: false,
    password: false,
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const validation = useMemo(() => registerSchema.safeParse(values), [values]);
  const fieldErrors = useMemo(() => {
    if (validation.success) return {};
    return validation.error.flatten().fieldErrors;
  }, [validation]);

  const shouldShowError = (field: keyof RegisterFormValues) => {
    return submittedOnce || touched[field];
  };

  const isFormValid = validation.success;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedOnce(true);

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const firstError =
        result.error.flatten().formErrors[0] ??
        result.error.flatten().fieldErrors.fullName?.[0] ??
        result.error.flatten().fieldErrors.workMail?.[0] ??
        result.error.flatten().fieldErrors.password?.[0];

      if (firstError) showToast(firstError, "error");
      return;
    }
    try {
      // Make your Api call here, boss
      setValues({ fullName: "", workMail: "", password: "" });
      setTouched({ fullName: false, workMail: false, password: false });
      setSubmittedOnce(false);
      showToast("Account details validated", "success");
    } catch (error: unknown) {
      console.error(error);
    }
  };

  return (
    <AuthCard>
      <AuthBrand />
      <AuthSeparator />

      <AuthHeading
        step="Step 1 of 2"
        title="Create your account"
        description="Enter your details to continue"
      />

      <form className="mt-6 flex flex-col gap-[16px]" onSubmit={onSubmit}>
        <AuthField
          id="fullName"
          label="Full name"
          type="text"
          placeholder="John Doe"
          leftIcon={<User size={18} />}
          value={values.fullName}
          onChange={(e) =>
            setValues((current) => ({ ...current, fullName: e.target.value }))
          }
          onBlur={() =>
            setTouched((current) => ({ ...current, fullName: true }))
          }
          error={
            shouldShowError("fullName") ? fieldErrors.fullName?.[0] : undefined
          }
        />
        <AuthField
          id="workMail"
          label="Work mail"
          type="email"
          placeholder="hello@mymail.com"
          leftIcon={<Mail size={18} />}
          value={values.workMail}
          onChange={(e) =>
            setValues((current) => ({ ...current, workMail: e.target.value }))
          }
          onBlur={() =>
            setTouched((current) => ({ ...current, workMail: true }))
          }
          error={
            shouldShowError("workMail") ? fieldErrors.workMail?.[0] : undefined
          }
        />
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          rightIcon={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-[#3B3E42]"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
            </button>
          }
          value={values.password}
          onChange={(e) =>
            setValues((current) => ({ ...current, password: e.target.value }))
          }
          onBlur={() =>
            setTouched((current) => ({ ...current, password: true }))
          }
          error={
            shouldShowError("password") ? fieldErrors.password?.[0] : undefined
          }
        />

        <div className="pt-2">
          <AuthButton type="submit" disabled={!isFormValid}>
            Create account
          </AuthButton>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1 w-full">
          <p className="text-base font-medium text-center  text-[#000000]">Or</p>
        </div>

        <AuthButton variant="secondary">Continue with Google</AuthButton>

        <div className="flex flex-col gap-[12px]">
          <p className="pt-2 text-center text-sm text-[#737880] text-nowrap">
            By continuing you agree to Covyvo&apos;s{" "}
            <Link
              className="text-[#055AF8] font-medium underline underline-offset-2"
              href="/terms"
            >
              Terms of Service
            </Link>
          </p>

          <p className="pt-2 text-center text-sm text-[#737880] text-nowrap">
            Already have an account?{" "}
            <Link
              className="text-[#1A3A6B] font-medium underline underline-offset-2"
              href="/auth/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
};

export default RegisterPage;
