type TimeStamp = Date | string;

interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
  gender?: "Male" | "Female" | "Other";
  image?: string;
  bio?: string;
  setup?: boolean;
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
  interaction?: TimeStamp;
}

interface GroupInfo {
  _id?: string;
  name?: string;
  description?: string;
  avatar?: string;
  admin?: string;
  members?: string[];
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
  interaction?: TimeStamp;
}

interface Message {
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
  deletedAt?: TimeStamp;
  createdAt?: TimeStamp;
  updatedAt?: TimeStamp;
  __v?: number;
}

interface MessageData {
  type: "text" | "file";
  text?: string;
  file?: string;
  reply?: string;
}

interface AuthStore {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  isAuthResolved: boolean;
  setIsAuthResolved: (isAuthResolved: boolean) => void;
  getUserInfo: () => Promise<UserInfo | null>;
}

type ChatType = "contact" | "group" | null;
type AllChatItem = (UserInfo & { type: "contact" }) | (GroupInfo & { type: "group" });

interface ChatStore {
  selectedChatType: ChatType;
  setSelectedChatType: (selectedChatType: ChatType) => void;
  selectedChatData: any;
  setSelectedChatData: (selectedChatData: UserInfo | GroupInfo) => void;
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
  groupSettingDialog: boolean;
  setGroupSettingDialog: (editDialog: boolean) => void;
}

type DetailsState = {
  name: string;
  description: string;
};

type MemberUpdateState = {
  add: string[];
  remove: string[];
};

interface GroupMemberManage {
  contacts?: UserInfo[];
  getMemberStatus: (userId: string) => "none" | "member" | "remove" | "add";
  toggleMember: (userId: string) => void;
  tooltipMap: {
    member: string;
    remove: string;
    add: string;
    none: string;
  };
}
