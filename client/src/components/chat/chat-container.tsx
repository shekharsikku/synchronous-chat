import { ChatHeader } from "./chat-header";
import { MessageContainer } from "./message-container";
import { MessageBar } from "./message-bar";
import { MessagePreview } from "./message-preview";

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
