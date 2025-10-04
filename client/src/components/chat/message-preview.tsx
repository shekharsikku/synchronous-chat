import { HiOutlineXMark, HiOutlineSlash } from "react-icons/hi2";
import { useChatStore } from "@/zustand";
import { usePlainText } from "@/lib/hooks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MessagePreview = () => {
  const { plainText } = usePlainText();
  const { replyTo, setReplyTo, selectedChatData } = useChatStore();

  if (!replyTo) return;

  return (
    <div className="h-bar w-full border-t flex items-center justify-center p-2">
      <div className="h-full w-full flex rounded items-center justify-between bg-gray-100/80 dark:bg-transparent px-4">
        <div className="flex items-center">
          <span className="text-sm font-medium">
            Replying to {replyTo?.sender === selectedChatData?._id ? `${selectedChatData?.name}` : "Yourself"}
          </span>
          <HiOutlineSlash size={20} />
          <span className="text-sm max-w-44 md:max-w-72 lg:max-w-96 inline-block align-middle truncate">
            {replyTo.content?.type === "text" ? plainText(replyTo) : "📎Attachment"}
          </span>
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
