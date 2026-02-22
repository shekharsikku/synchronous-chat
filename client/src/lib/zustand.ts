import { create } from "zustand";

import api from "@/lib/api";

export const useAuthStore = create<AuthStore>((set) => ({
  userInfo: null,
  setUserInfo: (userInfo: UserInfo | null) => set({ userInfo }),

  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),

  isAuthResolved: false,
  setIsAuthResolved: (isAuthResolved: boolean) => set({ isAuthResolved }),

  getUserInfo: async () => {
    try {
      const response = await api.get("/api/user/user-information");
      const result = response.data.data;
      set({
        userInfo: result,
        isAuthenticated: true,
      });
      return result;
    } catch {
      set({
        userInfo: null,
        isAuthenticated: false,
      });
      return null;
    }
  },
}));

export const useChatStore = create<ChatStore>((set) => ({
  selectedChatType: null,
  setSelectedChatType: (selectedChatType: ChatType) => set({ selectedChatType }),

  selectedChatData: null,
  setSelectedChatData: (selectedChatData: UserInfo | GroupInfo) => set({ selectedChatData }),

  messages: [],
  setMessages: (messages: Message[]) => set({ messages }),

  closeChat: () =>
    set({
      selectedChatType: null,
      selectedChatData: null,
      replyTo: null,
      messages: [],
    }),

  isPartnerTyping: false,
  setIsPartnerTyping: (isPartnerTyping: boolean) => set({ isPartnerTyping }),

  isSoundAllow: true,
  setIsSoundAllow: (isSoundAllow: boolean) => set({ isSoundAllow }),

  language: "en",
  setLanguage: (language: string) => set({ language }),

  updateMessage: (id: string, updated: any) =>
    set((state) => ({
      messages: state.messages.map((message) => (message._id === id ? { ...message, ...updated } : message)),
    })),

  editDialog: false,
  setEditDialog: (editDialog: boolean) => set({ editDialog }),

  groupDialog: false,
  setGroupDialog: (groupDialog: boolean) => set({ groupDialog }),

  messageForEdit: { id: "", text: "" },
  setMessageForEdit: (id: string, text: string) => {
    set({ messageForEdit: { id, text } });
  },

  replyTo: null,
  setReplyTo: (replyTo: Message | null) => set({ replyTo }),

  messageStats: { sent: 0, received: 0 },
  setMessageStats: (messages: Message[], userId: string) => {
    let sent = 0;
    let received = 0;

    for (const msg of messages) {
      if (msg.sender === userId) {
        sent++;
      } else {
        received++;
      }
    }

    set({ messageStats: { sent, received } });
  },
}));
