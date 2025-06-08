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
  HiOutlinePhoneXMark,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
} from "react-icons/hi2";
import { LuMic, LuMicOff, LuAudioLines, LuAudioWaveform } from "react-icons/lu";
import { continuousVisualizer } from "sound-visualizer";
import { useState, useRef, useEffect } from "react";
import { usePeer } from "@/lib/context";

const StreamInfo = () => {
  const [callTimer, setCallTimer] = useState(0);
  const [hoverInfo, setHoverInfo] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    localInfo,
    callingInfo,
    callingDialog,
    setCallingDialog,
    mediaStream,
    localAudioRef,
    remoteAudioRef,
    disconnectCalling,
    callingActive,
    mediaType,
    remoteMute,
    remoteMicOff,
    setRemoteMicOff,
    muteUser,
    setMuteUser,
  } = usePeer();

  const maskedPeerId = (uuid: string) => {
    if (!uuid) return "";
    return uuid.slice(0, 8) + "****" + uuid.slice(-4);
  };

  const displayName = (name: string) => {
    if (!name) return "";
    return name.split(" ")[0] + "...";
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    if (hours > 0) {
      const formattedHours = hours.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    } else {
      return `${formattedMinutes}:${formattedSeconds}`;
    }
  };

  /** Call timer */
  useEffect(() => {
    if (callingActive) {
      /** Start the timer */
      timerRef.current = setInterval(() => {
        setCallTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      /** Stop and reset the timer when the call is not accepted */
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallTimer(0);
    }

    /** Cleanup on component unmount or call end */
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callingActive]);

  /** Visualizer effect */
  useEffect(() => {
    let startVisualizer: (() => void) | undefined;
    let stopVisualizer: (() => void) | undefined;

    const initializeVisualizer = () => {
      if (canvasRef.current && mediaStream && callingActive) {
        const canvas = canvasRef.current;
        const options = {
          strokeColor: "#6b7280",
          lineWidth: "thick",
          slices: 100,
          barRadius: 4,
        };

        const audioTracks = mediaStream.getAudioTracks();

        if (audioTracks.length > 0 && remoteAudioRef && !remoteMute) {
          ({ start: startVisualizer, stop: stopVisualizer } =
            continuousVisualizer(mediaStream, canvas, options));
          startVisualizer();
        }
      }
    };

    if (callingDialog) {
      /** Add a slight delay to ensure the canvas is mounted and stable */
      const timeoutId = setTimeout(initializeVisualizer, 100);
      return () => {
        clearTimeout(timeoutId);
        if (stopVisualizer) stopVisualizer();
      };
    }
  }, [mediaStream, callingActive, remoteAudioRef, callingDialog, remoteMute]);

  return (
    <>
      <div className="h-bar border-t p-2">
        <div className="bg-gray-100/80 dark:bg-transparent rounded h-full w-full flex items-center justify-between px-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
                <div
                  className="flex flex-col justify-center px-1"
                  onClick={() => setCallingDialog(true)}
                  onMouseOver={() => setHoverInfo(true)}
                  onMouseLeave={() => setHoverInfo(false)}
                  role="button"
                >
                  <h5 className="flex gap-2 heading-name">
                    <span>{displayName(localInfo?.name!)}</span>
                    {hoverInfo ? (
                      <LuAudioLines
                        size={16}
                        strokeWidth={1.5}
                        className="mt-[2px]"
                      />
                    ) : (
                      <LuAudioWaveform
                        size={16}
                        strokeWidth={1.5}
                        className="mt-[2px]"
                      />
                    )}
                    <span>{displayName(callingInfo?.name!)}</span>
                  </h5>
                  <p className="flex gap-1 heading-uname">
                    <span>
                      {mediaType === "video" ? "Video" : "Voice"} Connected
                    </span>
                    <span>{formatTime(callTimer)}</span>
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="tooltip-span">Call Info</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="hidden">
            <audio ref={localAudioRef} autoPlay muted />
            <audio
              ref={remoteAudioRef}
              autoPlay
              muted={muteUser || remoteMute}
            />
          </div>

          <div className="flex gap-4 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  {remoteMicOff ? (
                    <LuMicOff
                      size={20}
                      strokeWidth={1.5}
                      onClick={() => setRemoteMicOff(false)}
                      className="tooltip-icon"
                    />
                  ) : (
                    <LuMic
                      size={20}
                      strokeWidth={1.5}
                      onClick={() => setRemoteMicOff(true)}
                      className="tooltip-icon"
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">
                    {remoteMicOff ? "Mic On" : "Mic Off"}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  {muteUser ? (
                    <HiOutlineSpeakerXMark
                      size={20}
                      onClick={() => setMuteUser(false)}
                      className="tooltip-icon"
                    />
                  ) : (
                    <HiOutlineSpeakerWave
                      size={20}
                      onClick={() => setMuteUser(true)}
                      className="tooltip-icon"
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">
                    {muteUser ? "Voice On" : "Voice Off"}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="focus:outline-none">
                  <HiOutlinePhoneXMark
                    size={18}
                    onClick={disconnectCalling}
                    className="tooltip-icon"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="tooltip-span">Disconnect</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Dialog for display info */}
      <Dialog
        open={callingDialog && mediaType === "audio"}
        onOpenChange={setCallingDialog}
      >
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-md items-start">
          <DialogHeader>
            <DialogTitle className="text-start">
              Call with {callingInfo?.name}
            </DialogTitle>
            <DialogDescription className="text-start text-xs sm:text-sm dark:text-gray-300">
              Connected with another user via WebRTC
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex flex-col gap-2">
            <h3 className="text-sm font-medium flex justify-between">
              <span>{mediaType === "video" ? "Video" : "Voice"} Connected</span>
              <span>{formatTime(callTimer)}</span>
            </h3>

            <h2 className="text-base font-medium flex justify-between">
              <span>{localInfo?.name}</span>
              <LuAudioWaveform size={16} strokeWidth={1.5} className="mt-1" />
              <span>{callingInfo?.name}</span>
            </h2>

            <div
              className={`${
                import.meta.env.PROD ? "hidden" : "w-full flex flex-col gap-2"
              }`}
            >
              <p className="text-sm font-medium">
                Local uid:{" "}
                <span className="text-xs text-gray-500 dark:text-gray-200 font-normal">
                  {localInfo?.uid}
                </span>
                <br />
                Local pid:{" "}
                <span className="text-xs text-gray-500 dark:text-gray-200 font-normal">
                  {maskedPeerId(localInfo?.pid!)}
                </span>
              </p>
              <p className="text-sm font-medium">
                Remote uid:{" "}
                <span className="text-xs text-gray-500 dark:text-gray-200 font-normal">
                  {callingInfo?.uid}
                </span>
                <br />
                Remote pid:{" "}
                <span className="text-xs text-gray-500 dark:text-gray-200 font-normal">
                  {maskedPeerId(callingInfo?.pid!)}
                </span>
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <canvas ref={canvasRef} className="h-20 w-full"></canvas>
              <hr />
            </div>
          </div>

          <div className="w-full flex items-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full p-2"
              onClick={() => setRemoteMicOff((prev) => !prev)}
            >
              {remoteMicOff ? "Unmute" : "Mute"}
            </Button>
            <Button
              size="lg"
              className="w-full p-2"
              onClick={disconnectCalling}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { StreamInfo };
