import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useMemo } from "react";

import api from "@/lib/api";
import { useSocket } from "@/lib/context";
import { contactQuery } from "@/lib/utils";
import { useChatStore, useAuthStore } from "@/lib/zustand";

import type { UserInfo, Message, GroupInfo } from "@/lib/zustand";

interface InteractionDetails {
  _id: string;
  type: "contact" | "group";
  interaction: string;
}

const fetchContacts = async (): Promise<UserInfo[]> => {
  const response = await api.get("/api/contact/fetch");
  return response.data.data;
};

const fetchGroups = async (): Promise<GroupInfo[]> => {
  const response = await api.get("/api/group/fetch");
  return response.data.data;
};

const updateSortInteraction = (older: UserInfo[] | GroupInfo[], details: InteractionDetails) => {
  if (older[0]?._id === details._id) {
    return [{ ...older[0], interaction: details.interaction }, ...older.slice(1)];
  }

  const index = older.findIndex((cur) => cur._id === details._id);

  if (index === -1) return older;

  const current = { ...older[index], interaction: details.interaction };

  return [current, ...older.slice(0, index), ...older.slice(index + 1)];
};

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { socket } = useSocket();
  const { userInfo } = useAuthStore();
  const { selectedChatData, setSelectedChatData } = useChatStore();

  /** Query key for both contacts and groups */
  const queryMap = useMemo(() => {
    return {
      contact: ["contacts", userInfo?._id] as const,
      group: ["groups", userInfo?._id] as const,
    };
  }, [userInfo?._id]);

  /** Query and caching of contacts and groups for 8 hour */
  const queryOptions = useMemo(() => {
    return {
      staleTime: 8 * 60 * 60 * 1000,
      gcTime: 12 * 60 * 60 * 1000,
      enabled: !!userInfo?._id,
    };
  }, [userInfo?._id]);

  const { data: contacts, isFetching: ctsFetching } = useQuery({
    queryKey: queryMap["contact"],
    queryFn: fetchContacts,
    ...queryOptions,
  });

  const { data: groups, isFetching: gpsFetching } = useQuery({
    queryKey: queryMap["group"],
    queryFn: fetchGroups,
    ...queryOptions,
  });

  const updateChatInteraction = useEffectEvent((details: InteractionDetails) => {
    if (selectedChatData && selectedChatData._id === details._id) {
      setSelectedChatData({
        ...selectedChatData,
        interaction: details.interaction,
      });
    }
  });

  /** Update contact interaction (socket event) */
  useEffect(() => {
    const handleConversationUpdate = (details: InteractionDetails) => {
      if (!userInfo?._id) return;

      const queryKey = queryMap[details.type];

      if (!queryKey) return;

      queryClient.setQueryData<UserInfo[] | GroupInfo[]>(queryKey, (older = []) => {
        return updateSortInteraction(older, details);
      });

      /** Update interacting contact if necessary */
      updateChatInteraction(details);
    };

    socket?.on("conversation:updated", handleConversationUpdate);

    return () => {
      socket?.off("conversation:updated", handleConversationUpdate);
    };
  }, [socket, userInfo?._id, queryMap, queryClient]);

  useEffect(() => {
    const handleMessagesContact = async (message: Message) => {
      if (message.group) return;

      const chatKey = userInfo?._id === message.sender ? message.recipient : message.sender;

      /** Get the latest contacts from the cache */
      const cachedContacts = queryClient.getQueryData<UserInfo[]>(["contacts", userInfo?._id]) ?? [];

      /** If the user is already in the contact list, don't fetch */
      if (cachedContacts.some((contact) => contact._id === chatKey)) return;

      try {
        /** Use queryClient.fetchQuery to avoid duplicate API requests */
        const newContact = await queryClient.fetchQuery(
          contactQuery(chatKey!, {
            staleTime: 60 * 60 * 1000 /** Cache for 1 hour */,
            gcTime: 2 * 60 * 60 * 1000,
          })
        );

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

  return { contacts, groups, fetching: ctsFetching || gpsFetching };
};
