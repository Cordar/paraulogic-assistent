'use client'

import { useState, useEffect, useMemo } from 'react';

interface PrefixCombinationsModalProps {
    prefix: string;
    length: number;
    subgroups: string[];
    availableLetters: string[];
    isOpen: boolean;
    onClose: () => void;
}

interface CombinationData {
    combination: string;
    matchingSubgroups: string[];
}

export default function PrefixCombinationsModal({ 
    prefix, 
    length, 
    subgroups, 
    availableLetters,
    isOpen,
    onClose 
}: PrefixCombinationsModalProps) {
    const [triedCombinations, setTriedCombinations] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    // Load tried combinations from localStorage on component mount
    useEffect(() => {
        const loadTriedCombinations = () => {
            try {
                const saved = localStorage.getItem('paraulogic-tried-combinations');
                if (saved) {
                    const savedArray = JSON.parse(saved);
                    console.log('Loaded from localStorage:', savedArray); // Debug log
                    setTriedCombinations(new Set(savedArray));
                }
            } catch (error) {
                console.error('Error loading tried combinations:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTriedCombinations();
    }, []);

    // Save tried combinations to localStorage whenever it changes
    useEffect(() => {
        if (!isLoaded) return; // Don't save until we've loaded first

        try {
            const combinationsArray = [...triedCombinations];
            localStorage.setItem('paraulogic-tried-combinations', JSON.stringify(combinationsArray));
            console.log('Saved to localStorage:', combinationsArray); // Debug log
        } catch (error) {
            console.error('Error saving tried combinations:', error);
        }
    }, [triedCombinations, isLoaded]);

    const toggleCombination = (combination: string) => {
        console.log('Toggling combination:', combination); // Debug log
        setTriedCombinations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(combination)) {
                newSet.delete(combination);
                console.log('Removed:', combination);
            } else {
                newSet.add(combination);
                console.log('Added:', combination);
            }
            console.log('New set size:', newSet.size);
            return newSet;
        });
    };

    // Generate all valid combinations (independent of tried combinations)
    const baseCombinations = useMemo(() => {
        if (!isOpen || length < prefix.length) return [];

        const remainingLength = length - prefix.length;
        if (remainingLength === 0) {
            // If the prefix is exactly the target length, just check if it's valid
            const matchingSubgroups = subgroups.filter(subgroup => {
                const subgroupLetters = new Set(subgroup.split(''));
                return prefix.split('').every(letter => subgroupLetters.has(letter));
            });

            if (matchingSubgroups.length > 0) {
                return [{
                    combination: prefix,
                    matchingSubgroups
                }];
            }
            return [];
        }

        const results: CombinationData[] = [];

        // Generate all possible combinations for the remaining positions
        const generateCombinations = (currentCombo: string, remainingPos: number) => {
            if (remainingPos === 0) {
                // Check if this combination uses only letters from at least one subgroup
                const matchingSubgroups = subgroups.filter(subgroup => {
                    const subgroupLetters = new Set(subgroup.split(''));
                    return currentCombo.split('').every(letter => subgroupLetters.has(letter));
                });

                if (matchingSubgroups.length > 0) {
                    results.push({
                        combination: currentCombo,
                        matchingSubgroups
                    });
                }
                return;
            }

            // Try each available letter for the next position
            availableLetters.forEach(letter => {
                generateCombinations(currentCombo + letter, remainingPos - 1);
            });
        };

        generateCombinations(prefix, remainingLength);

        // Remove duplicates and sort
        const uniqueResults = results.filter((combo, index, array) => 
            array.findIndex(c => c.combination === combo.combination) === index
        );

        return uniqueResults.sort((a, b) => a.combination.localeCompare(b.combination));
    }, [prefix, length, subgroups, availableLetters, isOpen]);

    // Combine base combinations with tried status
    const combinations = useMemo(() => {
        return baseCombinations.map(combo => ({
            ...combo,
            isTried: triedCombinations.has(combo.combination)
        }));
    }, [baseCombinations, triedCombinations]);

    const triedCount = combinations.filter(c => c.isTried).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            🎯 Combinacions amb prefix "{prefix.toUpperCase()}"
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                            Llargada: {length} lletres • {triedCount}/{combinations.length} provades
                        </div>
                        {/* Debug info */}
                        <div className="text-xs text-gray-400 mt-1">
                            Debug: localStorage size = {triedCombinations.size}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                    <div className="text-sm text-blue-800">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <span className="font-medium">Prefix:</span> {prefix.toUpperCase()}
                            </div>
                            <div>
                                <span className="font-medium">Llargada total:</span> {length} lletres
                            </div>
                            <div>
                                <span className="font-medium">Subgrups disponibles:</span> 
                                <span className="ml-1 font-mono">
                                    {subgroups.map(s => s.toUpperCase()).join(', ')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {combinations.length > 0 && (
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progrés</span>
                            <span className="text-sm text-gray-600">
                                {Math.round((triedCount / combinations.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                style={{ width: `${(triedCount / combinations.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Combinations Grid */}
                <div className="p-4">
                    {combinations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🚫</div>
                            <div className="text-lg font-medium mb-2">
                                No hi ha combinacions vàlides
                            </div>
                            <div className="text-sm text-gray-400">
                                Comprova que el prefix i la llargada siguin compatibles amb els subgrups disponibles
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-1">
                                        Combinacions possibles ({combinations.length}):
                                    </h4>
                                    <div className="text-sm text-gray-600">
                                        Clica sobre una combinació per marcar-la com a provada
                                    </div>
                                </div>
                                
                                {/* Clear all button for this modal */}
                                <button
                                    onClick={() => {
                                        const currentModalCombinations = combinations.map(c => c.combination);
                                        setTriedCombinations(prev => {
                                            const newSet = new Set(prev);
                                            currentModalCombinations.forEach(combo => newSet.delete(combo));
                                            return newSet;
                                        });
                                    }}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    disabled={triedCount === 0}
                                >
                                    Netejar provades
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {combinations.map(combo => (
                                    <div key={combo.combination} className="relative">
                                        <button
                                            onClick={() => toggleCombination(combo.combination)}
                                            className={`
                                                w-full px-3 py-3 rounded-lg border-2 font-mono text-sm font-medium
                                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                                ${combo.isTried 
                                                    ? 'bg-gray-200 text-gray-600 border-gray-300 line-through opacity-60' 
                                                    : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:shadow-md'
                                                }
                                            `}
                                            title={`Subgrups: ${combo.matchingSubgroups.join(', ')}\nClica per ${combo.isTried ? 'desmarcar' : 'marcar'} com a provada`}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={combo.isTried ? 'line-through' : ''}>
                                                    {combo.combination.toUpperCase()}
                                                </span>
                                                <div className="text-xs text-gray-500">
                                                    {combo.matchingSubgroups.length > 1 
                                                        ? `${combo.matchingSubgroups.length} subgrups`
                                                        : combo.matchingSubgroups[0]?.toUpperCase()
                                                    }
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {/* Multiple subgroups indicator */}
                                        {combo.matchingSubgroups.length > 1 && (
                                            <div className="absolute -top-1 -right-1 bg-orange-400 text-orange-900 text-xs px-1 rounded-full font-bold">
                                                {combo.matchingSubgroups.length}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Statistics */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium mb-2 text-gray-800">📊 Resum:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-blue-600">
                                            {combinations.length}
                                        </div>
                                        <div className="text-gray-600">Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-green-600">
                                            {triedCount}
                                        </div>
                                        <div className="text-gray-600">Provades</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-orange-600">
                                            {combinations.length - triedCount}
                                        </div>
                                        <div className="text-gray-600">Pendents</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-purple-600">
                                            {[...new Set(combinations.flatMap(c => c.matchingSubgroups))].length}
                                        </div>
                                        <div className="text-gray-600">Subgrups usats</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Les combinacions es desen automàticament al localStorage
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Tancar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}