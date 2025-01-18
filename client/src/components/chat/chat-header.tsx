import {
  HiOutlineRss,
  HiOutlinePhone,
  HiOutlineXMark,
  HiOutlineLanguage
} from "react-icons/hi2";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { countUserMessages, languageOptions } from "@/utils";
import { useSocket, usePeer } from "@/context";
import { useEffect, useState } from "react";
import { useChatStore } from "@/zustand";
import { useAvatar } from "@/hooks";
import { toast } from "sonner";
import moment from "moment";

const ChatHeader = () => {
  const { selectedChatData, closeChat, isPartnerTyping, messages, language, setLanguage } = useChatStore();
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);
  const [messageStats, setMessageStats] = useState({ sent: 0, received: 0 });
  const userAvatar = useAvatar(selectedChatData);

  useEffect(() => {
    const { sent, received } = countUserMessages(messages, selectedChatData);
    setMessageStats({ sent, received });
  }, [selectedChatData?._id, messages.length]);

  const { localInfo, callingActive, pendingRequest, setPendingRequest, setCallingDialog } = usePeer();
  const { socket, onlineUsers } = useSocket();

  const isCurrentlyOnline = onlineUsers.hasOwnProperty(selectedChatData?._id!);

  const requestVoiceCalling = (userId: string) => {
    /** Streaming details for signaling */
    const callingDetails = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: userId,
      pid: localInfo?.pid,
    }

    if (callingActive || pendingRequest) {
      toast.info("Can't request for another call currently!");
      return;
    }

    setPendingRequest(true);
    socket?.emit("before:callrequest", { callingDetails });
  }

  return (
    <div className="h-bar border-b flex items-center justify-between p-2">
      <div className="h-full w-full rounded flex items-center justify-between px-4 bg-gray-100/80">
        <div className="flex gap-4 items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
                <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2"
                  onClick={() => setOpenUserInfoModal(true)}>
                  <AvatarImage src={userAvatar} alt="profile" className="object-fit h-full w-full" />
                  <AvatarFallback className={`uppercase h-full w-full text-xl border text-center font-medium 
                      transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}>
                    {selectedChatData?.username?.split("").shift() || selectedChatData?.email?.split("").shift()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Info</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Dialog for show user information */}
          <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
            <DialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl bg-white p-8">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              {/* Profile Image */}
              <div className="flex justify-center">
                <img className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-white 
                shadow-lg -mt-20 lg:-mt-24 transition-all"
                  src={userAvatar} alt="User profile"
                />
              </div>
              {/* User Info */}
              <div className="text-center mt-6">
                <h2 className="text-2xl font-bold text-gray-800">{selectedChatData?.name}</h2>
                <p className="text-gray-500">{selectedChatData?.username}</p>
                <p className="mt-2 text-gray-600 text-sm">{selectedChatData?.bio}</p>
              </div>
              {/* User Stats */}
              <div className="flex flex-col justify-around text-gray-800 text-sm mt-4 border-t border-gray-200 pt-4">
                <p className="text-center text-xl mb-4 font-semibold">Message Stats</p>
                <div className="flex justify-evenly">
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.sent}</p>
                    <p className="text-gray-500">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.received}</p>
                    <p className="text-gray-500">Received</p>
                  </div>
                </div>
              </div>
              {/* Last Message Time */}
              <p className="text-center text-sm mt-4 text-gray-500">
                {moment(selectedChatData?.interaction).format("MMMM Do YYYY, h:mm:ss A")}
              </p>
            </DialogContent>
          </Dialog>
          {/* Username and Typing Indicator */}
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedChatData?.name || selectedChatData?.username || selectedChatData?.email}
            </h3>
            {isPartnerTyping && <span className="text-xs">typing...</span>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* Voice Stream */}
          {isCurrentlyOnline && (
            <>
              {callingActive ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="focus:outline-none">
                      <HiOutlineRss size={18} onClick={() => setCallingDialog(true)}
                        className="text-neutral-600 border-none outline-none transition-all duration-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-neutral-700 font-medium">Call Info</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="focus:outline-none">
                      <HiOutlinePhone size={18} onClick={() => requestVoiceCalling(selectedChatData?._id!)}
                        className="text-neutral-600 border-none outline-none transition-all duration-300" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-neutral-700 font-medium">Voice Call</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          )}
          {/* Translate Language */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <DropdownMenuTrigger asChild>
                  <TooltipTrigger className="focus:outline-none">
                    <HiOutlineLanguage size={18}
                      className="text-neutral-600 border-none outline-none transition-all duration-300" />
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent>
                  <span className="text-neutral-700 font-medium">Translate</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-36 mt-4 mr-6">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-52 overflow-y-auto scrollbar-hide">
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage} className="space-y-1">
                  {languageOptions.map((option) => (
                    <DropdownMenuRadioItem key={option.code} value={option.code}
                      className={`flex items-center justify-start gap-2 text-sm capitalize cursor-pointer rounded-md 
                    ${option.code === language && "bg-gray-100"}`}>
                      {option.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Close Chat */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
                <HiOutlineXMark size={20} onClick={closeChat}
                  className="text-neutral-600 border-none outline-none transition-all duration-300" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Close</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export { ChatHeader };