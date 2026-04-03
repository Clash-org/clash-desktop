import { useTranslation } from "react-i18next";
import Tabs from "../Tabs";
import { useState } from "react";
import Section from "../Section";
import { useTournaments } from "@/hooks/useTournaments";
import { useAtom } from "jotai";
import { languageAtom } from "@/store";
import Table from "../Table";
import { formatDate, translateStatus } from "@/utils/helpers";
import styles from "./index.module.css"
import { TournamentShortType } from "@/typings";
import { Pages, usePage } from "@/hooks/usePage";
import { Building2, Swords, Trash2, Trophy, UsersRound } from "lucide-react";
import { deleteTournament } from "@/utils/api";
import ModalWindow from "../ModalWindow";
import Button from "../Button";
import UsersPage from "./UsersPage";
import WeaponsCreate from "./WeaponsCreate";
import LoadWrap from "../LoadWrap";
import toast from "react-hot-toast";
import CityUpdate from "./CityUpdate";

export default function Admin() {
    const { t } = useTranslation()
    const { setPage: setGlobalPage } = usePage()
    const [lang] = useAtom(languageAtom)
    const tabs = ["tournaments", "users", "weapons", "cities"] as const
    const titles = [
        <><Trophy size={20} color="var(--fg)" />{t("tournaments")}</>,
        <><UsersRound size={20} color="var(--fg)" />{t("fighters")}</>,
        <><Swords size={20} color="var(--fg)" />{t("weapons")}</>,
        <><Building2 size={20} color="var(--fg)" />{t("city")}</>
    ]
    const [activeTab, setActiveTab] = useState<typeof tabs[number]>("tournaments")
    const [page, setPage] = useState(1)
    const { tournaments, tournamentsCount, isLoading } = useTournaments(lang, page, true)
    const [currentTournaments, setCurrentTournaments] = useState<TournamentShortType[]>([])
    const [showDelete, setShowDelete] = useState(false);
    const [tournamentId, setTournamentId] = useState(-1)

    return (
        <div className={["container", styles.container].join(" ")}>
            <Tabs tabs={tabs} titles={titles} activeTab={activeTab} setActiveTab={setActiveTab} />

            <Section className={styles.tournamentsWrap}>
            {activeTab === "tournaments" &&
                <>
                <LoadWrap loading={isLoading} totalCount={tournamentsCount} page={page} setPage={setPage} data={tournaments} setData={setCurrentTournaments}>
                    <Table
                    titles={["ID", t("tournamentTitle"), t("city"), t("date"), t("status"), t("organizer")]}
                    data={currentTournaments.map(t=>[
                        String(t.id),
                        t.title,
                        t.city,
                        formatDate(t.date, lang, true),
                        translateStatus(t.status, lang),
                        <span className="link" onClick={()=>setGlobalPage(Pages.PROFILE, { id: t.organizer.id })}>{t.organizer.username}</span>,
                        <Trash2 size={20} color="var(--fg)" className={styles.controller} onClick={()=>{setTournamentId(t.id); setShowDelete(true)}} />
                    ])}
                    />
                </LoadWrap>

                <ModalWindow isOpen={showDelete && tournamentId > 0} onClose={()=>setShowDelete(false)}>
                    <Section title={t("realyDelete") + `\nID: ${tournamentId}`}>
                        <Button onClick={async ()=>{
                            const res = await deleteTournament(tournamentId)
                            if (res) {
                                toast.success(t("dataUpdated"))
                                setShowDelete(false)
                            }
                        }}>
                            <Trash2 color="var(--fg)" />
                        </Button>
                    </Section>
                </ModalWindow>
                </>
            }
            {activeTab === "users" && <UsersPage lang={lang} t={t} setPage={setGlobalPage} />}
            {activeTab === "weapons" && <WeaponsCreate lang={lang} t={t} />}
            {activeTab === "cities" && <CityUpdate lang={lang} t={t} />}
            </Section>
        </div>
    )
}