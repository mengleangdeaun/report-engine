import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ── Ripple colour per variant ──────────────────────────────────────────────────
// We use a semi-transparent white or black depending on the button surface.
const rippleColorMap: Record<string, string> = {
  default:     "rgba(255,255,255,0.30)",
  destructive: "rgba(255,255,255,0.30)",
  outline:     "rgba(0,0,0,0.10)",
  secondary:   "rgba(0,0,0,0.10)",
  ghost:       "rgba(0,0,0,0.10)",
  link:        "transparent",
}

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

// ── useRipple hook ─────────────────────────────────────────────────────────────
function useRipple(variant: string = "default") {
  const [ripples, setRipples] = React.useState<Ripple[]>([])

  const addRipple = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      // Diameter = longest diagonal so the circle always covers the button
      const size = Math.hypot(rect.width, rect.height) * 2
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top  - size / 2
      const id = Date.now()

      setRipples(prev => [...prev, { id, x, y, size }])

      // Clean up after animation finishes (600 ms)
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    },
    []
  )

  const rippleColor = rippleColorMap[variant] ?? "rgba(255,255,255,0.25)"

  const rippleElements = (
    <>
      {ripples.map(({ id, x, y, size }) => (
        <span
          key={id}
          aria-hidden
          style={{
            position:      "absolute",
            left:          x,
            top:           y,
            width:         size,
            height:        size,
            borderRadius:  "50%",
            background:    rippleColor,
            transform:     "scale(0)",
            animation:     "button-ripple 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
            pointerEvents: "none",
          }}
        />
      ))}
      <style>{`
        @keyframes button-ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )

  return { addRipple, rippleElements }
}

// ── ButtonProps ────────────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// ── Button ─────────────────────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, children, ...props }, ref) => {
    const { addRipple, rippleElements } = useRipple(variant ?? "default")

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        addRipple(e)
        onClick?.(e)
      },
      [addRipple, onClick]
    )

    if (asChild) {
      // When used as Slot, we wrap children so ripples can be injected inside
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          onClick={handleClick as React.MouseEventHandler}
          {...props}
        >
          <Slottable>{children}</Slottable>
          {rippleElements}
        </Slot>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick}
        {...props}
      >
        {children}
        {rippleElements}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }