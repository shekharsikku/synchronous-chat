import { toast } from "sonner";
import {
  HiOutlineLanguage,
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
import { checkImageType, decryptMessage } from "@/utils";
import { useChatStore, useAuthStore } from "@/zustand";
import { useDisableAnimations } from "@/hooks";
import { useSocket } from "@/hooks/context";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import moment from "moment";
import api from "@/lib/api";

const RenderDMMessages = ({
  message, lastMessageId: lastId
}: {
  message: Message, lastMessageId: string
}) => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, updateMessage, language } = useChatStore();

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      toast.info("Message copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy message!");
    }
  };

  useEffect(() => {
    const messageRemove = (current: Message) => {
      updateMessage(current._id, current);
    };

    socket?.on("message:remove", messageRemove);

    return () => {
      socket?.off("message:remove", messageRemove);
    };
  }, []);

  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`);
      const deleted: Message = await response.data.data;
      updateMessage(deleted._id, deleted);
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

  const [translated, setTranslated] = useState("");
  const [translation, setTranslation] = useState({ message: "", language: "" });
  const setTextAndLanguage = (message: string) => setTranslation({ message, language });

  const translateMessage = async (message: string, language: string) => {
    try {
      const response = await api.post("/api/message/translate", { message, language });
      setTranslated(response.data.data);
    } catch (error: any) {
      setTranslated("");
      isDevelopment && console.error("Language translation error:", error);
    }
  }

  useEffect(() => {
    if (translation.message && translation.language) {
      (async () => {
        await translateMessage(translation.message, translation.language);
      })();
    }
  }, [translation]);

  const mergeRefs = (...refs: any[]) => (element: any) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(element);
      } else {
        ref.current = element;
      }
    });
  };

  const isSender = message.sender === selectedChatData?._id;

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
  });

  const elementRef = useRef<any>(null);
  useDisableAnimations(socket!, elementRef);

  return (
    <div className={`w-full flex flex-col gap-2 mb-4 ${isSender ? "items-start text-left" : "items-end text-right"}`}>
      <ContextMenu>
        <ContextMenuTrigger ref={mergeRefs(inViewRef, elementRef)}
          className={cn("inline-block border rounded-sm p-3 break-words transition duration-300 ease-in-out transform text-start text-gray-950 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]",
            isSender ? "bg-gray-100 border-gray-200" : "bg-gray-200 border-gray-300",
            message.type === "deleted" ? "cursor-not-allowed" : "cursor-default", message._id === lastId && "shake",
            inView ? "opacity-100 translate-x-0" : `opacity-0 ${isSender ? "translate-x-16" : "-translate-x-16"}`
          )}>
          {/* Right click here */}
          {message.type === "deleted" ? (
            <span className="flex items-center gap-1 italic text-base">
              <HiOutlineNoSymbol size={16} /> {isSender ? "This message was deleted." : "You deleted this message."}
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
                  <span className="flex items-center gap-1 italic text-base">
                    <HiOutlineDocumentArrowDown size={16} /> Download this file to view it.
                  </span>
                ))}
            </>
          )}
        </ContextMenuTrigger>
        {message.type !== "deleted" && (
          <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 transition-all duration-500">
            {message.type === "text" && (
              <>
                {language !== "en" && (
                  <ContextMenuItem className="flex gap-2" onClick={() => setTextAndLanguage(plainText(message))}>
                    <HiOutlineLanguage size={16} /> Translate
                  </ContextMenuItem>
                )}
                <ContextMenuItem className="flex gap-2" onClick={() => copyToClipboard(plainText(message))}>
                  <HiOutlineClipboardDocument size={16} /> Copy
                </ContextMenuItem>
              </>
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
      {/* Translated Message */}
      {translated !== "" && (
        <span className="text-base">{translated}</span>
      )}
      <span className="text-xs text-gray-600">
        {message.type === "deleted"
          ? `${moment(message.updatedAt).format("LT")}`
          : `${moment(message.createdAt).format("LT")}`}
      </span>
      {/* Dialog for image extend view */}
      <Dialog open={imageViewExtend} onOpenChange={setImageViewExtend}>
        <DialogContent className="h-96 w-[90vw] lg:h-auto lg:w-auto bg-gray-50 rounded-md">
          <DialogHeader>
            <DialogTitle className="text-start">Extend View Mode</DialogTitle>
            <DialogDescription className="hidden"></DialogDescription>
          </DialogHeader>
          <div className="min-h-max">
            <img src={message?.file} alt="Extend view" className="size-fit rounded" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { RenderDMMessages };