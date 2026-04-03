import Table from "@/components/Table";
import { PageParams, Pages } from "@/hooks/usePage";
import { useUsers } from "@/hooks/useUsers";
import { LangType } from "@/typings";
import { formatDate } from "@/utils/helpers";
import { TFunction } from "i18next";
import { Crown, Mars, Trash2, Venus } from "lucide-react";
import styles from "../index.module.css"
import { deleteUser, updateUser } from "@/utils/api";
import ModalWindow from "@/components/ModalWindow";
import { useState } from "react";
import Button from "@/components/Button";
import Section from "@/components/Section";
import toast from "react-hot-toast";

type UsersPageProps = {
    lang: LangType;
    t: TFunction<"translation", undefined>;
    setPage: (() => void) | (<T extends Pages>(page: T, params?: PageParams[T]) => void);
}

export default function UsersPage({ lang, t, setPage }:UsersPageProps) {
    const { users } = useUsers(lang)
    const [userId, setUserId] = useState("")
    return users.length && (
        <>
        <Table
        titles={["ID", t("username"), t("email"), t("gender"), t("city"), t("club"), t("isAdmin"), t("dateRegistor")]}
        data={users.map(u=>[
            u.id,
            <span className="link" onClick={()=>setPage(Pages.PROFILE, { id: u.id })}>{u.username}</span>,
            u.email,
            u.gender ? <Mars size={20} color="var(--fg)" /> : <Venus size={20} color="var(--fg)" />,
            u.city.title,
            <span className="link" onClick={()=>setPage(Pages.CLUB, { id: u.club.id })}>{u.club.title}</span>,
            String(u.isAdmin),
            formatDate(u.createdAt, lang, true),
            <Crown scale={20} color={u.isAdmin ? "var(--accent)" : "var(--fg)"} className={styles.controller} onClick={()=>updateUser({ id: u.id, isAdmin: !u.isAdmin }, lang)} />,
            <Trash2 scale={20} color="var(--fg)" className={styles.controller} onClick={()=>setUserId(u.id)} />,
        ])} />
        <ModalWindow isOpen={!!userId} onClose={()=>setUserId("")}>
            <Section title={t("realyDelete") + `\nID: ${userId}`}>
                <Button onClick={async ()=>{
                    const res = await deleteUser(userId);
                    if (res) {
                        toast.success(t("dataUpdated"))
                        setUserId("")
                    }
                }}>
                    <Trash2 color="var(--fg)" />
                </Button>
            </Section>
        </ModalWindow>
        </>
    )
}