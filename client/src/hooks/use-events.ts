import { useEffect, useRef, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";

import env from "@/lib/env";
import { useAuthStore, type UserInfo } from "@/lib/zustand";

export const useEvents = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const { userInfo, setUserInfo } = useAuthStore();

  const updateUserInfo = useEffectEvent((updatedProfile: UserInfo) => {
    if (updatedProfile._id === userInfo?._id) {
      setUserInfo(updatedProfile);
      if (updatedProfile.setup) navigate("/chat");
      if (env.isDev) console.log("👍 Profile setup completed!");
    }
  });

  useEffect(() => {
    if (!userInfo?._id) return;
    if (connectedUserIdRef.current === userInfo._id) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    connectedUserIdRef.current = userInfo._id;

    const eventSource = new EventSource(`${env.serverUrl}/api/events`, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.addEventListener("profile-setup-complete", (event) => {
      const updatedProfile: UserInfo = JSON.parse(event.data);
      updateUserInfo(updatedProfile);
    });

    eventSource.onerror = (error) => {
      console.error("Server events connection error:", error);
      eventSource.close();
      eventSourceRef.current = null;
      connectedUserIdRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      connectedUserIdRef.current = null;
    };
  }, [userInfo?._id]);
};
