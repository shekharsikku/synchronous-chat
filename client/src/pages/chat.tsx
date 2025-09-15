import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useChatStore } from "@/zustand";
import { usePeer } from "@/lib/context";
import { ContactsContainer, EmptyChatContainer, ChatContainer, DraggableVideo } from "@/components/chat";

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastChatUser, setLastChatUser] = useState<string | null>(null);
  const { selectedChatData } = useChatStore();
  const { mediaType, callingActive } = usePeer();

  useEffect(() => {
    setLastChatUser(searchParams.get("user"));
  }, [searchParams]);

  useEffect(() => {
    if (selectedChatData) setSearchParams({ user: selectedChatData.username! });
  }, [selectedChatData]);

  return (
    <main className="h-screen w-screen flex overflow-hidden">
      <div className="h-full w-full flex">
        <ContactsContainer lastChatUser={lastChatUser} setSearchParams={setSearchParams} />
        {selectedChatData ? <ChatContainer /> : <EmptyChatContainer />}
      </div>
      {mediaType === "video" && callingActive && <DraggableVideo />}
    </main>
  );
};

export default Chat;
