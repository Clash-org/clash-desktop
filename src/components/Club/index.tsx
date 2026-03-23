import { useClub } from "@/hooks/useClubs"
import Table from "../Table"
import { useUsersByClubId } from "@/hooks/useUsers"
import { useTranslation } from "react-i18next"

export default function Club({ id }:{ id:number|null }) {
    const { t } = useTranslation()
    const { club } = useClub(id)
    const { users } = useUsersByClubId(id)
    const titles = ["№", t("username"), t("tournaments"), t("nominations")]
    if (!club) return <></>
    const data = users.map((user, idx)=>[String(idx+1), user.username, user.tournamentsCount.toString(), user.nominationCount.toString()])
    return (
        <div className="container">
            <h1 className="title" style={{ textAlign: "center" }}>{club.title}</h1>
            <Table data={data} titles={titles} />
        </div>
    )
}