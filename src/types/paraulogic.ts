export interface GameData {
    lletraPrincipal: string;
    lletresExtres: string[];
    dataCreacio: string;
    pistes?: {
        totalParaules: number;
        paraulesPerLletra: { 
            [key: string]: { 
                count: number, 
                lengths: number[],
                lengthCounts?: { [length: number]: number }
            } 
        };
        paraulesPerSubgrup: { [key: string]: number };
        paraulesPerPrefix: { [key: string]: number };
    };
    paraulesTrobades?: string[];
}
