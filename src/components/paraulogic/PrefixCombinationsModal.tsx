'use client'

import { Pistes } from "@/types/paraulogic";
import { useState, useEffect, useMemo, useCallback } from 'react';

interface PrefixCombinationsModalProps {
    prefix: string;
    length: number;
    subgroups: string[];
    availableLetters: string[];
    mainLetter: string;
    foundWords: string[]; // Global list of found words
    pistes: Pistes;
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
    pistes,
    onAddFoundWord,
    onRemoveFoundWord,
    isOpen,
    onClose 
}: PrefixCombinationsModalProps) {
    const [triedCombinations, setTriedCombinations] = useState<Set<string>>(new Set());
    const [isLoaded, setIsLoaded] = useState(false);

    // Define vowels and consonants for Catalan
    const vowels = useCallback(() => {
        return new Set(['a', 'e', 'i', 'o', 'u'])
    }, []);
    const allowedDoubleConsonants = useCallback(() => {
        return new Set(['r', 's', 'l']);
    }, []);

    // Bad consonant combinations (sound unnatural)
    const badConsonantCombinations = useCallback(() => {
        return new Set([
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
    }, []);

    // Catalan-specific consonant combinations that work at the beginning
    const catalanBeginningCombs = useCallback(() => {
        return new Set([
            'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
            'bl', 'cl', 'fl', 'gl', 'pl',
            'sc', 'sp', 'st', 'sq'
        ]);
    }, []);

    // Catalan-specific consonant combinations that work at the end
    const catalanEndCombs = useCallback(() => {
        return new Set([
            'nt', 'nd', 'ng', 'nk', 'mp', 'mb', 
            'lt', 'rt', 'rn', 'rm', 'rp', 'rc', 'rd', 'rf', 'rg',
            'st', 'ct', 'pt', 'xt', 'ny'
        ]);
    }, []);

    // Bad sounding vowel combinations specific to Catalan
    const badVowelCombinations = useCallback(() => {
        return new Set([
            'oa', 'ao', 'oe', 'eo', 'uo', 'ou', 
            'ae', 'ea', 'oo', 'aa', 'ii', 'uu', 'ee',
            'io', 'oi'
        ]);
    }, []);

    // Natural/acceptable vowel combinations in Catalan
    const catalanDiphthongs = useCallback(() => {
        return new Set([
            'ai', 'au', 'ei', 'eu', 'iu', 'ui',
            'ia', 'ie', 'ua', 'ue'
        ]);
    }, []);

    // Helper function to check if a word has more than 2 consecutive letters
    const hasMoreThanTwoConsecutiveLetters = (word: string): boolean => {
        for (let i = 0; i < word.length - 2; i++) {
            if (word[i] === word[i + 1] && word[i + 1] === word[i + 2]) {
                return true;
            }
        }
        return false;
    };

    // Function to calculate probability score for a word
    const calculateProbabilityScore = useCallback((word: string): number => {
        let score = 100;

        // Check for consecutive repeated letters (except r, s, l)
        for (let i = 0; i < word.length - 1; i++) {
            if (word[i] === word[i + 1]) {
                if (!allowedDoubleConsonants().has(word[i])) {
                    score -= 30;
                } else {
                    score += 5;
                }
            }
        }

        // Check for bad vowel combinations specific to Catalan
        for (let i = 0; i < word.length - 1; i++) {
            const currentChar = word[i];
            const nextChar = word[i + 1];
            
            if (vowels().has(currentChar) && vowels().has(nextChar)) {
                const vowelPair = currentChar + nextChar;
                
                if (badVowelCombinations().has(vowelPair)) {
                    if (['oa', 'ao', 'oe', 'eo'].includes(vowelPair)) {
                        score -= 30;
                    } else if (['uo', 'ou', 'ae', 'ea'].includes(vowelPair)) {
                        score -= 25;
                    } else if (['oo', 'aa', 'ii', 'uu', 'ee'].includes(vowelPair)) {
                        score -= 20;
                    } else if (['io', 'oi'].includes(vowelPair)) {
                        score -= 15;
                    } else {
                        score -= 10;
                    }
                } else if (catalanDiphthongs().has(vowelPair)) {
                    if (['ai', 'au', 'ei', 'eu', 'iu', 'ui'].includes(vowelPair)) {
                        score += 8;
                    } else if (['ia', 'ie', 'ua', 'ue'].includes(vowelPair)) {
                        score += 5;
                    }
                }
            }
        }

        // Check for consecutive consonants and their positions
        let consecutiveConsonants = 0;
        let currentConsonantCluster = '';
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            
            if (!vowels().has(char)) {
                consecutiveConsonants++;
                currentConsonantCluster += char;
                
                if (consecutiveConsonants >= 2) {
                    const lastTwo = currentConsonantCluster.slice(-2);
                    
                    if (badConsonantCombinations().has(lastTwo)) {
                        score -= 50;
                    } else if (consecutiveConsonants === 2) {
                        const allCatalanCombos = new Set([
                            ...catalanBeginningCombs(), 
                            ...catalanEndCombs()
                        ]);
                        
                        if (allCatalanCombos.has(lastTwo)) {
                            let positionPenalty = 0;
                            const isAtBeginning = i === 1;
                            const isAtEnd = i === word.length - 1;
                            
                            if (isAtBeginning) {
                                if (catalanEndCombs().has(lastTwo) && !catalanBeginningCombs().has(lastTwo)) {
                                    positionPenalty = 25;
                                }
                            } else if (isAtEnd) {
                                if (catalanBeginningCombs().has(lastTwo) && !catalanEndCombs().has(lastTwo)) {
                                    positionPenalty = 25;
                                }
                            }
                            
                            if (positionPenalty > 0) {
                                score -= positionPenalty;
                            } else {
                                score += 3;
                            }
                        } else {
                            score -= 15;
                        }
                    } else if (consecutiveConsonants >= 3) {
                        score -= 30;
                    }
                }
            } else {
                consecutiveConsonants = 0;
                currentConsonantCluster = '';
            }
        }

        // Catalan-specific position checks
        const firstChar = word[0];
        const lastChar = word[word.length - 1];
        
        if (!vowels().has(firstChar)) {
            if (['x', 'z', 'q', 'w'].includes(firstChar)) {
                score -= 20;
            }
        }
        
        if (!vowels().has(lastChar)) {
            if (['h', 'j', 'q', 'w', 'x', 'z', 'b', 'k'].includes(lastChar)) {
                score -= 15;
            }
            
            if (lastChar === 'd') {
                score -= 35;
            }
            
            if (['t', 'n', 'r', 's', 'l', 'm'].includes(lastChar)) {
                score += 3;
            }
        }

        // Check for bad ending patterns
        if (word.endsWith('rr')) {
            score -= 30;
        }
        
        if (word.endsWith('ll') && word.length > 2) {
            score -= 10;
        }
        
        if (word.endsWith('ss')) {
            score -= 25;
        }

        // Bonus for alternating vowel-consonant patterns
        let alternatingBonus = 0;
        let hasGoodAlternation = true;
        for (let i = 0; i < word.length - 1; i++) {
            const current = vowels().has(word[i]);
            const next = vowels().has(word[i + 1]);
            if (current !== next) {
                alternatingBonus += 2;
            }
            if (current && next) {
                const vowelPair = word[i] + word[i + 1];
                if (badVowelCombinations().has(vowelPair)) {
                    hasGoodAlternation = false;
                }
            }
        }
        
        if (hasGoodAlternation) {
            score += alternatingBonus;
        } else {
            score += Math.floor(alternatingBonus / 2);
        }

        if (!vowels().has(word[0])) {
            score += 5;
        }

        if (vowels().has(word[word.length - 1])) {
            score += 8;
        }

        // Enhanced penalty for too many vowels in a row
        let consecutiveVowels = 0;
        for (let i = 0; i < word.length; i++) {
            if (vowels().has(word[i])) {
                consecutiveVowels++;
                if (consecutiveVowels >= 3) {
                    score -= 20 + (consecutiveVowels - 3) * 8;
                }
            } else {
                consecutiveVowels = 0;
            }
        }

        // Bonus for characteristic Catalan letter patterns
        if (word.includes('rr') && !word.endsWith('rr')) {
            score += 10;
        }
        if (word.includes('ll') && !word.endsWith('ll')) {
            score += 8;
        }
        if (word.includes('ny')) {
            score += 10;
        }
        
        if (word.includes('ix') || word.includes('ig') || word.includes('eix')) {
            score += 8;
        }
        
        if (word.includes('qu')) {
            score += 5;
        }

        // Catalan-specific word ending bonuses
        if (word.endsWith('a') || word.endsWith('e') || word.endsWith('i') || 
            word.endsWith('o') || word.endsWith('u')) {
            score += 5;
        }
        
        if (word.endsWith('at') || word.endsWith('et') || word.endsWith('it') || 
            word.endsWith('ot') || word.endsWith('ut')) {
            score += 4;
        }
        
        if (word.endsWith('ar') || word.endsWith('er') || word.endsWith('ir')) {
            score += 6;
        }

        // Penalty for very un-Catalan patterns
        if (word.includes('w') || word.includes('k')) {
            score -= 25;
        }

        return Math.max(score, 0);
    }, [allowedDoubleConsonants, badConsonantCombinations, badVowelCombinations, catalanBeginningCombs, catalanDiphthongs, catalanEndCombs, vowels]);

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

    const getCombinationStatus = useCallback((combination: string): CombinationStatus => {
        if (foundWords.includes(combination)) return 'correct';
        if (triedCombinations.has(combination)) return 'tried';
        return 'untried';
    }, [foundWords, triedCombinations]);

    const toggleCombinationStatus = (combination: string, newStatus: CombinationStatus) => {
        console.log('Setting combination status:', combination, newStatus);
        
        const currentStatus = getCombinationStatus(combination);
        
        setTriedCombinations(prev => {
            const newSet = new Set(prev);
            if (newStatus === 'tried') {
                newSet.add(combination);
            } else {
                newSet.delete(combination);
            }
            return newSet;
        });
        
        if (newStatus === 'correct' && currentStatus !== 'correct') {
            if (!foundWords.includes(combination)) {
                onAddFoundWord(combination);
            }
        } else if (newStatus !== 'correct' && currentStatus === 'correct') {
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

        return uniqueResults.sort((a, b) => {
            if (a.probabilityScore !== b.probabilityScore) {
                return b.probabilityScore - a.probabilityScore;
            }
            return a.combination.localeCompare(b.combination);
        });
    }, [prefix, length, subgroups, availableLetters, mainLetter, isOpen, calculateProbabilityScore]);

    // Combine base combinations with status
    const combinations = useMemo(() => {
        return baseCombinations.map(combo => ({
            ...combo,
            status: getCombinationStatus(combo.combination)
        }));
    }, [baseCombinations, getCombinationStatus]);

    const triedCount = combinations.filter(c => c.status === 'tried').length;
    const correctCount = foundWords?.filter(word => word.startsWith(prefix)).length || 0;
    const untriedCount = combinations.filter(c => c.status === 'untried').length;
    const totalWordsWithPrefix = pistes?.paraulesPerPrefix[prefix] || 0;
    const missingCount = totalWordsWithPrefix - correctCount;

    // Get probability distribution for display
    const probabilityStats = useMemo(() => {
        if (combinations.length === 0) return { max: 0, min: 0, avg: 0 };
        
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
                            🎯 Combinacions amb prefix &quot;{prefix.toUpperCase()}&quot;
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

                {/* Always visible Missing Words Counter */}
                <div className="sticky top-[120px] bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 border-b border-gray-300 shadow-sm z-20">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-4 text-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <div className="text-lg font-bold">
                                        {missingCount} {missingCount === 1 ? 'possible paraula' : 'possibles paraules'} a trobar
                                    </div>
                                    <div className="text-xs opacity-90">
                                        amb prefix &quot;{prefix.toUpperCase()}&quot; ({length} lletres)
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border-l border-white/30 pl-4">
                                <div className="text-sm font-medium">
                                    {correctCount} / {totalWordsWithPrefix} trobades
                                </div>
                                <div className="text-xs opacity-90">
                                    {totalWordsWithPrefix > 0 ? Math.round((correctCount / totalWordsWithPrefix) * 100) : 0}% complet
                                </div>
                            </div>
                            
                            {totalWordsWithPrefix > 0 && (
                                <div className="border-l border-white/30 pl-4">
                                    <div className="w-16 bg-white/20 rounded-full h-2 mt-1">
                                        <div 
                                            className="h-2 rounded-full bg-white transition-all duration-300"
                                            style={{ width: `${(correctCount / totalWordsWithPrefix) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
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
                            📊 Ordenades per probabilitat • Considera patrons vocals/consonants i posicions de combinacions catalanes
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {combinations.length > 0 && (
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progrés d&apos;exploració</span>
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
                            <span>✅ {correctCount} trobades</span>
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
                                    Subgrups que contenen &quot;{prefix.toUpperCase()}&quot;: {relevantSubgroups.length > 0 ? relevantSubgroups.map(s => s.toUpperCase()).join(', ') : 'Cap'}
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
                                        <div>Clica dreta: marcar com a <span className="text-green-600 font-medium">trobada</span> (s&apos;afegeix a la llista global)</div>
                                        <div className="text-blue-600 mt-1">Totes inclouen la lletra principal {mainLetter.toUpperCase()}</div>
                                    </div>
                                </div>
                                
                                {/* Clear buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
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
                                        Netejar trobades
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
                                {combinations.map(combo => (
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
                                                    : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:shadow-md'
                                                }
                                            `}
                                            title={`Subgrups: ${combo.matchingSubgroups.join(', ')}\nProbabilitat: ${combo.probabilityScore}/100\nClica esquerra: marcar com provada\nClica dreta: marcar com trobada\nEstat actual: ${combo.status === 'correct' ? 'trobada (a la llista global)' : combo.status === 'tried' ? 'provada' : 'pendent'}`}
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
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span>
                                                        {combo.matchingSubgroups.length > 1 
                                                            ? `${combo.matchingSubgroups.length} subgrups`
                                                            : combo.matchingSubgroups[0]?.toUpperCase()
                                                        }
                                                    </span>
                                                    <span className="text-blue-600">• {combo.probabilityScore}</span>
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {/* Multiple subgroups indicator */}
                                        {combo.matchingSubgroups.length > 1 && (
                                            <div className="absolute -top-1 -right-1 bg-purple-400 text-purple-900 text-xs px-1 rounded-full font-bold">
                                                {combo.matchingSubgroups.length}
                                            </div>
                                        )}
                                        
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

                                        {/* Probability score indicator for high/low scores */}
                                        {combo.probabilityScore > 80 && (
                                            <div className="absolute -top-1 -left-1 text-xs px-1 rounded-full font-bold bg-green-500 text-white">
                                                ★
                                            </div>
                                        )}
                                        {combo.probabilityScore < 20 && (
                                            <div className="absolute -top-1 -left-1 text-xs px-1 rounded-full font-bold bg-red-500 text-white">
                                                ★
                                            </div>
                                        )}
                                    </div>
                                ))}
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
                            Les paraules correctes s&apos;afegeixen automàticament a la llista global
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