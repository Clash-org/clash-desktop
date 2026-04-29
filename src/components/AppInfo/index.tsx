import { useTranslation } from "react-i18next"
import { CSSProperties, useEffect, useState } from "react";
import Section from "../Section";
import Markdown from "../Markdown";
import { useApi } from "@/hooks/useApi";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";
import { useUpdater } from "@/hooks/useUpdater";
import Button from "../Button";
import { Download } from "lucide-react";

const TutorialRU = () => {
    const styles: CSSProperties = { width: "100%", borderRadius: "12px" }
    return (
        <>
        <iframe src="https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239017&hash=e9a0190bee125ebd" style={styles} height="360" frameBorder="0" allowFullScreen="1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"></iframe>
        <iframe src="https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239020&hash=c5535dd9189748e4" style={styles} height="360" frameBorder="0" allowFullScreen="1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"></iframe>
        <iframe src="https://vkvideo.ru/video_ext.php?oid=-231799221&id=456239023&hash=fa1689aa98fe192b" style={styles} height="360" frameBorder="0" allowFullScreen="1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture"></iframe>
        </>
    )
}

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
            <Section title={t("manual")}>
                {lang === "ru" ? <TutorialRU /> :
                (lang === "en" ? <></> : <></>)
                }
            </Section>
            <Section>
                <Markdown text={privacyPolicy} />
            </Section>
        </div>
    )
}