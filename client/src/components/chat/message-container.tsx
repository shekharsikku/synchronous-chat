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
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useMessages();
  const { selectedChatData, selectedChatType, setMessages, replyTo, listenerActive, setMessageStats } = useChatStore();

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [skeletonCount, setSkeletonCount] = useState(9);
  const [scrollButton, setScrollButton] = useState(true);

  const scrollLockedRef = useRef(false);
  const initialFetchRef = useRef(false);
  const prevMsgCountRef = useRef(0);
  const prevChatIdRef = useRef<string | null>(null);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
    delay: 200,
  });

  const scrollBottom = (smooth = true) => {
    lastMessageRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
      block: "end",
    });
  };

  /** Flatten + dedupe messages */
  const messages: Message[] = React.useMemo(() => {
    if (!data?.pages) return [];

    const depth = data.pageParams.length;
    const flattened = [...data.pages].reverse().flat(depth);

    /* Optional: dedupe by _id while preserving order */
    const seen = new Set<string>();

    return flattened.filter((msg) => {
      if (seen.has(msg._id)) return false;
      seen.add(msg._id);
      return true;
    });
  }, [data?.pages]);

  /** Skeleton count — only calc once */
  useEffect(() => {
    const scrollHeight = scrollSectionRef.current?.clientHeight ?? 800;
    setSkeletonCount(Math.ceil(scrollHeight / 90));

    const handleKeyDown = (event: KeyboardEvent) => {
      const element = scrollSectionRef.current;
      if (!element) return;

      switch (event.key) {
        case "PageDown":
          element.scrollBy({ top: 200, behavior: "smooth" });
          break;
        case "PageUp":
          element.scrollBy({ top: -200, behavior: "smooth" });
          break;
        case "Home":
          element.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "End":
          element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /** Scroll to bottom after first load */
  useEffect(() => {
    if (!isPending && !initialFetchRef.current) {
      requestAnimationFrame(() => {
        scrollSectionRef.current?.scrollTo({
          top: scrollSectionRef.current.scrollHeight,
          behavior: "instant",
        });
      });
      initialFetchRef.current = true;
    }
  }, [isPending]);

  /** Reset when chat changes */
  useEffect(() => {
    if (selectedChatData?._id !== prevChatIdRef.current) {
      prevMsgCountRef.current = 0;
      prevChatIdRef.current = selectedChatData?._id ?? null;
    }

    if (messages && messages.length === prevMsgCountRef.current) {
      setMessages(messages);
      return;
    }

    if (messages && messages.length > prevMsgCountRef.current) {
      setMessages(messages);
      setMessageStats(messages, selectedChatData?._id!);
    }

    if (messages && messages.length > prevMsgCountRef.current && !scrollLockedRef.current) {
      requestAnimationFrame(() => {
        scrollSectionRef.current?.scrollTo({
          top: scrollSectionRef.current.scrollHeight,
          behavior: listenerActive ? "smooth" : "instant",
        });
      });

      setScrollButton(false);
      initialFetchRef.current = false;

      setTimeout(() => {
        setScrollButton(true);
        initialFetchRef.current = true;
      }, 2000);
    }

    prevMsgCountRef.current = messages.length;
  }, [selectedChatData?._id, messages, listenerActive]);

  /** Handle scroll fetching */
  useEffect(() => {
    const scrollContainer = scrollSectionRef.current;
    if (!scrollContainer || !hasNextPage) return;

    /* When top sentinel visible → load older messages */
    const handleScrollFetch = async () => {
      if (!initialFetchRef.current || isFetchingNextPage) return;

      /* Calculate how far the user has scrolled up (0 = top, 1 = bottom) */
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPosition = scrollTop / (scrollHeight - clientHeight);

      /* Example: fetch when scrolled above 75% (i.e., closer to top) */
      if (scrollPosition < 0.25 && !scrollLockedRef.current) {
        scrollLockedRef.current = true;
        await fetchNextPage();
        setTimeout(() => (scrollLockedRef.current = false), 2000);
      }
    };

    scrollContainer.addEventListener("scroll", handleScrollFetch);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScrollFetch);
    };
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <>
      <section ref={scrollSectionRef} className="w-full flex-1 overflow-y-auto scroll-smooth px-4 message-scrollbar">
        {isPending ? (
          <MessageSkeleton count={skeletonCount} />
        ) : (
          <RenderMessages messages={messages!} selectedChatType={selectedChatType} messageRefs={messageRefs} />
        )}
        {!isPending && <div ref={mergeRefs(lastMessageRef, inViewRef)} className="h-0.5 bg-transparent" />}
      </section>

      {!inView && scrollButton && !replyTo && (
        <Button
          variant="outline"
          size="icon"
          className="absolute z-50 bottom-24 right-6 duration-0 text-neutral-600 dark:text-neutral-100"
          onClick={() => scrollBottom()}
        >
          <HiOutlineArrowSmallDown size={20} />
        </Button>
      )}
    </>
  );
};

export { MessageContainer };
