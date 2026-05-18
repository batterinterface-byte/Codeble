import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={twMerge(clsx(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-deep disabled:opacity-50 disabled:pointer-events-none border',
          {
            'bg-accent text-white hover:bg-accent-hover border-transparent': variant === 'primary',
            'bg-surface text-primary hover:bg-hover border-border': variant === 'secondary',
            'bg-transparent text-secondary hover:text-primary hover:bg-hover border-transparent': variant === 'ghost',
            'bg-red/10 text-red hover:bg-red/20 border-transparent': variant === 'danger',
          },
          {
            'h-7 px-3 text-xs': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
          },
          className,
        ))}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
