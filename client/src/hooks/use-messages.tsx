import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useChatStore, useAuthStore } from "@/zustand";

import api from "@/lib/api";

export const useMessages = () => {
  const { userInfo } = useAuthStore();
  const { selectedChatData } = useChatStore();

  const queryKey = useMemo(
    () => ["messages", userInfo?._id!, selectedChatData?._id!],
    [userInfo?._id, selectedChatData?._id]
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: queryKey,
    queryFn: async ({ pageParam }) => {
      const limit = pageParam ? 10 : 20;
      const before = pageParam ? `&before=${pageParam}` : "";
      const url = `/api/message/fetch/${selectedChatData?._id}?limit=${limit}${before}`;
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
