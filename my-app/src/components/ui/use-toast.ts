import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, options);
  },
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, options);
  },
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, options);
  },
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, options);
  },
};
