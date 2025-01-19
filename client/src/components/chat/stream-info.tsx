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
  HiOutlineRss,
  HiOutlinePhoneXMark,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineArrowsRightLeft,
} from "react-icons/hi2";
import { continuousVisualizer } from "sound-visualizer";
import { useState, useRef, useEffect } from "react";
import { usePeer } from "@/lib/context";

const StreamInfo = () => {
  const [isMute, setIsMute] = useState(false);
  const [callTimer, setCallTimer] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { localInfo, remoteInfo, callingDialog, setCallingDialog, mediaStream,
    localAudioRef, remoteAudioRef, disconnectCalling, callingActive } = usePeer();

  const maskedPeerId = (uuid: string) => {
    if (!uuid) return "";
    return uuid.slice(0, 8) + "****" + uuid.slice(-4);
  };

  const displayName = (name: string) => {
    if (!name) return "";
    return name.split(" ")[0] + "...";
  }

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

        if (audioTracks.length > 0 && remoteAudioRef) {
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
  }, [mediaStream, callingActive, remoteAudioRef, callingDialog]);

  const [hoverTest, setHoverTest] = useState(false);

  return (
    <>
      <div className="h-bar border-t p-2">
        <div className="bg-gray-100/80 rounded h-full w-full flex items-center justify-between px-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="focus:outline-none">
                <div className="flex flex-col justify-center" onClick={() => setCallingDialog(true)}
                  onMouseOver={() => setHoverTest(true)} onMouseLeave={() => setHoverTest(false)} role="button">
                  <h5 className="flex gap-2 text-sm font-semibold text-neutral-700">
                    <span>{displayName(localInfo?.name!)}</span>
                    {hoverTest ? (
                      <HiOutlineRss size={16} className="mt-[2px]" />
                    ) : (
                      <HiOutlineArrowsRightLeft size={16} className="mt-[2px]" />
                    )}
                    <span>{displayName(remoteInfo?.name!)}</span>
                  </h5>
                  <p className="flex gap-1 text-xs font-medium text-neutral-700">
                    <span>Voice Connected</span>
                    <span>{formatTime(callTimer)}</span>
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-neutral-700 font-medium">Call Info</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                  <HiOutlinePhoneXMark size={18} onClick={() => disconnectCalling()}
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
      <Dialog open={callingDialog} onOpenChange={setCallingDialog}>
        <DialogContent className="h-auto w-80 md:w-96 flex flex-col rounded-md items-start">
          <DialogHeader>
            <DialogTitle className="text-start">Call with {remoteInfo?.name}</DialogTitle>
            <DialogDescription className="text-start text-xs sm:text-sm">
              Connected with another user via WebRTC
            </DialogDescription>
          </DialogHeader>

          <div className="w-full flex flex-col gap-2">
            <h3 className="text-sm font-medium flex justify-between">
              <span>Voice Connected</span>
              <span>{formatTime(callTimer)}</span>
            </h3>

            <h2 className="text-base font-medium flex justify-between">
              <span>{localInfo?.name}</span>
              <HiOutlineArrowsRightLeft size={16} className="mt-1" />
              <span>{remoteInfo?.name}</span>
            </h2>

            <div className={`${import.meta.env.PROD ? "hidden" : "w-full flex flex-col gap-2"}`}>
              <p className="text-sm font-medium">
                Local uid: <span className="text-xs text-gray-500 font-normal">{localInfo?.uid}</span>
                <br />
                Local pid: <span className="text-xs text-gray-500 font-normal">{maskedPeerId(localInfo?.pid!)}</span>
              </p>
              <p className="text-sm font-medium">
                Remote uid: <span className="text-xs text-gray-500 font-normal">{remoteInfo?.uid}</span>
                <br />
                Remote pid: <span className="text-xs text-gray-500 font-normal">{maskedPeerId(remoteInfo?.pid!)}</span>
              </p>
            </div>

            <div className="w-full flex flex-col gap-2">
              <canvas ref={canvasRef} className="h-20 w-full"></canvas>
              <hr />
            </div>
          </div>

          <div className="w-full flex items-center gap-4">
            <Button size="lg" variant="outline" className="w-full p-2" onClick={() => setIsMute(prev => !prev)}>
              {isMute ? "Unmute" : "Mute"}</Button>
            <Button size="lg" className="w-full p-2" onClick={() => disconnectCalling()}>
              Disconnect</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { StreamInfo };