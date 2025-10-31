import { useQueryState } from "nuqs";
import { useEffect, useEffectEvent } from "react";

import { ContactsContainer, EmptyChatContainer, ChatContainer, DraggableVideo } from "@/components/chat";
import { usePeer } from "@/lib/context";
import { useChatStore } from "@/lib/zustand";

const Chat = () => {
  const [lastChatUser, setLastChatUser] = useQueryState("chat", { defaultValue: "" });
  const { selectedChatData } = useChatStore();
  const { mediaType, callingActive } = usePeer();

  const handleLastSelectedChat = useEffectEvent((selectedChat: any) => {
    if (selectedChatData) setLastChatUser(selectedChat._id!);
  });

  useEffect(() => {
    handleLastSelectedChat(selectedChatData);
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
