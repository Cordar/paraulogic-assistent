import { GameData } from '@/types/paraulogic';

export function obtenirDadesGuardades(): GameData | null {
    const localData = typeof window !== 'undefined' ? localStorage.getItem("paraulogic_assistent") : null;
    return localData ? JSON.parse(localData) : null;
}

export function guardarDades(dades: GameData) {
    if (typeof window !== 'undefined') {
        localStorage.setItem("paraulogic_assistent", JSON.stringify(dades));
    }
}

export function eliminarDades() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("paraulogic_assistent");
    }
}