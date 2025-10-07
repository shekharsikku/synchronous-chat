import { useQueryClient, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { useSocket } from "@/lib/context";
import { useEffect, useRef, useMemo } from "react";
import { useChatStore, useAuthStore, Message } from "@/zustand";
import notificationSound from "@/assets/sound/message-alert.mp3";
import api from "@/lib/api";

export const useMessages = () => {
  const queryClient = useQueryClient();
  const messageListeners = useRef(false);

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, isSoundAllow, setMessageActive } = useChatStore();

  const queryKey = useMemo(
    () => ["messages", userInfo?._id!, selectedChatData?._id!],
    [userInfo?._id, selectedChatData?._id]
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = pageParam ? 10 : 20;
      const before = pageParam ? `&before=${pageParam}` : "";
      const url = `/api/message/fetch/${selectedChatData?._id}?limit=${limit}${before}`;
      const response = await api.get(url);
      return response.data.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.length) return undefined;
      return lastPage[0].createdAt;
    },
    refetchOnWindowFocus: false,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
    enabled: !!selectedChatData?._id,
  });

  useEffect(() => {
    if (!socket || !selectedChatData?._id) return;

    const handleMessageReceive = async (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;
      const chatQueryKey = ["messages", userInfo?._id, chatKey];
      setMessageActive(true);

      /** Update messages with the new message (avoid duplicates) */
      queryClient.setQueryData<InfiniteData<Message[]>>(chatQueryKey, (older) => {
        if (!older) return { pages: [[message]], pageParams: [undefined] };

        /** Clone latest messages pages array */
        const newer = [...older.pages];
        const first = newer[0];

        /** Avoid duplicates */
        if (first.some((msg) => msg._id === message._id)) return older;

        /** Append message to the first page */
        newer[0] = [...first, message];

        return {
          ...older,
          pages: newer,
        };
      });

      if (message.recipient === userInfo?._id && message.sender !== selectedChatData?._id && isSoundAllow) {
        const sound = new Audio(notificationSound);
        sound.volume = 0.25;
        void sound.play();
      }

      const messageTimeout = setTimeout(() => setMessageActive(false), 2000);
      return () => clearTimeout(messageTimeout);
    };

    const handleMessageUpdate = (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;
      const chatQueryKey = ["messages", userInfo?._id, chatKey];

      queryClient.setQueryData<InfiniteData<Message[]>>(chatQueryKey, (existing) => {
        if (!existing) return { pages: [[message]], pageParams: [undefined] };

        const updated = existing.pages.map((page) => {
          return page.map((msg) => (msg._id === message._id ? { ...msg, ...message } : msg));
        });

        return {
          ...existing,
          pages: updated,
        };
      });
    };

    const events: [string, (...args: any[]) => void][] = [
      ["message:receive", handleMessageReceive],
      ["message:remove", handleMessageUpdate],
      ["message:edited", handleMessageUpdate],
      ["message:reacted", handleMessageUpdate],
    ];

    if (!messageListeners.current) {
      events.forEach(([event, handler]) => socket.on(event, handler));
      messageListeners.current = true;
    }

    return () => {
      events.forEach(([event, handler]) => socket.off(event, handler));
      messageListeners.current = false;
    };
  }, [socket, userInfo?._id, selectedChatData?._id, queryClient, isSoundAllow]);

  return infiniteQuery;
};
