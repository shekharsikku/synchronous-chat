import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/zustand";
import { useListenMessages } from "@/hooks";
import { RenderDMMessages } from "./render-dm-messages";
import { MessageSkeleton } from "./message-skeleton";
import moment from "moment";
import api from "@/lib/api";

const MessageContainer = () => {
  useListenMessages();
  const { selectedChatType, selectedChatData, messages, setMessages } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  const getMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/message/${selectedChatData?._id}`);
      setMessages(response.data.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChatData?._id) getMessages();
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

  const RenderMessages = () => {
    let lastDate = "";

    return messages.map((message) => {
      const messageDate = moment(message.createdAt).format("YYYY-MM-DD");
      const showDate = messageDate !== lastDate;
      lastDate = messageDate;
      return (
        <div key={message._id} className="">
          {showDate && (
            <div className="text-center text-gray-500 my-2 md:my-4">
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
        </div>
      )
    })
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide py-2 md:p-4 px-6 w-full outline-none">
      {isLoading ? <MessageSkeleton /> : <RenderMessages />}
      {!isLoading && <div ref={lastMessageRef} />}
    </div>
  )
}

export { MessageContainer };