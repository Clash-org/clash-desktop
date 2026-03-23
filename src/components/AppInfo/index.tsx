import { useTranslation } from "react-i18next"
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from "react";
import Section from "../Section";

export default function AppInfo() {
    const { t } = useTranslation()
    const [version, setVersion] = useState("")
    useEffect(()=>{
        (async ()=>{
            setVersion(await getVersion())
        })()
    }, [])
    return (
        <div className="container">
            <h1 className="title" style={{ textAlign: "center" }}>{t("aboutApp")}</h1>
            <Section>
                <span>{t("version")}: {version}</span>
            </Section>
        </div>
    )
}