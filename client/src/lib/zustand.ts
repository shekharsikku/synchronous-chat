import { create } from "zustand";

import api from "@/lib/api";

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  gender?: string;
  image?: string;
  bio?: string;
  setup?: boolean;
  createdAt?: any;
  updatedAt?: any;
  __v?: number;
  interaction?: any;
}

export interface Message {
  _id: string;
  sender: string;
  recipient?: string;
  group?: string;
  type: "default" | "edited" | "deleted";
  content?: {
    type: "text" | "file";
    text?: string;
    file?: string;
    reactions?: {
      by: string;
      emoji: string;
    }[];
  };
  reply?: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: any;
}

export interface MessageData {
  type: "text" | "file";
  text?: string;
  file?: string;
  reply?: string;
}

export interface GroupInfo {
  _id?: string;
  name?: string;
  description?: string;
  avatar?: string;
  admin?: string;
  members?: string[];
  createdAt?: any;
  updatedAt?: any;
  __v?: number;
  interaction?: any;
}

export const useAuthStore = create<{
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo | null) => void;

  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;

  isAuthResolved: boolean;
  setIsAuthResolved: (isAuthResolved: boolean) => void;

  getUserInfo: () => Promise<UserInfo | null>;
}>((set) => ({
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
    } catch (_error: any) {
      set({
        userInfo: null,
        isAuthenticated: false,
      });
      return null;
    }
  },
}));

export type ChatType = "contact" | "group" | null;

export const useChatStore = create<{
  selectedChatType: ChatType;
  setSelectedChatType: (selectedChatType: ChatType) => void;

  selectedChatData: any;
  setSelectedChatData: (selectedChatData: any) => void;

  messages: Message[];
  setMessages: (messages: Message[]) => void;

  closeChat: () => void;

  isPartnerTyping: boolean;
  setIsPartnerTyping: (isPartnerTyping: boolean) => void;

  isSoundAllow: boolean;
  setIsSoundAllow: (isSoundAllow: boolean) => void;

  language: string;
  setLanguage: (translateLanguage: string) => void;

  updateMessage: (id: string, updated: any) => void;

  editDialog: boolean;
  setEditDialog: (editDialog: boolean) => void;

  groupDialog: boolean;
  setGroupDialog: (groupDialog: boolean) => void;

  messageForEdit: { id: string; text: string };
  setMessageForEdit: (id: string, text: string) => void;

  replyTo: Message | null;
  setReplyTo: (replyTo: Message | null) => void;

  messageStats: { sent: number; received: number };
  setMessageStats: (messages: Message[], selectedChatId: string) => void;

  allChats: any[];
  setAllChats: (allChats: any[]) => void;
}>((set) => ({
  selectedChatType: null,
  setSelectedChatType: (selectedChatType: ChatType) => set({ selectedChatType }),

  selectedChatData: null,
  setSelectedChatData: (selectedChatData: any) => set({ selectedChatData }),

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

  allChats: [],
  setAllChats: (allChats: any[]) => set({ allChats }),
}));
