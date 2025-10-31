import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useEffectEvent } from "react";

import notificationIcon from "@/assets/favicon.ico";
import notificationSound from "@/assets/sound/message-alert.mp3";
import { useContacts } from "@/hooks";
import api from "@/lib/api";
import { useSocket } from "@/lib/context";
import { useAuthStore, useChatStore, Message } from "@/lib/zustand";

export const useListeners = () => {
  const queryClient = useQueryClient();
  const messageListeners = useRef(false);

  const { socket } = useSocket();
  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();
  const { selectedChatData, isSoundAllow } = useChatStore();

  const getSenderName = useEffectEvent((chatKey: string) => {
    return contacts?.find((contact) => contact._id === chatKey)?.name;
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = async (message: Message) => {
      let chatKey: string | undefined = undefined;

      if (message.group) {
        chatKey = message.group;
      } else {
        chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;
      }

      const chatQueryKey = ["messages", userInfo?._id, chatKey];

      /** Check if messages are already cached */
      let cachedMessages = queryClient.getQueryData<InfiniteData<Message[]>>(chatQueryKey);

      /** If messages are not cached, fetch from api */
      if (!cachedMessages || cachedMessages.pages.length === 0) {
        cachedMessages = await queryClient.fetchInfiniteQuery({
          queryKey: chatQueryKey,
          queryFn: async ({ pageParam }) => {
            const limit = pageParam ? 10 : 20;
            const response = await api.get(`/api/message/fetch/${chatKey}?limit=${limit}`);
            return response.data.data;
          },
          initialPageParam: undefined,
          getNextPageParam: (lastPage: any) => {
            if (!lastPage?.length) return undefined;
            return lastPage[0].createdAt;
          },
          staleTime: 6 * 60 * 60 * 1000,
          gcTime: 8 * 60 * 60 * 1000,
        });
      }

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

      /** Show Browser Notification */
      if (Notification.permission === "granted" && !selectedChatData?._id) {
        const senderName = getSenderName(chatKey!);

        if (senderName) {
          const notification = new Notification(`You have a message from ${senderName}`, {
            icon: notificationIcon,
          });

          /** Auto-close notification after 5 seconds (optional) */
          setTimeout(() => notification.close(), 5000);
        }
      }

      if (message.recipient === userInfo?._id && message.sender !== selectedChatData?._id && isSoundAllow) {
        const sound = new Audio(notificationSound);
        sound.volume = 0.25;
        void sound.play();
      }
    };

    const handleMessageUpdate = (message: Message) => {
      let chatKey: string | undefined = undefined;

      if (message.group) {
        chatKey = message.group;
      } else {
        chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;
      }

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
  }, [socket, queryClient, userInfo?._id, selectedChatData?._id, isSoundAllow]);
};
