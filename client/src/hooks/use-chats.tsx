import { useQueryClient } from "@tanstack/react-query";
import { useChatStore, useAuthStore, UserInfo } from "@/zustand";
import { useContacts } from "@/hooks/use-contacts";
import { useEffect } from "react";

export const useChats = () => {
  const queryClient = useQueryClient();

  const { contacts, fetching } = useContacts();
  const { userInfo } = useAuthStore();
  const { selectedChatData, setSelectedChatType, setSelectedChatData, setReplyTo } = useChatStore();

  useEffect(() => {
    if (contacts && selectedChatData?._id) {
      if (contacts.some((obj) => obj._id === selectedChatData._id)) return;

      const selected = {
        ...selectedChatData,
        interaction: new Date().toISOString(),
      };

      const cleaned = Object.fromEntries(
        Object.entries(selected).filter(([key]) => !["setup", "createdAt", "updatedAt", "__v"].includes(key))
      );

      queryClient.setQueryData(["contacts", userInfo?._id], (oldContacts: UserInfo[] | undefined) => [
        ...(oldContacts || []),
        { ...cleaned },
      ]);
    }
  }, [contacts, selectedChatData?._id, queryClient]);

  return { contacts, fetching, selectedChatData, setSelectedChatType, setSelectedChatData, setReplyTo };
};
