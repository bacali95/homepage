import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react/toast";
import { X } from "lucide-react";

export function Toaster() {
  return (
    <ToastRegion data-agent-hidden side="bottom" align="end">
      {() => (
        <Toast>
          <div className="min-w-0 flex-1">
            <ToastTitle className="text-sm font-medium" />
            <ToastDescription className="mt-0.5 text-xs text-muted" />
          </div>
          <ToastClose aria-label="Dismiss notification">
            <X aria-hidden="true" />
          </ToastClose>
        </Toast>
      )}
    </ToastRegion>
  );
}
