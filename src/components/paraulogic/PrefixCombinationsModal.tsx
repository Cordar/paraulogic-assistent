'use client'

import { useState, useEffect, useMemo } from 'react';

interface PrefixCombinationsModalProps {
    prefix: string;
    length: number;
    subgroups: string[];
    availableLetters: string[];
    mainLetter: string;
    foundWords: string[]; // Global list of found words
    onAddFoundWord: (word: string) => void; // Function to add word to found words
    onRemoveFoundWord: (word: string) => void; // Function to remove word from found words
    isOpen: boolean;
    onClose: () => void;
}

interface CombinationData {
    combination: string;
    matchingSubgroups: string[];
    probabilityScore: number;
}

type CombinationStatus = 'untried' | 'tried' | 'correct';

export default function PrefixCombinationsModal({ 
    prefix, 
    length, 
    subgroups, 
    availableLetters,
    mainLetter,
    foundWords,
    onAddFoundWord,
    onRemoveFoundWord,
    isOpen,
    onClose 
}: PrefixCombinationsModalProps) {
    const [triedCombinations, setTriedCombinations] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    // Define vowels and consonants for Catalan/Spanish
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const allowedDoubleConsonants = new Set(['r', 's', 'l']);
    
    // Bad consonant combinations (sound unnatural)
    const badConsonantCombinations = new Set([
        'bp', 'bt', 'bk', 'bg', 'bf', 'bx', 'bz',
        'pb', 'pt', 'pk', 'pf', 'px', 'pz',
        'tk', 'tg', 'tx', 'tz', 'tf',
        'kt', 'kg', 'kf', 'kx', 'kz',
        'gf', 'gx', 'gz', 'gb', 'gp', 'gt', 'gk',
        'fb', 'fp', 'ft', 'fk', 'fg', 'fx', 'fz',
        'xb', 'xp', 'xt', 'xk', 'xg', 'xf', 'xz',
        'zb', 'zp', 'zt', 'zk', 'zg', 'zf', 'zx',
        'jb', 'jp', 'jt', 'jk', 'jg', 'jf', 'jx', 'jz',
        'qb', 'qp', 'qt', 'qk', 'qg', 'qf', 'qx', 'qz'
    ]);

    // Helper function to check if a word has more than 2 consecutive letters
    const hasMoreThanTwoConsecutiveLetters = (word: string): boolean => {
        for (let i = 0; i < word.length - 2; i++) {
            if (word[i] === word[i + 1] && word[i + 1] === word[i + 2]) {
                return true; // Found 3 consecutive identical letters
            }
        }
        return false;
    };

    // Function to calculate probability score for a word
    const calculateProbabilityScore = (word: string): number => {
        let score = 100; // Start with base score

        // Check for consecutive repeated letters (except r, s, l)
        for (let i = 0; i < word.length - 1; i++) {
            if (word[i] === word[i + 1]) {
                if (!allowedDoubleConsonants.has(word[i])) {
                    score -= 30; // Heavy penalty for bad double letters
                } else {
                    score += 5; // Small bonus for natural double letters (rr, ss, ll)
                }
            }
        }

        // Check for consecutive consonants
        let consecutiveConsonants = 0;
        let currentConsonantCluster = '';
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            
            if (!vowels.has(char)) {
                // It's a consonant
                consecutiveConsonants++;
                currentConsonantCluster += char;
                
                if (consecutiveConsonants >= 2) {
                    // Check for particularly bad consonant combinations
                    const lastTwo = currentConsonantCluster.slice(-2);
                    if (badConsonantCombinations.has(lastTwo)) {
                        score -= 50; // Very heavy penalty for bad combinations
                    } else if (consecutiveConsonants === 2) {
                        // Check for some natural combinations that are okay
                        const naturalCombos = ['br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr', 
                                             'bl', 'cl', 'fl', 'gl', 'pl', 
                                             'ch', 'th', 'sh', 'st', 'sc', 'sp', 'sm', 'sn',
                                             'nt', 'nd', 'ng', 'nk', 'mp', 'mb', 
                                             'lt', 'rt', 'rn', 'rm', 'rp', 'rb', 'rc', 'rd', 'rf', 'rg'];
                        
                        if (naturalCombos.includes(lastTwo)) {
                            score += 2; // Small bonus for natural combinations
                        } else {
                            score -= 15; // Penalty for unnatural consonant pairs
                        }
                    } else if (consecutiveConsonants >= 3) {
                        score -= 25; // Heavy penalty for 3+ consecutive consonants
                    }
                }
            } else {
                // It's a vowel - reset consonant counter
                consecutiveConsonants = 0;
                currentConsonantCluster = '';
            }
        }

        // Bonus for alternating vowel-consonant patterns
        let alternatingBonus = 0;
        for (let i = 0; i < word.length - 1; i++) {
            const current = vowels.has(word[i]);
            const next = vowels.has(word[i + 1]);
            if (current !== next) {
                alternatingBonus += 2; // Small bonus for alternating pattern
            }
        }
        score += alternatingBonus;

        // Bonus for words starting with consonant (more natural in Catalan/Spanish)
        if (!vowels.has(word[0])) {
            score += 5;
        }

        // Bonus for words ending with vowel (common in Catalan/Spanish)
        if (vowels.has(word[word.length - 1])) {
            score += 3;
        }

        // Penalty for too many vowels in a row
        let consecutiveVowels = 0;
        for (let i = 0; i < word.length; i++) {
            if (vowels.has(word[i])) {
                consecutiveVowels++;
                if (consecutiveVowels >= 3) {
                    score -= 10; // Penalty for 3+ consecutive vowels
                }
            } else {
                consecutiveVowels = 0;
            }
        }

        // Ensure score doesn't go negative
        return Math.max(score, 0);
    };

    // Load combinations from localStorage on component mount
    useEffect(() => {
        const loadCombinations = () => {
            try {
                const savedTried = localStorage.getItem('paraulogic-tried-combinations');
                
                if (savedTried) {
                    const triedArray = JSON.parse(savedTried);
                    console.log('Loaded tried from localStorage:', triedArray);
                    setTriedCombinations(new Set(triedArray));
                }
            } catch (error) {
                console.error('Error loading combinations:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadCombinations();
    }, []);

    // Save tried combinations to localStorage whenever they change
    useEffect(() => {
        if (!isLoaded) return;

        try {
            const triedArray = [...triedCombinations];
            localStorage.setItem('paraulogic-tried-combinations', JSON.stringify(triedArray));
            console.log('Saved tried to localStorage:', triedArray);
        } catch (error) {
            console.error('Error saving tried combinations:', error);
        }
    }, [triedCombinations, isLoaded]);

    const getCombinationStatus = (combination: string): CombinationStatus => {
        if (foundWords.includes(combination)) return 'correct';
        if (triedCombinations.has(combination)) return 'tried';
        return 'untried';
    };

    const toggleCombinationStatus = (combination: string, newStatus: CombinationStatus) => {
        console.log('Setting combination status:', combination, newStatus);
        
        const currentStatus = getCombinationStatus(combination);
        
        // Handle tried status
        setTriedCombinations(prev => {
            const newSet = new Set(prev);
            if (newStatus === 'tried') {
                newSet.add(combination);
            } else {
                newSet.delete(combination);
            }
            return newSet;
        });
        
        // Handle correct status - sync with found words
        if (newStatus === 'correct' && currentStatus !== 'correct') {
            // Mark as correct - add to found words if not already there
            if (!foundWords.includes(combination)) {
                onAddFoundWord(combination);
            }
        } else if (newStatus !== 'correct' && currentStatus === 'correct') {
            // Unmark as correct - remove from found words
            onRemoveFoundWord(combination);
        }
    };

    // Filter subgroups that contain all letters from the prefix
    const relevantSubgroups = useMemo(() => {
        return subgroups.filter(subgroup => {
            const subgroupLetters = new Set(subgroup.split(''));
            return prefix.split('').every(letter => subgroupLetters.has(letter));
        });
    }, [subgroups, prefix]);

    // Generate all valid combinations
    const baseCombinations = useMemo(() => {
        if (!isOpen || length < prefix.length) return [];

        const remainingLength = length - prefix.length;
        if (remainingLength === 0) {
            if (!prefix.includes(mainLetter)) {
                return [];
            }

            // Check if prefix has more than 2 consecutive letters
            if (hasMoreThanTwoConsecutiveLetters(prefix)) {
                return [];
            }

            const matchingSubgroups = subgroups.filter(subgroup => {
                const subgroupLetters = new Set(subgroup.split(''));
                return prefix.split('').every(letter => subgroupLetters.has(letter));
            });

            if (matchingSubgroups.length > 0) {
                return [{
                    combination: prefix,
                    matchingSubgroups,
                    probabilityScore: calculateProbabilityScore(prefix)
                }];
            }
            return [];
        }

        const results: CombinationData[] = [];
        const prefixContainsMainLetter = prefix.includes(mainLetter);

        const generateCombinations = (currentCombo: string, remainingPos: number, hasMainLetter: boolean) => {
            if (remainingPos === 0) {
                if (!hasMainLetter) {
                    return;
                }

                // Filter out combinations with more than 2 consecutive letters
                if (hasMoreThanTwoConsecutiveLetters(currentCombo)) {
                    return;
                }

                const matchingSubgroups = subgroups.filter(subgroup => {
                    const subgroupLetters = new Set(subgroup.split(''));
                    return currentCombo.split('').every(letter => subgroupLetters.has(letter));
                });

                if (matchingSubgroups.length > 0) {
                    results.push({
                        combination: currentCombo,
                        matchingSubgroups,
                        probabilityScore: calculateProbabilityScore(currentCombo)
                    });
                }
                return;
            }

            availableLetters.forEach(letter => {
                const newHasMainLetter = hasMainLetter || letter === mainLetter;
                const newCombo = currentCombo + letter;
                
                // Early pruning: if adding this letter would create 3 consecutive identical letters, skip it
                const len = newCombo.length;
                if (len >= 3 && 
                    newCombo[len - 1] === newCombo[len - 2] && 
                    newCombo[len - 2] === newCombo[len - 3]) {
                    return;
                }
                
                generateCombinations(newCombo, remainingPos - 1, newHasMainLetter);
            });
        };

        generateCombinations(prefix, remainingLength, prefixContainsMainLetter);

        const uniqueResults = results.filter((combo, index, array) => 
            array.findIndex(c => c.combination === combo.combination) === index
        );

        // Sort by probability score (highest first), then alphabetically
        return uniqueResults.sort((a, b) => {
            if (a.probabilityScore !== b.probabilityScore) {
                return b.probabilityScore - a.probabilityScore; // Higher score first
            }
            return a.combination.localeCompare(b.combination); // Alphabetical as secondary sort
        });
    }, [prefix, length, subgroups, availableLetters, mainLetter, isOpen]);

    // Combine base combinations with status
    const combinations = useMemo(() => {
        return baseCombinations.map(combo => ({
            ...combo,
            status: getCombinationStatus(combo.combination)
        }));
    }, [baseCombinations, triedCombinations, foundWords]);

    const triedCount = combinations.filter(c => c.status === 'tried').length;
    const correctCount = combinations.filter(c => c.status === 'correct').length;
    const untriedCount = combinations.filter(c => c.status === 'untried').length;

    // Get probability distribution for display
    const probabilityStats = useMemo(() => {
        const scores = combinations.map(c => c.probabilityScore);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        return {
            max: maxScore,
            min: minScore,
            avg: Math.round(avgScore)
        };
    }, [combinations]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            🎯 Combinacions amb prefix "{prefix.toUpperCase()}"
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                            Llargada: {length} lletres • Lletra principal: <span className="font-bold text-blue-600">{mainLetter.toUpperCase()}</span> • 
                            <span className="text-green-600 font-medium"> {correctCount} correctes</span>, 
                            <span className="text-orange-600 font-medium"> {triedCount} provades</span>, 
                            <span className="text-gray-600"> {untriedCount} pendents</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            Ordenat per probabilitat • Puntuació: {probabilityStats.min}-{probabilityStats.max} (mitjana: {probabilityStats.avg})
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Info */}
                <div className="p-4 bg-blue-50 border-b border-gray-200">
                    <div className="text-sm text-blue-800">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <span className="font-medium">Prefix:</span> {prefix.toUpperCase()}
                            </div>
                            <div>
                                <span className="font-medium">Llargada total:</span> {length} lletres
                            </div>
                            <div>
                                <span className="font-medium">Lletra principal:</span> 
                                <span className="ml-1 font-mono font-bold text-blue-700">
                                    {mainLetter.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium">Subgrups compatibles:</span> 
                                <span className="ml-1 font-mono">
                                    {relevantSubgroups.length > 0 
                                        ? relevantSubgroups.map(s => s.toUpperCase()).join(', ')
                                        : 'Cap'
                                    }
                                </span>
                                {relevantSubgroups.length > 0 && (
                                    <span className="ml-2 text-xs text-blue-600">
                                        ({relevantSubgroups.length} de {subgroups.length})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-700">
                            📊 Ordenades per probabilitat de ser paraules reals (patrons de vocals/consonants)
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {combinations.length > 0 && (
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progrés</span>
                            <span className="text-sm text-gray-600">
                                {Math.round(((triedCount + correctCount) / combinations.length) * 100)}% explorat
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-orange-400 to-gray-300 relative overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-green-500"
                                    style={{ width: `${(correctCount / combinations.length) * 100}%` }}
                                ></div>
                                <div 
                                    className="absolute top-0 h-full bg-orange-400"
                                    style={{ 
                                        left: `${(correctCount / combinations.length) * 100}%`,
                                        width: `${(triedCount / combinations.length) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>✅ {correctCount} correctes</span>
                            <span>🔴 {triedCount} provades</span>
                            <span>⚪ {untriedCount} pendents</span>
                        </div>
                    </div>
                )}

                {/* Combinations Grid */}
                <div className="p-4">
                    {combinations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🚫</div>
                            <div className="text-lg font-medium mb-2">
                                No hi ha combinacions vàlides
                            </div>
                            <div className="text-sm text-gray-400">
                                Comprova que el prefix i la llargada siguin compatibles amb els subgrups disponibles,
                                <br />
                                que continguin la lletra principal <strong>{mainLetter.toUpperCase()}</strong>
                                <br />
                                i que no tinguin més de 2 lletres consecutives iguals.
                                <br />
                                <span className="text-blue-600">
                                    Subgrups que contenen "{prefix.toUpperCase()}": {relevantSubgroups.length > 0 ? relevantSubgroups.map(s => s.toUpperCase()).join(', ') : 'Cap'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-800 mb-1">
                                        Combinacions possibles ({combinations.length}):
                                    </h4>
                                    <div className="text-sm text-gray-600">
                                        <div>Clica esquerra: marcar com a <span className="text-orange-600 font-medium">provada</span></div>
                                        <div>Clica dreta: marcar com a <span className="text-green-600 font-medium">correcta</span> (s'afegeix a la llista global)</div>
                                        <div className="text-blue-600 mt-1">
                                            Ordenades per probabilitat • Les més probables apareixen primer
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Clear buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            // Remove all current modal combinations from found words
                                            const currentModalCorrectCombinations = combinations
                                                .filter(c => c.status === 'correct')
                                                .map(c => c.combination);
                                            currentModalCorrectCombinations.forEach(combo => {
                                                onRemoveFoundWord(combo);
                                            });
                                        }}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        disabled={correctCount === 0}
                                    >
                                        Netejar correctes
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentModalCombinations = combinations
                                                .filter(c => c.status === 'tried')
                                                .map(c => c.combination);
                                            setTriedCombinations(prev => {
                                                const newSet = new Set(prev);
                                                currentModalCombinations.forEach(combo => newSet.delete(combo));
                                                return newSet;
                                            });
                                        }}
                                        className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                        disabled={triedCount === 0}
                                    >
                                        Netejar provades
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {combinations.map(combo => {
                                    // Determine color intensity based on probability score
                                    const scoreRatio = (combo.probabilityScore - probabilityStats.min) / 
                                                      Math.max(1, probabilityStats.max - probabilityStats.min);
                                    const isHighProbability = scoreRatio > 0.7;
                                    const isMediumProbability = scoreRatio > 0.4;

                                    return (
                                        <div key={combo.combination} className="relative">
                                            <button
                                                onClick={() => {
                                                    const currentStatus = combo.status;
                                                    const newStatus = currentStatus === 'untried' ? 'tried' : 
                                                                    currentStatus === 'tried' ? 'untried' : 'untried';
                                                    toggleCombinationStatus(combo.combination, newStatus);
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    const currentStatus = combo.status;
                                                    const newStatus = currentStatus === 'correct' ? 'untried' : 'correct';
                                                    toggleCombinationStatus(combo.combination, newStatus);
                                                }}
                                                className={`
                                                    w-full px-3 py-3 rounded-lg border-2 font-mono text-sm font-medium
                                                    transition-all duration-200 transform hover:scale-105 active:scale-95
                                                    ${combo.status === 'correct' 
                                                        ? 'bg-green-100 text-green-800 border-green-400 shadow-md' 
                                                        : combo.status === 'tried'
                                                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                                                        : isHighProbability
                                                        ? 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200 hover:shadow-md font-bold'
                                                        : isMediumProbability
                                                        ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:shadow-md'
                                                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                                                    }
                                                `}
                                                title={`Subgrups: ${combo.matchingSubgroups.join(', ')}\nProbabilitat: ${combo.probabilityScore}/100\nClica esquerra: marcar com provada\nClica dreta: marcar com correcta\nEstat actual: ${combo.status === 'correct' ? 'correcta (a la llista global)' : combo.status === 'tried' ? 'provada' : 'pendent'}`}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1">
                                                        {combo.status === 'correct' && <span className="text-xs">✅</span>}
                                                        {combo.status === 'tried' && <span className="text-xs">🔴</span>}
                                                        <span>
                                                            {combo.combination.toUpperCase().split('').map((letter, index) => (
                                                                <span 
                                                                    key={index}
                                                                    className={letter === mainLetter.toUpperCase() ? 'text-red-600 font-bold' : ''}
                                                                >
                                                                    {letter}
                                                                </span>
                                                            ))}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {combo.matchingSubgroups.length > 1 
                                                            ? `${combo.matchingSubgroups.length} subgrups`
                                                            : combo.matchingSubgroups[0]?.toUpperCase()
                                                        }
                                                    </div>
                                                    <div className={`text-xs font-bold ${
                                                        isHighProbability ? 'text-green-600' :
                                                        isMediumProbability ? 'text-yellow-600' :
                                                        'text-gray-500'
                                                    }`}>
                                                        {combo.probabilityScore}
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            {/* Probability indicator */}
                                            <div className={`absolute -top-1 -right-1 text-xs px-1 rounded-full font-bold ${
                                                isHighProbability ? 'bg-green-500 text-white' :
                                                isMediumProbability ? 'bg-yellow-500 text-white' :
                                                'bg-gray-400 text-white'
                                            }`}>
                                                {isHighProbability ? '★' : isMediumProbability ? '◐' : '◯'}
                                            </div>
                                            
                                            {/* Status indicator */}
                                            {combo.status !== 'untried' && (
                                                <div className={`absolute -top-1 -left-1 text-xs px-1 rounded-full font-bold ${
                                                    combo.status === 'correct' 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-orange-500 text-white'
                                                }`}>
                                                    {combo.status === 'correct' ? '✓' : '×'}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Statistics */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium mb-2 text-gray-800">📊 Resum:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-blue-600">
                                            {combinations.length}
                                        </div>
                                        <div className="text-gray-600">Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-green-600">
                                            {correctCount}
                                        </div>
                                        <div className="text-gray-600">Correctes</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-orange-600">
                                            {triedCount}
                                        </div>
                                        <div className="text-gray-600">Provades</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-gray-600">
                                            {untriedCount}
                                        </div>
                                        <div className="text-gray-600">Pendents</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg text-purple-600">
                                            {[...new Set(combinations.flatMap(c => c.matchingSubgroups))].length}
                                        </div>
                                        <div className="text-gray-600">Subgrups</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-600">
                                    <div className="mb-2 font-medium">Indicadors de probabilitat:</div>
                                    <div className="flex flex-wrap gap-4">
                                        <span>★ = Alta probabilitat (70%+)</span>
                                        <span>◐ = Mitjana probabilitat (40-70%)</span>
                                        <span>◯ = Baixa probabilitat (40%)</span>
                                    </div>
                                    <div className="mt-2 text-gray-500">
                                        * Basat en patrons de vocals/consonants naturals en català
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Les paraules correctes s'afegeixen automàticament a la llista global
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Tancar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}