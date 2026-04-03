import Button from "@/components/Button";
import ModalWindow from "@/components/ModalWindow";
import Section from "@/components/Section";
import WeaponNominationsSelect from "@/components/WeaponNominationsSelect";
import { useNominations } from "@/hooks/useNominations";
import { LangType } from "@/typings";
import { createWeapons, deleteWeapons } from "@/utils/api";
import { TFunction } from "i18next";
import { CirclePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function WeaponsCreate({ lang, t }:{ lang: LangType, t: TFunction<"translation", undefined> }) {
    const { nominations } = useNominations(lang)
    const [weaponId, setWeaponId] = useState<number>()
    const [nominationId, setNominationId] = useState<number>()
    const [weapon, setWeapon] = useState("")
    const [nomination, setNomination] = useState("")
    const [showDelete, setShowDelete] = useState(false)

    const createWeapon = async () => {
        const res = await createWeapons(weapon, nomination, weaponId)
        if (res.success)
            toast.success(t("created"))
    }

    const deleteWeapon = async () => {
        if (weaponId) {
            const res = await deleteWeapons(weaponId, nominationId)
            if (res.success)
                toast.success(t("created"))
        }
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
        <span style={{ color: "var(--placeholder)", textAlign: "center", fontSize: "12px" }}>{t("enterIfNotFound")}</span>
        <Button onClick={createWeapon}>
            <CirclePlus size={28} color="var(--fg)" />
        </Button>
        <Button onClick={()=>setShowDelete(true)}>
            <Trash2 size={28} color="var(--fg)" />
        </Button>
        <ModalWindow isOpen={showDelete} onClose={()=>setShowDelete(false)}>
            <Section title={t("realyDelete")}>
                <Button onClick={deleteWeapon}>
                    <Trash2 size={28} color="var(--fg)" />
                </Button>
            </Section>
        </ModalWindow>
        </>
    )
}