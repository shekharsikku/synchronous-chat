import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import axios from "axios";
import api from "@/lib/api";
import env from "@/lib/env";
import { useSocket } from "@/lib/context";
import { decryptMessage } from "@/lib/noble";
import { useAuthStore, useChatStore } from "@/lib/zustand";
import type { ChangeEvent, RefObject, SetStateAction, Dispatch } from "react";

export const useDebounce = <T extends (...args: any[]) => void>(callback: T, delay: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  return debouncedFunction;
};

export const useDisableAnimations = <T extends HTMLElement>(socket: Socket | null, ref: RefObject<T | null>) => {
  useEffect(() => {
    if (!socket || !ref.current) return;

    let timeout: ReturnType<typeof setTimeout>;

    const listener = () => {
      ref.current?.classList.add("transform-none");

      clearTimeout(timeout);

      timeout = setTimeout(() => {
        ref.current?.classList.remove("transform-none");
      }, 5000);
    };

    socket.onAny(listener);

    return () => {
      clearTimeout(timeout);
      socket.offAny(listener);
    };
  }, [socket, ref]);
};

export const useLastMinutes = (timestamp: Date | string | number, minutes = 10) => {
  const [isLastMinutes, setIsLastMinutes] = useState(false);

  useEffect(() => {
    const timestampDate = new Date(timestamp);

    if (isNaN(timestampDate.getTime())) {
      setIsLastMinutes(false);
      return;
    }

    const checkTimestamp = () => {
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - timestampDate.getTime();
      setIsLastMinutes(timeDifference <= minutes * 60 * 1000);
    };

    checkTimestamp();
    const timeInterval = setInterval(checkTimestamp, 60 * 1000);
    return () => clearInterval(timeInterval);
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
    } catch {
      if (env.isDev) console.log("Plain text decryption failed!");
      return "Decryption Error!";
    }
  };

  return { plainText };
};

export const useClipboard = (
  inputRef: RefObject<HTMLInputElement | null>,
  pasteMessage: (value: string | ((prev: string) => string)) => void
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
        pasteMessage(value);
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
  const { userInfo } = useAuthStore();

  const uploadMessageFile = async (imageFormData: FormData | null) => {
    if (!imageFormData) return null;

    try {
      const { data: result } = await axios.post(`${env.bucketUrl}/api/files`, imageFormData, {
        headers: { "Content-Type": "multipart/form-data" },
        params: {
          uid: userInfo?._id,
        },
      });
      const fileInfo = JSON.stringify({
        id: result.data._id,
        ...result.data.metadata.dimensions,
      });
      return fileInfo;
    } catch {
      return null;
    }
  };

  const deleteSelectedMessage = async (message: Message) => {
    try {
      if (message.content?.type === "file") {
        try {
          const fileInfo = JSON.parse(message.content.file!);

          await axios.delete(`${env.bucketUrl}/api/files/${fileInfo.id}`, {
            params: {
              uid: userInfo?._id,
            },
          });
        } catch (err) {
          console.error("Failed to delete file:", err);
        }
      }

      const response = await api.delete(`/api/message/delete/${message._id}`);
      toast.info(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleEmojiReaction = async (id: string, emoji: string) => {
    try {
      await api.patch(`/api/message/react/${id}`, {
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
    } catch {
      setTranslated("");
      if (env.isDev) console.log("Language translation error!");
    }
  };

  return { deleteSelectedMessage, handleEmojiReaction, translateMessage, uploadMessageFile };
};

type UseImageSelectorOptions = {
  formKey: string;
  onSuccess?: (previewUrl: string, formData: FormData) => void;
  onError?: (message: string) => void;
};

export const useImageSelector = ({ formKey, onSuccess, onError }: UseImageSelectorOptions) => {
  /** Size is 3 MB and converted into Bytes */
  const maxBytesAllow = 3 * 1024 * 1024;

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const input = event.target;
    const files = input.files;

    if (!files || files.length === 0) return;

    const imageFile = files[0];

    if (!imageFile.type.startsWith("image/")) {
      const message = "Only image files are allowed!";
      toast.info(message);
      onError?.(message);
      return;
    }

    if (imageFile.size > maxBytesAllow) {
      input.value = "";
      const message = "File size exceeds the 3MB limit!";
      toast.info(message);
      onError?.(message);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    const formData = new FormData();
    formData.append(formKey, imageFile);
    onSuccess?.(previewUrl, formData);
    input.value = "";
  };

  return { handleImageSelect };
};

export const useGroupUpdate = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { setSelectedChatData } = useChatStore();

  const handleGroupUpdate = (updatedData: GroupInfo) => {
    const updatedGroup = { ...updatedData, interaction: new Date().toISOString() };

    queryClient.setQueryData<GroupInfo[]>(["groups", userInfo?._id], (older = []) => {
      return older.map((group) => (group._id === updatedGroup._id ? updatedGroup : group));
    });

    setSelectedChatData(updatedGroup);
    socket?.emit("before:group-update", { updatedGroup });
  };

  return { handleGroupUpdate };
};

export { useAuthUser, useSignOut } from "@/hooks/use-auth";
export { useContacts } from "@/hooks/use-contacts";
export { useEvents } from "@/hooks/use-events";
export { useListeners } from "@/hooks/use-listeners";
export { useMessages } from "@/hooks/use-messages";
