import Select from "../Select";
import { Dispatch, SetStateAction } from "react";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";
import { useTranslation } from "react-i18next";
import { useCities } from "@/hooks/useCities";

type CitySelectProps = {
    city?: string;
    setCity?: Dispatch<SetStateAction<string>>;
    cityId: number | undefined;
    setCityId: Dispatch<SetStateAction<number | undefined>>;
    required?: boolean;
}

export default function CitySelect({ city, cityId, setCity, setCityId, required }:CitySelectProps) {
    const { t } = useTranslation()
    const lang = useAtomValue(languageAtom)
    const { cities } = useCities(lang)

    return <Select
            required={required}
            placeholder={t("city")}
            value={cityId}
            setValue={setCityId}
            inputValue={city}
            setInputValue={setCity}
            options={cities.map(city=>({ label: city.title, value: city.id }))}
            />
}