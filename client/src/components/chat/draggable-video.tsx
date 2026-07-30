import { useState, useRef, useEffect, useEffectEvent } from "react";
import { cn } from "@/lib/utils";
import { usePeer } from "@/lib/context";
import env from "@/lib/env";
import { useChatStore } from "@/lib/zustand";

const DraggableVideo = () => {
  const { localVideoRef, remoteVideoRef, muteUser, remoteMute } = usePeer();
  const { selectedChatData } = useChatStore();

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
    e.preventDefault();
  };

  const handleMouseMove = useEffectEvent((e: any) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    const newX = initialPos.current.x + deltaX;
    const newY = initialPos.current.y + deltaY;

    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 150;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  });

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: any) => {
    const touch = e.touches[0];
    setIsDragging(true);
    startPos.current = { x: touch.clientX, y: touch.clientY };
    initialPos.current = { x: position.x, y: position.y };
    e.preventDefault();
  };

  const handleTouchMove = useEffectEvent((e: any) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;

    const newX = initialPos.current.x + deltaX;
    const newY = initialPos.current.y + deltaY;

    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 150;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
    e.preventDefault();
  });

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: true });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <>
      {/* Draggable Element */}
      <div
        ref={dragRef}
        className={cn(
          "absolute w-96 lg:w-120 xl:w-xl h-96 lg:h-120 bg-background dark:border rounded-xl cursor-move flex items-center justify-center font-bold text-lg shadow-xl p-2 select-none",
          isDragging
            ? "z-50 scale-110 shadow-2xl transition-none"
            : "transition-transform duration-100 ease-out hover:scale-105 hover:shadow-2xl"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        role="grid"
      >
        <div className="w-full h-full relative rounded-md aspect-video bg-transparent">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-2 right-2 w-32 h-24 rounded-sm border dark:border shadow-lg"
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={muteUser || remoteMute}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      </div>

      {!selectedChatData && env.isDev && (
        <>
          {/* Position Info */}
          <div className="fixed top-2 right-2 bg-background backdrop-blur-sm rounded p-4 shadow-2xl dark:shadow-black/80">
            <div className="font-semibold mb-2">Element Position</div>
            <div className="text-sm text-gray-600 dark:text-gray-200">X: {Math.round(position.x)}px</div>
            <div className="text-sm text-gray-600 dark:text-gray-200">Y: {Math.round(position.y)}px</div>
            <div className="text-xs text-gray-500 dark:text-gray-100 mt-2">
              {isDragging ? "🟢 Dragging" : "⚪ Ready"}
            </div>
          </div>

          {/* Instructions */}
          <div className="fixed bottom-2 right-2 bg-background backdrop-blur-sm rounded p-4 shadow-2xl dark:shadow-black/80">
            <div className="font-medium mb-1">Instructions:</div>
            <div className="text-sm opacity-90">• Click and drag the box to move it around</div>
            <div className="text-sm opacity-90">• Works on both desktop and mobile</div>
            <div className="text-sm opacity-90">• Element stays within screen bounds</div>
          </div>
        </>
      )}
    </>
  );
};

export { DraggableVideo };
