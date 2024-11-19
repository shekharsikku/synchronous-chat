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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  const copyToClipboard = (dataToCopy: string) => {
    try {
      // const stringifiedData = JSON.stringify(dataToCopy, null, 2);
      navigator.clipboard.writeText(dataToCopy);
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

    socket?.on("message-remove", messageRemove);

    return () => {
      socket?.off("message-remove", messageRemove);
    };
  }, [socket, messages, setMessages]);

  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`, { withCredentials: true });
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

  /** for convert encrypt message to plain text */
  const plainText = (message: Message) => {
    let messageKey = "";

    if (message.sender === selectedChatData?._id) {
      messageKey = userInfo?._id!;
    } else {
      messageKey = selectedChatData?._id!;
    }

    return decryptMessage(message.text!, messageKey);
  }

  return (
    <div className={`${message.sender !== selectedChatData?._id ? "text-right" : "text-left"} w-full`}>
      {message && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`${message.sender !== selectedChatData?._id
                  ? "bg-gray-200 text-gray-950 border-white/20"
                  : "bg-gray-100 text-gray-900 border-white/10"} 
                border inline-block p-3 rounded-sm my-1 break-words
                md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] ${shakeClass}
                ${message.type === "deleted" ? "cursor-not-allowed" : "cursor-default"}`}>
                  {/* Rendered if message is deleted or not */}
                  {message.type === "deleted" ? (
                    <span className="flex items-center gap-1 italic text-base">
                      <HiOutlineNoSymbol size={16} /> {deletedMessage}
                    </span>
                  ) : (
                    <>
                      {/* For test message type */}
                      {message.type === "text" && (
                        <span className="text-base">{plainText(message)}</span>
                      )}
                      {/* For file message type */}
                      {message.type === "file" && (
                        checkImageType(message.file!) ? (
                          <img src={message.file} alt="Image file"
                            className="h-48 w-full md:h-60 md:w-auto" />
                        ) : (
                          <span className="flex items-center gap-1 text-base">
                            <HiOutlineDocumentArrowDown size={16} /> Download for view this file
                          </span>
                        ))}
                    </>
                  )}
                </div>
              </TooltipTrigger>
              {message.type !== "deleted" && (
                <TooltipContent className="flex gap-3 py-3">
                  {message.type === "text" && (
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(message.text!)}>
                      <HiOutlineClipboardDocument size={20} />
                    </Button>
                  )}
                  {message.type === "file" && (
                    <>
                      {checkImageType(message.file!) && (
                        <Button variant="outline" size="icon" onClick={() => setImageViewExtend(true)}>
                          <HiOutlineViewfinderCircle size={20} />
                        </Button>
                      )}
                      <Button variant="outline" size="icon" onClick={() => handleDownload(message)}>
                        <HiOutlineCloudArrowDown size={20} />
                      </Button>
                    </>
                  )}
                  {message.recipient === selectedChatData?._id && (
                    <Button variant="outline" size="icon" onClick={() => deleteSelectedMessage(message._id)}>
                      <HiOutlineTrash size={20} />
                    </Button>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs text-gray-600 mb-2">
            {message.type === "deleted"
              ? `${moment(message.updatedAt).format("LT")}`
              : `${moment(message.createdAt).format("LT")}`}
          </div>
          {/* Dialog for image extend view */}
          <Dialog open={imageViewExtend} onOpenChange={setImageViewExtend}>
            <DialogContent className="h-auto w-72 md:w-80 lg:w-96 xl:w-auto rounded-sm">
              <DialogHeader>
                <DialogTitle className="text-start">Extend View Mode</DialogTitle>
                <DialogDescription className="hidden"></DialogDescription>
              </DialogHeader>
              <img src={message?.file} alt="Extend view" />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

export { RenderDMMessages };