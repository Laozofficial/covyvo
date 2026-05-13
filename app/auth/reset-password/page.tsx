import Link from "next/link";
import { Mail } from "lucide-react";

import Button from "../../../src/components/button";
import Input from "../../../src/components/input";
import {
  AuthBrand,
  AuthCard,
  AuthHeading,
  AuthSeparator,
} from "../../../src/shared/auth/AuthUI";

const ResetPasswordPage = () => {
  return (
    <section className="w-full">
      <AuthCard>
        <AuthBrand />
        <AuthSeparator />

        <AuthHeading
          title="Reset password"
          description="Enter your registered email for a reset code"
        />

        <form className="mt-6 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="hello@mymail.com"
          leftIcon={<Mail size={18} />}
          />

          <div className="pt-8">
            <Button>Send reset code</Button>
          </div>
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-xs text-slate-500">
        Remember password?{" "}
        <Link
          className="text-slate-900 underline underline-offset-2"
          href="/auth/login"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
};

export default ResetPasswordPage;
