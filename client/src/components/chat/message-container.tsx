import React, { useEffect, useRef, useState, RefObject } from "react";
import { useInView } from "react-intersection-observer";
import { HiOutlineArrowSmallDown } from "react-icons/hi2";
import { Message, useChatStore } from "@/zustand";
import { mergeRefs } from "@/lib/utils";
import { useMessages } from "@/hooks/use-messages";
import { Button } from "@/components/ui/button";
import { RenderDMMessages } from "@/components/chat/render-dm-messages";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import moment from "moment";

const RenderMessages = React.memo(
  ({
    messages,
    selectedChatType,
    messageRefs,
  }: {
    messages: Message[];
    selectedChatType: string;
    messageRefs: RefObject<Record<string, HTMLDivElement | null>>;
  }) => {
    let lastDate = "";

    const scrollMessage = (id: string) => {
      const element = messageRefs.current[id];

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
          {selectedChatType === "contact" && <RenderDMMessages message={message} scrollMessage={scrollMessage} />}
        </div>
      );
    });
  }
);

const MessageContainer = () => {
  const { messages, fetching } = useMessages();
  const { selectedChatData, selectedChatType, setMessages, replyTo } = useChatStore();

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [skeletonCount, setSkeletonCount] = useState(9);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showScrollButton, setShowScrollButton] = useState(true);
  const prevLength = useRef(0);
  const prevChatId = useRef<string | null>(null);

  const scrollLast = (delay: number) => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, delay);
  };

  useEffect(() => {
    if (selectedChatData?._id !== prevChatId.current) {
      prevLength.current = 0;
      prevChatId.current = selectedChatData?._id ?? null;
    }

    if (messages && messages.length > 0) setMessages(messages);

    if (prevLength.current === 0 || (messages && messages.length > prevLength.current)) {
      scrollLast(100);
      setShowScrollButton(false);
      setTimeout(() => setShowScrollButton(true), 2000);
    }

    prevLength.current = messages?.length ?? 0;
  }, [messages, fetching, selectedChatData?._id]);

  useEffect(() => {
    const scrollHeight = scrollContainerRef.current?.clientHeight ?? 800;
    const scrollCount = Math.ceil(scrollHeight / 90);
    setSkeletonCount(scrollCount);
  }, [scrollContainerRef]);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
    delay: 200,
  });

  return (
    <>
      <section ref={scrollContainerRef} className="w-full flex-1 overflow-y-auto scrollbar-hide scroll-smooth px-4">
        {fetching ? (
          <MessageSkeleton count={skeletonCount} />
        ) : (
          <RenderMessages messages={messages!} selectedChatType={selectedChatType} messageRefs={messageRefs} />
        )}
        {!fetching && <div ref={mergeRefs(lastMessageRef, inViewRef)} className="h-0.5 bg-transparent" />}
      </section>

      {!inView && showScrollButton && !replyTo && (
        <Button
          variant="outline"
          size="icon"
          className="absolute z-50 bottom-24 right-6 duration-0 text-neutral-600 dark:text-neutral-100"
          onClick={() => scrollLast(200)}
        >
          <HiOutlineArrowSmallDown size={20} />
        </Button>
      )}
    </>
  );
};

export { MessageContainer };
