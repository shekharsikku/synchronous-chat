import { encryptInfo, decryptInfo } from "@/lib/noble";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useChatStore, UserInfo } from "@/lib/zustand";
import { usePeer } from "@/lib/context";
import { useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import Cookies from "js-cookie";

const cookiesKey = import.meta.env.VITE_COOKIE_KEY;

export const setAuthUser = (user: UserInfo) => {
  const data = encryptInfo(JSON.stringify(user), import.meta.env.VITE_ENCRYPTION);
  Cookies.set(cookiesKey, data, { expires: 2, sameSite: "strict", secure: import.meta.env.PROD });
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

  useEffect(() => {
    (async () => {
      let userData = getAuthUser();

      if (userData) {
        setUserInfo(userData);
        setIsAuthenticated(true);
      } else {
        userData = await getUserInfo();

        if (userData) {
          setAuthUser(userData);
        }
      }
    })();
  }, [location.pathname]);

  return { isAuthenticated, userInfo };
};

export const useSignOut = () => {
  const navigate = useNavigate();
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
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
    navigate("/auth", { replace: true });
  };
  return { handleSignOut };
};
