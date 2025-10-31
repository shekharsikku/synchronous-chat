import { useEffect, useCallback, useRef, useState, RefObject, SetStateAction, Dispatch } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";

import api from "@/lib/api";
import { decryptMessage } from "@/lib/noble";
import { useAuthStore, useChatStore, Message } from "@/lib/zustand";

export const useDebounce = (callback: Function, delay: number) => {
  const callbackRef = useCallback(callback, [callback]);
  const timeoutRef = useRef<any | any>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunction = (...args: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef(...args);
    }, delay);
  };
  return debouncedFunction;
};

export const useDisableAnimations = (socket: Socket, ref: any) => {
  useEffect(() => {
    if (!socket || !ref?.current) return;

    const disableAnimations = () => {
      if (ref.current) {
        ref.current.classList.add("transform-none");
      }
    };

    const enableAnimations = () => {
      if (ref.current) {
        ref.current.classList.remove("transform-none");
      }
    };

    socket.onAny(() => {
      disableAnimations();

      setTimeout(() => {
        enableAnimations();
      }, 5000);
    });

    return () => {
      socket.offAny();
    };
  }, [socket, ref]);
};

export const useLastMinutes = (timestamp: Date | string | number, minutes = 10) => {
  const [isLastMinutes, setIsLastMinutes] = useState(false);

  useEffect(() => {
    const checkTimestamp = () => {
      const timestampDate = new Date(timestamp);
      const currentData = new Date();
      const timeDifference = currentData.getTime() - timestampDate.getTime();
      setIsLastMinutes(timeDifference <= minutes * 60 * 1000);
    };

    checkTimestamp();
    const interval = setInterval(checkTimestamp, 60 * 1000);

    return () => clearInterval(interval);
  }, [timestamp, minutes]);

  return { isLastMinutes };
};

/** for convert encrypt message to plain text */
export const usePlainText = () => {
  const { userInfo } = useAuthStore();
  const { selectedChatData } = useChatStore();

  const plainText = (message: Message) => {
    if (message.content?.type === "file") {
      return "Can't Decrypt!";
    }

    try {
      if (message.group) {
        return decryptMessage(message?.content?.text!, message.group);
      }

      let messageKey = "";

      if (message.sender === selectedChatData?._id) {
        messageKey = userInfo?._id!;
      } else {
        messageKey = selectedChatData?._id!;
      }

      return decryptMessage(message?.content?.text!, messageKey);
    } catch (_error) {
      import.meta.env.DEV && console.log("Plain text decryption failed!");
      return "Decryption Error!";
    }
  };

  return { plainText };
};

export const useClipboard = (
  inputRef: RefObject<HTMLInputElement | null>,
  setMessage: Dispatch<SetStateAction<string>>
) => {
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const element = inputRef.current;

      if (text && element) {
        element.focus();
        const start = element.selectionStart ?? element.value.length;
        const end = element.selectionEnd ?? element.value.length;
        const value = element.value.substring(0, start) + text + element.value.substring(end);

        element.value = value;
        setMessage(value);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            element.setSelectionRange(start + text.length, start + text.length);
            element.focus();
          });
        });
      }
    } catch (error: any) {
      console.error("Clipboard read failed:", error.message);
    }
  };

  return { pasteFromClipboard };
};

export const useReplyMessage = (message: Message) => {
  const { messages } = useChatStore();
  return { replyMessage: messages.find((msg) => msg._id === message.reply) || null };
};

export const useMessageActions = () => {
  const deleteSelectedMessage = async (id: string) => {
    try {
      const response = await api.delete(`/api/message/delete/${id}`);
      toast.info(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleEmojiReaction = async (id: string, uid: string, emoji: string) => {
    try {
      await api.patch(`/api/message/react/${id}`, {
        by: uid,
        emoji,
      });
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const translateMessage = async (
    message: string,
    language: string,
    setTranslated: Dispatch<SetStateAction<string>>
  ) => {
    try {
      const response = await api.post("/api/message/translate", {
        message,
        language,
      });
      setTranslated(response.data.data);
    } catch (_error: any) {
      setTranslated("");
      import.meta.env.DEV && console.log("Language translation error!");
    }
  };

  return { deleteSelectedMessage, handleEmojiReaction, translateMessage };
};

export { useContacts } from "@/hooks/use-contacts";
export { useListeners } from "@/hooks/use-listeners";
export { useMessages } from "@/hooks/use-messages";
