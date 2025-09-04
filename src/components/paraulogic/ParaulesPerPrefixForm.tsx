'use client'

import { useState } from 'react';

interface ParaulesPerPrefixFormProps {
    paraulesPerPrefix: { [key: string]: number };
    onChange: (paraulesPerPrefix: { [key: string]: number }) => void;
}

export default function ParaulesPerPrefixForm({ paraulesPerPrefix, onChange }: ParaulesPerPrefixFormProps) {
    const [nouPrefix, setNouPrefix] = useState('');
    const [nouCount, setNouCount] = useState('');
    const [error, setError] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [showBulkInput, setShowBulkInput] = useState(false);

    const handleAfegirPrefix = () => {
        setError('');
        
        if (!nouPrefix.trim()) {
            setError('Introdueix un prefix');
            return;
        }

        if (!nouCount.trim() || isNaN(Number(nouCount)) || Number(nouCount) < 0) {
            setError('Introdueix un número vàlid');
            return;
        }

        const prefix = nouPrefix.toLowerCase().trim();
        const count = parseInt(nouCount);

        if (!/^[a-z]+$/.test(prefix)) {
            setError('El prefix només pot contenir lletres');
            return;
        }

        const nousPrefixos = {
            ...paraulesPerPrefix,
            [prefix]: count
        };

        onChange(nousPrefixos);
        setNouPrefix('');
        setNouCount('');
    };

    const handleEliminarPrefix = (prefix: string) => {
        const nousPrefixos = { ...paraulesPerPrefix };
        delete nousPrefixos[prefix];
        onChange(nousPrefixos);
    };

    const parseBulkInput = (input: string): { [key: string]: number } => {
        const prefixos: { [key: string]: number } = {};
        
        // Split by spaces and process each part
        const parts = input.trim().split(/\s+/);
        
        for (const part of parts) {
            // Match pattern like "eg-1" or "re-19"
            const match = part.match(/^([a-z]+)-(\d+)$/i);
            if (match) {
                const prefix = match[1].toLowerCase();
                const count = parseInt(match[2]);
                if (count > 0) {
                    prefixos[prefix] = count;
                }
            }
        }
        
        return prefixos;
    };

    const handleBulkUpdate = () => {
        setError('');
        
        if (!bulkInput.trim()) {
            setError('Introdueix les dades dels prefixos');
            return;
        }

        try {
            const nousPrefixos = parseBulkInput(bulkInput);
            
            if (Object.keys(nousPrefixos).length === 0) {
                setError('No s\'han trobat prefixos vàlids. Format esperat: "eg-1 er-5 es-11"');
                return;
            }

            // Merge with existing prefixes
            const prefixosCombinats = {
                ...paraulesPerPrefix,
                ...nousPrefixos
            };

            onChange(prefixosCombinats);
            setBulkInput('');
            setShowBulkInput(false);
            
            // Show success message
            const countAfegits = Object.keys(nousPrefixos).length;
            setError(''); // Clear any previous errors
            setTimeout(() => {
                alert(`S'han afegit/actualitzat ${countAfegits} prefixos correctament!`);
            }, 100);
            
        } catch (err) {
            setError('Error processant les dades. Comprova el format.');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAfegirPrefix();
        }
    };

    const totalPrefixos = Object.keys(paraulesPerPrefix).filter(p => paraulesPerPrefix[p] > 0).length;
    const totalParaules = Object.values(paraulesPerPrefix).reduce((sum, count) => sum + count, 0);

    return (
        <div>
            <div className="mb-4">
                <h6 className="text-sm font-medium text-gray-700 mb-3">
                    Prefixos ({totalPrefixos} prefixos, {totalParaules} paraules)
                </h6>
                
                {/* Bulk input toggle */}
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => setShowBulkInput(!showBulkInput)}
                        className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 font-medium"
                    >
                        {showBulkInput ? 'Amagar importació massiva' : 'Importació massiva des de web'}
                    </button>
                </div>

                {/* Bulk input form */}
                {showBulkInput && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-md border">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">
                            Importació massiva de prefixos
                        </h6>
                        <p className="text-xs text-gray-600 mb-3">
                            Enganxa les dades copiades de la web (format: "eg-1 er-5 es-11 et-2...")
                        </p>
                        <textarea
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            placeholder="eg-1 er-5 es-11 et-2 ge-2 gi-2 gr-4 ir-2 it-1 re-19 ri-1 se-6 si-4 te-9 ti-6 tr-10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20 resize-none"
                        />
                        <div className="flex justify-end space-x-2 mt-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setBulkInput('');
                                    setShowBulkInput(false);
                                    setError('');
                                }}
                                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                            >
                                Cancel·lar
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkUpdate}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium"
                            >
                                Importar Prefixos
                            </button>
                        </div>
                    </div>
                )}

                {/* Individual prefix form */}
                <div className="flex items-center space-x-2 mb-3">
                    <input
                        type="text"
                        value={nouPrefix}
                        onChange={(e) => setNouPrefix(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Prefix (ex: re, es, tr...)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <input
                        type="number"
                        value={nouCount}
                        onChange={(e) => setNouCount(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Quantitat"
                        min="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleAfegirPrefix}
                        className="px-3 py-2 bg-green-200 hover:bg-green-300 rounded-md text-sm font-medium"
                    >
                        Afegir
                    </button>
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md mb-3">
                        {error}
                    </div>
                )}
            </div>

            {/* Current prefixes list */}
            {Object.keys(paraulesPerPrefix).length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(paraulesPerPrefix)
                            .filter(([_, count]) => count > 0)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([prefix, count]) => (
                                <div key={prefix} className="flex items-center justify-between bg-white p-2 rounded border">
                                    <span className="font-mono text-sm">
                                        <strong>{prefix}</strong>: {count}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleEliminarPrefix(prefix)}
                                        className="text-red-500 hover:text-red-700 ml-2 text-xs"
                                        title="Eliminar"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {Object.keys(paraulesPerPrefix).filter(p => paraulesPerPrefix[p] > 0).length === 0 && (
                <div className="text-center text-gray-500 p-4 border-2 border-dashed border-gray-300 rounded-md">
                    No hi ha prefixos configurats
                </div>
            )}
        </div>
    );
}