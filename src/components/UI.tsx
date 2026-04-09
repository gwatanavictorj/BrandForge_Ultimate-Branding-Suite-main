import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  extra?: React.ReactNode;
  onClick?: () => void;
}

export const Card = ({ children, className, title, icon: Icon, extra, onClick, ...props }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className={cn(
      "bg-white rounded-[var(--radius-card)] p-6 shadow-sm border border-slate-100 transition-all",
      onClick && "cursor-pointer hover:shadow-md hover:border-brand-100",
      className
    )}
    {...props}
  >
    {title && (
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-brand-600" />}
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        {extra && <div>{extra}</div>}
      </div>
    )}
    {children}
  </motion.div>
);

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md shadow-brand-500/20 border border-brand-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
        secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
      },
      size: {
        micro: "h-8 px-3 text-[10px] gap-1 rounded-[var(--radius-control)] font-bold",
        sm: "h-9 px-4 text-xs gap-1.5",
        md: "h-10 px-4 md:px-5 text-sm gap-2",
        lg: "h-11 px-4 md:px-6 text-base gap-2 font-bold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input 
      className={cn(
        "w-full px-4 py-2 rounded-[var(--radius-control)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-slate-50/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea 
      className={cn(
        "w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-slate-50/50 min-h-[100px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
