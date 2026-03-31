import { create } from "zustand";
import { persist } from "zustand/middleware";
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

  language: "en",
  setLanguage: (language: string) => set({ language }),

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

  groupSettingDialog: false,
  setGroupSettingDialog: (groupSettingDialog: boolean) => set({ groupSettingDialog }),
}));

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      deviceId: null,
      initDeviceId: () => {
        let currentId = get().deviceId;

        if (!currentId) {
          currentId = crypto.randomUUID();
          set({ deviceId: currentId });
        }

        return currentId;
      },

      isAllow: false,
      setIsAllow: (isAllow) => set({ isAllow }),
    }),
    { name: "app_synchronous" }
  )
);
