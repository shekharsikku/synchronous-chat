import { useQueryClient } from "@tanstack/react-query";
import { useChatStore, useAuthStore, UserInfo } from "@/zustand";
import { useContacts } from "@/hooks/use-contacts";
import { useEffect } from "react";

export const useSelectedChat = () => {
  const queryClient = useQueryClient();

  const { contacts } = useContacts();
  const { userInfo } = useAuthStore();
  const { selectedChatData } = useChatStore();

  useEffect(() => {
    if (contacts && selectedChatData) {
      const exists = contacts.some((obj) => obj._id === selectedChatData._id);

      if (!exists) {
        const selected = {
          ...selectedChatData,
          interaction: new Date().toISOString(),
        };

        const cleaned = Object.fromEntries(
          Object.entries(selected).filter(
            ([key]) => !["setup", "createdAt", "updatedAt", "__v"].includes(key)
          )
        );

        queryClient.setQueryData(
          ["contacts", userInfo?._id],
          (oldContacts: UserInfo[] | undefined) => [
            ...(oldContacts || []),
            { ...cleaned },
          ]
        );
      }
    }
  }, [contacts, selectedChatData, queryClient]);

  return { selectedChatData };
};
