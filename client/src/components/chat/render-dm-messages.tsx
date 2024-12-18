import { toast } from "sonner";
import {
  HiOutlineNoSymbol,
  HiOutlineTrash,
  HiOutlineClipboardDocument,
  HiOutlineCloudArrowDown,
  HiOutlineDocumentArrowDown,
  HiOutlineViewfinderCircle
} from "react-icons/hi2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Message } from "@/zustand/slice/chat";
import { useSocket } from "@/context/socket-context";
import { useChatStore, useAuthStore } from "@/zustand"
import { useEffect, useState } from "react";
import { checkImageType, decryptMessage } from "@/utils";
import moment from "moment";
import api from "@/lib/api";

const RenderDMMessages = ({ message, lastMessageId }: { message: Message, lastMessageId: string }) => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, messages, setMessages } = useChatStore();

  const shakeClass = message._id === lastMessageId ? "shake" : "";
  const deletedMessage = message.sender === selectedChatData?._id
    ? "This message was deleted" : "You deleted this message";

  const copyToClipboard = (text: string) => {
    try {
      // const stringifiedData = JSON.stringify(dataToCopy, null, 2);
      navigator.clipboard.writeText(text);
      toast.info("Message copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy message!");
    }
  };

  useEffect(() => {
    const messageRemove = (current: any) => {
      const updated = messages.map(message => message._id === current._id ? current : message);
      setMessages([...updated]);
    };

    socket?.on("message:remove", messageRemove);

    return () => {
      socket?.off("message:remove", messageRemove);
    };
  }, [socket, messages, setMessages]);

  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`);
      const deletedMessage = await response.data.data;
      const updatedMessages = messages.map(message => message._id === deletedMessage._id ? deletedMessage : message);
      setMessages([...updatedMessages]);
      toast.info(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  const handleDownload = (messageFile: Message) => {
    const link = document.createElement('a');
    link.href = messageFile.file!;
    link.download = messageFile._id;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [imageViewExtend, setImageViewExtend] = useState(false);

  const isDevelopment = import.meta.env.DEV;

  /** for convert encrypt message to plain text */
  const plainText = (message: Message) => {
    try {
      let messageKey = "";

      if (message.sender === selectedChatData?._id) {
        messageKey = userInfo?._id!;
      } else {
        messageKey = selectedChatData?._id!;
      }

      return decryptMessage(message.text!, messageKey);
    } catch (error) {
      isDevelopment && console.error("Plain text decryption failed:", error);
      return "Decryption Error!";
    }
  }

  return (
    <div className={`${message.sender !== selectedChatData?._id ? "text-right" : "text-left"} w-full`}>
      {message && (
        <>
          <ContextMenu>
            <ContextMenuTrigger className={`${message.sender !== selectedChatData?._id
              ? "bg-gray-200 text-gray-950 border-white/20"
              : "bg-gray-100 text-gray-900 border-white/10"} 
                border inline-block p-3 rounded-sm my-1 break-words
                md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] ${shakeClass}
                ${message.type === "deleted" ? "cursor-not-allowed" : "cursor-default"}`}>
              {/* Right click here */}
              {message.type === "deleted" ? (
                <span className="flex items-center gap-1 italic text-base">
                  <HiOutlineNoSymbol size={16} /> {deletedMessage}
                </span>
              ) : (
                <>
                  {/* For test message type */}
                  {message.type === "text" && message.text !== "" && (
                    <span className="text-base">{plainText(message)}</span>
                  )}
                  {/* For file message type */}
                  {message.type === "file" && (
                    checkImageType(message.file!) ? (
                      <img src={message.file} alt="Image file" className="h-60 w-auto rounded" />
                    ) : (
                      <span className="flex items-center gap-1 text-base">
                        <HiOutlineDocumentArrowDown size={16} /> Download for view this file
                      </span>
                    ))}
                </>
              )}
            </ContextMenuTrigger>
            {message.type !== "deleted" && (
              <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 transition-all duration-500">
                {message.type === "text" && (
                  <ContextMenuItem className="flex gap-2" onClick={() => copyToClipboard(plainText(message))}>
                    <HiOutlineClipboardDocument size={16} /> Copy
                  </ContextMenuItem>
                )}
                {message.type === "file" && (
                  <>
                    {checkImageType(message.file!) && (
                      <ContextMenuItem className="flex gap-2" onClick={() => setImageViewExtend(true)}>
                        <HiOutlineViewfinderCircle size={16} /> View
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem className="flex gap-2" onClick={() => handleDownload(message)}>
                      <HiOutlineCloudArrowDown size={16} /> Download
                    </ContextMenuItem>
                  </>
                )}
                {message.recipient === selectedChatData?._id && (
                  <ContextMenuItem className="flex gap-2" onClick={() => deleteSelectedMessage(message._id)}>
                    <HiOutlineTrash size={16} /> Delete
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            )}
          </ContextMenu>
          <div className="text-xs text-gray-600 mb-2">
            {message.type === "deleted"
              ? `${moment(message.updatedAt).format("LT")}`
              : `${moment(message.createdAt).format("LT")}`}
          </div>
          {/* Dialog for image extend view */}
          <Dialog open={imageViewExtend} onOpenChange={setImageViewExtend}>
            <DialogContent className="h-96 w-[95vw] lg:h-auto lg:w-auto bg-gray-50 rounded">
              <DialogHeader>
                <DialogTitle className="text-start">Extend View Mode</DialogTitle>
                <DialogDescription className="hidden"></DialogDescription>
              </DialogHeader>
              <div className="min-h-max">
                <img src={message?.file} alt="Extend view" className="size-fit rounded" />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

export { RenderDMMessages };
