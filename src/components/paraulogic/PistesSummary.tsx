'use client'

import { GameData } from '@/types/paraulogic';

interface PistesSummaryProps {
    dades: GameData;
}

export default function PistesSummary({ dades }: PistesSummaryProps) {
    if (!dades.pistes|| !dades.paraulesTrobades) {
        return (
            <div className="text-center text-gray-500 p-4">
                No hi ha pistes configurades
            </div>
        );
    }

    const { pistes, paraulesTrobades } = dades;
    const totesLesLletres = [dades.lletraPrincipal, ...dades.lletresExtres];

    // Analyze found words
    const analisiParaules = {
        perLletra: {} as { [key: string]: { count: number, lengths: { [length: number]: number } } },
        perSubgrup: {} as { [key: string]: number },
        perPrefix: {} as { [key: string]: number }
    };

    // Analyze words by letter and length
    paraulesTrobades.forEach(paraula => {
        const primeraLletra = paraula[0];
        const longitud = paraula.length;

        if (!analisiParaules.perLletra[primeraLletra]) {
            analisiParaules.perLletra[primeraLletra] = { count: 0, lengths: {} };
        }
        
        analisiParaules.perLletra[primeraLletra].count++;
        analisiParaules.perLletra[primeraLletra].lengths[longitud] = 
            (analisiParaules.perLletra[primeraLletra].lengths[longitud] || 0) + 1;
    });

    // Analyze words by subgroups
    Object.keys(pistes.paraulesPerSubgrup).forEach(subgrup => {
        if (pistes.paraulesPerSubgrup[subgrup] > 0) {
            const paraulesAmbSubgrup = paraulesTrobades.filter(paraula => {
                return subgrup.split('').every(lletra => paraula.includes(lletra));
            });
            analisiParaules.perSubgrup[subgrup] = paraulesAmbSubgrup.length;
        }
    });

    // Analyze words by prefix
    Object.keys(pistes.paraulesPerPrefix).forEach(prefix => {
        if (pistes.paraulesPerPrefix[prefix] > 0) {
            const paraulesAmbPrefix = paraulesTrobades.filter(paraula => paraula.startsWith(prefix));
            analisiParaules.perPrefix[prefix] = paraulesAmbPrefix.length;
        }
    });

    const getProgressColor = (found: number, total: number) => {
        if (found === 0) return 'bg-red-100 text-red-800';
        if (found >= total) return 'bg-green-100 text-green-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    const getProgressBar = (found: number, total: number) => {
        const percentage = total > 0 ? (found / total) * 100 : 0;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                    className={`h-2 rounded-full ${found >= total ? 'bg-green-500' : found > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
                <h4 className="text-xl font-semibold mb-2">Anàlisi de Progrés</h4>
                <div className="text-lg">
                    <span className="font-bold">{paraulesTrobades.length}</span> de <span className="font-bold">{pistes.totalParaules}</span> paraules trobades
                    <span className="text-sm text-gray-600 ml-2">
                        ({Math.round((paraulesTrobades.length / pistes.totalParaules) * 100)}%)
                    </span>
                </div>
                {getProgressBar(paraulesTrobades.length, pistes.totalParaules)}
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 p-6 rounded-lg">
                <h5 className="font-medium mb-3 text-lg">Recomanacions:</h5>
                <div className="space-y-2 text-sm">
                    {/* Letters with missing words */}
                    {totesLesLletres
                        .filter(lletra => {
                            const pista = pistes.paraulesPerLletra[lletra];
                            const trobades = analisiParaules.perLletra[lletra]?.count || 0;
                            return pista && pista.count > trobades;
                        })
                        .slice(0, 3)
                        .map(lletra => {
                            const pista = pistes.paraulesPerLletra[lletra];
                            const trobades = analisiParaules.perLletra[lletra]?.count || 0;
                            const falten = pista.count - trobades;
                            return (
                                <div key={lletra} className="flex items-center">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                    Busca {falten} paraules més que comencin per <strong className="ml-1"> {lletra.toUpperCase()}</strong>
                                </div>
                            );
                        })}
                    
                    {/* Subgroups with missing words */}
                    {Object.entries(pistes.paraulesPerSubgrup)
                        .filter(([subgrup, expectedCount]) => {
                            const foundCount = analisiParaules.perSubgrup[subgrup] || 0;
                            return expectedCount > foundCount;
                        })
                        .slice(0, 2)
                        .map(([subgrup, expectedCount]) => {
                            const foundCount = analisiParaules.perSubgrup[subgrup] || 0;
                            const falten = expectedCount - foundCount;
                            return (
                                <div key={subgrup} className="flex items-center">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    Busca {falten} paraules més amb les lletres <strong className="ml-1">{subgrup.toUpperCase()}</strong>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Progress by letter */}
            <div className="mb-8">
                <h5 className="font-medium mb-4 text-lg">Progrés per lletra inicial:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {totesLesLletres.sort().map(lletra => {
                        const pista = pistes.paraulesPerLletra[lletra];
                        const trobades = analisiParaules.perLletra[lletra];
                        const countTrobades = trobades?.count || 0;
                        const totalEsperades = pista?.count || 0;

                        return (
                            <div key={lletra} className={`p-4 rounded-lg border-2 ${getProgressColor(countTrobades, totalEsperades)}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-bold text-2xl">{lletra.toUpperCase()}</div>
                                    <div className="text-lg font-semibold">
                                        {countTrobades}/{totalEsperades}
                                    </div>
                                </div>
                                {getProgressBar(countTrobades, totalEsperades)}
                                
                                {/* Length breakdown */}
                                {pista?.lengthCounts && Object.keys(pista.lengthCounts).length > 0 && (
                                    <div className="mt-3 text-sm">
                                        <div className="font-medium mb-1">Per longitud:</div>
                                        {Object.entries(pista.lengthCounts)
                                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                            .map(([length, expectedCount]) => {
                                                const foundCount = trobades?.lengths[parseInt(length)] || 0;
                                                return (
                                                    <div key={length} className="flex justify-between items-center">
                                                        <span>{length} lletres:</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${getProgressColor(foundCount, expectedCount)}`}>
                                                            {foundCount}/{expectedCount}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress by subgroups */}
            {Object.keys(pistes.paraulesPerSubgrup).some(s => pistes.paraulesPerSubgrup[s] > 0) && (
                <div className="mb-8">
                    <h5 className="font-medium mb-4 text-lg">Progrés per subgrups:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(pistes.paraulesPerSubgrup)
                            .filter(([_, count]) => count > 0)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([subgrup, expectedCount]) => {
                                const foundCount = analisiParaules.perSubgrup[subgrup] || 0;
                                return (
                                    <div key={subgrup} className={`p-4 rounded-lg border-2 ${getProgressColor(foundCount, expectedCount)}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-mono text-lg font-bold">{subgrup.toUpperCase()}</div>
                                            <div className="text-lg font-semibold">
                                                {foundCount}/{expectedCount}
                                            </div>
                                        </div>
                                        {getProgressBar(foundCount, expectedCount)}
                                        <div className="text-xs text-gray-600 mt-1">
                                            Paraules amb totes aquestes lletres
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Progress by prefixes */}
            {Object.keys(pistes.paraulesPerPrefix).some(p => pistes.paraulesPerPrefix[p] > 0) && (
                <div className="mb-8">
                    <h5 className="font-medium mb-4 text-lg">Progrés per prefixos:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(pistes.paraulesPerPrefix)
                            .filter(([_, count]) => count > 0)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([prefix, expectedCount]) => {
                                const foundCount = analisiParaules.perPrefix[prefix] || 0;
                                return (
                                    <div key={prefix} className={`p-4 rounded-lg border-2 ${getProgressColor(foundCount, expectedCount)}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-mono text-lg font-bold">{prefix.toUpperCase()}</div>
                                            <div className="text-lg font-semibold">
                                                {foundCount}/{expectedCount}
                                            </div>
                                        </div>
                                        {getProgressBar(foundCount, expectedCount)}
                                        <div className="text-xs text-gray-600 mt-1">
                                            Paraules que comencen per "{prefix}"
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            
        </div>
    );
}