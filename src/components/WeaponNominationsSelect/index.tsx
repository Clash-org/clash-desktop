import { useTranslation } from "react-i18next";
import Select from "../Select";
import { NominationType } from "@/typings";
import { SetStateAction } from "react";

type Props = {
    nominations: NominationType[];
    weaponId: number | undefined;
    setWeaponId: (args_0: SetStateAction<number | undefined>) => void;
    nominationId: number | undefined;
    setNominationId: (args_0: SetStateAction<number | undefined>) => void;
    nomination?: string;
    weapon?: string;
    setNomination?: (value: string) => void
    setWeapon?: (value: string) => void
}

export default function WeaponNominationsSelect({ nominations, weaponId, setWeaponId, nominationId, setNominationId, nomination, weapon, setNomination, setWeapon }:Props) {
    const { t } = useTranslation();
    const deleteDuplicates = (arrObj: { label: string, value: number }[]) => arrObj.filter((obj, idx, arr) => idx === arr.findIndex((t) => t.value === obj.value))
    return (
        <>
        <span>{t('weapons')}</span>
        <Select
            options={deleteDuplicates(nominations.map(nom=>({ label: nom.weapon.title, value: nom.weapon.id })))}
            value={weaponId}
            setValue={(val) => setWeaponId(val)}
            placeholder={t('selectWeapon')}
            inputValue={weapon}
            setInputValue={setWeapon}
        />
        <span>{t('nominations')}</span>
        <Select
            options={deleteDuplicates(nominations.filter(nom=>nom.weapon.id === weaponId).map(nom=>({ label: nom.title, value: nom.id })))}
            value={nominationId}
            setValue={(val) => setNominationId(val)}
            placeholder={t('nominations')}
            inputValue={nomination}
            setInputValue={setNomination}
        />
        </>
    )
}