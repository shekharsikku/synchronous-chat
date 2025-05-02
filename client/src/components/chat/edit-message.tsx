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

interface EditMessageProps {
  openEditMessageDialog: boolean,
  setOpenEditMessageDialog: any,
  currentMessage: {
    id: string,
    text: string,
  },
}

const EditMessage = ({
  openEditMessageDialog,
  setOpenEditMessageDialog,
  currentMessage,
}: EditMessageProps) => {
  const { selectedChatData } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setNewMessage(currentMessage.text);
    }, 100);
  }, [currentMessage]);

  const editSelectedMessage = async () => {
    setIsLoading(true);
    try {
      const response = await api.patch(`/api/message/edit/${currentMessage.id}`, {
        text: encryptMessage(newMessage, selectedChatData?._id!)
      });
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={openEditMessageDialog} onOpenChange={setOpenEditMessageDialog}>
      <AlertDialogTrigger className="hidden"></AlertDialogTrigger>
      <AlertDialogContent
        className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-start">Edit Message!</AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            This changes will reflect to other user as well.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          type="text"
          onChange={(e) => setNewMessage(e.target.value)}
          value={newMessage || ""}
          placeholder="Edited Message..."
          onKeyDown={(e) => {
            if (e.key === "Tab" && !e.shiftKey && currentMessage.text !== newMessage) {
              e.preventDefault();
              requestAnimationFrame(() => {
                confirmBtnRef.current?.focus();
              });
            }
          }}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => setOpenEditMessageDialog(false)}>
            Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading || currentMessage.text === newMessage} ref={confirmBtnRef}
            onClick={() => editSelectedMessage()}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { EditMessage };