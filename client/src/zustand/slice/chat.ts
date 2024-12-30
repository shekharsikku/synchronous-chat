import { create } from "zustand";
import { UserInfo } from "./auth";

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  type: "text" | "file" | "deleted";
  text?: string;
  file?: string;
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
}>((set) => ({
  selectedChatType: "",
  setSelectedChatType: (selectedChatType: string) => set({ selectedChatType }),

  selectedChatData: null,
  setSelectedChatData: (selectedChatData: UserInfo) =>
    set({ selectedChatData }),

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
}));

export default useChatStore;
