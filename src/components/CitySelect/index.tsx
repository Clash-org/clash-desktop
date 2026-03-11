import { SelectOptionType } from "@/typings";
import Select from "../Select";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { citiesApi } from "@/utils/api";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";
import { useTranslation } from "react-i18next";

type CitySelectProps = {
    city?: string;
    setCity?: Dispatch<SetStateAction<string>>;
    cityId: number | undefined;
    setCityId: Dispatch<SetStateAction<number | undefined>>;
    required?: boolean;
}

export default function CitySelect({ city, cityId, setCity, setCityId, required }:CitySelectProps) {
    const { t } = useTranslation()
    const [cities, setCities] = useState<SelectOptionType[]>([])
    const lang = useAtomValue(languageAtom)

    useEffect(()=>{
        (async ()=>{
            const resCities = await citiesApi.getAll(lang)
            if (resCities) {
                const selectCities = Array<SelectOptionType>(resCities.length)
                resCities.forEach((city, i)=>{selectCities[i] = { label: city.title, value: city.id }})
                setCities(selectCities)
            }
        })()
    }, [])
    return <Select required={required} placeholder={t("city")} value={cityId} setValue={setCityId} inputValue={city} setInputValue={setCity} options={cities} />
}