import { ToastData, ToastVariant } from "../types/toast";
import { create } from "zustand";



type ToastStore = ToastData & {
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  isOpen: false,
  message: "",
  variant: "info",
  showToast: (message, variant = "info") =>
    set({ isOpen: true, message, variant }),
  hideToast: () => set({ isOpen: false }),
}));

export const useToast = () => {
  const showToast = useToastStore((state) => state.showToast);
  const hideToast = useToastStore((state) => state.hideToast);
  return { showToast, hideToast };
};
