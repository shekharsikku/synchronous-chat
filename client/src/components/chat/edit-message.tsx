import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
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
import { useChatStore } from "@/zustand";
import { encryptMessage } from "@/lib/noble";
import api from "@/lib/api";

const EditMessage = ({
  editMessageDialog,
  setEditMessageDialog,
}: {
  editMessageDialog: boolean;
  setEditMessageDialog: any;
}) => {
  const { selectedChatData, messageForEdit, setEditDialog } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => setNewMessage(messageForEdit.text), 50);
  }, [messageForEdit]);

  const editSelectedMessage = async () => {
    setIsLoading(true);
    try {
      const response = await api.patch(`/api/message/edit/${messageForEdit.id}`, {
        text: encryptMessage(newMessage, selectedChatData?._id!),
      });
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setEditDialog(false);
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={editMessageDialog} onOpenChange={setEditMessageDialog}>
      <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
      <AlertDialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl select-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-start">Edit Message!</AlertDialogTitle>
          <AlertDialogDescription className="text-start dark:text-gray-300">
            This changes will reflect to other user as well.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          type="text"
          onChange={(e) => setNewMessage(e.target.value)}
          value={newMessage || ""}
          placeholder="Edited Message..."
          onKeyDown={(e) => {
            if (e.key === "Tab" && !e.shiftKey && messageForEdit.text !== newMessage) {
              e.preventDefault();
              requestAnimationFrame(() => {
                confirmBtnRef.current?.focus();
              });
            }
          }}
        />

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isLoading}
            onClick={() => {
              setEditDialog(false);
              setEditMessageDialog(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading || messageForEdit.text === newMessage}
            ref={confirmBtnRef}
            onClick={() => editSelectedMessage()}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { EditMessage };
