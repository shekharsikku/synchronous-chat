import { toast } from "sonner";
import {
  HiOutlineLanguage,
  HiOutlineNoSymbol,
  HiOutlineTrash,
  HiOutlineClipboardDocument,
  HiOutlineCloudArrowDown,
  HiOutlineDocumentArrowDown,
  HiOutlineViewfinderCircle,
  HiOutlinePencilSquare,
  HiOutlineArrowTopRightOnSquare,
  HiMiniArrowUturnRight,
  HiMiniArrowUturnLeft,
} from "react-icons/hi2";
import { LuReply } from "react-icons/lu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditMessage } from "@/components/chat/edit-message";
import { isValidUrl, checkImageType, cn, mergeRefs } from "@/lib/utils";
import { useChatStore, useAuthStore, Message } from "@/zustand";
import { useDisableAnimations, useLastMinutes, usePlainText, useReplyMessage } from "@/lib/hooks";
import { useSocket } from "@/lib/context";
import { useInView } from "react-intersection-observer";
import { useEffect, useRef, useState } from "react";
import { isDesktop } from "react-device-detect";
import moment from "moment";
import api from "@/lib/api";

const RenderDMMessages = ({ message, scrollMessage }: { message: Message; scrollMessage: any }) => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { plainText } = usePlainText();
  const { selectedChatData, language, setEditDialog, setReplyTo } = useChatStore();

  const copyToClipboard = (text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      toast.info("Message copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy message!");
    }
  };

  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`);
      toast.info(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleDownload = (messageFile: Message) => {
    const link = document.createElement("a");
    link.href = messageFile?.content?.file!;
    link.download = messageFile._id;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const [imageViewExtend, setImageViewExtend] = useState(false);

  const [translated, setTranslated] = useState("");
  const [translation, setTranslation] = useState({ message: "", language: "" });
  const setTextAndLanguage = (message: string) => setTranslation({ message, language });

  const translateMessage = async (message: string, language: string) => {
    try {
      const response = await api.post("/api/message/translate", {
        message,
        language,
      });
      setTranslated(response.data.data);
    } catch (error: any) {
      setTranslated("");
      import.meta.env.DEV && console.log("Language translation error!");
    }
  };

  useEffect(() => {
    if (translation.message && translation.language) {
      (async () => {
        await translateMessage(translation.message, translation.language);
      })();
    }
  }, [translation]);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
  });

  const elementRef = useRef<any>(null);
  useDisableAnimations(socket!, elementRef);

  const [openEditMessageDialog, setOpenEditMessageDialog] = useState(false);
  const [currentMessageForEdit, setCurrentMessageForEdit] = useState({
    id: "",
    text: "",
  });

  const handleEditMessageClick = (message: Message) => {
    setOpenEditMessageDialog(true);
    setCurrentMessageForEdit({
      id: message._id,
      text: plainText(message),
    });
  };

  useEffect(() => {
    setEditDialog(openEditMessageDialog);
  }, [openEditMessageDialog]);

  const { isLastMinutes: isLastMinForEdit } = useLastMinutes(message?.createdAt!);

  const visitExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmojiReaction = async (emoji: string) => {
    try {
      await api.patch(`/api/message/react/${message._id}`, {
        by: userInfo?._id,
        emoji,
      });
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const { replyMessage } = useReplyMessage(message);
  const isSender = message.recipient === userInfo?._id && message.sender === selectedChatData?._id;

  return (
    <div
      className={cn(
        "group w-full flex flex-col gap-2 mb-4",
        isSender ? "items-start text-left" : "items-end text-right"
      )}
    >
      {/* Preview reply message if current message is reply */}
      {message.reply && replyMessage && (
        <span className="flex items-center gap-2 mr-1">
          <span
            className={cn(
              "border dark:border-gray-800 rounded p-2 text-xs",
              isSender ? "bg-gray-50 dark:bg-gray-50/5" : "bg-gray-100 dark:bg-gray-100/5"
            )}
            onClick={() => scrollMessage(replyMessage._id)}
          >
            {replyMessage.type === "deleted" ? (
              <span className="flex items-center gap-1 italic">
                <HiOutlineNoSymbol size={12} /> {"This message was deleted."}
              </span>
            ) : (
              <span>
                {replyMessage?.content?.type === "text" && replyMessage?.content?.text !== "" && (
                  <span className="max-w-72 inline-block align-middle truncate">{plainText(replyMessage)}</span>
                )}
                {replyMessage?.content?.type === "file" && <span>📎Attachment</span>}
              </span>
            )}
          </span>
          <LuReply className={cn(isSender && "order-first transform scale-x-[-1] tooltip-icon")} />
        </span>
      )}
      <ContextMenu>
        <ContextMenuTrigger
          ref={mergeRefs(inViewRef, elementRef)}
          className={cn(
            "inline-block border rounded-sm p-3 break-words transition-[transform,opacity] duration-300 ease-in-out transform text-start text-gray-950 dark:text-gray-50 dark:border-gray-700 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] hover:transition-colors",
            message.type === "deleted" ? "cursor-not-allowed" : "cursor-default",
            inView ? "opacity-100 translate-x-0" : `opacity-0 ${isSender ? "translate-x-16" : "-translate-x-16"}`,
            isSender
              ? "bg-gray-100 border-gray-200 dark:bg-gray-100/5 dark:hover:bg-gray-100/10"
              : "bg-gray-200 border-gray-300 dark:bg-gray-200/5 dark:hover:bg-gray-200/10"
          )}
          onDoubleClick={() => handleEmojiReaction("❤️")}
        >
          {/* Right click here */}
          {message.type === "deleted" ? (
            <span className="flex items-center gap-1 italic text-base">
              <HiOutlineNoSymbol size={16} /> {isSender ? "This message was deleted." : "You deleted this message."}
            </span>
          ) : (
            <span className={cn("relative", isSender && "self-end")}>
              {/* For test message type */}
              {message?.content?.type === "text" && message?.content?.text !== "" && (
                <span className="text-base">{plainText(message)}</span>
              )}
              {/* For file message type */}
              {message?.content?.type === "file" &&
                (checkImageType(message?.content?.file!) ? (
                  <img src={message?.content?.file} alt="Image file" className="h-auto max-h-60 w-auto rounded" />
                ) : (
                  <span className="flex items-center gap-1 text-base">
                    <HiOutlineDocumentArrowDown size={16} /> Download this file to view it.
                  </span>
                ))}
              {/* Message Reply & Emoji Reactions (show only on hover) */}
              {isDesktop && (
                <span
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 hidden group-hover:flex gap-2 bg-white dark:bg-gray-800 rounded-full shadow-md px-2 py-1 transition-transform duration-500 scale-95 group-hover:scale-100 text-sm",
                    isSender ? "left-full ml-6" : "right-full mr-6"
                  )}
                >
                  {/* Message Reply */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        className={cn("focus:outline-none", !isSender && "order-last")}
                        onClick={() => setReplyTo(message)}
                      >
                        {isSender ? (
                          <HiMiniArrowUturnRight className="tooltip-icon hover:scale-125 transition-transform duration-200" />
                        ) : (
                          <HiMiniArrowUturnLeft className="tooltip-icon hover:scale-125 transition-transform duration-200" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="tooltip-span">Reply</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* Emoji Reaction */}
                  {["👍", "❤️", "😂", "😲", "💯"].map((emoji) => (
                    <button
                      key={emoji}
                      className="hover:scale-125 transition-transform duration-200"
                      onClick={() => handleEmojiReaction(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </span>
              )}
              {/* Selected reactions */}
              {message.content?.reactions && message.content?.reactions?.length > 0 && (
                <span
                  className={cn(
                    "absolute -bottom-6 flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-md px-1 py-0.5 text-xs",
                    isSender ? "-right-1" : "-left-1"
                  )}
                >
                  {Object.entries(
                    message.content?.reactions?.reduce((acc: Record<string, number>, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => (
                    <span key={emoji} className="flex items-center gap-0.5">
                      {emoji} {count > 1 ? <span>{count}</span> : null}
                    </span>
                  ))}
                </span>
              )}
            </span>
          )}
        </ContextMenuTrigger>
        {message.type !== "deleted" && (
          <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 transition-all duration-500">
            {message?.content?.type === "text" && (
              <>
                {language !== "en" && (
                  <ContextMenuItem className="flex gap-2" onClick={() => setTextAndLanguage(plainText(message))}>
                    <HiOutlineLanguage size={16} /> Translate
                  </ContextMenuItem>
                )}
                <ContextMenuItem className="flex gap-2" onClick={() => copyToClipboard(plainText(message))}>
                  <HiOutlineClipboardDocument size={16} /> Copy
                </ContextMenuItem>
                {message.sender === userInfo?._id && message.type === "default" && isLastMinForEdit && (
                  <ContextMenuItem className="flex gap-2" onClick={() => handleEditMessageClick(message)}>
                    <HiOutlinePencilSquare size={16} /> Edit
                  </ContextMenuItem>
                )}
              </>
            )}
            {message?.content?.type === "file" && (
              <>
                {checkImageType(message?.content?.file!) && (
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
            {isValidUrl(plainText(message)) && (
              <ContextMenuItem className="flex gap-2" onClick={() => visitExternalLink(plainText(message))}>
                <HiOutlineArrowTopRightOnSquare size={16} /> Visit Site
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        )}
      </ContextMenu>
      {/* Translated Message */}
      {translated !== "" && <span className="text-base">{translated}</span>}
      <span className="text-xs text-gray-600 dark:text-gray-200 mt-0.5">
        {message.type === "deleted" ? (
          <span>{`${moment(message.deletedAt).format("LT")}`}</span>
        ) : (
          <span>
            {message.type === "edited" && "Edited"} {`${moment(message.updatedAt).format("LT")}`}
          </span>
        )}
      </span>
      {/* Dialog for image extend view */}
      <Dialog open={imageViewExtend} onOpenChange={setImageViewExtend}>
        <DialogContent className="h-auto w-[90vw] lg:w-auto rounded-md select-none">
          <DialogHeader>
            <DialogTitle className="text-start">Image Extend View Mode</DialogTitle>
            <DialogDescription className="hidden"></DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh] overflow-y-auto scrollbar-hide">
            <img src={message?.content?.file} alt="Extend view" className="object-contain size-full rounded" />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* for edit message */}
      <EditMessage
        openEditMessageDialog={openEditMessageDialog}
        setOpenEditMessageDialog={setOpenEditMessageDialog}
        currentMessage={currentMessageForEdit}
      />
    </div>
  );
};

export { RenderDMMessages };
