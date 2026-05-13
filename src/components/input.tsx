import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const Input = ({
  id,
  label,
  type,
  leftIcon,
  rightIcon,
  className,
  disabled,
  error,
  onChange,
  onBlur,
  ...props
}: InputProps) => {
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
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          className={cn(
            "w-full rounded-md border bg-[#FDFEFF] py-3 text-sm text-slate-900",
            "placeholder:text-[#D2D4D6] focus:outline-none focus:ring-1 focus:ring-slate-200",
            leftIcon ? "pl-10" : "pl-3",
            rightIcon ? "pr-10" : "pr-3",
            error ? "border-red-500 focus:ring-red-200" : "border-[#F0F2F4]",
            disabled ? "opacity-60" : "",
            className,
          )}
          {...props}
        />

        {rightIcon ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};

export default Input;
