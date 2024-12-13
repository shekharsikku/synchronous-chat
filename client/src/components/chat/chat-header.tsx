import { HiOutlineEllipsisVertical, HiOutlineXMark } from "react-icons/hi2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useChatStore } from "@/zustand";
import { useAvatar } from "@/hooks";
import { useEffect, useState } from "react";
import { countUserMessages } from "@/utils";
import moment from "moment";

const ChatHeader = () => {
  const { selectedChatData, closeChat, isPartnerTyping, messages } = useChatStore();
  const [openUserInfoModal, setOpenUserInfoModal] = useState(false);
  const [sendNumber, setSendNumber] = useState(0);
  const [receiveNumber, setReceiveNumber] = useState(0);
  const userAvatar = useAvatar(selectedChatData);

  useEffect(() => {
    const { sent, received } = countUserMessages(messages, selectedChatData);
    setSendNumber(sent);
    setReceiveNumber(received);
  }, [selectedChatData?._id, messages.length]);

  return (
    <div className="h-20 border-b flex items-center justify-between p-2">
      <div className="h-full w-full rounded flex gap-5 items-center justify-between px-4 bg-gray-100/80">
        <div className="flex gap-3 items-center justify-center">
          <Avatar className="h-8 w-8 rounded-full overflow-hidden cursor-pointer">
            <AvatarImage src={userAvatar} alt="profile" className="object-fit h-full w-full" />
            <AvatarFallback className={`uppercase h-full w-full text-xl border-[1px] text-center font-medium 
                      transition-all duration-300 bg-[#06d6a02a] text-[#06d6a0] border-[#06d6a0bb`}>
              {selectedChatData?.username?.split("").shift() || selectedChatData?.email?.split("").shift()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold">
              {selectedChatData?.name || selectedChatData?.username || selectedChatData?.email}
            </h3>
            {isPartnerTyping && <span className="text-[10px]">typing...</span>}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Dialog open={openUserInfoModal} onOpenChange={setOpenUserInfoModal}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HiOutlineEllipsisVertical size={20} onClick={() => setOpenUserInfoModal(true)}
                    className="text-neutral-600 border-none outline-none transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-neutral-700 font-medium">Info</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DialogContent className="w-72 lg:w-96 rounded-sm shadow-lg transition-all hover:shadow-2xl bg-white p-8">
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
                    <p className="font-semibold text-lg">{sendNumber}</p>
                    <p className="text-gray-500">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">{receiveNumber}</p>
                    <p className="text-gray-500">Received</p>
                  </div>
                </div>
              </div>
              {/* Last Message Time */}
              <p className="text-center text-sm mt-4 text-gray-500">
                {moment(selectedChatData?.interaction).format("MMMM Do YYYY, h:mm:ss a")}
              </p>
            </DialogContent>
          </Dialog>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
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