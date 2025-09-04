'use client'

import { useState } from 'react';

interface ModalState {
    isOpen: boolean;
    prefix: string;
    length: number;
    subgroups: string[];
}

export function usePrefixModal() {
    const [modalState, setModalState] = useState<ModalState>({
        isOpen: false,
        prefix: '',
        length: 0,
        subgroups: []
    });

    const openModal = (prefix: string, length: number, subgroups: string[]) => {
        setModalState({
            isOpen: true,
            prefix,
            length,
            subgroups
        });
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    return {
        modalState,
        openModal,
        closeModal
    };
}