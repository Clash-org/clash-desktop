import Button from "@/components/Button";
import CitySelect from "@/components/CitySelect";
import InputText from "@/components/InputText";
import styles from "../index.module.css"
import { LangType } from "@/typings";
import { updateCity } from "@/utils/api";
import { TFunction } from "i18next";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CityUpdate({ t, lang }:{ lang: LangType, t: TFunction<"translation", undefined> }) {
    const [newCity, setNewCity] = useState("")
    const [cityId, setCityId] = useState<number>()

    const updateCityName = async () => {
        if (newCity && cityId) {
            const res = await updateCity(newCity, cityId, lang)
            if (res)
                toast.success(t("dataUpdated"))
        }
    }

    return (
        <div className={styles.content}>
        <CitySelect cityId={cityId} setCityId={setCityId} />
        <InputText value={newCity} setValue={setNewCity} placeholder={t("newValue")} />
        <Button onClick={updateCityName} title={t("updateData")} />
        </div>
    )
}