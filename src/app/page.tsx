'use client'

import { useState, useEffect } from "react";
import { GameData } from '@/types/paraulogic';
import { obtenirDadesGuardades, eliminarDades } from '@/utils/localStorage';
import Button from '@/components/paraulogic/Button';
import LletraPrincipalForm from '@/components/paraulogic/LletraPrincipalForm';
import PistesForm from '@/components/paraulogic/PistesForm';
import PistesSummary from '@/components/paraulogic/PistesSummary';
import ParaulesTrobadesForm from '@/components/paraulogic/ParaulesTrobadesForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

function MostrarDadesGuardades({ dades, onReset, onAddClues, onViewSummary, onManageWords }: {
  dades: GameData,
  onReset: () => void,
  onAddClues: () => void,
  onViewSummary: () => void,
  onManageWords: () => void
}) {
  return (
    <div className="max-w-md mx-auto bg-green-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-4">Configuració actual</h4>
      <div className="space-y-2">
        <p><strong>Lletra Principal:</strong> <span className="text-2xl font-bold text-green-600">{dades.lletraPrincipal.toUpperCase()}</span></p>
        <p><strong>Lletres Extres:</strong> <span className="text-xl">{dades.lletresExtres.join(' ').toUpperCase()}</span></p>
        {dades.pistes && (
          <div className="text-sm text-gray-600">
            <p><strong>Pistes configurades:</strong></p>
            <ul className="ml-4 list-disc">
              <li>Total paraules: {dades.pistes.totalParaules}</li>
              <li>Paraules per lletra: {Object.keys(dades.pistes.paraulesPerLletra).length} lletres</li>
              <li>Subgrups: {Object.keys(dades.pistes.paraulesPerSubgrup).length} configurats</li>
              <li>Prefixos: {Object.keys(dades.pistes.paraulesPerPrefix).length} configurats</li>
            </ul>
          </div>
        )}
        <p className="text-xs text-gray-500">Creat: {new Date(dades.dataCreacio).toLocaleString('ca-ES')}</p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex space-x-2">
          <Button fun={onAddClues} variant="secondary">
            {dades.pistes ? "Editar Pistes" : "Afegir Pistes"}
          </Button>
          <Button fun={onManageWords} variant="secondary">
            Paraules ({dades.paraulesTrobades?.length || 0})
          </Button>
          {dades.pistes && (
            <Button fun={onViewSummary} variant="primary">
              Veure Anàlisi
            </Button>
          )}
        </div>
        <div className="text-center">
          <Button fun={onReset} variant="danger">
            Nova Configuració
          </Button>
        </div>
      </div>
    </div>
  );
}

function AssistentDinamic() {
  const [pas, setPas] = useState(0);
  const [dades, setDades] = useState<GameData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const dadesGuardades = obtenirDadesGuardades();
    if (dadesGuardades) {
      setDades(dadesGuardades);
      setPas(2);
    }
  }, []);

  function iniciar() {
    setPas(1);
  }

  function onFormComplete() {
    const dadesGuardades = obtenirDadesGuardades();
    setDades(dadesGuardades);
    setPas(2);
  }

  function resetDades() {
    setShowConfirmModal(true);
  }

  function confirmReset() {
    eliminarDades();
    setDades(null);
    setPas(1);
    setShowConfirmModal(false);
  }

  function cancelReset() {
    setShowConfirmModal(false);
  }

  function addClues() {
    setPas(3);
  }

  function viewSummary() {
    setPas(4);
  }

  function onCluesComplete() {
    const dadesGuardades = obtenirDadesGuardades();
    setDades(dadesGuardades);
    setPas(2);
  }

  function cancelClues() {
    setPas(2);
  }

  function backToMain() {
    setPas(2);
  }

  function manageWords() {
    setPas(5);
  }

  function onWordsComplete() {
    const dadesGuardades = obtenirDadesGuardades();
    setDades(dadesGuardades);
    setPas(2);
  }

  function cancelWords() {
    setPas(2);
  }

  if (pas === 0) {
    return (
      <div className="text-center">
        <p className="mb-4 text-gray-600">Benvingut a l&apos;assistent del Paraulògic</p>
        <Button fun={iniciar}>Iniciar</Button>
      </div>
    );
  }

  if (pas === 1) {
    return <LletraPrincipalForm onComplete={onFormComplete} />
  }

  if (pas === 2 && dades) {
    return (
      <>
        <MostrarDadesGuardades
          dades={dades}
          onReset={resetDades}
          onAddClues={addClues}
          onViewSummary={viewSummary}
          onManageWords={manageWords}
        />
        <ConfirmationModal
          isOpen={showConfirmModal}
          title="Confirmar nova configuració"
          message="Estàs segur que vols crear una nova configuració? Això eliminarà totes les dades actuals incloent pistes i paraules trobades."
          confirmText="Sí, crear nova"
          cancelText="Cancel·lar"
          onConfirm={confirmReset}
          onCancel={cancelReset}
          variant="danger"
        />
      </>
      
    );
  }

  if (pas === 3 && dades) {
    return (
      <PistesForm
        dades={dades}
        onComplete={onCluesComplete}
        onCancel={cancelClues}
      />
    );
  }

  if (pas === 4 && dades) {
    return (
      <div>
        <div className="mb-4 text-center">
          <Button fun={backToMain} variant="secondary">
            ← Tornar
          </Button>
        </div>
        <PistesSummary dades={dades} />
      </div>
    );
  }

  if (pas == 5 && dades) {
    return (
      <ParaulesTrobadesForm
        dades={dades}
        onComplete={onWordsComplete}
        onCancel={cancelWords}
      />
    )
  }

  return <span>Error: Estat no vàlid</span>
}

export default function DinamicPage() {
  return (
    <>
      <h3 className="text-center text-2xl font-bold mb-6">Assistent dinàmic</h3>
      <section className="w-full max-w-7xl mx-auto mt-5 px-4">
        <AssistentDinamic />
      </section>
    </>
  )
}