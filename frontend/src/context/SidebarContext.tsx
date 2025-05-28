import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
    isGetStartedPage: boolean;
    setIsGetStartedPage: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isGetStartedPage, setIsGetStartedPage] = useState(false);

    return (
        <SidebarContext.Provider value={{ isGetStartedPage, setIsGetStartedPage }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }
    return context;
};
