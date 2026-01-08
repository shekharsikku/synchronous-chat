import { FC, ReactNode } from "react";

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TooltipElementProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
  asChild?: boolean;
  onClick?: () => void;
  classNames?: string;
}

const TooltipElement: FC<TooltipElementProps> = ({ children, content, disabled, asChild, onClick, classNames }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          disabled={disabled}
          asChild={asChild}
          onClick={onClick}
          className={cn("focus:outline-none cursor-pointer", classNames)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <span className="tooltip-span">{content}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { TooltipElement };
