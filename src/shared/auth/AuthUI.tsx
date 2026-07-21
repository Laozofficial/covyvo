import Image from "next/image";
import type { ReactNode } from "react";
import covyvoLogo from "../../assets/logo/logo.png";

type AuthCardProps = {
  children: ReactNode;
};

export const AuthCard = ({ children }: AuthCardProps) => {
  return (
    <section className="w-full max-w-[580px] rounded-xl border border-[#F0F2F4] bg-white shadow-sm">
      <div className="px-8 pt-8 pb-7">{children}</div>
    </section>
  );
};

export const AuthBrand = () => {
  return (
    <div className="flex items-center gap-2 ">
      <Image
        src={covyvoLogo}
        alt="Covyvo"
        priority
        className="h-auto w-[168px]"
      />
    </div>
  );
};

export const AuthSeparator = () => {
  return <div className="mt-6 h-px w-full bg-slate-200" />;
};

type AuthHeadingProps = {
  title: string;
  description: string;
  step?: string;
};

export const AuthHeading = ({ title, description, step }: AuthHeadingProps) => {
  return (
    <header className="mt-5 flex flex-col gap-[8px]">
      {step ? (
        <p className="text-[.75rem] font-bold text-[#737880] ">{step}</p>
      ) : null}
      <h1 className=" text-[1.4375rem] leading-[140%] font-medium text-[#050807]">
        {title}
      </h1>
      <p className=" text-[.875rem] leading-[140%] font-normal text-[#2E2E2E]">
        {description}
      </p>
    </header>
  );
};

type AuthRowProps = {
  left: ReactNode;
  right: ReactNode;
};

export const AuthRow = ({ left, right }: AuthRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      {left}
      {right}
    </div>
  );
};
