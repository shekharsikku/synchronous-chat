import React, { useState, useEffect, useRef, type ChangeEvent, type KeyboardEventHandler } from "react";
import { isDesktop, isMobile } from "react-device-detect";
import {
  HiOutlineFaceSmile,
  HiOutlineLink,
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineBackspace,
  HiOutlineClipboardDocumentCheck,
} from "react-icons/hi2";
import { toast } from "sonner";

import { TooltipElement } from "@/components/chat/tooltip-element";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useClipboard } from "@/hooks";
import api from "@/lib/api";
import { useSocket, useTheme } from "@/lib/context";
import { encryptMessage } from "@/lib/noble";
import { convertToBase64 } from "@/lib/utils";
import { useChatStore, useAuthStore, type MessageData } from "@/lib/zustand";

import type { EmojiClickData, Theme } from "emoji-picker-react";

const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

const MessageBar = () => {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatType, selectedChatData, setIsPartnerTyping, editDialog, replyTo, setReplyTo, groupDialog } =
    useChatStore();

  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emojiPicker, setEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  useEffect(() => {
    if (!inputRef.current || isMobile) return;

    if (isDesktop && (selectedChatData || replyTo)) {
      inputRef.current.focus();
    }
  }, [selectedChatData, replyTo]);

  useEffect(() => {
    const handleSpaceEscapeKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      if ((editDialog || groupDialog) && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
        return;
      }

      if (event.code === "Space" && document.activeElement !== inputRef.current) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.code === "Escape" && document.activeElement === inputRef.current) {
        event.preventDefault();
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleSpaceEscapeKeyDown);

    return () => {
      document.removeEventListener("keydown", handleSpaceEscapeKeyDown);
    };
  }, [editDialog, groupDialog]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setEmojiPicker((prev) => !prev);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  const handleAddEmoji = (emoji: EmojiClickData) => {
    setMessage((msg) => msg + emoji.emoji);
  };

  const handleAttachClick = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleClearMessage = (reply = false) => {
    reply && setReplyTo(null);
    setMessage("");
    setSelectedImage(null);
  };

  const handleAttachChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    /** Size is 6 MB and converted into Bytes */
    const maxBytesAllow = 6 * 1024 * 1024;

    try {
      const imageFile = event.target.files?.[0];
      if (!imageFile) return;

      if (!imageFile.type.startsWith("image/")) {
        toast.info("Only image files are allowed!");
        return;
      }

      if (imageFile.size > maxBytesAllow) {
        event.target.value = "";
        toast.info("File size exceeds the max limit!");
        return;
      }

      const base64 = await convertToBase64(imageFile);
      setSelectedImage(base64);
      setMessage(imageFile?.name);
      event.target.value = "";
    } catch (error: any) {
      console.error(`Error while attaching file: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (isSending || message === "" || !selectedChatData?._id) return;
    setIsSending(true);

    try {
      const messageData: MessageData = {
        type: selectedImage ? "file" : "text",
      };

      if (selectedImage && message !== "") {
        messageData.file = selectedImage;
      } else {
        messageData.text = encryptMessage(message, selectedChatData?._id!);
      }

      if (replyTo) messageData.reply = replyTo._id;
      if (selectedImage) setMessage("Sending...");

      if (selectedChatType === "contact") {
        await api.post(`/api/message/send/${selectedChatData?._id}`, messageData);
      }

      if (selectedChatType === "group") {
        await api.post(`/api/group/message/send/${selectedChatData?._id}`, messageData);
      }

      handleClearMessage(!!replyTo);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleEnterKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && message !== "" && !isSending) {
      void handleSendMessage();
    }
  };

  useEffect(() => {
    if (selectedChatType === "group") return;

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
  }, [socket, userInfo?._id, selectedChatData?._id, selectedChatType, setIsPartnerTyping]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing:start", {
        selectedUser: selectedChatData?._id,
        currentUser: userInfo?._id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("typing:stop", {
        selectedUser: selectedChatData?._id,
        currentUser: userInfo?._id,
      });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
    selectedChatType === "contact" && handleTyping();
  };

  const { pasteFromClipboard } = useClipboard(inputRef, setMessage);

  return (
    <footer className="h-bar w-full border-t flex items-center justify-center p-2">
      <div className="w-full flex rounded items-center justify-center gap-4 bg-gray-100/80 dark:bg-transparent px-4 h-full">
        <div className="flex gap-4 relative">
          <TooltipElement content="Emojis" disabled={isSending}>
            <HiOutlineFaceSmile size={20} onClick={() => setEmojiPicker((prev) => !prev)} className="tooltip-icon" />
          </TooltipElement>

          {emojiPicker && (
            <div className="absolute bottom-20 -left-2.5 sm:-left-1.5 md:left-0" ref={emojiRef}>
              <EmojiPicker
                open={emojiPicker}
                onEmojiClick={handleAddEmoji}
                autoFocusSearch={false}
                theme={theme as Theme}
                className="max-w-80 sm:max-w-96 md:max-w-96 bg-background!"
              />
            </div>
          )}

          <TooltipElement content="Attach" disabled={isSending}>
            <HiOutlineLink size={20} onClick={handleAttachClick} className="tooltip-icon" />
          </TooltipElement>
        </div>

        <input
          type="file"
          id="file-input"
          className="hidden"
          ref={fileRef}
          accept="image/*"
          onChange={handleAttachChange}
        />
        {selectedImage && <img src={selectedImage} alt="image-preview" className="size-12 object-cover rounded" />}

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <input
              type="text"
              id="message-input"
              placeholder={`Message @${selectedChatData?.username || "user"}`}
              autoComplete="off"
              value={message}
              onChange={handleChange}
              className="w-full px-1 py-2 bg-transparent border-none outline-none text-sm tracking-wider"
              disabled={!!(selectedImage && message !== "") || editDialog || isSending}
              ref={inputRef}
              onKeyDown={handleEnterKeyDown}
            />
          </ContextMenuTrigger>
          <ContextMenuContent className="mb-2">
            <ContextMenuItem className="flex gap-2" onClick={pasteFromClipboard}>
              <HiOutlineClipboardDocumentCheck size={16} /> Paste
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {message && (
          <div className="flex gap-4">
            <TooltipElement content={selectedImage ? "Remove" : "Clear"} disabled={isSending}>
              {selectedImage ? (
                <HiOutlineXMark size={20} onClick={() => handleClearMessage()} className="tooltip-icon" />
              ) : (
                <HiOutlineBackspace size={20} onClick={() => handleClearMessage()} className="tooltip-icon" />
              )}
            </TooltipElement>

            <TooltipElement content="Send" disabled={isSending}>
              <HiOutlinePaperAirplane size={20} onClick={handleSendMessage} className="tooltip-icon" />
            </TooltipElement>
          </div>
        )}
      </div>
    </footer>
  );
};

export { MessageBar };
