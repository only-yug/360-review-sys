import React from 'react';

export default function ScreenLoader() {
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background pointer-events-none">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-solid border-primary/20 border-t-primary shadow-xl shadow-primary/10"></div>
        </div>
    );
}
