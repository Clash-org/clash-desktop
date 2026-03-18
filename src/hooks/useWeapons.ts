import { NominationType, WeaponType } from "@/typings";
import { useEffect, useState } from "react";

export function useWeapons(nominations: NominationType[]) {
    const [weapons, setWeapons] = useState<WeaponType[]>([]);

    useEffect(() => {
    (async ()=>{
        if (nominations.length) {
            let weapons: WeaponType[] = []
            nominations.forEach(nom=>{
            weapons.push(nom.weapon)
            })
            weapons = Array.from(new Map(weapons.map(item => [item.id, item])).values())
            setWeapons(weapons)
        }
    })()
    }, []);

    return { weapons }
}