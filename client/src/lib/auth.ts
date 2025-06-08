import { encryptInfo, decryptInfo } from "@/lib/noble";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useChatStore } from "@/zustand";
import { usePeer } from "@/lib/context";
import { useEffect } from "react";
import { UserInfo } from "@/zustand/auth";
import { toast } from "sonner";
import api from "@/lib/api";

export const setAuthUser = (user: UserInfo) => {
  const data = encryptInfo(
    JSON.stringify(user),
    import.meta.env.VITE_ENCRYPTION
  );
  localStorage.setItem("current", data);
};

export const getAuthUser = (): UserInfo | null => {
  const data = localStorage.getItem("current");
  if (data) {
    const user = decryptInfo(data, import.meta.env.VITE_ENCRYPTION);
    return JSON.parse(user);
  }
  return null;
};

export const delAuthUser = () => {
  localStorage.removeItem("current");
};

export const useAuthUser = () => {
  const location = useLocation();
  const {
    userInfo,
    isAuthenticated,
    getUserInfo,
    setUserInfo,
    setIsAuthenticated,
  } = useAuthStore();

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
