'use client'

import { SetStateAction, useState } from "react";



export default function Home() {
  const [paraula, setParaula] = useState('');
  const [paraules, setParaules] = useState<string[]>(() => {
    const localData = typeof window !== 'undefined' ? localStorage.getItem("paraules") : null;
    return localData ? JSON.parse(localData) : [];
  });
  const [subconjunt, setSubconjunt] = useState('');
  const [subconjuntRepeticions, setSubconjuntRepeticions] = useState(0);
  const [subconjunts, setSubconjunts] = useState<{ subconjunt: string, repeticions: number }[]>([]);
  const [subconjuntsATrobar, setSubconjuntsATrobar] = useState<{ subconjunt: string, repeticions: number }[]>(() => {
    const localData = typeof window !== 'undefined' ? localStorage.getItem("subconjunts") : null;
    return localData ? JSON.parse(localData) : [];
  });
  const [prefix, setPrefix] = useState('');
  const [prefixos, setPrefixos] = useState<{ prefix: string, repeticions: number }[]>([]);
  const [prefixosATrobar, setPrefixosATrobar] = useState<{ prefix: string, repeticions: number }[]>([]);

  function handleKeyPress(e: { key: string; }) {
    if (e.key == "Enter") {
      const paraulesIntroduides = paraula.split(",");
      const paraulesPerAfegir: string[] = [];
      for (let index = 0; index < paraulesIntroduides.length; index++) {
        let paraulaNeta = paraulesIntroduides[index];
        paraulaNeta = paraulaNeta.replace("-", "").replace(".", "")
        paraulaNeta = paraulaNeta.replace("à", "a").replace("á", "a").replace("è", "e").replace("é", "e").replace("í", "i").replace("ò", "o").replace("ó", "o").replace("ú", "u")
        paraulaNeta = paraulaNeta.trim();
        paraulaNeta = paraulaNeta.split(" ")[0]
        if (paraules.some(x => x == paraulaNeta) || paraulesPerAfegir.some(x => x == paraulaNeta)) {
          continue;
        }
        paraulesPerAfegir.push(paraulaNeta);
      }
      setParaules([...paraules, ...paraulesPerAfegir])
      setParaula("")
      localStorage.setItem("paraules", JSON.stringify([...paraules, ...paraulesPerAfegir]))
    }
  }

  function handleInputChange(e: { target: { value: SetStateAction<string>; }; }) {
    setParaula(e?.target?.value);
  }

  function handleInputChangeSubconjunt(e: { target: { value: SetStateAction<string>; }; }) {
    setSubconjunt(e?.target?.value);
  }

  function handleInputChangeSubconjuntRepeticions(e: React.MouseEvent<HTMLInputElement>) {
    setSubconjuntRepeticions(parseInt((e?.target as HTMLInputElement).value));
  }

  function updateSubConjunts() {
    const localSubconjunts: { subconjunt: string, repeticions: number }[] = [];
    for (let index = 0; index < paraules.length; index++) {
      const paraula = paraules[index];

      const localSubconjuntSet = new Set<string>();
      for (let index = 0; index < paraula.length; index++) {
        localSubconjuntSet.add(paraula[index]);
      }
      const localSubconjuntArray = Array.from(localSubconjuntSet).sort();
      const localSubconjunt = localSubconjuntArray.join("");
      const repIndex = localSubconjunts.findIndex(sc => sc.subconjunt == localSubconjunt);
      if (repIndex == -1) {
        localSubconjunts.push({ subconjunt: localSubconjunt, repeticions: 1 })
      } else {
        localSubconjunts[repIndex].repeticions = localSubconjunts[repIndex].repeticions + 1
      }
    }
    localSubconjunts.sort((a, b) => a.subconjunt.localeCompare(b.subconjunt))
    setSubconjunts(localSubconjunts)
  }

  function updatePrefixes() {
    const localPrefixos: { prefix: string, repeticions: number }[] = [];
    for (let index = 0; index < paraules.length; index++) {
      const paraula = paraules[index];

      const prefix = paraula.substring(0, 2);
      const item = localPrefixos.find(x => x.prefix == prefix);
      if (item) {
        item.repeticions += 1
      } else {
        localPrefixos.push({ prefix: prefix, repeticions: 1 })
      }
    }
    localPrefixos.sort((a, b) => a.prefix.localeCompare(b.prefix))
    setPrefixos(localPrefixos)
  }

  function fesInforme() {
    updateSubConjunts();
    updatePrefixes();
  }

  function addSubconjunt() {
    let subc = [...subconjuntsATrobar];
    const index = subc.findIndex(x => x.subconjunt == subconjunt);
    if (index != -1) {
      subc[index].repeticions = subconjuntRepeticions
    } else {
      subc.push({ subconjunt: subconjunt, repeticions: subconjuntRepeticions })
    }
    setSubconjuntsATrobar(subc)
    setSubconjunt("")
    setSubconjuntRepeticions(0)
    localStorage.setItem("subconjunts", JSON.stringify(subc));
  }

  function removeSubconjunt(e: MouseEventHandler<HTMLSpanElement>) {
    let subc = [...subconjuntsATrobar];
    const index = subc.findIndex(subc => subc.subconjunt == e.target.getAttribute("data-index"));
    subc.splice(index, 1)

  }

  return (
    <div className="w-full m-auto p-16 text-center flex flex-col">
      <h1 className="text-2xl">Benvingut a l&apos;assistent del paraulògic</h1>

      <div className="mt-16 flex justify-center gap-2">
        <input type="text" onKeyUp={handleKeyPress} value={paraula} onChange={handleInputChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="t'estimo"></input>
        <button onClick={fesInforme} className="bg-green-200 hover:bg-green-300 px-3 py-2 rounded-md">Fes l&apos;informe</button>
      </div>
      <h4 className="mb-2 text-sm">Introdueix una o varies paraules separades per coma</h4>
      <h3>Has trobat {paraules.length} paraules!</h3>
      <div className="mt-2 flex flex-wrap place-self-end">
        {paraules.map(paraula => (
          <span key={paraula}>{paraula},</span>
        ))}
      </div>
      <div className="flex flex-col gap-2 justify-start mt-10">
        <div className="flex gap-2 justify-center">
          <input type="text" value={subconjunt} onChange={handleInputChangeSubconjunt} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></input>
          <input type="text" value={subconjuntRepeticions} onChange={handleInputChangeSubconjuntRepeticions} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></input>
          <button onClick={addSubconjunt} className="bg-green-200 hover:bg-green-300 px-3 py-2 rounded-md">Afegir subconjunt a trobar</button>
        </div>
        <h2 className="px-4 font-semibold mt-2">Subconjunts a trobar (repeticions)</h2>
        <div className="text-wrap">
          {subconjuntsATrobar.map(item => (
            <span key={item.subconjunt} data-index={item.subconjunt} onClick={removeSubconjunt}>{item.subconjunt} ({item.repeticions}) </span>
          ))}
        </div>
        <h2 className="px-4 font-semibold mt-2">Subconjunts trobats (repeticions)</h2>
        <div className="text-wrap">
          {subconjunts.map(item => (
            <span key={item.subconjunt}>{item.subconjunt} ({item.repeticions}) </span>
          ))}
        </div>
        <h2 className="px-4 font-semibold mt-2">Prefixos trobats (repeticions)</h2>
        <div className="text-wrap">
          {prefixos.map(item => (
            <span key={item.prefix}>{item.prefix} ({item.repeticions}) </span>
          ))}
        </div>
      </div>
    </div>
  );
}
