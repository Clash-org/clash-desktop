import { languageAtom, userAtom } from "@/store";
import { Gender, RegistrationType, SelectOptionType } from "@/typings";
import { citiesApi, registrationApi } from "@/utils/api";
import { LocalStorage } from "@/utils/helpers";
import Button from "@components/Button";
import InputText from "@components/InputText";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Select from "../Select";
import { GenderSwitch } from "../GenderSwitch";

export default function Auth({ profileActivate, onClose }:{ profileActivate: ()=>void; onClose: ()=>void; }) {
    const { t } = useTranslation()
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState("")
    const [gender, setGender] = useState(Gender.MALE)
    const [email, setEmail] = useState("")
    const [city, setCity] = useState("")
    const [cityId, setCityId] = useState<number>()
    const [password, setPassword] = useState("")
    const [cities, setCities] = useState<SelectOptionType[]>([])
    const setUser = useSetAtom(userAtom)
    const lang = useAtomValue(languageAtom)

    useEffect(()=>{
        (async ()=>{
            if (!isLogin && !cities.length) {
                const res = await citiesApi.getAll(lang)
                if (res) {
                    const selectCities = Array<SelectOptionType>(res.length)
                    res.forEach((city, i)=>{selectCities[i] = { label: city.title, value: city.id }})
                    setCities(selectCities)
                }
            }
        })()
    }, [isLogin])

    const userSetter = async (res: RegistrationType) => {
        await LocalStorage.setItem("accessToken", res.accessToken)
        await LocalStorage.setItem("refreshToken", res.refreshToken)
        setUser(res.user)
    }
    const authHandler = async () => {
        if (isLogin) {
            if (email && password) {
                const res = await registrationApi.login(email, password, lang)
                if (res) {
                    await userSetter(res)
                    profileActivate()
                    onClose()
                }
            } else {
                toast.error("Email или пароль не введены")
            }
        } else {
            if (username && email && password) {
                const res = await registrationApi.createUser(email, username, password, cityId||null, Boolean(gender), lang, city)
                if (res) {
                    await userSetter(res)
                    profileActivate()
                    onClose()
                }
            } else {
                toast.error("Email, username или пароль не введены")
            }
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "30px" }}>
            <InputText placeholder="Email" type="email" value={email} setValue={setEmail} />
            {!isLogin && <InputText placeholder="Username" value={username} setValue={setUsername} /> }
            {!isLogin && <GenderSwitch gender={gender} setGender={setGender} />}
            {!isLogin && <Select placeholder={t("selectCity")} value={cityId} setValue={setCityId} options={cities} />}
            {!isLogin && <InputText placeholder="Create city" value={city} setValue={setCity} /> }
            <InputText placeholder="Password" type="password" value={password} setValue={setPassword} />
            <Button onClick={authHandler} title={isLogin ? t("enter") : t("register")} />
            <span onClick={()=>setIsLogin(!isLogin)} style={{ color: "var(--accent)", cursor: "pointer", alignSelf: "center" }}>{!isLogin ? t("enter") : t("register")}</span>
        </div>
    )
}