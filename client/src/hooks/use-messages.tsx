import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { useSocket } from "@/lib/context";
import { useEffect, useRef, useMemo } from "react";
import { useChatStore, useAuthStore, Message } from "@/zustand";
import notificationSound from "@/assets/sound/message-alert.mp3";
import api from "@/lib/api";

export const fetchMessages = async (userId: string): Promise<Message[]> => {
  const response = await api.get(`/api/message/${userId}`);
  return response.data.data;
};

const updateMessage = (queryClient: QueryClient, queryKey: string[], current: Message) => {
  queryClient.setQueryData<Message[]>(queryKey, (messages: Message[] | undefined) => {
    if (!messages) return [];
    return messages.map((message: Message) => (message._id === current._id ? { ...message, ...current } : message));
  });
};

export const useMessages = () => {
  const queryClient = useQueryClient();
  const messageListeners = useRef(false);

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, isSoundAllow } = useChatStore();

  const queryKey = useMemo(
    () => ["messages", userInfo?._id!, selectedChatData?._id!],
    [userInfo?._id, selectedChatData?._id]
  );

  const { data: messages, isFetching: fetching } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchMessages(selectedChatData?._id!),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
    enabled: !!selectedChatData?._id,
  });

  useEffect(() => {
    if (!socket || !selectedChatData?._id) return;

    const handleMessageReceive = async (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;
      const chatQueryKey = ["messages", userInfo?._id, chatKey];

      /** If the message belongs to the selected chat, update directly */
      if (chatKey === selectedChatData._id) {
        queryClient.setQueryData<Message[]>(chatQueryKey, (previous = []) => {
          return [...previous, message];
        });
        return;
      }

      /** Check if messages are already cached */
      let cachedMessages = queryClient.getQueryData<Message[]>(chatQueryKey) || [];

      /** If messages are not cached, fetch from api */
      if (!cachedMessages || cachedMessages.length === 0) {
        try {
          cachedMessages = await queryClient.fetchQuery({
            queryKey: chatQueryKey,
            queryFn: () => fetchMessages(chatKey),
            staleTime: 2 * 60 * 60 * 1000,
            gcTime: 4 * 60 * 60 * 1000,
          });
        } catch (error: any) {
          import.meta.env.DEV && console.error("Failed to fetch messages:", error.message);
          return;
        }
      }

      /** Update cache with the new message (avoid duplicates) */
      queryClient.setQueryData<Message[]>(chatQueryKey, (previous = []) => {
        const uniqueMessages = previous.filter((current) => current._id !== message._id);
        return [...uniqueMessages, message];
      });

      if (message.recipient === userInfo?._id && message.sender !== selectedChatData?._id && isSoundAllow) {
        const sound = new Audio(notificationSound);
        sound.volume = 0.25;
        void sound.play();
      }
    };

    const handleMessageUpdate = (current: Message) => {
      updateMessage(queryClient, queryKey, current);
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

  return { messages, fetching };
};
