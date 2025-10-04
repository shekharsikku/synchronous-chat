import React, { useEffect, useRef, useState, RefObject } from "react";
import { Message, useChatStore } from "@/zustand";
import { useMessages } from "@/hooks/use-messages";
import { RenderDMMessages } from "@/components/chat/render-dm-messages";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import moment from "moment";

const RenderMessages = React.memo(
  ({
    messages,
    lastMessageId,
    selectedChatType,
    messageRefs,
  }: {
    messages: Message[];
    lastMessageId: string;
    selectedChatType: string;
    messageRefs: RefObject<Record<string, HTMLDivElement | null>>;
  }) => {
    let lastDate = "";

    const scrollToMessage = (id: string) => {
      const element = messageRefs.current[id];

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("shake");
        setTimeout(() => element.classList.remove("shake"), 1500);
      }
    };

    return messages.map((message) => {
      const messageDate = moment(message.createdAt).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <div
          key={message._id}
          ref={(element) => {
            if (element) messageRefs.current[message._id] = element;
          }}
          className="relative"
        >
          {showDate && (
            <div className="text-center text-gray-500 dark:text-gray-100 py-4">
              {moment(message.createdAt).isSame(moment(), "day")
                ? "Today"
                : moment(message.createdAt).isSame(moment().subtract(1, "day"), "day")
                  ? "Yesterday"
                  : moment(message.createdAt).format("LL")}
            </div>
          )}
          {selectedChatType === "contact" && (
            <RenderDMMessages message={message} lastMessageId={lastMessageId} scrollToMessage={scrollToMessage} />
          )}
        </div>
      );
    });
  }
);

const MessageContainer = () => {
  const { messages, fetching } = useMessages();
  const { selectedChatType, setMessages } = useChatStore();

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [skeletonCount, setSkeletonCount] = useState(9);
  const [lastMessageId, setLastMessageId] = useState("");
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (messages && messages.length > 0) {
      setMessages(messages);
      setLastMessageId(messages[messages.length - 1]._id);
    }

    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, fetching]);

  useEffect(() => {
    const scrollHeight = scrollContainerRef.current?.clientHeight ?? 800;
    const scrollCount = Math.ceil(scrollHeight / 90);
    setSkeletonCount(scrollCount);
  }, [scrollContainerRef]);

  return (
    <section ref={scrollContainerRef} className="w-full flex-1 overflow-y-auto scrollbar-hide scroll-smooth px-4">
      {fetching ? (
        <MessageSkeleton count={skeletonCount} />
      ) : (
        <RenderMessages
          messages={messages!}
          lastMessageId={lastMessageId}
          selectedChatType={selectedChatType}
          messageRefs={messageRefs}
        />
      )}
      {!fetching && <div ref={lastMessageRef} />}
    </section>
  );
};

export { MessageContainer };
