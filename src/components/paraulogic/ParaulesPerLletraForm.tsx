'use client'

import { useState, useEffect } from 'react';

interface ParaulesPerLletraFormProps {
    lletres: string[];
    paraulesPerLletra: { [key: string]: { count: number, lengths: number[], lengthCounts?: { [length: number]: number } } };
    onChange: (lletra: string, field: 'count' | 'lengths' | 'lengthCounts', value: number | number[] | { [length: number]: number }) => void;
}

export default function ParaulesPerLletraForm({ 
    lletres, 
    paraulesPerLletra, 
    onChange 
}: ParaulesPerLletraFormProps) {

    // Helper function to get lengths with data
    const getLengthsWithData = (): number[] => {
        const usedLengths = new Set<number>();
        lletres.forEach(lletra => {
            const data = paraulesPerLletra[lletra];
            if (data?.lengthCounts) {
                Object.keys(data.lengthCounts).forEach(length => {
                    const lengthNum = parseInt(length);
                    if (data.lengthCounts![lengthNum] > 0) {
                        usedLengths.add(lengthNum);
                    }
                });
            }
        });
        const result = Array.from(usedLengths).sort((a, b) => a - b);
        // If no data exists, show default range
        return result.length > 0 ? result : [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    };

    // State for managing visible lengths - initialize with lengths that have data
    const [visibleLengths, setVisibleLengths] = useState<number[]>(getLengthsWithData());
    const [showLengthManager, setShowLengthManager] = useState(false);

    // Update visible lengths when data changes
    useEffect(() => {
        const lengthsWithData = getLengthsWithData();
        // Only update if current visible lengths don't include all data lengths
        const hasAllDataLengths = lengthsWithData.every(length => visibleLengths.includes(length));
        if (!hasAllDataLengths && lengthsWithData.length > 0) {
            // Merge current visible lengths with new data lengths, removing duplicates
            const mergedLengths = [...new Set([...visibleLengths, ...lengthsWithData])].sort((a, b) => a - b);
            setVisibleLengths(mergedLengths);
        }
    }, [paraulesPerLletra, lletres]);

    const allPossibleLengths = Array.from({ length: 18 }, (_, i) => i + 3); // 3 to 20

    const handleLengthCountChange = (lletra: string, length: number, count: number) => {
        const currentData = paraulesPerLletra[lletra] || { count: 0, lengths: [], lengthCounts: {} };
        const newLengthCounts = {
            ...currentData.lengthCounts,
            [length]: count
        };
        
        // Remove length if count is 0
        if (count === 0) {
            delete newLengthCounts[length];
        }
        
        onChange(lletra, 'lengthCounts', newLengthCounts);
        
        // Update total count
        const totalCount = Object.values(newLengthCounts).reduce((sum: number, c: number) => sum + c, 0);
        onChange(lletra, 'count', totalCount);
        
        // Update lengths array
        const lengths = Object.keys(newLengthCounts).map(l => parseInt(l)).sort((a, b) => a - b);
        onChange(lletra, 'lengths', lengths);
    };

    const getLengthCount = (lletra: string, length: number): number => {
        const data = paraulesPerLletra[lletra];
        return data?.lengthCounts?.[length] || 0;
    };

    const getTotalForLetter = (lletra: string): number => {
        const data = paraulesPerLletra[lletra];
        return data?.count || 0;
    };

    const getTotalForLength = (length: number): number => {
        return lletres.reduce((sum, lletra) => sum + getLengthCount(lletra, length), 0);
    };

    const getGrandTotal = (): number => {
        return lletres.reduce((sum, lletra) => sum + getTotalForLetter(lletra), 0);
    };

    const addLength = (length: number) => {
        if (!visibleLengths.includes(length)) {
            const newLengths = [...visibleLengths, length].sort((a, b) => a - b);
            setVisibleLengths(newLengths);
        }
    };

    const removeLength = (length: number) => {
        const newLengths = visibleLengths.filter(l => l !== length);
        setVisibleLengths(newLengths);
    };

    const toggleLength = (length: number) => {
        if (visibleLengths.includes(length)) {
            removeLength(length);
        } else {
            addLength(length);
        }
    };

    const resetToDefault = () => {
        setVisibleLengths([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    };

    const showOnlyUsed = () => {
        const lengthsWithData = getLengthsWithData();
        setVisibleLengths(lengthsWithData);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-medium text-gray-700">
                    Paraules que comencen per cada lletra
                </h5>
                <button
                    type="button"
                    onClick={() => setShowLengthManager(!showLengthManager)}
                    className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 font-medium"
                >
                    {showLengthManager ? 'Amagar columnes' : 'Gestionar columnes'}
                </button>
            </div>

            {/* Length manager */}
            {showLengthManager && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md border">
                    <h6 className="text-sm font-medium text-gray-700 mb-3">
                        Gestionar columnes de longitud
                    </h6>
                    
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            type="button"
                            onClick={showOnlyUsed}
                            className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 rounded"
                        >
                            Només amb dades
                        </button>
                        <button
                            type="button"
                            onClick={resetToDefault}
                            className="text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded"
                        >
                            Per defecte (3-15)
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibleLengths([])}
                            className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 rounded"
                        >
                            Amagar totes
                        </button>
                    </div>

                    {/* Length toggles */}
                    <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
                        {allPossibleLengths.map(length => {
                            const isVisible = visibleLengths.includes(length);
                            const hasData = getTotalForLength(length) > 0;
                            
                            return (
                                <button
                                    key={length}
                                    type="button"
                                    onClick={() => toggleLength(length)}
                                    className={`text-xs px-2 py-1 rounded border ${
                                        isVisible 
                                            ? 'bg-green-200 border-green-400 text-green-800' 
                                            : 'bg-gray-100 border-gray-300 text-gray-600'
                                    } ${hasData ? 'font-bold' : ''}`}
                                    title={hasData ? `${getTotalForLength(length)} paraules` : 'Sense dades'}
                                >
                                    {length}
                                    {hasData && <span className="ml-1">•</span>}
                                </button>
                            );
                        })}
                    </div>
                    
                    <p className="text-xs text-gray-600 mt-2">
                        • Verd: columna visible | Gris: columna oculta | Negreta amb punt: té dades
                    </p>
                </div>
            )}
            
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold sticky left-0 bg-gray-100 z-10">
                                Lletra
                            </th>
                            {visibleLengths.map(length => (
                                <th key={length} className="border border-gray-300 px-2 py-2 text-center font-semibold min-w-[60px] relative">
                                    <div className="flex items-center justify-center">
                                        <span>{length}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeLength(length)}
                                            className="ml-1 text-red-500 hover:text-red-700 text-xs opacity-50 hover:opacity-100"
                                            title="Amagar columna"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="border border-gray-300 px-3 py-2 text-center font-semibold bg-blue-50 sticky right-0 z-10">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {lletres.sort((a, b) => a.localeCompare(b)).map(lletra => (
                            <tr key={lletra} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2 font-bold text-lg bg-gray-50 sticky left-0 z-10">
                                    {lletra.toUpperCase()}
                                </td>
                                {visibleLengths.map(length => (
                                    <td key={length} className="border border-gray-300 px-1 py-1 text-center">
                                        <input
                                            type="number"
                                            value={getLengthCount(lletra, length)}
                                            onChange={(e) => handleLengthCountChange(lletra, length, parseInt(e.target.value) || 0)}
                                            className="w-full px-1 py-1 text-center border-0 focus:outline-none focus:ring-1 focus:ring-green-500 focus:bg-green-50"
                                            min="0"
                                            style={{ minWidth: '50px' }}
                                        />
                                    </td>
                                ))}
                                <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-blue-50 sticky right-0 z-10">
                                    {getTotalForLetter(lletra)}
                                </td>
                            </tr>
                        ))}
                        
                        {/* Totals row */}
                        <tr className="bg-yellow-50 font-semibold">
                            <td className="border border-gray-300 px-3 py-2 font-bold sticky left-0 bg-yellow-50 z-10">
                                TOTAL
                            </td>
                            {visibleLengths.map(length => (
                                <td key={length} className="border border-gray-300 px-2 py-2 text-center">
                                    {getTotalForLength(length)}
                                </td>
                            ))}
                            <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-yellow-100 sticky right-0 z-10">
                                {getGrandTotal()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {visibleLengths.length === 0 && (
                <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-md mt-4">
                    No hi ha columnes visibles. Fes clic a "Gestionar columnes" per afegir-ne.
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>• Cada cel·la representa el nombre de paraules d'una longitud específica que comencen per aquesta lletra</p>
                <p>• Els totals per lletra es calculen automàticament</p>
                <p>• Per defecte només es mostren les longituds amb dades</p>
            </div>
        </div>
    );
}
