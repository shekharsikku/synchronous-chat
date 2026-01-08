import { useHotkeys } from "react-hotkeys-hook";
import {
  HiOutlineBellAlert,
  HiOutlineBellSlash,
  HiOutlineArrowRightOnRectangle,
  HiOutlineMoon,
  HiOutlineSun,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSignOut } from "@/hooks";
import { usePeer, useTheme } from "@/lib/context";
import { getAvatar } from "@/lib/utils";
import { useAuthStore, useChatStore } from "@/lib/zustand";

const ProfileInfo = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const { handleSignOut } = useSignOut();
  const { theme, setTheme } = useTheme();
  const { isSoundAllow, setIsSoundAllow } = useChatStore();
  const { callingActive } = usePeer();

  useHotkeys("ctrl+m", () => setIsSoundAllow(isSoundAllow ? false : true), {
    enabled: !callingActive,
    enableOnFormTags: ["input"],
  });

  const handleProfileNavigate = () => {
    if (callingActive) {
      toast.info("Can't access profile page while calling!");
      return;
    }
    navigate("/profile");
  };

  return (
    <div className="absolute bottom-0 w-full h-bar border-t p-2">
      <div className="bg-gray-100/80 dark:bg-transparent rounded h-full w-full flex items-center justify-between px-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="focus:outline-none cursor-pointer" asChild>
              <div className="flex gap-4 items-center" onClick={handleProfileNavigate} role="button">
                <Avatar className="size-8 rounded-full overflow-hidden cursor-pointer border-2">
                  <AvatarImage src={getAvatar(userInfo)} alt="profile" className="object-cover size-full" />
                  <AvatarFallback
                    className={`uppercase h-full w-full text-xl border text-center font-medium 
                      transition-all duration-300 bg-[#4cc9f02a] text-[#4cc9f0] border-[#4cc9f0bb]`}
                  >
                    {(userInfo?.name ?? userInfo?.username ?? userInfo?.email)?.charAt(0) ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <h5 className="heading-name">{userInfo?.name}</h5>
                  <h6 className="heading-uname">{userInfo?.username}</h6>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span className="tooltip-span">Profile</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none cursor-pointer">
                {theme === "light" ? (
                  <HiOutlineMoon size={20} onClick={() => setTheme("dark")} className="tooltip-icon" />
                ) : (
                  <HiOutlineSun size={20} onClick={() => setTheme("light")} className="tooltip-icon" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <span className="tooltip-span">Theme</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none cursor-pointer">
                {isSoundAllow ? (
                  <HiOutlineBellAlert size={20} onClick={() => setIsSoundAllow(false)} className="tooltip-icon" />
                ) : (
                  <HiOutlineBellSlash size={20} onClick={() => setIsSoundAllow(true)} className="tooltip-icon" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <span className="tooltip-span">Alert</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none cursor-pointer">
                <HiOutlineArrowRightOnRectangle size={20} onClick={handleSignOut} className="tooltip-icon" />
              </TooltipTrigger>
              <TooltipContent>
                <span className="tooltip-span">Sign Out</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export { ProfileInfo };
