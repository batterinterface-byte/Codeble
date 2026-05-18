import * as SheetPrimitive from '@radix-ui/react-dialog'
import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

export const SheetContent = forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' }
>(({ className, children, side = 'right', ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
    <SheetPrimitive.Content
      ref={ref}
      className={twMerge(clsx(
        'fixed z-50 bg-panel border-border shadow-2xl data-[state=open]:animate-fade-in',
        side === 'right' && 'right-0 top-0 h-full w-[360px] border-l',
        side === 'left' && 'left-0 top-0 h-full w-[360px] border-r',
        className,
      ))}
      {...props}
    >
      {children}
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
))
SheetContent.displayName = 'SheetContent'
