'use client'

import { useState } from "react";



export default function Home() {
  const [paraula, setParaula] = useState('');
  const [paraules, setParaules] = useState<string[]>([]);
  const [subconjunts, setSubconjunts] = useState<{ subconjunt: string, repeticions: number }[]>([]);
  const [prefixos, setPrefixos] = useState<{ prefix: string, repeticions: number }[]>([]);

  function handleKeyPress(e: any) {
    if (e.key == "Enter") {
      const paraulesIntroduides = paraula.split(",");
      let paraulesPerAfegir: string[] = [];
      for (let index = 0; index < paraulesIntroduides.length; index++) {
        let paraulaNeta = paraulesIntroduides[index];
        paraulaNeta = paraulaNeta.replace("-", "").replace(".", "")
        paraulaNeta = paraulaNeta.replace("à", "a").replace("á", "a").replace("è", "e").replace("é", "e").replace("í", "i").replace("ò", "o").replace("ó", "o").replace("ú", "u")
        paraulaNeta = paraulaNeta.trim();
        paraulaNeta = paraulaNeta.split(" ")[0]
        console.log(paraulaNeta)
        if (paraules.some(x => x == paraulaNeta) || paraulesPerAfegir.some(x => x == paraulaNeta)) {
          continue;
        }
        paraulesPerAfegir.push(paraulaNeta);
      }
      setParaules([...paraules, ...paraulesPerAfegir])
      setParaula("")
    }
  }

  function handleInputChange(e: any) {
    setParaula(e?.target?.value);
  }

  function updateSubConjunts() {
    let localSubconjunts: { subconjunt: string, repeticions: number }[] = [];
    for (let index = 0; index < paraules.length; index++) {
      const paraula = paraules[index];

      let localSubconjuntSet = new Set<string>();
      for (let index = 0; index < paraula.length; index++) {
        localSubconjuntSet.add(paraula[index]);
      }
      let localSubconjuntArray = Array.from(localSubconjuntSet).sort();
      let localSubconjunt = localSubconjuntArray.join("");
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
    let localPrefixos: { prefix: string, repeticions: number }[] = [];
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

  return (
    <div className="w-1/2 m-auto p-16 text-center flex flex-col">
      <h1 className="mt-2 text-2xl">Benvingut a l'assistent del paraulògic</h1>
      <h2 className="mt-16 mb-2 text-lg">Introdueix una paraula</h2>
      <div className="flex">
        <button onClick={fesInforme} className="w-1/4">Fes l'informe</button>
        <input type="text" onKeyUp={handleKeyPress} value={paraula} onChange={handleInputChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="t'estimo"></input>
      </div>
      <div className="mt-2 flex flex-wrap w-3/4 place-self-end">
        {paraules.map(paraula => (
          <p key={paraula}>{paraula},</p>
        ))}
      </div>
      <div className="mt-4 flex">
        {subconjunts.map(subconjunt => (
          <p key={subconjunt.subconjunt}><b>{subconjunt.subconjunt}</b> {subconjunt.repeticions}</p>
        ))}
      </div>
      <div className="mt-4 flex">
        {prefixos.map(item => (
          <p key={item.prefix}><b>{item.prefix}</b> {item.repeticions}</p>
        ))}
      </div>

    </div >
  );
}
