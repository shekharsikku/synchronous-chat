import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import api from "@/lib/api";
import { useChatStore, useAuthStore } from "@/lib/zustand";

export const useMessages = () => {
  const { userInfo } = useAuthStore();
  const { selectedChatData, selectedChatType } = useChatStore();

  const queryKey = useMemo(
    () => ["messages", userInfo?._id!, selectedChatData?._id!],
    [userInfo?._id, selectedChatData?._id]
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: pageParam ? "10" : "20",
      });

      if (pageParam) params.append("before", pageParam);
      if (selectedChatType === "group") params.append("group", "true");

      const url = `/api/message/fetch/${selectedChatData?._id}?${params.toString()}`;
      const response = await api.get(url);
      return response.data.data;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.length) return undefined;
      return lastPage[0].createdAt;
    },
    refetchOnWindowFocus: false,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
    enabled: !!selectedChatData?._id,
  });

  return infiniteQuery;
};
