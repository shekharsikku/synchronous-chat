import { toast } from "sonner";
import { useState, useEffect } from "react";
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
import { Message } from "@/zustand/chat";
import { useChatStore } from "@/zustand";
import { encryptMessage } from "@/lib/utils";
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
  const { selectedChatData, updateMessage } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

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
      const edited: Message = await response.data.data;
      updateMessage(edited._id, edited);
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
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => setOpenEditMessageDialog(false)}>
            Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isLoading || currentMessage.text === newMessage}
            onClick={() => editSelectedMessage()}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { EditMessage };