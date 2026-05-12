'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
    ({ label, error, containerClassName, className, ...props }, ref) => {
        const [isShaking, setIsShaking] = React.useState(false);

        React.useEffect(() => {
            if (error) {
                setIsShaking(true);
                const timer = setTimeout(() => setIsShaking(false), 500);
                return () => clearTimeout(timer);
            }
        }, [error]);

        return (
            <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
                {label && (
                    <label className="text-sm font-bold text-gray-500 text-muted-foreground/70">
                        {label}
                    </label>
                )}
                
                <motion.div
                    animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="relative"
                >
                    <textarea
                        ref={ref}
                        className={cn(
                            "w-full h-32 bg-white dark:bg-white/5 border rounded-xl p-4 outline-none transition-all duration-300 font-medium text-sm resize-none",
                            "placeholder:text-muted-foreground/30",
                            error 
                                ? "border-destructive/50 ring-4 ring-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                                : "border-gray-200 dark:border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
                            props.disabled && "opacity-50 cursor-not-allowed grayscale",
                            className
                        )}
                        {...props}
                    />
                    
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-4 top-4 text-destructive"
                            >
                                <AlertCircle size={18} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex items-center gap-1.5 ml-1 overflow-hidden"
                        >
                            <span className="text-[10px] font-black text-destructive uppercase tracking-wider">
                                {error}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';
