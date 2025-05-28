import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-5 text-sm file:border-0 file:text-sm file:bg-transparent file:font-medium placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:border-black dark:focus-visible:border-gray-50/30",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
