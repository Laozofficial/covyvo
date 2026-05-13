"use client";

import Link from "next/link";
import { Eye, EyeClosed, Lock, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { useToast } from "../../../src/store/toastState";
import Button from "../../../src/components/button";
import {
  AuthBrand,
  AuthCard,
  AuthCheckbox,
  AuthField,
  AuthHeading,
  AuthRow,
  AuthSeparator,
} from "../../../src/shared/auth/AuthUI";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState<
    Record<keyof LoginFormValues, boolean>
  >({
    email: false,
    password: false,
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const validation = useMemo(() => loginSchema.safeParse(values), [values]);
  const fieldErrors = useMemo(() => {
    if (validation.success) return {};
    return validation.error.flatten().fieldErrors;
  }, [validation]);

  const shouldShowError = (field: keyof LoginFormValues) =>
    submittedOnce || touched[field];
  const isFormValid = validation.success;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedOnce(true);

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const firstError =
        result.error.flatten().formErrors[0] ??
        result.error.flatten().fieldErrors.email?.[0] ??
        result.error.flatten().fieldErrors.password?.[0];
      if (firstError) showToast(firstError, "error");
      return;
    }

    showToast("Login details validated", "success");
  };

  return (
    <AuthCard>
      <div className="mt-6">
        <AuthBrand />
        <AuthSeparator />

        <AuthHeading
          title="Welcome back"
          description="Enter your details to sign in"
        />

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <AuthField
            id="email"
            label="Email"
            type="email"
            placeholder="hello@mymail.com"
            leftIcon={<Mail size={18} />}
            value={values.email}
            onChange={(e) =>
              setValues((current) => ({ ...current, email: e.target.value }))
            }
            onBlur={() =>
              setTouched((current) => ({ ...current, email: true }))
            }
            error={
              shouldShowError("email") ? fieldErrors.email?.[0] : undefined
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
                {showPassword ? (
                  <EyeClosed size={18} />
                ) : (
                  <Eye size={18} />
                )}{" "}
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
              shouldShowError("password")
                ? fieldErrors.password?.[0]
                : undefined
            }
          />

          <AuthRow
            left={
              <AuthCheckbox
                id="keepLoggedIn"
                label="Keep me logged in"
                defaultChecked
              />
            }
            right={
              <Link
                className="text-sm font-medium text-[#163A6B]"
                href="/auth/reset-password"
              >
                Forgot password?
              </Link>
            }
          />

          <div className="pt-8">
            <Button type="submit" disabled={!isFormValid}>
              Sign in
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 w-full">
            <p className="text-base font-medium text-center  text-[#000000]">
              Or
            </p>
          </div>

          <Button variant="secondary">Continue with Google</Button>
        </form>
      </div>
    </AuthCard>
  );
};

export default LoginPage;
