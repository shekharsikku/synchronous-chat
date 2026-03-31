import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useEffectEvent } from "react";
import { toast } from "sonner";
import notificationIcon from "@/assets/favicon.ico";
import { useContacts } from "@/hooks";
import api from "@/lib/api";
import { useSocket } from "@/lib/context";
import { useAppStore, useAuthStore, useChatStore } from "@/lib/zustand";

export const useListeners = () => {
  const queryClient = useQueryClient();
  const messageListeners = useRef(false);

  const { socket } = useSocket();
  const { allChats } = useContacts();
  const { isAllow } = useAppStore();
  const { userInfo, setUserInfo } = useAuthStore();
  const { selectedChatData, setSelectedChatData, closeChat } = useChatStore();

  const getChatKey = useEffectEvent((message: Message) => {
    if (message.group) {
      return message.group;
    } else {
      return userInfo?._id === message.sender ? message.recipient : message.sender;
    }
  });

  const getCurrentChat = useEffectEvent((chatKey?: string) => {
    return allChats.find((current) => current._id === chatKey);
  });

  const showNotification = useEffectEvent((chatKey?: string) => {
    if (Notification.permission !== "granted" || selectedChatData?._id || !isAllow) return;

    const messageFrom = getCurrentChat(chatKey)?.name;
    if (!messageFrom) return;

    const notification = new Notification(`You have a message from ${messageFrom}`, {
      icon: notificationIcon,
    });

    setTimeout(() => notification.close(), 5000);
  });

  const updateSelectedGroup = useEffectEvent((groupData: GroupInfo, isMember?: boolean) => {
    if (selectedChatData?._id === groupData._id) {
      if (!isMember) {
        toast.info("You were removed from the group!");
        closeChat();
      } else {
        setSelectedChatData(groupData);
      }
    }
  });

  const handleProfileUpdate = useEffectEvent((updatedProfile: UserInfo) => {
    if (updatedProfile._id === userInfo?._id) {
      setUserInfo(updatedProfile);
    }
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = async (message: Message) => {
      const chatKey = getChatKey(message);
      const chatQueryKey = ["messages", userInfo?._id, chatKey];

      /** Check if messages are already cached */
      let cachedMessages = queryClient.getQueryData<InfiniteData<Message[]>>(chatQueryKey);
      const isCacheEmpty = !cachedMessages?.pages?.some((page) => page.length > 0);

      /** If messages are not cached, fetch from api */
      if (isCacheEmpty) {
        cachedMessages = await queryClient.fetchInfiniteQuery({
          queryKey: chatQueryKey,
          queryFn: async ({ pageParam }) => {
            const chatType = getCurrentChat(chatKey)?.type;

            const params = new URLSearchParams({
              limit: pageParam ? "20" : "30",
            });

            if (pageParam) params.append("before", pageParam);
            if (chatType === "group") params.append("group", "true");

            const response = await api.get(`/api/message/fetch/${chatKey}?${params.toString()}`);
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

      /** Show browser notification */
      showNotification(chatKey);
    };

    const handleMessageUpdate = (message: Message) => {
      const chatKey = getChatKey(message);
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

    const handleGroupUpsert = (groupData: GroupInfo) => {
      if (!userInfo?._id) return;

      const isMember = groupData.members?.includes(userInfo._id!);

      queryClient.setQueryData<GroupInfo[]>(["groups", userInfo?._id], (older = []) => {
        if (!isMember) {
          return older.filter((group) => group._id !== groupData._id);
        }

        const exists = older.some((group) => group._id === groupData._id);

        if (exists) {
          return older.map((group) => (group._id === groupData._id ? groupData : group));
        }

        return [groupData, ...older];
      });

      updateSelectedGroup(groupData, isMember);
    };

    const events: [string, (...args: any[]) => void][] = [
      ["message:receive", handleMessageReceive],
      ["message:remove", handleMessageUpdate],
      ["message:edited", handleMessageUpdate],
      ["message:reacted", handleMessageUpdate],
      ["group:created", handleGroupUpsert],
      ["profile:update", handleProfileUpdate],
      ["after:group-update", handleGroupUpsert],
    ];

    if (!messageListeners.current) {
      events.forEach(([event, handler]) => socket.on(event, handler));
      messageListeners.current = true;
    }

    return () => {
      events.forEach(([event, handler]) => socket.off(event, handler));
      messageListeners.current = false;
    };
  }, [socket, queryClient, userInfo?._id]);
};
