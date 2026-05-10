"use client";
import { X } from "lucide-react";
import Toast from "./Toast";
import { useToast, useToastStore } from "../../store/toastState";

const ToastHost = () => {
  const toast = useToastStore((state) => state);
  const { hideToast } = useToast();

  if (!toast.isOpen) return null;

  return (
    <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2">
      <Toast
        message={toast.message}
        variant={toast.variant}
        rightAction={
          <button
            type="button"
            aria-label="Dismiss"
            className="text-white/90 hover:text-white"
            onClick={hideToast}
          >
            <X size={20} />
          </button>
        }
      />
    </div>
  );
};

export default ToastHost;
