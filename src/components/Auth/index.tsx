import { languageAtom, userAtom } from "@/store";
import { Gender, RegistrationType } from "@/typings";
import { LocalStorage } from "@/utils/helpers";
import Button from "@components/Button";
import InputText from "@components/InputText";
import { useAtomValue, useSetAtom } from "jotai";
import { CSSProperties, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { GenderSwitch } from "../GenderSwitch";
import CitySelect from "../CitySelect";
import ClubSelect from "../ClubSelect";
import { useAuth } from "@/hooks/useAuth";

export default function Auth({ profileActivate, onClose }:{ profileActivate: ()=>void; onClose: ()=>void; }) {
    const { register, login } = useAuth()
    const { t } = useTranslation()
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState("")
    const [gender, setGender] = useState(Gender.MALE)
    const [email, setEmail] = useState("")
    const [city, setCity] = useState("")
    const [club, setClub] = useState("")
    const [cityId, setCityId] = useState<number>()
    const [clubId, setClubId] = useState<number>()
    const [password, setPassword] = useState("")

    const setUser = useSetAtom(userAtom)
    const lang = useAtomValue(languageAtom)

    const userSetter = async (res: RegistrationType) => {
        await LocalStorage.setItem("accessToken", res.accessToken)
        setUser(res.user)
    }
    const authHandler = async () => {
        if (isLogin) {
            if (email && password) {
                const res = await login(email, password, lang)
                if (res) {
                    await userSetter(res)
                    // profileActivate()
                    onClose()
                }
            } else {
                toast.error(t("emailOrPasswordIncorrect"))
            }
        } else {
            if (username && email && password) {
                const res = await register(email, username, password, cityId||null, clubId||null, Boolean(gender), lang, city, club)
                if (res) {
                    await userSetter(res)
                    profileActivate()
                    onClose()
                }
            } else {
                toast.error(t("notFieldsFilled"))
            }
        }
    }

    const hintStyle: CSSProperties = { fontSize: "12px", color: "var(--placeholder)", textAlign: "center" }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "30px" }}>
            <InputText required placeholder="Email" type="email" value={email} setValue={setEmail} />
            {!isLogin && <InputText required placeholder={t("username")} value={username} setValue={setUsername} /> }
            {!isLogin && <GenderSwitch gender={gender} setGender={setGender} />}
            {!isLogin && <CitySelect city={city} setCity={setCity} cityId={cityId} setCityId={setCityId} />}
            {!isLogin && <span style={hintStyle}>Если не нашли город, то просто введите свой</span> }
            {!isLogin && <ClubSelect clubId={clubId} setClubId={setClubId} club={club} setClub={setClub} />}
            {!isLogin && <span style={hintStyle}>Если не нашли клуб, то просто введите свой</span> }
            <InputText required placeholder="Password" type="password" value={password} setValue={setPassword} />
            <Button onClick={authHandler} title={isLogin ? t("enter") : t("register")} />
            <span onClick={()=>setIsLogin(!isLogin)} style={{ color: "var(--accent)", cursor: "pointer", alignSelf: "center" }}>{!isLogin ? t("enter") : t("register")}</span>
        </div>
    )
}