import { ChatHeader } from "./chat-header";
import { MessageContainer } from "./message-container";
import { MessageBar } from "./message-bar";

const ChatContainer = () => {
  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] flex flex-col md:static md:flex-1">
      <ChatHeader />
      <MessageContainer />
      <MessageBar />
    </div>
  )
}

export { ChatContainer };