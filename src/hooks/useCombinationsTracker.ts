'use client'

import { useState, useEffect } from 'react';

export interface CombinationStats {
    total: number;
    tried: number;
    byType: {
        prefix: number;
        subgroup: number;
        generated: number;
    };
    bySize: { [size: number]: { total: number; tried: number } };
}

export function useCombinationsTracker() {
    const [triedCombinations, setTriedCombinations] = useState<Set<string>>(new Set());

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('paraulogic-tried-combinations');
        if (saved) {
            try {
                const savedArray = JSON.parse(saved);
                setTriedCombinations(new Set(savedArray));
            } catch (error) {
                console.error('Error loading tried combinations:', error);
            }
        }
    }, []);

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('paraulogic-tried-combinations', JSON.stringify([...triedCombinations]));
    }, [triedCombinations]);

    const toggleCombination = (combination: string) => {
        setTriedCombinations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(combination)) {
                newSet.delete(combination);
            } else {
                newSet.add(combination);
            }
            return newSet;
        });
    };

    const markAsTried = (combination: string) => {
        setTriedCombinations(prev => new Set([...prev, combination]));
    };

    const markAsUntried = (combination: string) => {
        setTriedCombinations(prev => {
            const newSet = new Set(prev);
            newSet.delete(combination);
            return newSet;
        });
    };

    const clearAll = () => {
        setTriedCombinations(new Set());
        localStorage.removeItem('paraulogic-tried-combinations');
    };

    const isTried = (combination: string) => {
        return triedCombinations.has(combination);
    };

    return {
        triedCombinations,
        toggleCombination,
        markAsTried,
        markAsUntried,
        clearAll,
        isTried
    };
}