import { useTranslation } from "react-i18next"
import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from "react";
import Section from "../Section";
import Markdown from "../Markdown";
import { useApi } from "@/hooks/useApi";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";

export default function AppInfo() {
    const { t } = useTranslation()
    const lang = useAtomValue(languageAtom)
    const { api } = useApi()
    const [version, setVersion] = useState("")
    const [privacyPolicy, setPrivacyPolicy] = useState("")
    useEffect(()=>{
        (async ()=>{
            setVersion(await getVersion())
            const policy = await fetch(api.policy + `?lang=${lang}`)
            if (policy.ok)
                setPrivacyPolicy(await policy.json())
        })()
    }, [])

    return (
        <div className="container" style={{ paddingBottom: "100px" }}>
            <h1 className="title">{t("aboutApp")}</h1>
            <Section>
                <span>{t("version")}: {version}</span>
            </Section>
            <Section>
                <Markdown text={privacyPolicy} />
            </Section>
        </div>
    )
}