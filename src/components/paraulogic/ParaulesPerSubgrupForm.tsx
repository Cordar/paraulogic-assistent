'use client'

import { useState } from 'react';

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
    const [bulkInput, setBulkInput] = useState('');
    const [showBulkInput, setShowBulkInput] = useState(false);

    const validateSubgrup = (subgrup: string): string | null => {
        if (!subgrup.trim()) {
            return 'Introdueix un subgrup';
        }

        const subgrupClean = subgrup.toLowerCase().trim();

        // Validate that it only contains letters
        if (!/^[a-z]+$/.test(subgrupClean)) {
            return 'El subgrup només pot contenir lletres';
        }

        // Validate minimum length
        if (subgrupClean.length < 2) {
            return 'El subgrup ha de tenir almenys 2 lletres';
        }

        // Validate that all letters are from the available letters
        const totesLesLletres = lletres.join('');
        for (const lletra of subgrupClean) {
            if (!totesLesLletres.includes(lletra)) {
                return `La lletra "${lletra}" no està disponible`;
            }
        }

        // Validate no repeated letters in subgroup
        const lletresUniques = new Set(subgrupClean);
        if (lletresUniques.size !== subgrupClean.length) {
            return 'No es poden repetir lletres en el subgrup';
        }

        return null;
    };

    const handleAfegirSubgrup = () => {
        setError('');

        const validationError = validateSubgrup(nouSubgrup);
        if (validationError) {
            setError(validationError);
            return;
        }

        const subgrup = nouSubgrup.toLowerCase().trim();

        // Check if subgroup already exists
        if (paraulesPerSubgrup[subgrup]) {
            setError('Aquest subgrup ja existeix');
            return;
        }

        // Add the subgroup
        onChange(subgrup, nouCount);
        setNouSubgrup('');
        setNouCount(1);
    };

    const parseBulkInput = (input: string): { [key: string]: number } => {
        const subgrups: { [key: string]: number } = {};

        // Split by spaces and process each part
        const parts = input.trim().split(/\s+/);

        for (const part of parts) {
            // Match pattern like "egir-8", "er-2", "egirst-5"
            const match = part.match(/^([a-z]+)-(\d+)$/i);
            if (match) {
                const subgrup = match[1].toLowerCase();
                const count = parseInt(match[2]);

                // Sort the letters in the subgroup to normalize it (optional)
                const subgrupSorted = subgrup.split('').sort().join('');

                // Validate the subgroup
                const validationError = validateSubgrup(subgrupSorted);
                if (!validationError && count > 0) {
                    subgrups[subgrupSorted] = count;
                }
            }
        }

        return subgrups;
    };

    const handleBulkUpdate = () => {
        setError('');

        if (!bulkInput.trim()) {
            setError('Introdueix les dades dels subgrups');
            return;
        }

        try {
            const nousSubgrups = parseBulkInput(bulkInput);

            if (Object.keys(nousSubgrups).length === 0) {
                setError('No s\'han trobat subgrups vàlids. Format esperat: "abc def-5 ghi:3"');
                return;
            }

            // Update each subgroup using the onChange callback
            Object.entries(nousSubgrups).forEach(([subgrup, count]) => {
                onChange(subgrup, count);
            });

            setBulkInput('');
            setShowBulkInput(false);

            // Show success message
            const countAfegits = Object.keys(nousSubgrups).length;
            setTimeout(() => {
                alert(`S'han afegit/actualitzat ${countAfegits} subgrups correctament!`);
            }, 100);

        } catch (_) {
            setError('Error processant les dades. Comprova el format.');
        }
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
            <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-medium text-gray-700">
                    Paraules per subgrup de lletres
                </h5>
                <button
                    type="button"
                    onClick={() => setShowBulkInput(!showBulkInput)}
                    className="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-700 font-medium"
                >
                    {showBulkInput ? 'Amagar importació' : 'Importació massiva'}
                </button>
            </div>

            {/* Available letters reminder */}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">
                    <strong>Lletres disponibles:</strong> {lletres.sort().join(', ').toUpperCase()}
                </p>
            </div>

            {/* Bulk input form */}
            {showBulkInput && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md border">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">
                        Importació massiva de subgrups
                    </h6>
                    <p className="text-xs text-gray-600 mb-3">
                        Enganxa les dades copiades de la web (format: &quot;egir-8 er-2 ert-10 egr-3...&quot;)
                    </p>
                    <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="egir-8 er-2 ert-10 egr-3 ers-4 erst-11 egirst-5 eirst-10 eirt-7 egrt-1 gir-1"
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
                            Importar Subgrups
                        </button>
                    </div>

                    {error && showBulkInput && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md mt-3">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Add new subgroup form */}
            <div className="mb-6 p-4 bg-green-50 rounded-md">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Afegir nou subgrup:</h6>
                <div className="flex items-center space-x-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={nouSubgrup}
                            onChange={(e) => setNouSubgrup(e.target.value)}
                            onKeyDown={handleKeyPress}
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
                {error && !showBulkInput && (
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
