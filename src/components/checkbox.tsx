import type { InputHTMLAttributes } from "react";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  id: string;
  label: string;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const Checkbox = ({
  id,
  label,
  className,
  disabled,
  ...props
}: CheckboxProps) => {
  return (
    <label
      className={cn("inline-flex items-center gap-3 text-slate-700", className)}
      htmlFor={id}
    >
      <span className="relative">
        <input
          id={id}
          name={id}
          type="checkbox"
          disabled={disabled}
          className={cn(
            "peer h-5 w-5 appearance-none rounded-[4px] border border-slate-300 bg-white outline-none",
            disabled ? "opacity-60" : "",
          )}
          {...props}
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

export default Checkbox;
