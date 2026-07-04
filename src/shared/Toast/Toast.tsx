import type { ReactNode } from "react";
import { ToastVariant } from "../../types/toast";


type ToastProps = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  rightAction?: ReactNode;
};

const variantStyles: Record<
  ToastVariant,
  { container: string; iconBg: string }
> = {
  error: { container: "bg-[#8B1D1D] text-white", iconBg: "bg-white/10" },
  success: { container: "bg-emerald-700 text-white", iconBg: "bg-white/10" },
  info: { container: "bg-slate-800 text-white", iconBg: "bg-white/10" },
};

const ErrorIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M15 9 9 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 9l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const Toast = ({
  title,
  message,
  variant = "error",
  rightAction,
}: ToastProps) => {
  const styles = variantStyles[variant];

  return (
    <section
      role="status"
      className={[
        "w-full rounded-md px-4 py-3",
        "flex items-center justify-between gap-4",
        styles.container,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            "h-9 w-9 rounded-md flex items-center justify-center",
            styles.iconBg,
          ].join(" ")}
        >
          <ErrorIcon />
        </span>
        <div className="leading-snug">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <p className="text-sm">{message}</p>
        </div>
      </div>

      {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
    </section>
  );
};

export default Toast;
