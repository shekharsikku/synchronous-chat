import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
import { HiOutlineFaceSmile, HiMiniLink, HiOutlinePaperAirplane, HiOutlineBackspace } from "react-icons/hi2";
import { useChatStore, useAuthStore } from "@/zustand";
import { convertToBase64 } from "@/utils";
import { useSocket } from "@/context/socket-context";
import EmojiPicker from "emoji-picker-react";
import api from "@/lib/api";

const MessageBar = () => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, messages, setMessages, setIsPartnerTyping } = useChatStore();

  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);

  useEffect(() => {
    if (selectedChatData && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChatData]);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setEmojiPicker((prev) => !prev);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [emojiRef])

  const handleAddEmoji = (emoji: any) => {
    setMessage((msg) => msg + emoji.emoji);
  }

  const handleAttachClick = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  }

  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  const handleAttachChange = async (e: any) => {
    e.preventDefault();

    try {
      const imageFile = e.target.files[0];
      setMessage(`${imageFile?.name}`);

      if (imageFile) {
        const base64 = await convertToBase64(imageFile);
        setSelectedImage(base64);
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }

  interface MessageData {
    type: "text" | "file",
    text?: string,
    file?: string,
  }

  const handleSendMessage = async () => {
    try {
      const messageData: MessageData = {
        type: selectedImage ? "file" : "text",
      }

      if (selectedImage && message !== "") {
        messageData.file = selectedImage;
      } else {
        messageData.text = message;
      }

      const response = await api.post(`/api/message/send/${selectedChatData?._id}`, messageData, {
        withCredentials: true,
      });
      const data = await response.data.data;
      setMessages([...messages, data]);

      setMessage("");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  }

  const handleEnterKeyDown = (e: any) => {
    if (e.key === 'Enter' && message !== "") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    socket?.on("displayTyping", (data) => {
      if (data.uid === userInfo?._id) {
        setIsPartnerTyping(data.typing);
      }
    });

    socket?.on("hideTyping", (data) => {
      if (data.uid === userInfo?._id) {
        setIsPartnerTyping(data.typing);
      }
    });

    return () => {
      socket?.off("displayTyping");
      socket?.off("hideTyping");
    };
  }, [selectedChatData?._id]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("startTyping", selectedChatData?._id);

      setTimeout(() => {
        setIsTyping(false);
        socket?.emit("stopTyping", selectedChatData?._id);
      }, 2000);
    }
  };

  const handleChange = (e: any) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <div className="h-[10vh] border-t border-gray-200 flex items-center justify-center p-2 lg:px-3">
      <div className="flex-1 flex rounded items-center justify-center gap-3 md:gap-5 bg-gray-100/80 px-4 h-full">

        <div className="flex gap-3 md:gap-5 relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiOutlineFaceSmile size={20} onClick={() => setEmojiPicker((prev) => !prev)}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Emojis</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {emojiPicker && <div className="absolute bottom-20 left-[-5px] md:left-0" ref={emojiRef}>
            <EmojiPicker open={emojiPicker} onEmojiClick={handleAddEmoji} autoFocusSearch={false} className="" />
          </div>}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiMiniLink size={20} onClick={handleAttachClick}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Attach</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <input
          type="file"
          id="file-input"
          className="hidden"
          ref={fileRef}
          onChange={handleAttachChange}
        />

        <input
          type="text"
          id="message-input"
          placeholder="Type a message"
          autoComplete="off"
          value={message}
          onChange={handleChange}
          className="flex-1 bg-transparent px-2 py-4 md:px-4 rounded border-none 
          outline-none text-[14px] md:text-[14.5px] font-normal"
          disabled={selectedImage && message !== "" ? true : false}
          ref={inputRef}
          onKeyDown={handleEnterKeyDown}
        />

        {message && <div className="flex gap-3 md:gap-5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiOutlineBackspace size={20} onClick={() => {
                  setMessage("");
                  setSelectedImage(null);
                }}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Clear</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HiOutlinePaperAirplane size={20} onClick={handleSendMessage}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Send</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>}
      </div>
    </div>
  )
}

export { MessageBar };