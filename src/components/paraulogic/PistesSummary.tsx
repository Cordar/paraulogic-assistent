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
            const lletresSubgrup = new Set(subgrup.split(''));
            const paraulesAmbSubgrup = paraulesTrobades.filter(paraula => {
                const lletresParaula = new Set(paraula.split(''));
                
                // Check if both sets are identical (same size and same elements)
                return lletresParaula.size === lletresSubgrup.size && 
                    [...lletresParaula].every(lletra => lletresSubgrup.has(lletra));
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

    // Get all lengths that have expected data
    const getAllExpectedLengths = (): number[] => {
        const lengths = new Set<number>();
        totesLesLletres.forEach(lletra => {
            const pista = pistes.paraulesPerLletra[lletra];
            if (pista?.lengthCounts) {
                Object.keys(pista.lengthCounts).forEach(length => {
                    lengths.add(parseInt(length));
                });
            }
        });
        return Array.from(lengths).sort((a, b) => a - b);
    };

    const expectedLengths = getAllExpectedLengths();

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

            {/* Detailed table by letter and length */}
            {expectedLengths.length > 0 && (
                <div className="mb-8">
                    <h5 className="font-medium mb-4 text-lg">Detall per lletra i longitud:</h5>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold sticky left-0 bg-gray-100 z-10">
                                        Lletra
                                    </th>
                                    {expectedLengths.map(length => (
                                        <th key={length} className="border border-gray-300 px-2 py-2 text-center font-semibold min-w-[80px]">
                                            {length}
                                        </th>
                                    ))}
                                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold bg-blue-50">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {totesLesLletres.sort().map(lletra => {
                                    const pista = pistes.paraulesPerLletra[lletra];
                                    const trobades = analisiParaules.perLletra[lletra];
                                    const totalTrobades = trobades?.count || 0;
                                    const totalEsperades = pista?.count || 0;

                                    return (
                                        <tr key={lletra} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-3 py-2 font-bold text-lg bg-gray-50 sticky left-0 z-10">
                                                {lletra.toUpperCase()}
                                            </td>
                                            {expectedLengths.map(length => {
                                                const expectedCount = pista?.lengthCounts?.[length] || 0;
                                                const foundCount = trobades?.lengths[length] || 0;
                                                const missing = Math.max(0, expectedCount - foundCount);
                                                
                                                if (expectedCount === 0) {
                                                    return (
                                                        <td key={length} className="border border-gray-300 px-2 py-2 text-center text-gray-400">
                                                            -
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={length} className={`border border-gray-300 px-2 py-2 text-center ${getProgressColor(foundCount, expectedCount)}`}>
                                                        <div className="font-semibold">
                                                            {foundCount}/{expectedCount}
                                                        </div>
                                                        {missing > 0 && (
                                                            <div className="text-xs text-red-600">
                                                                -{missing}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className={`border border-gray-300 px-3 py-2 text-center font-bold sticky right-0 z-10 ${getProgressColor(totalTrobades, totalEsperades)}`}>
                                                {totalTrobades}/{totalEsperades}
                                                {totalEsperades > totalTrobades && (
                                                    <div className="text-xs text-red-600">
                                                        -{totalEsperades - totalTrobades}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                
                                {/* Totals row */}
                                <tr className="bg-yellow-50 font-semibold">
                                    <td className="border border-gray-300 px-3 py-2 font-bold sticky left-0 bg-yellow-50 z-10">
                                        TOTAL
                                    </td>
                                    {expectedLengths.map(length => {
                                        const totalExpected = totesLesLletres.reduce((sum, lletra) => {
                                            const pista = pistes.paraulesPerLletra[lletra];
                                            return sum + (pista?.lengthCounts?.[length] || 0);
                                        }, 0);
                                        const totalFound = totesLesLletres.reduce((sum, lletra) => {
                                            const trobades = analisiParaules.perLletra[lletra];
                                            return sum + (trobades?.lengths[length] || 0);
                                        }, 0);
                                        const totalMissing = Math.max(0, totalExpected - totalFound);

                                        if (totalExpected === 0) {
                                            return (
                                                <td key={length} className="border border-gray-300 px-2 py-2 text-center text-gray-400">
                                                    -
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={length} className="border border-gray-300 px-2 py-2 text-center">
                                                <div className="font-semibold">
                                                    {totalFound}/{totalExpected}
                                                </div>
                                                {totalMissing > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        -{totalMissing}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-yellow-100 sticky right-0 z-10">
                                        {paraulesTrobades.length}/{pistes.totalParaules}
                                        {pistes.totalParaules > paraulesTrobades.length && (
                                            <div className="text-xs text-red-600">
                                                -{pistes.totalParaules - paraulesTrobades.length}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        • Verd: complet | Groc: parcial | Vermell: sense trobar | Els números negatius mostren les paraules que falten
                    </p>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <h5 className="font-medium mb-3 text-lg">Recomanacions estratègiques:</h5>
                <div className="text-sm text-gray-600 mb-4">
                    <p>Estratègia: Busca primer les paraules més curtes, són més fàcils de trobar i et donaran més punts per lletra.</p>
                </div>
                
                {(() => {
                    // Get missing words by letter and length, prioritizing shorter words
                    const missingByLetterAndLength: { [letter: string]: { [length: number]: number } } = {};
                    const availablePrefixes: { [letter: string]: string[] } = {};
                    const availableSubgroups: { [letter: string]: string[] } = {};
                    
                    totesLesLletres.forEach(lletra => {
                        const pista = pistes.paraulesPerLletra[lletra];
                        const trobades = analisiParaules.perLletra[lletra];
                        
                        if (pista?.lengthCounts) {
                            Object.entries(pista.lengthCounts).forEach(([length, expectedCount]) => {
                                const lengthNum = parseInt(length);
                                const foundCount = trobades?.lengths[lengthNum] || 0;
                                const missing = expectedCount - foundCount;
                                
                                if (missing > 0) {
                                    if (!missingByLetterAndLength[lletra]) {
                                        missingByLetterAndLength[lletra] = {};
                                    }
                                    missingByLetterAndLength[lletra][lengthNum] = missing;
                                }
                            });
                        }
                        
                        // Get available prefixes for this letter
                        availablePrefixes[lletra] = Object.keys(pistes.paraulesPerPrefix)
                            .filter(prefix => {
                                const startsWithLetter = prefix.startsWith(lletra);
                                const expectedCount = pistes.paraulesPerPrefix[prefix];
                                const foundCount = analisiParaules.perPrefix[prefix] || 0;
                                return startsWithLetter && expectedCount > foundCount;
                            })
                            .sort((a, b) => a.length - b.length); // Shorter prefixes first
                        
                        // Get available subgroups that include this letter
                        availableSubgroups[lletra] = Object.keys(pistes.paraulesPerSubgrup)
                            .filter(subgrup => {
                                const includesLetter = subgrup.includes(lletra);
                                const expectedCount = pistes.paraulesPerSubgrup[subgrup];
                                const foundCount = analisiParaules.perSubgrup[subgrup] || 0;
                                return includesLetter && expectedCount > foundCount;
                            })
                            .sort((a, b) => a.length - b.length); // Shorter subgroups first
                    });
                    
                    // Sort letters by shortest missing words first, then by most missing words
                    const sortedLetters = Object.keys(missingByLetterAndLength)
                        .sort((a, b) => {
                            const shortestA = Math.min(...Object.keys(missingByLetterAndLength[a]).map(l => parseInt(l)));
                            const shortestB = Math.min(...Object.keys(missingByLetterAndLength[b]).map(l => parseInt(l)));
                            
                            if (shortestA !== shortestB) {
                                return shortestA - shortestB; // Shorter words first
                            }
                            
                            // If same shortest length, prioritize by total missing words
                            const totalMissingA = Object.values(missingByLetterAndLength[a]).reduce((sum, count) => sum + count, 0);
                            const totalMissingB = Object.values(missingByLetterAndLength[b]).reduce((sum, count) => sum + count, 0);
                            return totalMissingB - totalMissingA;
                        })
                        .slice(0, 4); // Show top 4 letters
                    
                    return (
                        <div className="space-y-4">
                            {sortedLetters.map(lletra => {
                                const missingLengths = missingByLetterAndLength[lletra];
                                const shortestLength = Math.min(...Object.keys(missingLengths).map(l => parseInt(l)));
                                const shortestMissing = missingLengths[shortestLength];
                                const prefixes = availablePrefixes[lletra] || [];
                                const subgroups = availableSubgroups[lletra] || [];
                                
                                return (
                                    <div key={lletra} className="bg-white p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-center mb-3">
                                            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                                            <div className="font-semibold text-base">
                                                Lletra <strong className="text-xl">{lletra.toUpperCase()}</strong>
                                                <span className="ml-2 text-sm font-normal text-gray-600">
                                                    (prioritat: {shortestMissing} paraules de {shortestLength} lletres)
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {/* Missing by length */}
                                            <div>
                                                <div className="font-medium text-gray-700 mb-2">📏 Paraules que falten:</div>
                                                <div className="space-y-1">
                                                    {Object.entries(missingLengths)
                                                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                        .map(([length, missing]) => (
                                                            <div key={length} className={`flex justify-between px-2 py-1 rounded ${parseInt(length) === shortestLength ? 'bg-yellow-100 font-semibold' : 'bg-gray-50'}`}>
                                                                <span>{length} lletres:</span>
                                                                <span className="text-red-600 font-medium">{missing} paraules</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                            
                                            {/* Available strategies */}
                                            <div>
                                                <div className="font-medium text-gray-700 mb-2">🎯 Estratègies de cerca:</div>
                                                <div className="space-y-2">
                                                    {prefixes.length > 0 && (
                                                        <div>
                                                            <div className="text-xs text-gray-600 mb-1">Prefixos disponibles:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {prefixes.slice(0, 6).map(prefix => {
                                                                    const expectedCount = pistes.paraulesPerPrefix[prefix];
                                                                    const foundCount = analisiParaules.perPrefix[prefix] || 0;
                                                                    const missing = expectedCount - foundCount;
                                                                    return (
                                                                        <span key={prefix} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                                                                            {prefix.toUpperCase()}
                                                                            <span className="ml-1 text-green-600">({missing})</span>
                                                                        </span>
                                                                    );
                                                                })}
                                                                {prefixes.length > 6 && (
                                                                    <span className="text-xs text-gray-500">+{prefixes.length - 6} més</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {subgroups.length > 0 && (
                                                        <div>
                                                            <div className="text-xs text-gray-600 mb-1">Subgrups disponibles:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {subgroups.slice(0, 4).map(subgrup => {
                                                                    const expectedCount = pistes.paraulesPerSubgrup[subgrup];
                                                                    const foundCount = analisiParaules.perSubgrup[subgrup] || 0;
                                                                    const missing = expectedCount - foundCount;
                                                                    return (
                                                                        <span key={subgrup} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-mono">
                                                                            {subgrup.toUpperCase()}
                                                                            <span className="ml-1 text-purple-600">({missing})</span>
                                                                        </span>
                                                                    );
                                                                })}
                                                                {subgroups.length > 4 && (
                                                                    <span className="text-xs text-gray-500">+{subgroups.length - 4} més</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {prefixes.length === 0 && subgroups.length === 0 && (
                                                        <div className="text-xs text-gray-500 italic">
                                                            Busca paraules que comencin per {lletra.toUpperCase()} de {shortestLength} lletres
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {sortedLetters.length === 0 && (
                                <div className="text-center text-green-600 font-medium">
                                    🎉 Felicitats! Has trobat totes les paraules configurades!
                                </div>
                            )}
                        </div>
                    );
                })()}
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