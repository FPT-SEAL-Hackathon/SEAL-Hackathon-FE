import { createContext, useContext, ReactNode} from "react";

import { useRounds } from "../hooks/useRounds";

interface Props {
    eventId: string;
    children: ReactNode;
}

const RoundContext = createContext<ReturnType<typeof useRounds> | undefined>(undefined);

export function RoundProvider({
    eventId, 
    children,
}: Props) {
    const value = useRounds(eventId);
    return (
        <RoundContext.Provider value={value}>
            {children}
        </RoundContext.Provider>
    );
}

export function useRoundContext() {
    const context = useContext(RoundContext);

    if (!context) {
        throw new Error("useRoundContext must be used inside RoundProvider");
    }
    
    return context;
} 