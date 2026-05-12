'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string; // Classes for the outer container
    selectClassName?: string; // Classes for the trigger area
    dropdownClassName?: string; // Classes for the list container
    optionClassName?: string; // Classes for each option
    icon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    errorText?: string;
    error?: boolean;
    uppercase?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className,
    selectClassName,
    dropdownClassName,
    optionClassName,
    icon,
    fullWidth = false,
    disabled = false,
    errorText,
    error,
    uppercase = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div 
            ref={containerRef} 
            className={cn(
                "relative select-none",
                isOpen ? "z-[250]" : "z-[10]",
                fullWidth ? "w-full" : "w-auto",
                className
            )}
        >
            <div
                onClick={toggleOpen}
                className={cn(
                    "flex items-center justify-between gap-3 px-4 h-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-all focus:ring-4 focus:ring-primary/20 outline-none font-bold text-sm shadow-sm dark:shadow-none",
                    uppercase && "uppercase font-black text-[10px] tracking-[0.2rem]",
                    isOpen && "border-primary/50 bg-gray-50 dark:bg-white/10 ring-4 ring-primary/10 shadow-2xl shadow-primary/20 scale-[1.02]",
                    error && "border-destructive/50 ring-4 ring-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
                    disabled && "opacity-50 cursor-not-allowed grayscale pointer-events-none",
                    selectClassName
                )}
            >
                <div className="flex items-center gap-3 truncate">
                    {icon && <span className={cn("text-muted-foreground", isOpen && "text-primary transition-colors")}>{icon}</span>}
                    <span className={cn(
                        "truncate",
                        !selectedOption && "text-muted-foreground font-medium opacity-50"
                    )}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown 
                    size={18} 
                    strokeWidth={3}
                    className={cn(
                        "text-muted-foreground transition-all duration-300",
                        isOpen && "rotate-180 text-primary"
                    )} 
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 8, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden",
                            dropdownClassName
                        )}
                    >
                        <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
                            {options.length === 0 ? (
                                <div className="p-8 text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] h-24 flex items-center justify-center italic opacity-50">Empty Data Set</div>
                            ) : (
                                options.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between px-5 py-4 rounded-xl cursor-pointer transition-all group mb-1 last:mb-0",
                                            value === option.value ? "bg-primary/10 dark:bg-primary/20 text-primary" : "hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.98]"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-sm font-bold tracking-tight",
                                                uppercase && "uppercase font-black text-xs tracking-widest",
                                                value === option.value ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-hover:translate-x-1"
                                            )}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {value === option.value && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                                    <Check size={12} strokeWidth={4} className="text-white" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {errorText && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex items-center gap-1.5 ml-1 mt-1.5 overflow-hidden"
                    >
                        <span className="text-[10px] font-black text-destructive uppercase tracking-wider">
                            {errorText}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
