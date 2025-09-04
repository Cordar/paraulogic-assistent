'use client'

import { useState } from "react";
import { GameData } from '@/types/paraulogic';
import { guardarDades } from '@/utils/localStorage';
import Button from './Button';
import ParaulesPerLletraForm from './ParaulesPerLletraForm';
import ParaulesPerSubgrupForm from './ParaulesPerSubgrupForm';
import ParaulesPerPrefixForm from './ParaulesPerPrefixForm';

interface PistesFormProps {
    dades: GameData;
    onComplete: () => void;
    onCancel: () => void;
}

export default function PistesForm({ dades, onComplete, onCancel }: PistesFormProps) {
    const [totalParaules, setTotalParaules] = useState(dades.pistes?.totalParaules || 0);
    const [paraulesPerLletra, setParaulesPerLletra] = useState(
        dades.pistes?.paraulesPerLletra || {}
    );
    const [paraulesPerSubgrup, setParaulesPerSubgrup] = useState(
        dades.pistes?.paraulesPerSubgrup || {}
    );
    const [paraulesPerPrefix, setParaulesPerPrefix] = useState(
        dades.pistes?.paraulesPerPrefix || {}
    );

    const totesLesLletres = [dades.lletraPrincipal, ...dades.lletresExtres];

    const handleParaulesPerLletraChange = (lletra: string, field: 'count' | 'lengths' | 'lengthCounts', value: number | number[] | { [length: number]: number }) => {
    setParaulesPerLletra(prev => ({
        ...prev,
        [lletra]: {
            ...prev[lletra],
            [field]: value
        }
    }));
};


    const handleSubgrupChange = (subgrup: string, count: number) => {
        setParaulesPerSubgrup(prev => ({
            ...prev,
            [subgrup]: count
        }));
    };

    const handlePrefixChange = (prefix: string, count: number) => {
        setParaulesPerPrefix(prev => ({
            ...prev,
            [prefix]: count
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dadesActualitzades: GameData = {
            ...dades,
            pistes: {
                totalParaules,
                paraulesPerLletra,
                paraulesPerSubgrup,
                paraulesPerPrefix
            }
        };

        guardarDades(dadesActualitzades);
        onComplete();
    };

    return (
        <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold mb-4">Introdueix les pistes del joc</h4>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Total de paraules */}
                <div className="bg-blue-50 p-4 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total de paraules del joc
                    </label>
                    <input
                        type="number"
                        value={totalParaules}
                        onChange={(e) => setTotalParaules(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="0"
                        placeholder="0"
                    />
                </div>

                {/* Paraules per lletra */}
                <ParaulesPerLletraForm
                    lletres={totesLesLletres}
                    paraulesPerLletra={paraulesPerLletra}
                    onChange={handleParaulesPerLletraChange}
                />

                {/* Paraules per prefix */}
                <ParaulesPerPrefixForm
                    lletres={totesLesLletres}
                    paraulesPerPrefix={paraulesPerPrefix}
                    onChange={handlePrefixChange}
                />

                {/* Paraules per subgrup */}
                <ParaulesPerSubgrupForm
                    lletres={totesLesLletres}
                    paraulesPerSubgrup={paraulesPerSubgrup}
                    onChange={handleSubgrupChange}
                />

                {/* Botons */}
                <div className="flex justify-between pt-6 border-t">
                    <Button fun={onCancel} variant="secondary">
                        Cancel·lar
                    </Button>
                    <Button fun={() => {}} type="submit" variant="primary">
                        Guardar Pistes
                    </Button>
                </div>
            </form>
        </div>
    );
}