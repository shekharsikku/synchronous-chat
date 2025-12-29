import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "@/lib/api";
import { usePeer } from "@/lib/context";
import { encryptInfo, decryptInfo } from "@/lib/noble";
import { useAuthStore, useChatStore, type UserInfo } from "@/lib/zustand";

const cookiesKey = import.meta.env.VITE_COOKIE_KEY;

export const setAuthUser = (user: UserInfo) => {
  const data = encryptInfo(JSON.stringify(user), import.meta.env.VITE_ENCRYPTION);
  Cookies.set(cookiesKey, data, { expires: 1, sameSite: "strict", secure: import.meta.env.PROD });
};

export const getAuthUser = (): UserInfo | null => {
  const data = Cookies.get(cookiesKey);
  if (data) {
    const user = decryptInfo(data, import.meta.env.VITE_ENCRYPTION);
    return JSON.parse(user);
  }
  return null;
};

export const delAuthUser = () => {
  Cookies.remove(cookiesKey);
};

export const useAuthUser = () => {
  const location = useLocation();
  const { userInfo, isAuthenticated, getUserInfo, setUserInfo, setIsAuthenticated } = useAuthStore();

  const handleAuthSync = useEffectEvent(async () => {
    let userData = getAuthUser();

    if (userData) {
      setUserInfo(userData);
      setIsAuthenticated(true);
    } else {
      userData = await getUserInfo();
      if (userData) setAuthUser(userData);
    }
  });

  useEffect(() => {
    handleAuthSync();
  }, [location.pathname]);

  return { isAuthenticated, userInfo };
};

export const useSignOut = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { closeChat } = useChatStore();
  const { setUserInfo, setIsAuthenticated } = useAuthStore();
  const { disconnectCalling, callingActive } = usePeer();

  const handleSignOut = async (e: any) => {
    e.preventDefault();
    if (callingActive) disconnectCalling();
    try {
      const response = await api.delete("/api/auth/sign-out");
      setIsAuthenticated(false);
      setUserInfo(null);
      closeChat();
      delAuthUser();
      queryClient.clear();
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
    navigate("/auth", { replace: true });
  };
  return { handleSignOut };
};
