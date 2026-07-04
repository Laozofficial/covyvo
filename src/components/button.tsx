import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const Button = ({
  variant = "primary",
  fullWidth = true,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const base = cn(
    "rounded-md py-3 px-6 text-sm font-medium",
    "inline-flex items-center justify-center gap-2",
    fullWidth ? "w-full" : "w-auto",
    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
  );

  const styles =
    variant === "primary"
      ? disabled
        ? "bg-slate-200 text-white"
        : "bg-[#163A6B] text-white"
      : cn(
          "border border-[#03070C] bg-white text-[#03070C]",
          disabled ? "opacity-60" : "",
        );

  return (
    <button
      className={cn(base, styles, className)}
      disabled={disabled}
      {...props}
    >
      {leftIcon ? (
        <span className="inline-flex items-center">{leftIcon}</span>
      ) : null}
      <span className="inline-flex items-center">{children}</span>
      {rightIcon ? (
        <span className="inline-flex items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
};

export default Button;
