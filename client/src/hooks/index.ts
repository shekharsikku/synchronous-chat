import { toast } from "sonner";
import { Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback, useRef } from "react";
import { useSocket, usePeer } from "@/context";
import { useAuthStore, useChatStore } from "@/zustand";
import { logout, currentUser } from "@/redux/reducer/auth";
import { Message } from "@/zustand/slice/chat";
import notificationSound from "@/assets/sound/message-alert.mp3";
import maleAvatar from "@/assets/male-avatar.jpg";
import femaleAvatar from "@/assets/female-avatar.jpg";
import noAvatar from "@/assets/no-avatar.png";
import api from "@/lib/api";

export const useGetUserInfo = () => {
  const dispatch = useDispatch();
  const { setUserInfo, setIsAuthenticated } = useAuthStore();

  const getUserInfo = async () => {
    try {
      const response = await api.get("/api/user/user-information");
      const data = await response.data.data;
      setUserInfo(data);
      setIsAuthenticated(true);
      dispatch(currentUser(data));
    } catch (error: any) {
      return null;
    }
  };
  return { getUserInfo };
};

export const useSignOutUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setUserInfo, setIsAuthenticated } = useAuthStore();
  const { closeChat } = useChatStore();
  const { disconnectCalling, callingActive } = usePeer();

  const handleSignOut = async (e: any) => {
    e.preventDefault();
    try {
      const response = await api.delete("/api/auth/sign-out");
      if (callingActive) {
        disconnectCalling();
      }
      setIsAuthenticated(false);
      setUserInfo(null!);
      dispatch(logout());
      closeChat();
      navigate("/auth");
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
        if (message.recipient === userInfo?._id && isSoundAllow) {
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
