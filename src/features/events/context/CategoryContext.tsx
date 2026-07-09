import { useEffect, createContext, useContext, ReactNode } from "react";
import { useCategories } from "../hooks/useCategories";

type CategoryContextType = ReturnType<typeof useCategories>;

const CategoryContext = createContext<CategoryContextType | null>(null);

interface CategoryProviderProps {
    eventId: string;
    children: ReactNode;
}

export function CategoryProvider({
    eventId,
    children,
} : CategoryProviderProps) {

    const value = useCategories(eventId);

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    )
}

export function useCategoryContext() {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error("useCategoryContext must be used in CategoryProvider");
    }
    return context;
}