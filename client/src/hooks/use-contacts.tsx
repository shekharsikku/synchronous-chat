import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useChatStore, useAuthStore } from "@/zustand";
import { useSocket } from "@/lib/context";
import { UserInfo } from "@/zustand/auth";
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
    staleTime: 4 * 15 * 60 * 1000,
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
        return updatedContacts.sort(
          (a, b) => new Date(b.interaction).getTime() - new Date(a.interaction).getTime()
        );
      });

      /** Update interacting contact if necessary */
      if (selectedChatData && selectedChatData._id === data._id) {
        setSelectedChatData({ ...selectedChatData, interaction: data.interaction });
      }
    };

    socket?.on("conversation:updated", handleConversationUpdate);
    return () => {
      socket?.off("conversation:updated", handleConversationUpdate);
    };
  }, [socket, userInfo?._id, selectedChatData, queryClient]);

  return { contacts, fetching };
};
