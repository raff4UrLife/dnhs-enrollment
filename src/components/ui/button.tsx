import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        navy: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        // outline: "border border-input text-foreground hover:bg-muted",
        outline: "border border-white/70 text-white hover:bg-white/10",
        ghost: "hover:bg-black/5 text-[--color-navy-900]",
        link: "text-[--color-navy-900] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends
    useRender.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

function Button({ className, variant, size, render, ...props }: ButtonProps) {
  const element = useRender({
    defaultTagName: "button",
    render,
    props: mergeProps<"button">(
      { className: cn(buttonVariants({ variant, size, className })) },
      props,
    ),
  });

  return element;
}

export { Button, buttonVariants };
