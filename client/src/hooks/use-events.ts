import { useEffect, useRef, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import env from "@/lib/env";
import { useContacts } from "@/hooks";
import { getTimeoutDelay } from "@/lib/utils";
import { subscribeNotification } from "@/lib/push";
import { useAuthStore, useChatStore } from "@/lib/zustand";
import type { UserInfo } from "@/types";

export const useEvents = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const { userInfo, setUserInfo } = useAuthStore();
  const { setSelectedChatType, setSelectedChatData } = useChatStore();
  const { contacts } = useContacts();

  const handleMessageEvent = useEffectEvent((event: MessageEvent) => {
    if (event.data?.type !== "NAVIGATE") return;
    const { url, sid } = event.data;

    if (sid) {
      const details = contacts?.find((c) => c._id === sid);
      if (details) {
        setSelectedChatType("contact");
        setSelectedChatData(details);
      }
    }
    navigate(url, { replace: true });
  });

  const handleProfileSetup = useEffectEvent((event: MessageEvent) => {
    try {
      const updatedProfile: UserInfo = JSON.parse(event.data);

      if (updatedProfile._id === userInfo?._id) {
        setUserInfo(updatedProfile);
        if (updatedProfile.setup) navigate("/chat");
        if (env.isDev) console.info("[SSE] Profile setup completed.");
      }
    } catch (err) {
      console.error("[SSE] Failed to parse event payload:", err);
    }
  });

  /** Effect for manage sse connection. */
  useEffect(() => {
    if (!userInfo?._id) return;

    let isMounted = true;

    const connectEvent = () => {
      if (!isMounted || eventSourceRef.current) return;

      const eventSource = new EventSource(`${env.serverUrl}/api/events`, {
        withCredentials: true,
      });

      eventSourceRef.current = eventSource;

      eventSource.addEventListener("profile-setup-complete", handleProfileSetup);

      eventSource.onopen = () => {
        if (!isMounted) return;
        retryCountRef.current = 0;
        console.info("[SSE] Connected to event source.");
      };

      eventSource.onerror = () => {
        if (!isMounted) return;
        console.warn("[SSE] Connection error, closing to retrying...");

        eventSource.removeEventListener("profile-setup-complete", handleProfileSetup);
        eventSource.close();
        eventSourceRef.current = null;

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        const retryDelay = getTimeoutDelay(retryCountRef.current);
        retryCountRef.current++;

        console.info(`[SSE] Reconnecting in ${(retryDelay / 1000).toFixed(1)} sec...`);

        retryTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            console.info("[SSE] Reconnecting now...");
            connectEvent();
          }
        }, retryDelay);
      };
    };

    connectEvent();

    return () => {
      isMounted = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener("profile-setup-complete", handleProfileSetup);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [userInfo?._id]);

  /** Effect for manage push notification. */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!userInfo?._id) return;

    subscribeNotification();

    navigator.serviceWorker.addEventListener("message", handleMessageEvent);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessageEvent);
  }, [userInfo?._id]);
};
