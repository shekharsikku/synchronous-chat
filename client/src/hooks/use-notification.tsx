import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "@/lib/context";
import { useContacts } from "@/hooks/use-contacts";
import { fetchMessages } from "@/hooks/use-messages";
import { useAuthStore, useChatStore, Message } from "@/zustand";
import notificationIcon from "@/assets/favicon.ico";

export const useNotification = () => {
  const queryClient = useQueryClient();

  const { socket } = useSocket();
  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();
  const { selectedChatData } = useChatStore();

  useEffect(() => {
    const handleMessageNotify = async (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;

      /** Show Browser Notification */
      if (Notification.permission === "granted" && !selectedChatData) {
        const senderName = contacts?.find((contact) => contact._id === chatKey)?.name;

        if (senderName) {
          const notification = new Notification(`You have a message from ${senderName}`, {
            icon: notificationIcon,
          });

          /** Auto-close notification after 5 seconds (optional) */
          setTimeout(() => notification.close(), 5000);
        }
      }

      /** Update message cache in background when any chat is not selected. */
      if (!selectedChatData) {
        /** Check if messages are already cached */
        let cachedMessages = queryClient.getQueryData<Message[]>(["messages", userInfo?._id, chatKey]) || [];

        /** If messages are not cached, fetch from api */
        if (!cachedMessages || cachedMessages.length === 0) {
          try {
            cachedMessages = await queryClient.fetchQuery({
              queryKey: ["messages", userInfo?._id, chatKey],
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
        queryClient.setQueryData<Message[]>(["messages", userInfo?._id, chatKey], (previous = []) => {
          const uniqueMessages = previous.filter((current) => current._id !== message._id);
          return [...uniqueMessages, message];
        });
      }
    };

    socket?.on("message:receive", handleMessageNotify);

    return () => {
      socket?.off("message:receive", handleMessageNotify);
    };
  }, [socket, userInfo?._id, selectedChatData, contacts]);

  return { notification: null };
};
