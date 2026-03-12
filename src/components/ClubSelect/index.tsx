import Select from "../Select";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { useClubs } from "@/hooks/useClubs";

type ClubSelectProps = {
    club?: string;
    setClub?: Dispatch<SetStateAction<string>>;
    clubId: number | undefined;
    setClubId: Dispatch<SetStateAction<number | undefined>>;
    required?: boolean;
}

export default function CitySelect({ club, clubId, setClub, setClubId, required }:ClubSelectProps) {
    const { t } = useTranslation()
    const { clubs } = useClubs()

    return <Select
           required={required}
           placeholder={t("club")}
           value={clubId}
           setValue={setClubId}
           inputValue={club}
           setInputValue={setClub}
           options={clubs.map(club=>({ label: club.title, value: club.id }))}
           />
}