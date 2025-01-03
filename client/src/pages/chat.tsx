import { useChatStore } from "@/zustand";
import { ContactsContainer, EmptyChatContainer, ChatContainer } from "@/components/chat";

const Chat = () => {
  const { selectedChatData } = useChatStore();

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <div className="h-full w-full md:hidden">
        {selectedChatData ? <ChatContainer /> : <ContactsContainer />}
      </div>
      <div className="h-full w-full hidden md:flex">
        <ContactsContainer />
        {selectedChatData ? <ChatContainer /> : <EmptyChatContainer />}
      </div>
    </div>
  )
}

export default Chat;