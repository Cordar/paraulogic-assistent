'use client'

import { useState } from 'react';

interface ParaulesPerLletraFormProps {
    lletres: string[];
    paraulesPerLletra: { [key: string]: { count: number, lengths: number[], lengthCounts?: { [length: number]: number } } };
    onChange: (lletra: string, field: 'count' | 'lengths' | 'lengthCounts', value: any) => void;
}

export default function ParaulesPerLletraForm({ 
    lletres, 
    paraulesPerLletra, 
    onChange 
}: ParaulesPerLletraFormProps) {
    
    // State for each letter's select dropdown
    const [selectValues, setSelectValues] = useState<{[key: string]: string}>({});

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

    const handleSelectChange = (lletra: string, value: string) => {
        if (value) {
            const length = parseInt(value);
            const currentData = paraulesPerLletra[lletra] || { count: 0, lengths: [], lengthCounts: {} };
            const lengthCounts = currentData.lengthCounts || {};
            
            if (length >= 3 && length <= 15 && !lengthCounts[length]) {
                handleLengthCountChange(lletra, length, 1);
            }
        }
        
        // Reset select value
        setSelectValues(prev => ({
            ...prev,
            [lletra]: ''
        }));
    };

    return (
        <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">
                Paraules que comencen per cada lletra
            </h5>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lletres.sort((a, b) => a.localeCompare(b)).map(lletra => {
                    const data = paraulesPerLletra[lletra] || { count: 0, lengths: [], lengthCounts: {} };
                    const lengthCounts = data.lengthCounts || {};
                    
                    return (
                        <div key={lletra} className="border p-4 rounded-md bg-gray-50">
                            <div className="font-semibold text-xl mb-3 text-center bg-white p-2 rounded">
                                {lletra.toUpperCase()}
                            </div>
                            
                            {/* Total count (read-only, calculated from lengths) */}
                            <div className="mb-3 p-2 bg-blue-50 rounded">
                                <span className="text-sm font-medium">Total paraules: </span>
                                <span className="text-lg font-bold">{data.count || 0}</span>
                            </div>

                            {/* Length counts */}
                            <div className="space-y-2">
                                <h6 className="text-sm font-medium text-gray-700">Paraules per longitud:</h6>
                                
                                {/* Existing length counts */}
                                {Object.entries(lengthCounts)
                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                    .map(([length, count]) => (
                                        <div key={length} className="flex items-center space-x-2 bg-white p-2 rounded">
                                            <span className="text-sm w-16">{length} lletres:</span>
                                            <input
                                                type="number"
                                                value={count}
                                                onChange={(e) => handleLengthCountChange(lletra, parseInt(length), parseInt(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                                min="0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleLengthCountChange(lletra, parseInt(length), 0)}
                                                className="text-red-500 hover:text-red-700 text-sm px-2"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                
                                {/* Add new length */}
                                <div className="flex items-center space-x-2 bg-green-50 p-2 rounded">
                                    <span className="text-sm">Afegir longitud:</span>
                                    <select
                                        value={selectValues[lletra] || ''}
                                        onChange={(e) => handleSelectChange(lletra, e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                    >
                                        <option value="">Selecciona...</option>
                                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
                                            .filter(len => !lengthCounts[len])
                                            .map(len => (
                                                <option key={len} value={len}>{len} lletres</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
