import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { auth as api } from "@/lib/api";
import { usePeer } from "@/lib/context";
import { unsubscribeNotification } from "@/lib/push";
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

  const handleSignOut = async (event?: React.MouseEvent) => {
    event?.preventDefault();

    try {
      if (callingActive) {
        disconnectCalling();
      }

      const response = await api.delete("/api/auth/signout");
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      unsubscribeNotification().catch(() => {});
      closeChat();
      setUserInfo(null);
      setIsAuthenticated(false);
      queryClient.clear();
      navigate("/auth", { replace: true });
    }
  };
  return { handleSignOut };
};
