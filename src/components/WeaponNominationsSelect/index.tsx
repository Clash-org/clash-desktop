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
}

export default function WeaponNominationsSelect({ nominations, weaponId, setWeaponId, nominationId, setNominationId }:Props) {
    const { t } = useTranslation();
    return (
        <>
        <span>{t('weapons')}</span>
        <Select
            options={nominations.map(nom=>({ label: nom.weapon.title, value: nom.weapon.id })).filter((obj, idx, arr) => idx === arr.findIndex((t) => t.value === obj.value))}
            value={weaponId}
            setValue={(val) => setWeaponId(val)}
            placeholder={t('selectWeapon')}
        />
        <span>{t('nominations')}</span>
        <Select
            options={nominations.filter(nom=>nom.weapon.id === weaponId).map(nom=>({ label: nom.title, value: nom.id })).filter((obj, idx, arr) => idx === arr.findIndex((t) => t.value === obj.value))}
            value={nominationId}
            setValue={(val) => setNominationId(val)}
            placeholder={t('nominations')}
        />
        </>
    )
}