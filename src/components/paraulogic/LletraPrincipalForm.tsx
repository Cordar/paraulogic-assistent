'use client'

import { useState } from "react";
import { GameData } from '@/types/paraulogic';
import { guardarDades } from '@/utils/localStorage';

interface LletraPrincipalFormProps {
    onComplete: () => void;
}

export default function LletraPrincipalForm({ onComplete }: LletraPrincipalFormProps) {
    const [lletraPrincipal, setLletraPrincipal] = useState('');
    const [lletresExtres, setLletresExtres] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!lletraPrincipal || lletraPrincipal.length !== 1) {
            setError('La lletra principal ha de ser una sola lletra');
            return;
        }

        if (!lletresExtres || lletresExtres.length < 4 || lletresExtres.length > 6) {
            setError('Has d\'introduir entre 4 i 6 lletres extres');
            return;
        }

        const principal = lletraPrincipal.toLowerCase().trim();
        const extres = lletresExtres.toLowerCase().replace(/\s/g, '');

        const lletresRegex = /^[a-z]+$/;
        if (!lletresRegex.test(principal) || !lletresRegex.test(extres)) {
            setError('Només es permeten lletres');
            return;
        }

        const totesLesLletres = principal + extres;
        const lletresUniques = new Set(totesLesLletres);
        if (lletresUniques.size !== totesLesLletres.length) {
            setError('No es poden repetir lletres');
            return;
        }

        const dades: GameData = {
            lletraPrincipal: principal,
            lletresExtres: extres.split(''),
            dataCreacio: new Date().toISOString()
        };

        guardarDades(dades);
        onComplete();
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold mb-4">Configura les lletres</h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="lletraPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
                        Lletra Principal
                    </label>
                    <input
                        type="text"
                        id="lletraPrincipal"
                        value={lletraPrincipal}
                        onChange={(e) => setLletraPrincipal(e.target.value)}
                        maxLength={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
                        placeholder="A"
                    />
                </div>

                <div>
                    <label htmlFor="lletresExtres" className="block text-sm font-medium text-gray-700 mb-1">
                        Lletres Extres (4-6 lletres)
                    </label>
                    <input
                        type="text"
                        id="lletresExtres"
                        value={lletresExtres}
                        onChange={(e) => setLletresExtres(e.target.value)}
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-xl"
                        placeholder="BCDEF"
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="w-full bg-green-200 hover:bg-green-300 px-3 py-2 rounded-md"
                >
                    Continuar
                </button>
            </form>
        </div>
    );
}