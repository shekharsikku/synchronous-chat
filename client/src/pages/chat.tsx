import { useEffect } from "react";
import { useQueryState } from "nuqs";
import { useChatStore } from "@/zustand";
import { usePeer } from "@/lib/context";
import { ContactsContainer, EmptyChatContainer, ChatContainer, DraggableVideo } from "@/components/chat";

const Chat = () => {
  const [lastChatUser, setLastChatUser] = useQueryState("user", { defaultValue: "" });
  const { selectedChatData, selectedChatType } = useChatStore();
  const { mediaType, callingActive } = usePeer();

  useEffect(() => {
    if (selectedChatData && selectedChatType === "contact") setLastChatUser(selectedChatData.username!);
  }, [selectedChatData]);

  return (
    <main className="h-screen w-screen flex overflow-hidden">
      <div className="h-full w-full flex">
        <ContactsContainer lastChatUser={lastChatUser} setLastChatUser={setLastChatUser} />
        {selectedChatData ? <ChatContainer /> : <EmptyChatContainer />}
      </div>
      {mediaType === "video" && callingActive && <DraggableVideo />}
    </main>
  );
};

export default Chat;
