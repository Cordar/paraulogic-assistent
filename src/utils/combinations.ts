export function getCombinations(arr: string[], size: number): string[] {
    if (size === 1) return arr.map(item => item);
    if (size === arr.length) return [arr.join('')];
    
    const result: string[] = [];
    for (let i = 0; i <= arr.length - size; i++) {
        const head = arr[i];
        const tailCombos = getCombinations(arr.slice(i + 1), size - 1);
        tailCombos.forEach(combo => result.push(head + combo));
    }
    return result;
}

export function generateSubgroups(lletres: string[]): string[] {
    const subgroups = [];
    
    // Generate all possible combinations of 2-6 letters
    for (let size = 2; size <= lletres.length; size++) {
        const combinations = getCombinations(lletres, size);
        subgroups.push(...combinations);
    }
    
    return subgroups.sort();
}

export function generatePrefixes(lletres: string[]): string[] {
    const prefixes = [];
    
    // Generate all possible 2-letter prefixes
    for (let i = 0; i < lletres.length; i++) {
        for (let j = 0; j < lletres.length; j++) {
            if (i !== j) {
                prefixes.push(lletres[i] + lletres[j]);
            }
        }
    }
    
    return prefixes.sort();
}