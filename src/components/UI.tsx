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
      "bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 transition-all",
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
  "inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm border border-brand-700/10",
        secondary: "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
      },
      size: {
        sm: "px-3 py-1.5 text-xs gap-1.5",
        md: "px-5 py-2.5 text-sm gap-2",
        lg: "px-8 py-4 text-base gap-3 font-bold",
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
        "w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-slate-50/50 disabled:cursor-not-allowed disabled:opacity-50",
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
