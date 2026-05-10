import Image from "next/image";
import type { ChangeEvent, ReactNode } from "react";
import CovyvoLogoAssets from "../../assets/logo";

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
        src={CovyvoLogoAssets.CovyvoAuthLogo}
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

type AuthFieldProps = {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
};

export const AuthField = ({
  id,
  label,
  type,
  placeholder,
  leftIcon,
  rightIcon,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  error,
}: AuthFieldProps) => {
  return (
    <div className="flex flex-col gap-[12px]">
      <label
        className="text-sm font-normal text-[#737880] leading-[140%]"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative min-w-[400px]">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#3B3E42]">
            {leftIcon}
          </span>
        ) : null}

        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={[
            "w-full rounded-md border bg-[#FDFEFF] py-3 text-sm text-slate-900",
            "placeholder:text-[#D2D4D6] focus:outline-none focus:ring-1 focus:ring-slate-200",
            leftIcon ? "pl-10" : "pl-3",
            rightIcon ? "pr-10" : "pr-3",
            error ? "border-red-500 focus:ring-red-200" : "border-[#F0F2F4]",
            disabled ? "opacity-60" : "",
          ].join(" ")}
        />

        {rightIcon ? (
          <span className="absolute cursor-pointer inset-y-0 right-3 flex items-center text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {/* {error ? <p className="text-xs text-red-600">{error}</p> : null} */}
    </div>
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

type AuthCheckboxProps = {
  id: string;
  label: string;
  defaultChecked?: boolean;
};

export const AuthCheckbox = ({
  id,
  label,
  defaultChecked,
}: AuthCheckboxProps) => {
  return (
    <label
      className="inline-flex items-center gap-3 text-slate-700"
      htmlFor={id}
    >
      <span className="relative">
        <input
          id={id}
          name={id}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer h-5 w-5 appearance-none rounded-[4px] border border-slate-300 bg-white outline-none"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[4px] bg-[#163A6B] opacity-0 peer-checked:opacity-100" />
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-white peer-checked:flex">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m20 6-11 11-5-5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
};

type AuthButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  onClick?: () => void;
};

export const AuthButton = ({
  children,
  disabled,
  variant = "primary",
  type = "button",
  onClick,
}: AuthButtonProps) => {
  const base = "w-full rounded-md py-3 px-6 text-sm font-medium cursor-pointer";
  const styles =
    variant === "primary"
      ? disabled
        ? "bg-slate-200 text-white"
        : "bg-[#163A6B] text-white"
      : "border border-[#03070C] bg-white text-[#03070C]";

  return (
    <button
      type={type}
      disabled={disabled}
      className={[base, styles].join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  );
};


