import { useClub } from "@/hooks/useClubs"
import Table from "../Table"
import { useUsersByClubId } from "@/hooks/useUsers"
import { useTranslation } from "react-i18next"
import ErrorPage from "../ErrorPage"

export default function Club({ id }:{ id:number|null }) {
    const { t } = useTranslation()
    const { club } = useClub(id)
    const { users } = useUsersByClubId(id)
    const titles = ["№", t("username"), t("tournaments"), t("nominations")]
    if (!club) return <ErrorPage message={t('notFound')} />
    const data = users.map((user, idx)=>[String(idx+1), user.username, user.tournamentsCount.toString(), user.nominationCount.toString()])
    return (
        <div className="container">
            <h1 className="title">{club.title}</h1>
            <Table data={data} titles={titles} />
        </div>
    )
}