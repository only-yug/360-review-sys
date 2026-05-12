'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
    show: boolean;
    title: string;
    message: string;
    type: AlertType;
    mode: 'alert' | 'confirm';
    resolve?: (value: boolean) => void;
}

interface AlertContextType {
    showAlert: (message: string, title?: string, type?: AlertType) => void;
    showConfirm: (message: string, title?: string, type?: AlertType) => Promise<boolean>;
    hideAlert: (result: boolean) => void;
    state: AlertState;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AlertState>({
        show: false,
        title: '',
        message: '',
        type: 'warning',
        mode: 'alert',
    });

    const showAlert = useCallback((message: string, title: string = 'Notice', type: AlertType = 'warning') => {
        setState({
            show: true,
            title,
            message,
            type,
            mode: 'alert',
        });
    }, []);

    const showConfirm = useCallback((message: string, title: string = 'Confirm Action', type: AlertType = 'warning') => {
        return new Promise<boolean>((resolve) => {
            setState({
                show: true,
                title,
                message,
                type,
                mode: 'confirm',
                resolve,
            });
        });
    }, []);

    const hideAlert = useCallback((result: boolean) => {
        if (state.resolve) {
            state.resolve(result);
        }
        setState((prev) => ({ ...prev, show: false, resolve: undefined }));
    }, [state]);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert, state }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
