import { useEffect, useRef, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import env from "@/lib/env";
import { getTimeoutDelay } from "@/lib/utils";
import { useAuthStore } from "@/lib/zustand";

export const useEvents = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { userInfo, setUserInfo } = useAuthStore();

  const updateUserInfo = useEffectEvent((updatedProfile: UserInfo) => {
    if (updatedProfile._id === userInfo?._id) {
      setUserInfo(updatedProfile);
      if (updatedProfile.setup) navigate("/chat");
      if (env.isDev) console.log("👍 Profile setup completed!");
    }
  });

  const connectEvent = () => {
    if (!userInfo?._id) return;
    if (eventSourceRef.current) return;

    const eventSource = new EventSource(`${env.serverUrl}/api/events`, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.addEventListener("profile-setup-complete", (event) => {
      const updatedProfile: UserInfo = JSON.parse(event.data);
      updateUserInfo(updatedProfile);
    });

    eventSource.onopen = () => {
      retryCountRef.current = 0;
      console.log("✅ Connected to event source!");
    };

    eventSource.onerror = (_error) => {
      console.error("❌ Event source connection error!");

      eventSource.close();
      eventSourceRef.current = null;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      const retryDelay = getTimeoutDelay(retryCountRef.current);
      retryCountRef.current++;

      console.log(`🔄 Reconnecting in ${(retryDelay / 1000).toFixed(1)} sec...`);

      retryTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Reconnecting now...");
        connectEvent();
      }, retryDelay);
    };
  };

  useEffect(() => {
    if (!userInfo?._id) return;
    if (connectedUserIdRef.current === userInfo._id) return;

    connectedUserIdRef.current = userInfo._id;

    connectEvent();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      connectedUserIdRef.current = null;
    };
  }, [userInfo?._id]);
};
