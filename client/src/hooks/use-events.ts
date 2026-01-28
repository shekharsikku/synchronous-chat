import { useEffect, useRef, useEffectEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore, type UserInfo } from "@/lib/zustand";

const serverUrl = import.meta.env.VITE_SERVER_URL;

export const useEvents = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectedUserIdRef = useRef<string | null>(null);
  const { userInfo, setUserInfo } = useAuthStore();

  const updateUserInfo = useEffectEvent((updatedProfile: UserInfo) => {
    if (updatedProfile._id === userInfo?._id) {
      setUserInfo(updatedProfile);
      updatedProfile.setup && navigate("/chat");
      import.meta.env.DEV && console.log("👍 Profile setup completed!");
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

    const eventSource = new EventSource(`${serverUrl}/api/events`, {
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
