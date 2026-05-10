export type ToastVariant = "error" | "success" | "info";
export type ToastData = {
  isOpen: boolean;
  message: string;
  variant: ToastVariant;
};