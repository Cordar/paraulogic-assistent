'use client'

import { useState, useRef } from 'react';
import { GameData } from '@/types/paraulogic';
import Button from "./Button";

interface ParaulesTrobadesFormProps {
    dades: GameData;
    onAddFoundWord: (word: string) => void;
    onRemoveFoundWord: (word: string) => void;
    onComplete: () => void;
    _onCancel: () => void;
}

export default function ParaulesTrobadesForm({ 
    dades, 
    onAddFoundWord, 
    onRemoveFoundWord, 
    onComplete, 
    _onCancel 
}: ParaulesTrobadesFormProps) {
    const [novaParaula, setNovaParaula] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [showDetails, setShowDetails] = useState(false);

    const totesLesLletres = [dades.lletraPrincipal, ...dades.lletresExtres];
    const paraulesTrobades = dades.paraulesTrobades || [];

    const validarParaula = (paraula: string): string | null => {
        if (!paraula.trim()) {
            return 'Introdueix una paraula';
        }

        const paraulaClean = paraula.toLowerCase().trim();

        if (paraulaClean.length < 3) {
            return 'La paraula ha de tenir almenys 3 lletres';
        }

        if (!/^[a-z]+$/.test(paraulaClean)) {
            return 'La paraula només pot contenir lletres';
        }

        // Check if it contains the main letter
        if (!paraulaClean.includes(dades.lletraPrincipal)) {
            return `La paraula ha de contenir la lletra principal: ${dades.lletraPrincipal.toUpperCase()}`;
        }

        // Check if all letters are available
        for (const lletra of paraulaClean) {
            if (!totesLesLletres.includes(lletra)) {
                return `La lletra "${lletra.toUpperCase()}" no està disponible`;
            }
        }

        // Check if already added
        if (paraulesTrobades.includes(paraulaClean)) {
            return 'Aquesta paraula ja està afegida';
        }

        return null;
    };

    const handleAfegirParaula = () => {
        setError('');

        const errorValidacio = validarParaula(novaParaula);
        if (errorValidacio) {
            setError(errorValidacio);
            inputRef.current?.focus();
            return;
        }

        const paraulaClean = novaParaula.toLowerCase().trim();
        
        // Use the prop function to add the word
        onAddFoundWord(paraulaClean);
        setNovaParaula('');
        onComplete();
    };

    const handleEliminarParaula = (paraula: string) => {
        // Use the prop function to remove the word
        onRemoveFoundWord(paraula);
        onComplete();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAfegirParaula();
        }
    };

    // Group words by first letter
    const paraulesPerLletra = paraulesTrobades.reduce((acc, paraula) => {
        const primeraLletra = paraula[0];
        if (!acc[primeraLletra]) {
            acc[primeraLletra] = [];
        }
        acc[primeraLletra].push(paraula);
        return acc;
    }, {} as { [key: string]: string[] });

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
                <h4 className="text-xl font-semibold mb-2">Paraules trobades</h4>
                <p className="text-gray-600">Afegeix les paraules que ja has trobat</p>
            </div>

            {/* Available letters reminder */}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">
                    <strong>Lletra principal:</strong> <span className="text-lg font-bold text-blue-600">{dades.lletraPrincipal.toUpperCase()}</span>
                    {' '}<strong>Lletres extres:</strong> {dades.lletresExtres.join(', ').toUpperCase()}
                </p>
            </div>

            {/* Add word form */}
            <div className="mb-6 p-4 bg-green-50 rounded-md">
                <h6 className="text-sm font-medium text-gray-700 mb-3">Afegir nova paraula:</h6>
                <div className="flex items-center space-x-3">
                    <div className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={novaParaula}
                            onChange={(e) => setNovaParaula(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Escriu una paraula..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                        />
                    </div>
                    <Button
                        fun={handleAfegirParaula}
                    >
                        Afegir
                    </Button>
                </div>
                <Button fun={() => setShowDetails(!showDetails)} className="mt-2">Mostrar / Ocultar detalls</Button>
                {error && (
                    <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-md">
                        {error}
                    </div>
                )}
            </div>

            {/* Show/hide details */}
            {showDetails && (
                <div>
                    {/* Words count summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Total paraules trobades: {paraulesTrobades.length}</span>
                            {dades.pistes && (
                                <span className="text-sm text-gray-600">
                                    de {dades.pistes.totalParaules} ({Math.round((paraulesTrobades.length / dades.pistes.totalParaules) * 100)}%)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Found words by letter */}
                    {paraulesTrobades.length > 0 && (
                        <div className="mb-6">
                            <h6 className="text-sm font-medium text-gray-700 mb-3">Paraules per lletra inicial:</h6>
                            <div className="max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
                                {totesLesLletres.sort().map(lletra => {
                                    const paraules = paraulesPerLletra[lletra] || [];
                                    if (paraules.length === 0) return null;

                                    return (
                                        <div key={lletra} className="mb-4">
                                            <div className="font-bold text-lg mb-2 flex items-center">
                                                <span className="bg-white px-3 py-1 rounded mr-3">{lletra.toUpperCase()}</span>
                                                <span className="text-sm text-gray-600">({paraules.length} paraules)</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                                {paraules.map(paraula => (
                                                    <div key={paraula} className="bg-white p-2 rounded flex items-center justify-between">
                                                        <span className="font-mono text-sm">{paraula}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEliminarParaula(paraula)}
                                                            className="text-red-500 hover:text-red-700 ml-2 text-xs"
                                                            title="Eliminar"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {paraulesTrobades.length === 0 && (
                        <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-300 rounded-md mb-6">
                            No hi ha paraules trobades encara
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
