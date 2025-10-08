import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatStore, useAuthStore, UserInfo, Message } from "@/zustand";
import { useSocket } from "@/lib/context";
import { useEffect } from "react";
import api from "@/lib/api";

const fetchContacts = async (): Promise<UserInfo[]> => {
  const response = await api.get("/api/contact/fetch");
  return response.data.data;
};

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, setSelectedChatData } = useChatStore();

  /** Query and caching of contacts for 1 hour */
  const { data: contacts, isFetching: fetching } = useQuery({
    queryKey: ["contacts", userInfo?._id],
    queryFn: fetchContacts,
    staleTime: 8 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    enabled: !!userInfo?._id,
  });

  /** Update contact interaction (socket event) */
  useEffect(() => {
    const handleConversationUpdate = (data: UserInfo) => {
      queryClient.setQueryData<UserInfo[]>(["contacts", userInfo?._id], (oldContacts: UserInfo[] | undefined) => {
        if (!oldContacts) return [];

        /** Update interaction time */
        const updatedContacts = oldContacts.map((current) =>
          current._id === data._id ? { ...current, interaction: data.interaction } : current
        );

        /** Sort by latest interaction */
        return updatedContacts.sort((a, b) => new Date(b.interaction).getTime() - new Date(a.interaction).getTime());
      });

      /** Update interacting contact if necessary */
      if (selectedChatData && selectedChatData._id === data._id) {
        setSelectedChatData({
          ...selectedChatData,
          interaction: data.interaction,
        });
      }
    };

    socket?.on("conversation:updated", handleConversationUpdate);

    return () => {
      socket?.off("conversation:updated", handleConversationUpdate);
    };
  }, [socket, userInfo?._id, selectedChatData?._id, queryClient]);

  useEffect(() => {
    const handleMessagesContact = async (message: Message) => {
      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;

      /** Get the latest contacts from the cache */
      const cachedContacts = queryClient.getQueryData<UserInfo[]>(["contacts", userInfo?._id]) || [];

      /** If the user is already in the contact list, don't fetch */
      if (cachedContacts.some((contact) => contact._id === chatKey)) {
        return;
      }

      try {
        /** Use queryClient.fetchQuery to avoid duplicate API requests */
        const newContact = await queryClient.fetchQuery({
          queryKey: ["contact", chatKey] /** Unique query key per user */,
          queryFn: async () => {
            const response = await api.get(`/api/contact/fetch/${chatKey}`);
            return response.data.data;
          },
          staleTime: 60 * 60 * 1000 /** Cache for 1 hour */,
          gcTime: 2 * 60 * 60 * 1000,
        });

        /** Update the contacts list with the new contact & Ensure no duplicates before updating the cache */
        queryClient.setQueryData<UserInfo[]>(["contacts", userInfo?._id], (contacts = []) => {
          const uniqueContacts = contacts.filter((details) => details._id !== newContact._id);
          return [{ ...newContact, interaction: new Date().toISOString() }, ...uniqueContacts];
        });
      } catch (error: any) {
        import.meta.env.DEV && console.error("Failed to fetch contact:", error.message);
      }
    };

    socket?.on("message:receive", handleMessagesContact);

    return () => {
      socket?.off("message:receive", handleMessagesContact);
    };
  }, [socket, userInfo?._id, queryClient]);

  return { contacts, fetching };
};
