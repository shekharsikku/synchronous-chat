import EmojiPicker from "emoji-picker-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HiOutlineFaceSmile,
  HiOutlineLink,
  HiOutlinePaperAirplane,
  HiOutlineBackspace
} from "react-icons/hi2";
import { convertToBase64, encryptMessage } from "@/utils";
import { useChatStore, useAuthStore } from "@/zustand";
import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/context";
import { toast } from "sonner";
import api from "@/lib/api";

const MessageBar = () => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, setIsPartnerTyping, messages } = useChatStore();

  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
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

    const maxSizeAllow = 9; // Size in MB
    const maxBytesAllow = maxSizeAllow * 1024 * 1024;

    try {
      const imageFile = e.target.files[0];
      setMessage(`${imageFile?.name}`);

      if (imageFile) {
        if (imageFile.size > maxBytesAllow) {
          setMessage("");
          toast.info("File size exceeds the max limit!");
          return;
        }

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
    if (isSending || message === "") return;
    setIsSending(true);

    try {
      const messageData: MessageData = {
        type: selectedImage ? "file" : "text",
      }

      if (selectedImage && message !== "") {
        messageData.file = selectedImage;
      } else {
        messageData.text = encryptMessage(message, selectedChatData?._id!);
      }

      if (selectedImage) {
        setMessage("Sending...");
      }

      const response = await api.post(`/api/message/send/${selectedChatData?._id}`, messageData);
      const data = await response.data;

      if (data?.success && messages.length <= 0) {
        toast.success(data?.message);
      }

      setMessage("");
      setSelectedImage(null);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsSending(false);
    }
  }

  const handleEnterKeyDown = (e: any) => {
    if (e.key === "Enter" && message !== "" && !isSending) {
      handleSendMessage();
    }
  };

  useEffect(() => {
    socket?.on("typing:display", (typingUser) => {
      if (typingUser.uid === userInfo?._id && selectedChatData?._id === typingUser.cid) {
        setIsPartnerTyping(typingUser.typing);
      }
    });

    socket?.on("typing:hide", (typingUser) => {
      if (typingUser.uid === userInfo?._id) {
        setIsPartnerTyping(typingUser.typing);
      }
    });

    return () => {
      socket?.off("typing:display");
      socket?.off("typing:hide");
    };
  }, [selectedChatData?._id]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing:start", { selectedUser: selectedChatData?._id, currentUser: userInfo?._id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("typing:stop", { selectedUser: selectedChatData?._id, currentUser: userInfo?._id });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: any) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <div className="h-bar border-t flex items-center justify-center p-2">
      <div className="flex-1 flex rounded items-center justify-center gap-4 bg-gray-100/80 px-4 h-full">
        <div className="flex gap-4 relative">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
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
              <TooltipTrigger className="focus:outline-none">
                <HiOutlineLink size={20} onClick={handleAttachClick}
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
          className="flex-1 px-1 py-2 bg-transparent border-none outline-none 
          text-sm tracking-wider disabled:text-blue-800"
          disabled={selectedImage && message !== "" ? true : false}
          ref={inputRef}
          onKeyDown={handleEnterKeyDown}
        />

        {message && <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
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
              <TooltipTrigger className="focus:outline-none">
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