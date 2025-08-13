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
  };
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: any;
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
  setEditDialog: (editMessageDialog: boolean) => void;
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
}));

export default useChatStore;
