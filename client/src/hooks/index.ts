import { toast } from "sonner";
import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChangeEvent, ChangeEventHandler, useState } from "react";
import { useSocket } from "@/context/socket-context";
import { useAuthStore, useChatStore } from "@/zustand";
import notificationSound from "@/assets/sound/notification.mp3";
import api from "@/lib/api";

import { useDispatch } from "react-redux";
import { logout, currentUser } from "@/redux/reducer/auth";

export interface InitialValuesProps {
  email?: string;
  username?: string;
  password?: string;
  confirm?: string;
  credentials?: string;
  old_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export const useHandleForm = (
  initialValues: InitialValuesProps
): [
  values: InitialValuesProps,
  setValues: CallableFunction,
  handleChange: ChangeEventHandler
] => {
  const [values, setValues] = useState<InitialValuesProps>(initialValues);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  return [values, setValues, handleChange];
};

export const useGetUserInfo = () => {
  const dispatch = useDispatch();
  const { setUserInfo, setIsAuthenticated } = useAuthStore();

  const getUserInfo = async () => {
    try {
      const response = await api.get("/api/user/user-information", {
        withCredentials: true,
      });
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

  const handleSignOut = async (e: any) => {
    e.preventDefault();
    try {
      const response = await api.delete("/api/auth/sign-out", {
        withCredentials: true,
      });
      toast.success(response.data.message);
      setIsAuthenticated(false);
      setUserInfo(null!);

      dispatch(logout());

      closeChat();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };
  return { handleSignOut };
};

export const useAuthRefresh = () => {
  const authRefresh = async () => {
    try {
      const response = await api.get("/api/auth/auth-refresh", {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      return error.response.data;
    }
  };
  return { authRefresh };
};

export const useListenMessages = () => {
  const { socket } = useSocket();
  const { messages, setMessages } = useChatStore();

  useEffect(() => {
    socket?.on("newMessage", (newMessage: any) => {
      const sound = new Audio(notificationSound);
      sound.play();
      setMessages([...messages, newMessage]);
    });

    return () => {
      socket?.off("newMessage");
    };
  }, [socket, setMessages, messages]);
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
