import { languageAtom, userAtom } from "@/store";
import { Gender } from "@/typings";
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
import Checkbox from "../Checkbox";

export default function Auth({ profileActivate, onClose, setPage }:{ profileActivate: ()=>void; onClose: ()=>void; setPage: ()=>void }) {
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
    const [isAgree, setIsAgree] = useState(false)

    const setUser = useSetAtom(userAtom)
    const lang = useAtomValue(languageAtom)

    const authHandler = async () => {
        if (isLogin) {
            if (email && password) {
                const res = await login(email, password, lang)
                if (res) {
                    setUser(res.user)
                    profileActivate()
                    onClose()
                }
            } else {
                toast.error(t("emailOrPasswordIncorrect"))
            }
        } else {
            if (username && email && password) {
                const res = await register(email, username, password, cityId||null, clubId||null, Boolean(gender), lang, city, club)
                if (res) {
                    setUser(res.user)
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
            <InputText required placeholder={t("email")} type="email" value={email} setValue={setEmail} />
            {!isLogin && <InputText required placeholder={t("username")} value={username} setValue={setUsername} /> }
            {!isLogin && <GenderSwitch gender={gender} setGender={setGender} />}
            {!isLogin && <CitySelect city={city} setCity={setCity} cityId={cityId} setCityId={setCityId} />}
            {!isLogin && <span style={hintStyle}>{t("enterIfNotFound")}</span> }
            {!isLogin && <ClubSelect clubId={clubId} setClubId={setClubId} club={club} setClub={setClub} />}
            {!isLogin && <span style={hintStyle}>{t("enterIfNotFound")}</span> }
            <InputText required placeholder={t("password")} type="password" value={password} setValue={setPassword} />
            {!isLogin && <Checkbox title={t("youAgree")} postfix={<span onClick={(e)=>{ e.stopPropagation(); e.preventDefault(); setPage(); onClose() }} style={{ borderBottom: "1px dashed var(--accent)" }}>{t("privacyPolicy")}</span>} value={isAgree} setValue={(val)=>setIsAgree(val)} />}
            <Button onClick={authHandler} title={isLogin ? t("enter") : t("register")} />
            <span onClick={()=>setIsLogin(!isLogin)} style={{ color: "var(--accent)", cursor: "pointer", alignSelf: "center" }}>{!isLogin ? t("enter") : t("register")}</span>
        </div>
    )
}