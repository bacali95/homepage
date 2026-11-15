import { toast as uiToast } from "@ui-sdk/react/toast";

export const toast = {
  success: (message: string, description?: string) =>
    uiToast.success(message, { description }),
  error: (message: string, description?: string) =>
    uiToast.error(message, { description }),
  info: (message: string, description?: string) =>
    uiToast.info(message, { description }),
  warning: (message: string, description?: string) =>
    uiToast.warning(message, { description }),
};
