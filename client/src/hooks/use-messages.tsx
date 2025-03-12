import { useQuery, useQueryClient, QueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useMemo } from "react";
import { useChatStore, useAuthStore } from "@/zustand";
import { useSocket } from "@/lib/context";
import { Message } from "@/zustand/chat";
import notificationSound from "@/assets/sound/message-alert.mp3";
import api from "@/lib/api";

const fetchMessages = async (userId: string): Promise<Message[]> => {
  const response = await api.get(`/api/message/${userId}`);
  return response.data.data;
};

const updateMessage = (
  queryClient: QueryClient,
  queryKey: string[],
  current: Message
) => {
  queryClient.setQueryData<Message[]>(
    queryKey,
    (messages: Message[] | undefined) => {
      if (!messages) return [];
      return messages.map((message: Message) =>
        message._id === current._id ? { ...message, ...current } : message
      );
    }
  );
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
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    enabled: !!selectedChatData?._id,
  });

  useEffect(() => {
    if (!socket || !selectedChatData?._id) return;

    const handleMessageReceive = (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;

      queryClient.setQueryData<Message[]>(
        ["messages", userInfo?._id, chatKey],
        (older: Message[] | undefined) => [...(older || []), message]
      );

      if (
        message.recipient === userInfo?._id &&
        message.sender !== selectedChatData?._id &&
        isSoundAllow
      ) {
        const sound = new Audio(notificationSound);
        void sound.play();
      }
    };

    const handleMessageUpdate = (current: Message) => {
      updateMessage(queryClient, queryKey, current);
    };

    if (!messageListeners.current) {
      socket.on("message:receive", handleMessageReceive);
      socket.on("message:remove", handleMessageUpdate);
      socket.on("message:edited", handleMessageUpdate);
      messageListeners.current = true;
    }

    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.off("message:remove", handleMessageUpdate);
      socket.off("message:edited", handleMessageUpdate);
      messageListeners.current = false;
    };
  }, [socket, userInfo?._id, selectedChatData?._id, queryClient, isSoundAllow]);

  return { messages, fetching };
};
