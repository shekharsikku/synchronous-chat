import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UploadActionProps {
  isConfirmOpen: boolean;
  onConfirmChange: (open: boolean) => void;
  confirmTitle: string;
  confirmDesc: string;
  onUploadCancel: () => void;
  onUploadConfirm: () => void;
  isUpdatePending: boolean;
  isDeleteOpen: boolean;
  onDeleteChange: (open: boolean) => void;
  deleteTitle: string;
  deleteDesc: string;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}

const UploadActionDialog: React.FC<UploadActionProps> = ({
  isConfirmOpen,
  onConfirmChange,
  confirmTitle,
  confirmDesc,
  onUploadCancel,
  onUploadConfirm,
  isUpdatePending,
  isDeleteOpen,
  onDeleteChange,
  deleteTitle,
  deleteDesc,
  onDeleteCancel,
  onDeleteConfirm,
}) => {
  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={onConfirmChange}>
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-start dark:text-gray-300">{confirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatePending} onClick={onUploadCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isUpdatePending} onClick={onUploadConfirm}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={onDeleteChange}>
        <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
        <AlertDialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl select-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-start dark:text-gray-300">{deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatePending} onClick={onDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isUpdatePending} onClick={onDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export { UploadActionDialog };
