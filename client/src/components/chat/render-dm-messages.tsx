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
import { useChatStore, useAuthStore, Message } from "@/zustand";
import { useDisableAnimations, useLastMinutes, usePlainText, useReplyMessage, useMessageActions } from "@/lib/hooks";
import { useSocket } from "@/lib/context";
import { isDesktop } from "react-device-detect";
import { useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  cn,
  mergeRefs,
  isValidUrl,
  checkImageType,
  messageTimestamp,
  handleDownload,
  copyToClipboard,
} from "@/lib/utils";

const RenderDMMessages = ({
  message,
  scrollMessage,
  getSender,
}: {
  message: Message;
  scrollMessage: (mid: string) => void;
  getSender: (sid: string) => string | undefined;
}) => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { plainText } = usePlainText();
  const { language, setMessageForEdit, setEditDialog, setReplyTo, selectedChatType } = useChatStore();
  const { deleteSelectedMessage, handleEmojiReaction, translateMessage } = useMessageActions();

  const [imageViewExtend, setImageViewExtend] = useState(false);
  const [editMessageDialog, setEditMessageDialog] = useState(false);
  const [translated, setTranslated] = useState("");

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.3,
    delay: 100,
  });

  const elementRef = useRef<any>(null);
  useDisableAnimations(socket!, elementRef);

  const { replyMessage } = useReplyMessage(message);
  const { isLastMinutes: isLastMinForEdit } = useLastMinutes(message?.createdAt!);
  const { isLastMinutes: isLastMinForDelete } = useLastMinutes(message?.createdAt!, 60);
  const isSender = message.sender === userInfo?._id;

  return (
    <div
      className={cn(
        "group w-full flex flex-col gap-2 mb-4",
        isSender ? "items-end text-right" : "items-start text-left"
      )}
    >
      {/* Preview reply message if current message is reply */}
      {message.reply && replyMessage && (
        <span className="flex items-center gap-2 mr-1">
          <span
            className={cn(
              "border dark:border-gray-800 rounded p-2 text-xs",
              isSender ? "bg-gray-100 dark:bg-gray-100/5" : "bg-gray-50 dark:bg-gray-50/5"
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
          <LuReply className={cn(!isSender && "order-first transform scale-x-[-1] tooltip-icon")} />
        </span>
      )}
      <ContextMenu>
        <ContextMenuTrigger
          ref={mergeRefs(inViewRef, elementRef)}
          className={cn(
            "inline-block border rounded-sm px-3 py-2.5 break-words transition-[transform,opacity] duration-300 ease-in-out transform text-start text-gray-950 dark:text-gray-50 dark:border-gray-700 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] hover:transition-colors",
            message.type === "deleted" ? "cursor-not-allowed" : "cursor-default",
            inView ? "opacity-100 translate-x-0" : `opacity-0 ${isSender ? "-translate-x-16" : "translate-x-16"}`,
            isSender
              ? "bg-gray-200 border-gray-300 dark:bg-gray-200/5 dark:hover:bg-gray-200/10"
              : "bg-gray-100 border-gray-200 dark:bg-gray-100/5 dark:hover:bg-gray-100/10"
          )}
          onDoubleClick={() => handleEmojiReaction(message._id, userInfo?._id!, "❤️")}
        >
          {/* Right click here */}
          {message.type === "deleted" ? (
            <span className="flex items-center gap-1 italic text-base">
              <HiOutlineNoSymbol size={16} /> {isSender ? "You deleted this message." : "This message was deleted."}
            </span>
          ) : (
            <span className={cn("relative", isSender && "self-start")}>
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
                    isSender ? "right-full mr-6" : "left-full ml-6"
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
                          <HiMiniArrowUturnLeft className="tooltip-icon hover:scale-125 transition-transform duration-200" />
                        ) : (
                          <HiMiniArrowUturnRight className="tooltip-icon hover:scale-125 transition-transform duration-200" />
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
                      onClick={() => handleEmojiReaction(message._id, userInfo?._id!, emoji)}
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
                    isSender ? "-left-1" : "-right-1"
                  )}
                >
                  {Object.entries(
                    message.content?.reactions
                      ?.filter((r) => r != null)
                      .reduce((acc: Record<string, number>, r) => {
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
          <ContextMenuContent className="w-20 flex flex-col gap-2 p-2 mb-4 transition-all duration-500">
            {message?.content?.type === "text" && (
              <>
                {language !== "en" && (
                  <ContextMenuItem
                    className="flex gap-2"
                    onClick={() => translateMessage(plainText(message), language, setTranslated)}
                  >
                    <HiOutlineLanguage size={16} /> Translate
                  </ContextMenuItem>
                )}
                <ContextMenuItem className="flex gap-2" onClick={() => copyToClipboard(plainText(message))}>
                  <HiOutlineClipboardDocument size={16} /> Copy
                </ContextMenuItem>
                {isSender && message.type === "default" && isLastMinForEdit && (
                  <ContextMenuItem
                    className="flex gap-2"
                    onClick={() => {
                      setEditDialog(true);
                      setEditMessageDialog(true);
                      setMessageForEdit(message._id, plainText(message));
                    }}
                  >
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
                <ContextMenuItem
                  className="flex gap-2"
                  onClick={() => handleDownload(message.content?.file!, message._id)}
                >
                  <HiOutlineCloudArrowDown size={16} /> Download
                </ContextMenuItem>
              </>
            )}
            {isSender && isLastMinForDelete && (
              <ContextMenuItem className="flex gap-2" onClick={() => deleteSelectedMessage(message._id)}>
                <HiOutlineTrash size={16} /> Delete
              </ContextMenuItem>
            )}
            {isValidUrl(plainText(message)) && (
              <ContextMenuItem
                className="flex gap-2"
                onClick={() => window.open(plainText(message), "_blank", "noopener,noreferrer")}
              >
                <HiOutlineArrowTopRightOnSquare size={16} /> Visit Site
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        )}
      </ContextMenu>
      {/* Translated Message */}
      {translated !== "" && <span className="text-base mt-1">{translated}</span>}
      {/* If group message show sender name */}
      {selectedChatType === "group" && message.group && (
        <span className="text-xs text-gray-300 mt-0.5">{`Sent by ${getSender(message.sender)}`}</span>
      )}
      {/* Message Timestamps */}
      <span className="text-xs text-gray-600 dark:text-gray-200 mt-0.5">{messageTimestamp(message)}</span>
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
      <EditMessage editMessageDialog={editMessageDialog} setEditMessageDialog={setEditMessageDialog} />
    </div>
  );
};

export { RenderDMMessages };
