import { useState } from "react";
import InputText from "../InputText";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import { storage } from "@/utils/storage";
import toast from "react-hot-toast";
import { useApi } from "@/hooks/useApi";
import { ApiConfig, setGlobalApiConfig } from "@/providers/ApiProvider";
import { Save } from "lucide-react";

export default function Servers() {
    const { t } = useTranslation()
    const { setBaseUrl, baseUrl } = useApi()
    const [serverURL, setServerURL] = useState(baseUrl)

    const handleChangeBaseURL = async ()=>{
        try {
            const res = await fetch(serverURL + "health")
            if (res.ok) {
                await storage.set("server", serverURL);
                setBaseUrl(serverURL)
                setGlobalApiConfig(new ApiConfig(serverURL))
                toast.success(t("settingsSaved"))
            }
        } catch {
            toast.error(t("p2pConnectionError").slice(1))
        }
    }

    return (
        <div className="container">
            <h1 className="title" style={{ textAlign: "center" }}>{t("server")}</h1>
            <InputText placeholder={t("server")} value={serverURL} setValue={setServerURL} />
            <Button title={t("change")} onClick={handleChangeBaseURL} style={{ width: "100%" }}>
                <Save size={28} color="var(--fg)" />
            </Button>
        </div>
    )
}