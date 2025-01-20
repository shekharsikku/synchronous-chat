import { toast } from "sonner";
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router";
import { useEffect, useCallback, useRef } from "react";
import { usePeer, useSocket } from "@/lib/context";
import { useAuthStore, useChatStore } from "@/zustand";
import { Message } from "@/zustand/chat";
import notificationSound from "@/assets/sound/message-alert.mp3";
import maleAvatar from "@/assets/male-avatar.webp";
import femaleAvatar from "@/assets/female-avatar.webp";
import noAvatar from "@/assets/no-avatar.webp";
import api from "@/lib/api";

export const useGetUserInfo = () => {
  const { setUserInfo, setIsAuthenticated } = useAuthStore();

  const getUserInfo = async () => {
    try {
      const response = await api.get("/api/user/user-information");
      const data = await response.data.data;
      setUserInfo(data);
      setIsAuthenticated(true);
    } catch (error: any) {
      return null;
    }
  };
  return { getUserInfo };
};

export const useSignOutUser = () => {
  const navigate = useNavigate();
  const { setUserInfo, setIsAuthenticated } = useAuthStore();
  const { closeChat } = useChatStore();
  const { disconnectCalling, callingActive, setPendingRequest } = usePeer();

  const handleSignOut = async (e: any) => {
    e.preventDefault();
    try {
      const response = await api.delete("/api/auth/sign-out");
      if (callingActive) disconnectCalling();
      setPendingRequest(false);
      setIsAuthenticated(false);
      setUserInfo(null!);
      closeChat();
      navigate("/auth", { replace: true });
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };
  return { handleSignOut };
};

export const useAuthRefresh = () => {
  const authRefresh = async () => {
    try {
      await api.get("/api/auth/auth-refresh");
      return true;
    } catch (error: any) {
      return false;
    }
  };
  return { authRefresh };
};

export const useListenMessages = () => {
  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { messages, setMessages, selectedChatData, isSoundAllow } =
    useChatStore();

  const listenersAttached = useRef(false);

  useEffect(() => {
    if (socket && !listenersAttached.current) {
      socket.on("message:receive", (message: Message) => {
        /** Play notification sound only if the message is for the current user */
        if (
          message.recipient === userInfo?._id &&
          message.sender !== selectedChatData?._id &&
          isSoundAllow
        ) {
          const sound = new Audio(notificationSound);
          sound.play();
        }
        /** Add the message to the chat if it's part of the selected chat */
        if (
          selectedChatData?._id === message.sender ||
          userInfo?._id === message.sender
        ) {
          setMessages([...messages, message]);
        }
      });
      listenersAttached.current = true;
    }
    return () => {
      socket?.off("message:receive");
      listenersAttached.current = false;
    };
  }, [
    socket,
    messages,
    setMessages,
    isSoundAllow,
    userInfo?._id,
    selectedChatData?._id,
  ]);
};

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

export const useAvatar = (userInformation: any) => {
  let avatar;

  if (userInformation?.image) {
    avatar = userInformation.image;
  } else {
    if (userInformation?.gender === "Male") {
      avatar = maleAvatar;
    } else if (userInformation?.gender === "Female") {
      avatar = femaleAvatar;
    } else {
      avatar = noAvatar;
    }
  }
  return avatar;
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
