import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react";
import Section from "../Section";
import Markdown from "../Markdown";
import { useApi } from "@/hooks/useApi";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";
import { useUpdater } from "@/hooks/useUpdater";
import Button from "../Button";
import { Download } from "lucide-react";

export default function AppInfo() {
    const { t } = useTranslation()
    const lang = useAtomValue(languageAtom)
    const { currentVersion, updateInfo, downloadAndInstall } = useUpdater()
    const { api } = useApi()
    const [privacyPolicy, setPrivacyPolicy] = useState("")
    useEffect(()=>{
        (async ()=>{
            const policy = await fetch(api.policy + `?lang=${lang}`)
            if (policy.ok)
                setPrivacyPolicy(await policy.json())
        })()
    }, [])

    return (
        <div className="container" style={{ paddingBottom: "100px" }}>
            <h1 className="title">{t("aboutApp")}</h1>
            <Section>
                <span>{t("version")}: {currentVersion}</span>
                {updateInfo.available && !updateInfo.downloading &&
                <Button onClick={downloadAndInstall}>
                    <Download size={28} color="var(--fg)" />
                    {updateInfo.version}
                </Button>
                }
            </Section>
            <Section>
                <Markdown text={privacyPolicy} />
            </Section>
        </div>
    )
}