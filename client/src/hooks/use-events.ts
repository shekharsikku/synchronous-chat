import { useEffect, useRef, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";
import env from "@/lib/env";
import { useContacts } from "@/hooks";
import { getTimeoutDelay } from "@/lib/utils";
import { subscribeNotification } from "@/lib/push";
import { useAuthStore, useChatStore } from "@/lib/zustand";

export const useEvents = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { userInfo, setUserInfo } = useAuthStore();

  const { setSelectedChatType, setSelectedChatData } = useChatStore();
  const { contacts } = useContacts();

  const getSenderDetails = useEffectEvent((sender: string) => {
    return contacts?.find((contact) => contact._id === sender);
  });

  const updateUserInfo = useEffectEvent((updatedProfile: UserInfo) => {
    if (updatedProfile._id === userInfo?._id) {
      setUserInfo(updatedProfile);
      if (updatedProfile.setup) navigate("/chat");
      if (env.isDev) console.info("[SSE] Profile setup completed.");
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
      console.info("[SSE] Connected to event source.");
    };

    eventSource.onerror = (_error) => {
      console.warn("[SSE] Connection error, retrying...");

      eventSource.close();
      eventSourceRef.current = null;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      const retryDelay = getTimeoutDelay(retryCountRef.current);
      retryCountRef.current++;

      console.info(`[SSE] Reconnecting in ${(retryDelay / 1000).toFixed(1)} sec...`);

      retryTimeoutRef.current = setTimeout(() => {
        console.info("[SSE] Reconnecting now...");
        connectEvent();
      }, retryDelay);
    };
  };

  /** Effect for manage sse connection. */
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

  /** Effect for manage push notification. */
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!userInfo?._id) return;

    subscribeNotification();

    const handleMessageEvent = (event: MessageEvent) => {
      if (event.data?.type !== "NAVIGATE") return;
      const { url, sid } = event.data;

      if (sid) {
        const details = getSenderDetails(sid);
        if (details) {
          setSelectedChatType("contact");
          setSelectedChatData(details);
        }
      }
      navigate(url, { replace: true });
    };

    navigator.serviceWorker.addEventListener("message", handleMessageEvent);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessageEvent);
  }, [userInfo?._id]);
};
