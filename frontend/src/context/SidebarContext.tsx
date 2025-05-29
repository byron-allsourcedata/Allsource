import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
    isGetStartedPage: boolean;
    setIsGetStartedPage: (value: boolean) => void;
    installedResources: {
        pixel: boolean;
        source: boolean;
    };
    setInstalledResources: (resources: { pixel: boolean; source: boolean }) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isGetStartedPage, setIsGetStartedPage] = useState(false);
    const [installedResources, setInstalledResources] = useState({
        pixel: false,
        source: false,
    });

    return (
        <SidebarContext.Provider value={{ isGetStartedPage, setIsGetStartedPage, installedResources, setInstalledResources, }}>
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
