import { toast } from "sonner";
import {
  HiOutlineNoSymbol,
  HiOutlineTrash,
  HiOutlineClipboardDocument,
  HiOutlineEllipsisHorizontalCircle,
  HiOutlineCloudArrowDown,
  HiOutlineFolderArrowDown,
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
import { useChatStore } from "@/zustand"
import { useEffect, useState } from "react";
import { checkImageType } from "@/utils";
import moment from "moment";
import api from "@/lib/api";

const RenderDMMessages = ({ message, lastMessageId }: { message: Message, lastMessageId: string }) => {
  const { socket } = useSocket();
  const { selectedChatData, messages, setMessages } = useChatStore();

  const shakeClass = message._id === lastMessageId ? "shake" : "";
  const deletedMessage = message.sender === selectedChatData?._id
    ? "This message was deleted." : "You deleted this message.";

  const copyToClipboard = (dataToCopy: string) => {
    try {
      // const stringifiedData = JSON.stringify(dataToCopy, null, 2);
      navigator.clipboard.writeText(dataToCopy);
      toast.success("Message copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy message!");
    }
  };

  useEffect(() => {
    if (socket) {
      const handleRemoveMessage = (currentMessage: any) => {
        const updatedMessages = messages.map(message => message._id === currentMessage._id ? currentMessage : message);
        setMessages([...updatedMessages]);
      };

      socket.on("messageRemove", handleRemoveMessage);

      return () => {
        socket.off("messageRemove", handleRemoveMessage);
      };
    }
  }, [socket, messages, setMessages]);

  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`, { withCredentials: true });
      const deletedMessage = await response.data.data;
      const updatedMessages = messages.map(message => message._id === deletedMessage._id ? deletedMessage : message);
      await setMessages([...updatedMessages]);
      toast.info(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  const deletedMessageInfo = () => {
    return (
      <span className="flex items-center gap-1 italic cursor-not-allowed">
        <HiOutlineNoSymbol /> {deletedMessage}
      </span>
    )
  }

  const handleDownload = (messageFile: Message) => {
    const link = document.createElement('a');
    link.href = messageFile.fileUrl!;
    link.download = messageFile._id;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [imageViewExtend, setImageViewExtend] = useState(false);

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
                border inline-block p-3 rounded-sm my-1 break-words cursor-default
                md:max-w-[90%] lg:max-w-[80%] xl:max-w-[70%] ${shakeClass}`}>
                  {message.messageType === "text" ? (
                    message.textMessage || deletedMessageInfo()
                  ) : (
                    message.fileUrl !== "" ? (
                      checkImageType(message.fileUrl!) ? (
                        <img src={message.fileUrl} alt="Image file"
                          className="h-48 w-full md:h-60 md:w-auto" />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {message.sender !== selectedChatData?._id ? (
                            <>
                              <HiOutlineFolderArrowDown size={20} />
                              <span className="text-base">Download for view</span>
                            </>
                          ) : (
                            <>
                              <span className="text-base">Download for view</span>
                              <HiOutlineFolderArrowDown size={20} />
                            </>
                          )}
                        </div>
                      )
                    ) : (
                      deletedMessageInfo()
                    ))}
                </div>
              </TooltipTrigger>
              {message.textMessage !== "" && (
                <TooltipContent className="flex gap-3 py-3">
                  {message.messageType === "text" && (
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(message.textMessage!)}>
                      <HiOutlineClipboardDocument size={20} />
                    </Button>
                  )}
                  {message.messageType === "file" && (
                    <>
                      {checkImageType(message.fileUrl!) && (
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
                  <Button variant="outline" size="icon" onClick={() => console.log(message)}>
                    <HiOutlineEllipsisHorizontalCircle size={20} />
                  </Button>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs text-gray-600 mb-2">
            {message.textMessage === "" || message.fileUrl === ""
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
              <img src={message?.fileUrl} alt="Extend view" />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

export { RenderDMMessages };