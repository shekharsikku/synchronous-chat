import { useChatStore } from "@/zustand";
import { usePeer } from "@/lib/context";
import {
  ContactsContainer,
  EmptyChatContainer,
  ChatContainer,
  DraggableVideo,
} from "@/components/chat";

const Chat = () => {
  const { selectedChatData } = useChatStore();
  const { mediaType, callingActive } = usePeer();

  return (
    <main className="h-screen w-screen flex overflow-hidden">
      <div className="h-full w-full flex">
        <ContactsContainer />
        {selectedChatData ? <ChatContainer /> : <EmptyChatContainer />}
      </div>
      {mediaType === "video" && callingActive && <DraggableVideo />}
    </main>
  );
};

export default Chat;
