"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "button-primary",
        work: "button-work",
        outline: "button-secondary",
        secondary: "button-secondary",
        ghost: "button-quiet",
        destructive: "button-danger",
        link: "button-quiet underline underline-offset-4",
      },
      size: {
        default: "px-4 py-2.5",
        xs: "min-h-8 gap-1 px-2 py-1 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-9 gap-1.5 px-3 py-1.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "min-h-12 gap-2.5 px-5 py-3",
        icon: "min-h-11 w-11 px-0 py-0",
        "icon-xs": "min-h-8 w-8 px-0 py-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "min-h-9 w-9 px-0 py-0",
        "icon-lg": "min-h-12 w-12 px-0 py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
