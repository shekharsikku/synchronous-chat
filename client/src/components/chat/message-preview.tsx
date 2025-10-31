import { HiOutlineXMark, HiOutlineSlash } from "react-icons/hi2";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlainText } from "@/hooks";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/zustand";

const MessagePreview = () => {
  const { plainText } = usePlainText();
  const { replyTo, setReplyTo, selectedChatData } = useChatStore();

  return (
    <div
      className={cn(
        "absolute bottom-[4.5rem] h-bar w-full border-t flex items-center justify-center p-2 transition-[opacity,transform] duration-300 backdrop-blur-sm z-50",
        replyTo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16 pointer-events-none"
      )}
    >
      <div className="h-full w-full flex rounded items-center justify-between bg-gray-100/80 dark:bg-transparent px-4">
        <div className="flex items-center">
          {replyTo && (
            <>
              <span className="text-sm font-medium">
                Replying to {replyTo?.sender === selectedChatData?._id ? `${selectedChatData?.name}` : "Yourself"}
              </span>
              <HiOutlineSlash size={20} />
              <span className="text-sm max-w-44 md:max-w-72 lg:max-w-96 inline-block align-middle truncate">
                {replyTo?.content?.type === "text" ? plainText(replyTo) : "📎Attachment"}
              </span>
            </>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="focus:outline-none" disabled={undefined}>
              <HiOutlineXMark size={20} onClick={() => setReplyTo(null)} className="tooltip-icon" />
            </TooltipTrigger>
            <TooltipContent>
              <span className="tooltip-span">Cancel</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export { MessagePreview };
