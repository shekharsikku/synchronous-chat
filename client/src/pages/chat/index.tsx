import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useChatStore } from "@/zustand";
import { ContactsContainer, EmptyChatContainer, ChatContainer } from "@/components/chat";

const Chat = () => {
  const navigate = useNavigate();
  const { userInfo, isAuthenticated } = useAuthStore();
  const { selectedChatType, selectedChatData } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && !userInfo?.setup) {
      navigate("/profile")
    }
  }, [navigate, userInfo, isAuthenticated]);

  return (
    <main className="h-[100vh] flex overflow-hidden">
      <div className="h-full w-full md:hidden">
        {!selectedChatData ? <ContactsContainer /> : <ChatContainer />}
      </div>
      <div className="h-full w-full hidden md:flex">
        <ContactsContainer />
        {!selectedChatType ? <EmptyChatContainer /> : <ChatContainer />}
      </div>
    </main>
  )
}

export default Chat;