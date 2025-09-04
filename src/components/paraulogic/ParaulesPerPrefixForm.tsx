'use client'

import { generatePrefixes } from '@/utils/combinations';

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
    
    const prefixes = generatePrefixes(lletres);

    return (
        <div>
            <h5 className="text-md font-medium text-gray-700 mb-3">
                Paraules per prefix de 2 lletres
            </h5>
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