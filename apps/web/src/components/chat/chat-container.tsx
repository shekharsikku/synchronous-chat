import { ChatHeader } from "@/components/chat/chat-header";
import { MessageBar } from "@/components/chat/message-bar";
import { MessageContainer } from "@/components/chat/message-container";
import { MessagePreview } from "@/components/chat/message-preview";

const ChatContainer = () => {
  return (
    <div className="fixed top-0 h-full w-full flex flex-col md:static md:flex-1">
      <ChatHeader />
      <MessageContainer />
      <div className="relative">
        <MessagePreview />
        <MessageBar />
      </div>
    </div>
  );
};

export { ChatContainer };
