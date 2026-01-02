import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  HiOutlinePhone,
  HiOutlineXMark,
  HiOutlineLanguage,
  HiOutlineVideoCamera,
  HiOutlineShare,
} from "react-icons/hi2";
import { LuAudioLines } from "react-icons/lu";
import { toast } from "sonner";

import groupAvatar from "@/assets/group-avatar.webp";
import { GroupMembersList } from "@/components/chat/member-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSocket, usePeer } from "@/lib/context";
import { cn, languageOptions, getAvatar, formatUtcTimestamp } from "@/lib/utils";
import { useChatStore } from "@/lib/zustand";

const ChatHeader = () => {
  const { selectedChatData, selectedChatType, closeChat, isPartnerTyping, language, setLanguage, messageStats } =
    useChatStore();
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);
  const [openGroupInfoModal, setOpenGroupInfoModal] = useState(false);
  const userAvatar = getAvatar(selectedChatData);

  useHotkeys("ctrl+q", () => closeChat(), {
    enabled: !!selectedChatData,
    enableOnFormTags: ["input"],
  });

  const {
    localInfo,
    callingActive,
    pendingRequest,
    setPendingRequest,
    setCallingDialog,
    callingInfo,
    setMediaType,
    setOpenPeerShareModal,
  } = usePeer();
  const { socket, onlineUsers } = useSocket();

  const isCurrentlyOnline = onlineUsers.hasOwnProperty(selectedChatData?._id!);

  const requestVoiceCalling = (userId: string, type: "audio" | "video") => {
    if (callingActive || pendingRequest) {
      toast.info("Can't request for another call currently!");
      return;
    }

    /** Local user details for call request */
    const callingDetails = {
      from: localInfo?.uid,
      name: localInfo?.name,
      to: userId,
      pid: localInfo?.pid,
      type: type,
    };

    setMediaType(type);
    setPendingRequest(true);
    socket?.emit("before:call-request", { callingDetails });
  };

  return (
    <header className="h-bar border-b flex items-center justify-between p-2">
      <div className="h-full w-full rounded flex items-center justify-between px-4 bg-gray-100/80 dark:bg-transparent">
        <div className="flex gap-4 items-center justify-center">
          {selectedChatType === "group" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Avatar
                    className="size-9 rounded-full overflow-hidden cursor-pointer border-2"
                    onClick={() => setOpenGroupInfoModal(true)}
                  >
                    <AvatarImage
                      src={selectedChatData.avatar || groupAvatar}
                      alt="avatar"
                      className="object-cover size-full"
                    />
                    <AvatarFallback
                      className={`uppercase h-full w-full text-xl border text-center font-medium 
                  transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}
                    >
                      {selectedChatData?.name.charAt(0) ?? ""}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Group Info</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Dialog open={openGroupInfoModal} onOpenChange={setOpenGroupInfoModal}>
            <DialogContent className="w-80 md:w-96 h-max rounded-md shadow-lg transition-all hover:shadow-2xl p-6 select-none">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              <div className="w-full flex flex-col gap-4">
                <div className="w-full flex gap-4">
                  <div className="size-max">
                    <img
                      src={selectedChatData.avatar || groupAvatar}
                      className="size-16 md:size-20 rounded-full border-4 border-white object-cover shadow-lg transition-all"
                    />
                  </div>
                  <div className="w-2/3 flex flex-col justify-center gap-1.5">
                    <h3 className="text-lg md:text-xl font-bold">{selectedChatData.name}</h3>
                    <p className="text-xs md:text-sm max-w-48 md:max-w-56 text-ellipsis wrap-break-word line-clamp-2">
                      {selectedChatData.description}
                    </p>
                  </div>
                </div>

                <GroupMembersList selectedChatData={selectedChatData} />

                <p className="text-center text-xs md:text-sm tracking-wider text-gray-500 dark:text-gray-100">
                  Created at: {formatUtcTimestamp(selectedChatData?.createdAt)}
                </p>
              </div>
            </DialogContent>
          </Dialog>

          {selectedChatType === "contact" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none" asChild>
                  <Avatar
                    className="size-9 rounded-full overflow-hidden cursor-pointer border-2"
                    onClick={() => setOpenUserInfoModal(true)}
                  >
                    <AvatarImage src={userAvatar} alt="profile" className="object-cover size-full" />
                    <AvatarFallback
                      className={`uppercase h-full w-full text-xl border text-center font-medium 
                      transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}
                    >
                      {(selectedChatData?.name || selectedChatData?.username || selectedChatData?.email).charAt(0) ??
                        ""}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Chat Info</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Dialog for show user information */}
          <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
            <DialogContent className="w-80 md:w-96 rounded-md shadow-lg transition-all hover:shadow-2xl p-6 select-none">
              <DialogHeader className="hidden">
                <DialogTitle></DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              {/* Profile Image */}
              <div className="flex justify-center">
                <img
                  className="size-28 lg:size-32 rounded-full border-4 border-white 
                  object-cover shadow-lg -mt-20 lg:-mt-24 transition-all"
                  src={userAvatar}
                  alt="User profile"
                />
              </div>
              {/* User Info */}
              <div className="text-center pt-4">
                <h2 className="text-2xl font-bold">{selectedChatData?.name}</h2>
                <p className="text-gray-500 dark:text-gray-100">{selectedChatData?.username}</p>
                <p className="mt-2 text-gray-600 dark:text-gray-200 text-sm">{selectedChatData?.bio}</p>
              </div>
              {/* User Stats */}
              <div className="flex flex-col justify-around text-sm border-t border-gray-200 pt-4">
                <p className="text-center text-xl mb-4 font-semibold">Message Stats</p>
                <div className="flex justify-evenly">
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.sent}</p>
                    <p className="text-gray-500 dark:text-gray-100">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{messageStats.received}</p>
                    <p className="text-gray-500 dark:text-gray-100">Received</p>
                  </div>
                </div>
              </div>
              {/* Last Message Time */}
              <p className="text-center text-xs md:text-sm tracking-wider text-gray-500 dark:text-gray-100">
                Last msg: {formatUtcTimestamp(selectedChatData?.interaction)}
              </p>
            </DialogContent>
          </Dialog>

          {/* Username and Typing Indicator */}
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedChatData?.name || selectedChatData?.username || selectedChatData?.email}
            </h3>
            <p className="text-xs">
              {selectedChatType === "contact" ? (
                <>
                  {isCurrentlyOnline ? (
                    <>
                      {isPartnerTyping ? (
                        <>
                          <span>typing</span>
                          <span className="typing">.</span>
                          <span className="typing">.</span>
                          <span className="typing">.</span>
                        </>
                      ) : (
                        <span>online</span>
                      )}
                    </>
                  ) : (
                    <span>offline</span>
                  )}
                </>
              ) : (
                <span>
                  {`${selectedChatData?.members?.length ?? 0} ${selectedChatData?.members?.length === 1 ? "member" : "members"}`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {/* Voice & Video Stream Info */}
          {selectedChatType === "contact" && isCurrentlyOnline && (
            <>
              {callingActive && callingInfo?.uid === selectedChatData?._id ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="focus:outline-none cursor-pointer">
                      <LuAudioLines
                        size={20}
                        strokeWidth={1.5}
                        onClick={() => setCallingDialog(true)}
                        className="tooltip-icon"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="tooltip-span">Call Info</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="focus:outline-none cursor-pointer" disabled={pendingRequest}>
                        <HiOutlineShare
                          size={18}
                          onClick={() => setOpenPeerShareModal(true)}
                          className="tooltip-icon"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="tooltip-span">Peer Share</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="focus:outline-none cursor-pointer" disabled={pendingRequest}>
                        <HiOutlineVideoCamera
                          size={20}
                          onClick={() => requestVoiceCalling(selectedChatData?._id!, "video")}
                          className="tooltip-icon"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="tooltip-span">Video Call</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="focus:outline-none cursor-pointer" disabled={pendingRequest}>
                        <HiOutlinePhone
                          size={18}
                          onClick={() => requestVoiceCalling(selectedChatData?._id!, "audio")}
                          className="tooltip-icon"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="tooltip-span">Voice Call</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </>
          )}
          {/* Translate Language */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <DropdownMenuTrigger asChild className={cn(import.meta.env.PROD && "hidden")}>
                  <TooltipTrigger className="focus:outline-none cursor-pointer">
                    <HiOutlineLanguage size={18} className="tooltip-icon" />
                  </TooltipTrigger>
                </DropdownMenuTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Translate</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-36 mt-4 mr-6 bg-background">
              <DropdownMenuLabel>Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-52 overflow-y-auto scrollbar-hide">
                <DropdownMenuRadioGroup value={language} onValueChange={setLanguage} className="space-y-1">
                  {languageOptions.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.code}
                      value={option.code}
                      className={`flex items-center justify-start gap-2 text-sm capitalize cursor-pointer rounded-md 
                    ${option.code === language && "bg-neutral-100 dark:bg-neutral-800"}`}
                    >
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
              <TooltipTrigger className="focus:outline-none cursor-pointer">
                <HiOutlineXMark size={20} onClick={closeChat} className="tooltip-icon" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="tooltip-span">Close</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
};

export { ChatHeader };
