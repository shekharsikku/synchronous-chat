import React, { useEffect, useRef, useState, Fragment } from "react";
import { useChatStore } from "@/zustand";
import { useListenMessages } from "@/hooks";
import { RenderDMMessages } from "./render-dm-messages";
import { MessageSkeleton } from "./message-skeleton";
import { Message } from "@/zustand/slice/chat";
import { toast } from "sonner";
import moment from "moment";
import api from "@/lib/api";

const RenderMessages = React.memo(({
  messages, lastMessageId, selectedChatType
}: {
  messages: Message[], lastMessageId: string, selectedChatType: string
}) => {
  let lastDate = "";

  return messages.map((message) => {
    const messageDate = moment(message.createdAt).format("YYYY-MM-DD");
    const showDate = messageDate !== lastDate;
    lastDate = messageDate;

    return (
      <Fragment key={message._id}>
        {showDate && (
          <div className="text-center text-gray-500 py-4">
            {moment(message.createdAt).isSame(moment(), "day") ? (
              "Today"
            ) : moment(message.createdAt).isSame(moment().subtract(1, 'day'), 'day') ? (
              "Yesterday"
            ) : (
              moment(message.createdAt).format("LL"))}
          </div>
        )}
        {selectedChatType === "contact" && <RenderDMMessages
          message={message} lastMessageId={lastMessageId} />}
      </Fragment>
    )
  })
});

const MessageContainer = () => {
  useListenMessages();
  const { selectedChatType, selectedChatData, messages, setMessages } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  const getMessages = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/message/${userId}`);
      setMessages(response.data.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChatData?._id) {
      getMessages(selectedChatData._id);
    }
  }, [selectedChatData?._id]);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState("");

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageId(messages[messages.length - 1]._id);
    }

    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isLoading]);

  return (
    <div className="w-full flex-1 overflow-y-auto scrollbar-hide scroll-smooth px-4">
      {isLoading ? (
        <MessageSkeleton />
      ) : (
        <RenderMessages
          messages={messages}
          lastMessageId={lastMessageId}
          selectedChatType={selectedChatType}
        />
      )}
      {!isLoading && <div ref={lastMessageRef} />}
    </div>
  )
}

export { MessageContainer };