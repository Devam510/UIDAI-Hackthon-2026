import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    isOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendMessage: (message: string) => void;
    pendingMessage: string | null;
    clearPendingMessage: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);

    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);
    const toggleChat = () => setIsOpen(prev => !prev);

    const sendMessage = (message: string) => {
        setPendingMessage(message);
        setIsOpen(true);
    };

    const clearPendingMessage = () => setPendingMessage(null);

    return (
        <ChatContext.Provider value={{
            isOpen,
            openChat,
            closeChat,
            toggleChat,
            sendMessage,
            pendingMessage,
            clearPendingMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
