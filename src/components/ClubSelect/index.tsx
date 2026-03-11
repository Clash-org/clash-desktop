import { SelectOptionType } from "@/typings";
import Select from "../Select";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { clubsApi } from "@/utils/api";
import { useTranslation } from "react-i18next";

type ClubSelectProps = {
    club?: string;
    setClub?: Dispatch<SetStateAction<string>>;
    clubId: number | undefined;
    setClubId: Dispatch<SetStateAction<number | undefined>>;
    required?: boolean;
}

export default function CitySelect({ club, clubId, setClub, setClubId, required }:ClubSelectProps) {
    const { t } = useTranslation()
    const [clubs, setClubs] = useState<SelectOptionType[]>([])

    useEffect(()=>{
        (async ()=>{
            const resClubs = await clubsApi.getAll()
            if (resClubs) {
                const selectClubs = Array<SelectOptionType>(resClubs.length)
                resClubs.forEach((club, i)=>{selectClubs[i] = { label: club.title, value: club.id }})
                setClubs(selectClubs)
            }
        })()
    }, [])
    return <Select required={required} placeholder={t("club")} value={clubId} setValue={setClubId} inputValue={club} setInputValue={setClub} options={clubs} />
}