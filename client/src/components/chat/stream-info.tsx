import { Button } from "@/components/ui/button";
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
  HiOutlineLinkSlash,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineArrowsRightLeft,
} from "react-icons/hi2";
import { useState } from "react";
import { usePeer } from "@/context";

const StreamInfo = () => {
  const [isMute, setIsMute] = useState(false);

  const { localInfo, remoteInfo, openStreamDialog, setOpenStreamDialog,
    localAudioRef, remoteAudioRef, disconnectStream } = usePeer();

  const maskedPeerId = (uuid: string) => {
    if (!uuid) return "";
    return uuid.slice(0, 8) + "****" + uuid.slice(-4);
  };

  const displayName = (name: string) => {
    if (!name) return "";
    return name.slice(0, 6) + "...";
  }

  return (
    <>
      <div className="h-bar border-t p-2">
        <div className="bg-gray-100/80 rounded h-full w-full flex items-center justify-between px-4">

          <div className="flex flex-col justify-start">
            <span className="flex item-center gap-2 text-sm font-semibold text-neutral-700">
              {displayName(localInfo?.name!)}
              <HiOutlineArrowsRightLeft size={16} className="mt-[2px]" />
              {displayName(remoteInfo?.name!)}
            </span>
            <span className="text-xs font-medium text-neutral-700">Connected via WebRTC</span>
          </div>

          <div className="hidden">
            <audio ref={localAudioRef} autoPlay controls muted />
            <audio ref={remoteAudioRef} autoPlay controls muted={isMute} />
          </div>

          <div className="flex gap-4 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  {isMute ? (
                    <HiOutlineSpeakerXMark size={20} onClick={() => setIsMute(false)}
                      className="text-neutral-600 border-none outline-none transition-all duration-300" />
                  ) : (
                    <HiOutlineSpeakerWave size={20} onClick={() => setIsMute(true)}
                      className="text-neutral-600 border-none outline-none transition-all duration-300" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-neutral-700 font-medium">{isMute ? "Unmute" : "Mute"}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  <HiOutlineLinkSlash size={20} onClick={() => disconnectStream()}
                    className="text-neutral-600 border-none outline-none transition-all duration-300" />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="text-neutral-700 font-medium">Disconnect</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Dialog for display info */}
      <Dialog open={openStreamDialog} onOpenChange={setOpenStreamDialog}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-sm items-start">
          <DialogHeader>
            <DialogTitle className="text-start">Call with {remoteInfo?.name}?</DialogTitle>
            <DialogDescription className="text-start">
              Connected with another user via peer?
            </DialogDescription>
          </DialogHeader>

          <div className={`${import.meta.env.PROD && "hidden"} space-y-4`}>
            <div className="flex flex-col gap-2">
              <h3 className="text-md font-semibold">Audio Call</h3>
              <div>
                <p className="text-sm font-medium">
                  Local uid: <span className="text-xs text-gray-500 font-normal">{localInfo?.uid}</span>
                </p>
                <p className="text-sm font-medium">
                  Local pid: <span className="text-xs text-gray-500 font-normal">{maskedPeerId(localInfo?.pid!)}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Remote uid: <span className="text-xs text-gray-500 font-normal">{remoteInfo?.uid}</span>
                </p>
                <p className="text-sm font-medium">
                  Remote pid: <span className="text-xs text-gray-500 font-normal">{maskedPeerId(remoteInfo?.pid!)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center gap-4">
            <Button size="lg" variant="outline" className="w-full p-2" onClick={() => setIsMute(prev => !prev)}>
              {isMute ? "Unmute" : "Mute"}</Button>
            <Button size="lg" className="w-full p-2" onClick={() => disconnectStream()}>
              Disconnect</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { StreamInfo };