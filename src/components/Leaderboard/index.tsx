import { useLeaderboard } from "@/hooks/useRatings"
import { useState } from "react"
import WeaponNominationsSelect from "../WeaponNominationsSelect"
import { useNominations } from "@/hooks/useNominations"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { languageAtom } from "@/store"
import Table from "../Table"
import LoadWrap from "../LoadWrap"
import { LeaderboardType } from "@/typings"

export default function Leaderboard() {
    const { t } = useTranslation();
    const lang = useAtomValue(languageAtom)
    const [weaponId, setWeaponId] = useState<number>()
    const [nominationId, setNominationId] = useState<number>()
    const { nominations } = useNominations(lang)
    const [page, setPage] = useState(1)
    const { leaderboard, count, isLoading } = useLeaderboard(page, weaponId, nominationId, 1)
    const [currentData, setCurrentData] = useState<LeaderboardType[]>([])

    return (
        <div className="container">
            <WeaponNominationsSelect
            nominations={nominations}
            weaponId={weaponId}
            nominationId={nominationId}
            setWeaponId={setWeaponId}
            setNominationId={setNominationId}
            />
            {leaderboard && !!count &&
            <LoadWrap filterKey="username" showCount={1} totalCount={count} loading={isLoading} data={leaderboard} setData={setCurrentData} page={page} setPage={setPage}>
                <Table
                titles={[t("username"), t("rating"), t("rank"), "RD"]}
                data={currentData.map(l=>[String(l.username), String(l.rating), String(l.rank), String(l.rd)])}
                />
            </LoadWrap>
            }
        </div>
    )
}