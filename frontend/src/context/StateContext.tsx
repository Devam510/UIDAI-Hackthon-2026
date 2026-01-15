import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import client from '../api/client';

interface StateContextType {
    selectedState: string;
    setSelectedState: (state: string) => void;
    availableStates: string[];
    loadingStates: boolean;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedState, setSelectedState] = useState<string>(() => {
        return localStorage.getItem('selectedState') || 'Uttar Pradesh';
    });

    const [availableStates, setAvailableStates] = useState<string[]>(() => {
        // Try to load cached states from localStorage
        const cached = localStorage.getItem('availableStates');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    const [loadingStates, setLoadingStates] = useState(true);

    // Fetch all states from backend on mount
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await client.get('/meta/states');
                if (response.data.status === 'success' && response.data.states) {
                    const states = response.data.states;
                    setAvailableStates(states);
                    // Cache states in localStorage
                    localStorage.setItem('availableStates', JSON.stringify(states));

                    // If selected state is not in the list, default to first state
                    if (!states.includes(selectedState) && states.length > 0) {
                        setSelectedState(states[0]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch states:', error);
                // If fetch fails and we have no cached states, use fallback
                if (availableStates.length === 0) {
                    const fallbackStates = [
                        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
                        "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
                        "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
                        "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
                        "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
                        "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
                    ];
                    setAvailableStates(fallbackStates);
                }
            } finally {
                setLoadingStates(false);
            }
        };

        fetchStates();
    }, []);

    // Persist selected state
    useEffect(() => {
        localStorage.setItem('selectedState', selectedState);
    }, [selectedState]);

    return (
        <StateContext.Provider value={{ selectedState, setSelectedState, availableStates, loadingStates }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => {
    const context = useContext(StateContext);
    if (context === undefined) {
        throw new Error('useStateContext must be used within a StateProvider');
    }
    return context;
};
