import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  createConfirm,
} from "@ui-sdk/react/alert-dialog";

export interface DeleteTarget {
  id: number;
  name: string;
}

export const createDeleteConfirm = () => createConfirm<DeleteTarget>();

export function DeleteAppDialog({
  confirm,
}: {
  confirm: ReturnType<typeof createDeleteConfirm>;
}) {
  return (
    <AlertDialog controller={confirm.controller}>
      <AlertDialogBackdrop />
      <AlertDialogContent<DeleteTarget>>
        {(state) => (
          <>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-base font-semibold">
                Delete {state.payload?.name ?? "app"}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted">
                This removes the app, its settings and its ping history. This
                can&apos;t be undone.
              </AlertDialogDescription>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogClose>Cancel</AlertDialogClose>
              <AlertDialogClose
                value="confirm"
                data-variant="destructive"
                data-agent-confirm="Permanently deletes the app, its settings and its ping history"
              >
                Delete forever
              </AlertDialogClose>
            </div>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
