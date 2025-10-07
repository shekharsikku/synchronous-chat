import { create } from "zustand";
import { UserInfo } from "./auth";

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
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

const useChatStore = create<{
  selectedChatType: string;
  setSelectedChatType: (selectedChatType: string) => void;

  selectedChatData: UserInfo | null;
  setSelectedChatData: (selectedChatData: UserInfo) => void;

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

  replyTo: Message | null;
  setReplyTo: (replyTo: Message | null) => void;

  listenerActive: boolean;
  setListenerActive: (listenerActive: boolean) => void;

  messageStats: { sent: number; received: number };
  setMessageStats: (messages: Message[], selectedChatId: string) => void;
}>((set) => ({
  selectedChatType: "",
  setSelectedChatType: (selectedChatType: string) => set({ selectedChatType }),

  selectedChatData: null,
  setSelectedChatData: (selectedChatData: UserInfo) => set({ selectedChatData }),

  messages: [],
  setMessages: (messages: Message[]) => set({ messages }),

  closeChat: () =>
    set({
      selectedChatType: "",
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

  replyTo: null,
  setReplyTo: (replyTo: Message | null) => set({ replyTo }),

  listenerActive: false,
  setListenerActive: (listenerActive: boolean) => set({ listenerActive }),

  messageStats: { sent: 0, received: 0 },
  setMessageStats: (messages: Message[], selectedChatId: string) => {
    let sent = 0;
    let received = 0;

    for (const msg of messages) {
      if (msg.sender === selectedChatId) received++;
      else if (msg.recipient === selectedChatId) sent++;
    }

    set({ messageStats: { sent, received } });
  },
}));

export default useChatStore;
