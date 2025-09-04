'use client'

import { useState, useEffect } from 'react';
import { getCombinations } from '@/utils/combinations';

interface CombinationsTrackerProps {
    prefixes: string[];
    subgroups: string[];
    availableLetters: string[];
    onCombinationToggle?: (combination: string, isTried: boolean) => void;
}

interface CombinationData {
    combination: string;
    type: 'prefix' | 'subgroup' | 'valid-word';
    size: number;
    isTried: boolean;
    priority: number; // Lower number = higher priority
    matchingPrefixes?: string[];
}

export default function CombinationsTracker({ 
    prefixes, 
    subgroups, 
    availableLetters,
    onCombinationToggle 
}: CombinationsTrackerProps) {
    const [triedCombinations, setTriedCombinations] = useState<Set<string>>(new Set());
    const [showOnlyUntried, setShowOnlyUntried] = useState(false);
    const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set([3, 4, 5]));

    // Load tried combinations from localStorage on mount
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

    // Save tried combinations to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('paraulogic-tried-combinations', JSON.stringify([...triedCombinations]));
    }, [triedCombinations]);

    const toggleCombination = (combination: string) => {
        const newTriedCombinations = new Set(triedCombinations);
        const wasTried = triedCombinations.has(combination);
        
        if (wasTried) {
            newTriedCombinations.delete(combination);
        } else {
            newTriedCombinations.add(combination);
        }
        
        setTriedCombinations(newTriedCombinations);
        onCombinationToggle?.(combination, !wasTried);
    };

    const clearAllTried = () => {
        setTriedCombinations(new Set());
        localStorage.removeItem('paraulogic-tried-combinations');
    };

    const generateAllCombinations = (): CombinationData[] => {
        const combinationsMap = new Map<string, CombinationData>();

        // Add prefixes (these are always valid to try)
        prefixes.forEach(prefix => {
            if (prefix.length >= 2) {
                combinationsMap.set(prefix, {
                    combination: prefix,
                    type: 'prefix',
                    size: prefix.length,
                    isTried: triedCombinations.has(prefix),
                    priority: 1 // High priority for prefixes
                });
            }
        });

        // Add subgroups (these are always valid to try)
        subgroups.forEach(subgroup => {
            if (!combinationsMap.has(subgroup)) {
                combinationsMap.set(subgroup, {
                    combination: subgroup,
                    type: 'subgroup',
                    size: subgroup.length,
                    isTried: triedCombinations.has(subgroup),
                    priority: 2 // Medium priority for subgroups
                });
            }
        });

        // Generate valid word combinations based on the rules:
        // 1. Must be at least 3 letters
        // 2. Must start with one of the prefixes
        // 3. Must be part of one of the subgroups
        const maxSize = Math.min(7, availableLetters.length);
        for (let size = 3; size <= maxSize; size++) {
            const combinations = getCombinations(availableLetters, size);
            
            combinations.forEach(combo => {
                // Skip if already added as prefix or subgroup
                if (combinationsMap.has(combo)) return;

                // Rule 1: Must be at least 3 letters (already filtered by loop)
                
                // Rule 2: Must start with one of the prefixes
                const matchingPrefixes = prefixes.filter(prefix => combo.startsWith(prefix));
                if (matchingPrefixes.length === 0) return;

                // Rule 3: Must be part of one of the subgroups
                const isPartOfSubgroup = subgroups.some(subgroup => {
                    const subgroupLetters = new Set(subgroup.split(''));
                    const comboLetters = new Set(combo.split(''));
                    
                    // Check if all letters in combo are present in this subgroup
                    return [...comboLetters].every(letter => subgroupLetters.has(letter));
                });
                
                if (!isPartOfSubgroup) return;

                // If all rules pass, add the combination
                let priority = 3; // Default priority for valid words
                
                // Higher priority if it uses more high-priority prefixes
                if (matchingPrefixes.length > 1) {
                    priority = 2;
                }
                
                // Higher priority for shorter combinations (easier to find)
                if (size === 3) priority = Math.min(priority, 2);

                combinationsMap.set(combo, {
                    combination: combo,
                    type: 'valid-word',
                    size: combo.length,
                    isTried: triedCombinations.has(combo),
                    priority,
                    matchingPrefixes
                });
            });
        }

        return Array.from(combinationsMap.values());
    };

    const allCombinations = generateAllCombinations();

    // Filter combinations based on user preferences
    const filteredCombinations = allCombinations.filter(combo => {
        if (showOnlyUntried && combo.isTried) return false;
        if (!selectedSizes.has(combo.size)) return false;
        return true;
    });

    // Group combinations by size
    const combinationsBySize = filteredCombinations.reduce((acc, combo) => {
        if (!acc[combo.size]) acc[combo.size] = [];
        acc[combo.size].push(combo);
        return acc;
    }, {} as { [size: number]: CombinationData[] });

    // Sort combinations within each size group
    Object.keys(combinationsBySize).forEach(size => {
        combinationsBySize[parseInt(size)].sort((a, b) => {
            // Sort by priority first, then alphabetically
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.combination.localeCompare(b.combination);
        });
    });

    const getTypeIcon = (type: CombinationData['type']) => {
        switch (type) {
            case 'prefix': return '🎯';
            case 'subgroup': return '🧩';
            case 'valid-word': return '✅';
            default: return '📝';
        }
    };

    const getTypeColor = (type: CombinationData['type'], isTried: boolean) => {
        if (isTried) {
            return 'bg-gray-200 text-gray-600 border-gray-300 line-through opacity-60';
        }
        
        switch (type) {
            case 'prefix': return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
            case 'subgroup': return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200';
            case 'valid-word': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
        }
    };

    const getTypeLabel = (type: CombinationData['type']) => {
        switch (type) {
            case 'prefix': return 'Prefix';
            case 'subgroup': return 'Subgrup';
            case 'valid-word': return 'Paraula Vàlida';
            default: return 'Desconegut';
        }
    };

    const toggleSizeFilter = (size: number) => {
        const newSelectedSizes = new Set(selectedSizes);
        if (newSelectedSizes.has(size)) {
            newSelectedSizes.delete(size);
        } else {
            newSelectedSizes.add(size);
        }
        setSelectedSizes(newSelectedSizes);
    };

    const availableSizes = [...new Set(allCombinations.map(c => c.size))].sort((a, b) => a - b);
    const triedCount = allCombinations.filter(c => c.isTried).length;
    const totalCount = allCombinations.length;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                    🎲 Seguiment de Combinacions Vàlides
                </h3>
                <div className="text-sm text-gray-600">
                    {triedCount}/{totalCount} provades ({Math.round((triedCount / totalCount) * 100)}%)
                </div>
            </div>

            {/* Rules explanation */}
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">📋 Regles de validació:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Les paraules han de tenir mínim 3 lletres</li>
                    <li>• Han de començar amb un dels prefixos disponibles</li>
                    <li>• Han d'estar formades només amb lletres d'un dels subgrups</li>
                </ul>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                    style={{ width: `${(triedCount / totalCount) * 100}%` }}
                ></div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Mides:</span>
                    {availableSizes.map(size => (
                        <button
                            key={size}
                            onClick={() => toggleSizeFilter(size)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                selectedSizes.has(size)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={showOnlyUntried}
                            onChange={(e) => setShowOnlyUntried(e.target.checked)}
                            className="rounded"
                        />
                        Només no provades
                    </label>

                    <button
                        onClick={clearAllTried}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                        Netejar tot
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                    <span>🎯</span>
                    <span className="text-green-700">Prefixos</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🧩</span>
                    <span className="text-purple-700">Subgrups</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span className="text-blue-700">Paraules Vàlides</span>
                </div>
                <div className="text-gray-600 italic">
                    Clica per marcar com a provada
                </div>
            </div>

            {/* Combinations by size */}
            <div className="space-y-6">
                {Object.entries(combinationsBySize)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([size, combinations]) => (
                        <div key={size} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-3 text-gray-800">
                                📐 {size} lletres ({combinations.length} combinacions)
                            </h4>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {combinations.map(combo => (
                                    <div key={combo.combination} className="relative">
                                        <button
                                            onClick={() => toggleCombination(combo.combination)}
                                            className={`
                                                w-full px-3 py-2 rounded-lg border-2 font-mono text-sm font-medium
                                                transition-all duration-200 transform hover:scale-105 active:scale-95
                                                ${getTypeColor(combo.type, combo.isTried)}
                                                ${combo.isTried ? 'cursor-pointer' : 'cursor-pointer hover:shadow-md'}
                                            `}
                                            title={`${getTypeLabel(combo.type)} - Clica per ${combo.isTried ? 'desmarcar' : 'marcar'} com a provada${combo.matchingPrefixes ? `\nPrefixos: ${combo.matchingPrefixes.join(', ')}` : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs">{getTypeIcon(combo.type)}</span>
                                                <span className={combo.isTried ? 'line-through' : ''}>
                                                    {combo.combination.toUpperCase()}
                                                </span>
                                            </div>
                                        </button>
                                        
                                        {/* Show matching prefixes for valid words */}
                                        {combo.type === 'valid-word' && combo.matchingPrefixes && combo.matchingPrefixes.length > 0 && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded-full font-bold">
                                                {combo.matchingPrefixes.length}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
            </div>

            {filteredCombinations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-lg font-medium">
                        {showOnlyUntried ? 'Totes les combinacions han estat provades!' : 'No hi ha combinacions per mostrar amb els filtres actuals.'}
                    </div>
                </div>
            )}

            {/* Statistics */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                <h5 className="font-medium mb-2">📊 Estadístiques:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <div className="font-bold text-lg text-green-600">
                            {allCombinations.filter(c => c.type === 'prefix').length}
                        </div>
                        <div className="text-gray-600">Prefixos</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-purple-600">
                            {allCombinations.filter(c => c.type === 'subgroup').length}
                        </div>
                        <div className="text-gray-600">Subgrups</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-blue-600">
                            {allCombinations.filter(c => c.type === 'valid-word').length}
                        </div>
                        <div className="text-gray-600">Paraules Vàlides</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-gray-600">
                            {triedCount}
                        </div>
                        <div className="text-gray-600">Provades</div>
                    </div>
                </div>
                
                {/* Additional stats by size */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Distribució per mida:</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                        {availableSizes.map(size => {
                            const sizeTotal = allCombinations.filter(c => c.size === size).length;
                            const sizeTried = allCombinations.filter(c => c.size === size && c.isTried).length;
                            return (
                                <div key={size} className="text-center p-2 bg-white rounded">
                                    <div className="font-bold">{size}</div>
                                    <div className="text-gray-600">{sizeTried}/{sizeTotal}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}