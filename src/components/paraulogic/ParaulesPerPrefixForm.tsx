'use client'

import { generatePrefixes } from '@/utils/combinations';
import { useState } from "react";

interface ParaulesPerPrefixFormProps {
    lletres: string[];
    paraulesPerPrefix: { [key: string]: number };
    onChange: (prefix: string, count: number) => void;
}

export default function ParaulesPerPrefixForm({ 
    lletres, 
    paraulesPerPrefix, 
    onChange 
}: ParaulesPerPrefixFormProps) {
    const [bulkInput, setBulkInput] = useState('');
    const [showBulkInput, setShowBulkInput] = useState(false);
    const [error, setError] = useState('');
    
    const prefixes = generatePrefixes(lletres);

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
                if (count > 0 && prefixes.includes(prefix)) {
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

            // Update each prefix using the onChange callback
            Object.entries(nousPrefixos).forEach(([prefix, count]) => {
                onChange(prefix, count);
            });

            setBulkInput('');
            setShowBulkInput(false);
            
            // Show success message
            const countAfegits = Object.keys(nousPrefixos).length;
            setTimeout(() => {
                alert(`S'han actualitzat ${countAfegits} prefixos correctament!`);
            }, 100);
            
        } catch {
            setError('Error processant les dades. Comprova el format.');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
             <h5 className="text-md font-medium text-gray-700">
                    Paraules per prefix de 2 lletres
                </h5>
                <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 font-medium"
                >
                    {showBulkInput ? 'Amagar importació' : 'Importació massiva'}
                </button>
            </div>

            {/* Bulk input form */}
            {showBulkInput && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md border">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">
                        Importació massiva de prefixos
                    </h6>
                    <p className="text-xs text-gray-600 mb-3">
                        Enganxa les dades copiades de la web (format: &quot;eg-1 er-5 es-11 et-2...&quot;)
                    </p>
                    <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="eg-1 er-5 es-11 et-2"
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
                    
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md mt-3">
                            {error}
                        </div>
                    )}
                </div>
            )}

            <div className="max-h-80 overflow-y-auto border rounded-md p-4 bg-gray-50">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {prefixes.map(prefix => (
                        <div key={prefix} className="flex items-center space-x-2">
                            <span className="text-sm font-mono w-8 text-right">
                                {prefix.toUpperCase()}:
                            </span>
                            <input
                                type="number"
                                value={paraulesPerPrefix[prefix] || 0}
                                onChange={(e) => onChange(prefix, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                min="0"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Total de {prefixes.length} prefixos possibles
            </p>
        </div>
    );
}