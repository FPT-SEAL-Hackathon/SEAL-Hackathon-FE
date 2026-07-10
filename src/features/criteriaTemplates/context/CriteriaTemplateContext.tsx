import { createContext, useContext, ReactNode } from "react";
import { useCriteriaTemplates } from "../hook/useCriteriaTemplates";

type CriteriaTemplateContextType = ReturnType<typeof useCriteriaTemplates>;

const CriteriaTemplateContext = createContext<CriteriaTemplateContextType | null>(null);

interface CriteriaTemplateContextProps {
    children: ReactNode;
}

export function CriteriaTemplateProvider({children} : CriteriaTemplateContextProps) {
    const value = useCriteriaTemplates();

    return (
        <CriteriaTemplateContext.Provider value={value}>
            {children}
        </CriteriaTemplateContext.Provider>
    )
}

export function useCriteriaTemplateContext() {
    const context = useContext(CriteriaTemplateContext);

    if (!context) {
        throw new Error("useCriteriaTemplateContext must be used in CriteriaTemplateProvider");
    }

    return context;
}