import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "@/lib/api";
import { usePeer } from "@/lib/context";
import { useAuthStore, useChatStore } from "@/lib/zustand";

export const useAuthUser = () => {
  const { userInfo, isAuthenticated, getUserInfo, isAuthResolved, setIsAuthResolved } = useAuthStore();

  const handleAuthSync = useEffectEvent(async () => {
    try {
      if (!userInfo || !isAuthenticated) {
        await getUserInfo();
      }
    } finally {
      setIsAuthResolved(true);
    }
  });

  useEffect(() => {
    if (!isAuthResolved) {
      handleAuthSync();
    }
  }, [isAuthResolved]);

  return { isAuthenticated, userInfo, isAuthResolved };
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
      closeChat();
      setUserInfo(null);
      setIsAuthenticated(false);
      queryClient.clear();
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
    navigate("/auth", { replace: true });
  };
  return { handleSignOut };
};
