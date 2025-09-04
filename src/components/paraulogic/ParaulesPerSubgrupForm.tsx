'use client'

import { useState, useRef } from 'react';

interface ParaulesPerSubgrupFormProps {
    lletres: string[];
    paraulesPerSubgrup: { [key: string]: number };
    onChange: (subgrup: string, count: number) => void;
}

export default function ParaulesPerSubgrupForm({ 
    lletres, 
    paraulesPerSubgrup, 
    onChange 
}: ParaulesPerSubgrupFormProps) {
    
    const [nouSubgrup, setNouSubgrup] = useState('');
    const [nouCount, setNouCount] = useState(1);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAfegirSubgrup = () => {
        setError('');
        
        if (!nouSubgrup.trim()) {
            setError('Introdueix un subgrup');
            inputRef.current?.focus();
            return;
        }

        const subgrup = nouSubgrup.toLowerCase().trim();
        
        // Validate that it only contains letters
        if (!/^[a-z]+$/.test(subgrup)) {
            setError('El subgrup només pot contenir lletres');
            inputRef.current?.focus();
            return;
        }

        // Validate minimum length
        if (subgrup.length < 2) {
            setError('El subgrup ha de tenir almenys 2 lletres');
            inputRef.current?.focus();
            return;
        }

        // Validate that all letters are from the available letters
        const totesLesLletres = lletres.join('');
        for (const lletra of subgrup) {
            if (!totesLesLletres.includes(lletra)) {
                setError(`La lletra "${lletra}" no està disponible`);
                inputRef.current?.focus();
                return;
            }
        }

        // Validate no repeated letters in subgroup
        const lletresUniques = new Set(subgrup);
        if (lletresUniques.size !== subgrup.length) {
            setError('No es poden repetir lletres en el subgrup');
            inputRef.current?.focus();
            return;
        }

        // Check if subgroup already exists
        if (paraulesPerSubgrup[subgrup]) {
            setError('Aquest subgrup ja existeix');
            inputRef.current?.focus();
            return;
        }

        // Add the subgroup
        onChange(subgrup, nouCount);
        setNouSubgrup('');
        setNouCount(1);

        // Focus back to input for quick consecutive additions
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleEliminarSubgrup = (subgrup: string) => {
        onChange(subgrup, 0);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAfegirSubgrup();
        }
    };

    const subgrupsExistents = Object.entries(paraulesPerSubgrup)
        .filter(([_, count]) => count > 0)
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">
                Paraules per subgrup de lletres
            </h5>
            
            {/* Available letters reminder */}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">
                    <strong>Lletres disponibles:</strong> {lletres.sort().join(', ').toUpperCase()}
                </p>
            </div>

            {/* Add new subgroup form */}
            <div className="mb-6 p-4 bg-green-50 rounded-md">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Afegir nou subgrup:</h6>
                <div className="flex items-center space-x-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={nouSubgrup}
                            onChange={(e) => setNouSubgrup(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="ex: abc, def, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                    <div className="w-20">
                        <input
                            type="number"
                            value={nouCount}
                            onChange={(e) => setNouCount(parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAfegirSubgrup}
                        className="px-4 py-2 bg-green-200 hover:bg-green-300 rounded-md text-sm font-medium"
                    >
                        Afegir
                    </button>
                </div>
                {error && (
                    <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-md">
                        {error}
                    </div>
                )}
            </div>

            {/* Existing subgroups */}
            {subgrupsExistents.length > 0 && (
                <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-3">Subgrups configurats:</h6>
                    <div className="max-h-80 overflow-y-auto border rounded-md p-4 bg-gray-50">
                        <div className="space-y-2">
                            {subgrupsExistents.map(([subgrup, count]) => (
                                <div key={subgrup} className="flex items-center justify-between bg-white p-3 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-mono text-lg font-medium">
                                            {subgrup.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            ({subgrup.length} lletres)
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            value={count}
                                            onChange={(e) => onChange(subgrup, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                            min="0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleEliminarSubgrup(subgrup)}
                                            className="text-red-500 hover:text-red-700 px-2 py-1"
                                            title="Eliminar subgrup"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Total: {subgrupsExistents.length} subgrups configurats
                    </p>
                </div>
            )}

            {subgrupsExistents.length === 0 && (
                <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-md">
                    No hi ha subgrups configurats encara
                </div>
            )}
        </div>
    );
}
