import Button from "@/components/Button";
import WeaponNominationsSelect from "@/components/WeaponNominationsSelect";
import { useNominations } from "@/hooks/useNominations";
import { LangType } from "@/typings";
import { createWeapons } from "@/utils/api";
import { TFunction } from "i18next";
import { CirclePlus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function WeaponsCreate({ lang, t }:{ lang: LangType, t: TFunction<"translation", undefined> }) {
    const { nominations } = useNominations(lang)
    const [weaponId, setWeaponId] = useState<number>()
    const [nominationId, setNominationId] = useState<number>()
    const [weapon, setWeapon] = useState("")
    const [nomination, setNomination] = useState("")

    const createWeapon = async () => {
        const res = await createWeapons(weapon, nomination, weaponId)
        if (res.success)
            toast.success(t("created"))
    }
    return (
        <>
        <WeaponNominationsSelect
        nominations={nominations}
        weaponId={weaponId}
        setWeaponId={setWeaponId}
        nominationId={nominationId}
        setNominationId={setNominationId}
        weapon={weapon}
        setWeapon={setWeapon}
        nomination={nomination}
        setNomination={setNomination}
        />
        <Button onClick={createWeapon}>
            <CirclePlus size={28} color="var(--fg)" />
        </Button>
        </>
    )
}