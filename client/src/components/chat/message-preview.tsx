import { HiOutlineXMark, HiOutlineSlash } from "react-icons/hi2";

import { TooltipElement } from "@/components/chat/tooltip-element";
import { usePlainText } from "@/hooks";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/zustand";

const MessagePreview = () => {
  const { plainText } = usePlainText();
  const { replyTo, setReplyTo, selectedChatData } = useChatStore();

  const isReplyingToSelf = !!replyTo && !!selectedChatData && replyTo.sender === selectedChatData._id;
  const replyName = isReplyingToSelf ? selectedChatData?.name : "Yourself";
  const previewText = replyTo?.content?.type === "text" ? plainText(replyTo) : "📎Attachment";

  return (
    <div
      className={cn(
        "absolute bottom-18 h-bar w-full border-t flex items-center justify-center p-2 transition-all duration-300 backdrop-blur-sm z-50",
        replyTo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16 pointer-events-none"
      )}
    >
      <div className="h-full w-full flex rounded items-center justify-between bg-gray-100/80 dark:bg-transparent px-4">
        <div className="flex items-center">
          {replyTo && (
            <>
              <span className="text-sm font-medium">Replying to {replyName}</span>
              <HiOutlineSlash size={20} />
              <span className="text-sm max-w-44 md:max-w-72 lg:max-w-96 inline-block align-middle truncate">
                {previewText}
              </span>
            </>
          )}
        </div>
        <TooltipElement content="Cancel">
          <HiOutlineXMark size={20} onClick={() => setReplyTo(null)} className="tooltip-icon" />
        </TooltipElement>
      </div>
    </div>
  );
};

export { MessagePreview };
