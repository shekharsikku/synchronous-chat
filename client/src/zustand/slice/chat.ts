import { create } from "zustand";
import { UserInfo } from "./auth";

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  type: "text" | "file";
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
}));

export default useChatStore;
