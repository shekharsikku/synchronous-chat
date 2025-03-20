import React, { useEffect, useRef, useState, Fragment } from "react";
import { Message, useChatStore } from "@/zustand";
import { useMessages } from "@/hooks/use-messages";
import { RenderDMMessages } from "@/components/chat/render-dm-messages";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import moment from "moment";

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
  const { messages, fetching } = useMessages();
  const { selectedChatType, setMessages } = useChatStore();

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState("");

  useEffect(() => {
    if (messages && messages.length > 0) {
      setMessages(messages);
      setLastMessageId(messages[messages.length - 1]._id);
    }

    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, fetching]);

  return (
    <div className="w-full flex-1 overflow-y-auto scrollbar-hide scroll-smooth px-4">
      {fetching ? (
        <MessageSkeleton />
      ) : (
        <RenderMessages
          messages={messages!}
          lastMessageId={lastMessageId}
          selectedChatType={selectedChatType}
        />
      )}
      {!fetching && <div ref={lastMessageRef} />}
    </div>
  )
}

export { MessageContainer };