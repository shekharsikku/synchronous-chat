import React, {
  useReducer,
  useEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEventHandler,
  useEffectEvent,
  useCallback,
} from "react";
import { isDesktop, isMobile } from "react-device-detect";
import { useDropzone } from "react-dropzone";
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
import { useClipboard, useMessageActions } from "@/hooks";
import api from "@/lib/api";
import { useSocket, useTheme } from "@/lib/context";
import { encryptMessage } from "@/lib/noble";
import { useChatStore, useAuthStore } from "@/lib/zustand";
import type { MessageData } from "@/types";
import type { EmojiClickData, Theme } from "emoji-picker-react";

const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

interface TypingUpdate {
  selected: string;
  current: string;
  typing: boolean;
}

type MessageInputState = {
  message: string;
  isTyping: boolean;
  isSending: boolean;
  emojiPicker: boolean;
  selectedImage: string | null;
  imageFormData: FormData | null;
};

type MessageInputAction =
  | { type: "SET_MESSAGE"; payload: string }
  | { type: "APPEND_EMOJI"; payload: string }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "SET_SENDING"; payload: boolean }
  | { type: "TOGGLE_EMOJI" }
  | { type: "SET_IMAGE"; payload: string | null }
  | { type: "SET_IMAGE_FORM"; payload: FormData | null }
  | { type: "RESET" };

const initialMessageInputState: MessageInputState = {
  message: "",
  isTyping: false,
  isSending: false,
  emojiPicker: false,
  selectedImage: null,
  imageFormData: null,
};

function messageInputReducer(state: MessageInputState, action: MessageInputAction): MessageInputState {
  switch (action.type) {
    case "SET_MESSAGE":
      return { ...state, message: action.payload };

    case "APPEND_EMOJI":
      return { ...state, message: state.message + action.payload };

    case "SET_TYPING":
      return { ...state, isTyping: action.payload };

    case "SET_SENDING":
      return { ...state, isSending: action.payload };

    case "TOGGLE_EMOJI":
      return { ...state, emojiPicker: !state.emojiPicker };

    case "SET_IMAGE":
      return { ...state, selectedImage: action.payload };

    case "SET_IMAGE_FORM":
      return { ...state, imageFormData: action.payload };

    case "RESET":
      return initialMessageInputState;

    default:
      return state;
  }
}

const MessageBar = () => {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const {
    selectedChatType,
    selectedChatData,
    setIsPartnerTyping,
    editDialog,
    replyTo,
    setReplyTo,
    groupDialog,
    groupSettingDialog,
  } = useChatStore();
  const { uploadMessageFile } = useMessageActions();

  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [{ message, isTyping, isSending, emojiPicker, selectedImage, imageFormData }, dispatch] = useReducer(
    messageInputReducer,
    initialMessageInputState
  );

  useEffect(() => {
    if (!inputRef.current || isMobile) return;

    if (isDesktop && (selectedChatData || replyTo)) {
      inputRef.current.focus();
    }
  }, [selectedChatData, replyTo]);

  useEffect(() => {
    const handleSpaceEscapeKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      if (
        (editDialog || groupDialog || groupSettingDialog) &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
      ) {
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
  }, [editDialog, groupDialog, groupSettingDialog]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        dispatch({ type: "TOGGLE_EMOJI" });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleImageFile = useCallback(async (imageFile: File) => {
    /** Size is 6 MB and converted into Bytes */
    const maxBytesAllow = 6 * 1024 * 1024;

    if (!imageFile.type.startsWith("image/")) {
      toast.info("Only image files are allowed!");
      return;
    }

    if (imageFile.size > maxBytesAllow) {
      toast.info("File size exceeds the max limit!");
      return;
    }

    try {
      const previewUrl = URL.createObjectURL(imageFile);
      dispatch({ type: "SET_IMAGE", payload: previewUrl });

      const formData = new FormData();
      formData.append("file", imageFile);
      dispatch({ type: "SET_IMAGE_FORM", payload: formData });

      dispatch({ type: "SET_MESSAGE", payload: imageFile.name });
    } catch {
      console.error("[Chat] Failed to attach image file.");
    }
  }, []);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const imageFile = acceptedFiles[0];
      if (!imageFile || isSending || editDialog) return;

      await handleImageFile(imageFile);
    },
    [isSending, editDialog, handleImageFile]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    noKeyboard: true,
    accept: { "image/*": [] },
  });

  const handleAddEmoji = (emoji: EmojiClickData) => {
    dispatch({
      type: "APPEND_EMOJI",
      payload: emoji.emoji,
    });
  };

  const handleAttachClick = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  const handleClearMessage = (reply = false) => {
    if (reply) setReplyTo(null);
    dispatch({ type: "SET_MESSAGE", payload: "" });
    dispatch({ type: "SET_IMAGE", payload: null });
    dispatch({ type: "SET_IMAGE_FORM", payload: null });
  };

  const handleAttachChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const imageFile = event.target.files?.[0];
    if (!imageFile) return;

    await handleImageFile(imageFile);

    event.target.value = "";
  };

  const handleSendMessage = async () => {
    if (isSending || message === "" || !selectedChatData?._id) return;
    dispatch({ type: "SET_SENDING", payload: true });

    const chatId = selectedChatData._id;
    const isFile = !!selectedImage;

    const messageData: MessageData = {
      type: isFile ? "file" : "text",
    };

    if (isFile && message !== "") {
      if (selectedImage) dispatch({ type: "SET_MESSAGE", payload: "Uploading..." });

      const uploadResult = await uploadMessageFile(imageFormData);

      if (!uploadResult) {
        toast.error("Can't able to send image file!");
        handleClearMessage(!!replyTo);
        return;
      }

      messageData.file = uploadResult;
    } else {
      messageData.text = encryptMessage(message, chatId);
    }

    if (replyTo) messageData.reply = replyTo._id;

    try {
      if (selectedImage) dispatch({ type: "SET_MESSAGE", payload: "Sending..." });

      await api.post(`/api/message/send/${chatId}?type=${selectedChatType}`, messageData);

      handleClearMessage(!!replyTo);
    } catch (error: any) {
      toast.error(error.response.data.message ?? "Failed to send message");
    }

    dispatch({ type: "SET_SENDING", payload: false });
  };

  const handleEnterKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && message !== "" && !isSending) {
      void handleSendMessage();
    }
  };

  useEffect(() => {
    if (selectedChatType === "group") return;

    const handleTypingUpdate = ({ selected, current, typing }: TypingUpdate) => {
      if (selected === userInfo?._id && current === selectedChatData?._id) {
        setIsPartnerTyping(typing);
      }
    };

    socket?.on("typing:update", handleTypingUpdate);

    return () => {
      socket?.off("typing:update", handleTypingUpdate);
    };
  }, [socket, userInfo?._id, selectedChatData?._id, selectedChatType, setIsPartnerTyping]);

  const handleTyping = () => {
    if (!selectedChatData?._id || !userInfo?._id) return;

    if (!isTyping) {
      dispatch({ type: "SET_TYPING", payload: true });

      socket?.emit("typing:update", {
        selected: selectedChatData?._id,
        current: userInfo?._id,
        typing: true,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "SET_TYPING", payload: false });

      socket?.emit("typing:update", {
        selected: selectedChatData?._id,
        current: userInfo?._id,
        typing: false,
      });
    }, 2000);
  };

  const handleTypingBlur = () => {
    if (!isTyping) return;
    if (!selectedChatData?._id || !userInfo?._id) return;

    dispatch({ type: "SET_TYPING", payload: false });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket?.emit("typing:update", {
      selected: selectedChatData?._id,
      current: userInfo?._id,
      typing: false,
    });
  };

  const stopTypingEffect = useEffectEvent(() => {
    handleTypingBlur();
  });

  useEffect(() => {
    return () => stopTypingEffect();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_MESSAGE", payload: event.target.value });
    if (selectedChatType === "contact") handleTyping();
  };

  const pasteMessage = (value: string | ((prev: string) => string)) => {
    if (typeof value === "function") {
      dispatch({
        type: "SET_MESSAGE",
        payload: value(message),
      });
    } else {
      dispatch({
        type: "SET_MESSAGE",
        payload: value,
      });
    }
  };

  const { pasteFromClipboard } = useClipboard(inputRef, pasteMessage);

  return (
    <footer className="h-bar w-full border-t flex items-center justify-center p-2">
      <div
        className="w-full flex rounded items-center justify-center gap-4 bg-gray-100/80 dark:bg-transparent px-4 h-full"
        {...getRootProps()}
      >
        <input {...getInputProps()} />

        <div className="flex gap-4 relative">
          <TooltipElement content="Emojis" disabled={isSending}>
            <HiOutlineFaceSmile size={20} onClick={() => dispatch({ type: "TOGGLE_EMOJI" })} className="tooltip-icon" />
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
              placeholder={`Message @${selectedChatData.name.trim().toLowerCase().replace(/\s+/g, "_") || "unknown"}`}
              autoComplete="off"
              value={message}
              onChange={handleChange}
              onBlur={handleTypingBlur}
              className="w-full px-1 py-2 bg-transparent border-none outline-none text-sm tracking-wider"
              readOnly={!!(selectedImage && message !== "") || editDialog || isSending}
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
