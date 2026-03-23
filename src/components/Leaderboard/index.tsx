import { useLeaderboard } from "@/hooks/useRatings"
import { useState } from "react"
import WeaponNominationsSelect from "../WeaponNominationsSelect"
import { useNominations } from "@/hooks/useNominations"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { languageAtom } from "@/store"
import Table from "../Table"

export default function Leaderboard() {
    const { t } = useTranslation();
    const lang = useAtomValue(languageAtom)
    const [weaponId, setWeaponId] = useState<number>()
    const [nominationId, setNominationId] = useState<number>()
    const { nominations } = useNominations(lang)
    const { leaderboard } = useLeaderboard(weaponId, nominationId, 10)
    return (
        <div className="container">
        <WeaponNominationsSelect
        nominations={nominations}
        weaponId={weaponId}
        nominationId={nominationId}
        setWeaponId={setWeaponId}
        setNominationId={setNominationId}
        />
        {leaderboard &&
        <Table
        titles={[t("username"), t("rating"), t("rank"), "RD"]}
        data={leaderboard.map(l=>[String(l.username), String(l.rating), String(l.rank), String(l.rd)])}
        />
        }
        </div>
    )
}