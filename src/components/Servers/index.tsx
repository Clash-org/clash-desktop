import { useEffect, useState } from "react";
import InputText from "../InputText";
import { useTranslation } from "react-i18next";
import Button from "../Button";
import { storage } from "@/utils/storage";
import toast from "react-hot-toast";
import { useApi } from "@/hooks/useApi";
import { ApiConfig, setGlobalApiConfig } from "@/providers/ApiProvider";
import { Bookmark, Save } from "lucide-react";
import LinksList from "../LinksList";
import { useContract } from "@/hooks/useContract";
import { ServerStatus, ServerType } from "@/typings";
import { PaymentForm } from "../PaymentForm";

export default function Servers() {
    const { t } = useTranslation()
    const { useContractQuery, contract } = useContract("server")
    const { data: totalServers } = useContractQuery<bigint>("totalServers")
    const totalCount = Number(totalServers)
    const { setBaseUrl, baseUrl } = useApi()
    const [serverURL, setServerURL] = useState(baseUrl)
    const [servers, setServers] = useState<string[]>()
    const [globalServers, setGlobalServers] = useState<ServerType[]>()

    const handleChangeBaseURL = async () => {
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

    const saveURL = async () => {
        const serversArr = await storage.get<string[]>("servers") || []
        const data = [...serversArr, serverURL]
        await storage.set("servers", data);
        setServers(data)
        setServerURL("")
        toast.success(t("settingsSaved"))
    }

    useEffect(()=>{
        (async ()=>{
            setServers(await storage.get<string[]>("servers"))
            if (totalCount) {
                const serversArr: ServerType[] = []
                for (let i = 1; i <= totalCount; i++) {
                    serversArr.push(await contract.getServer(i))

                }
                setGlobalServers(serversArr)
            }
        })()
    }, [])

    return (
        <div className="container" style={{ paddingBottom: "100px" }}>
            <h1 className="title">{t("server")}</h1>
            <InputText placeholder={t("server")} value={serverURL} setValue={setServerURL} />
            <Button stroke title={t("change")} onClick={saveURL} style={{ width: "100%" }}>
                <Bookmark size={28} color="var(--fg)" />
            </Button>
            <Button title={t("change")} onClick={handleChangeBaseURL} style={{ width: "100%" }}>
                <Save size={28} color="var(--fg)" />
            </Button>
            {servers && <LinksList
                        onClick={(link)=>{setServerURL(link); handleChangeBaseURL()}}
                        links={servers}
                        setLinks={async (links)=>{ setServers(links); await storage.set("servers", links) }}
                        />}
            {globalServers && <LinksList
                        onClick={(link)=>{setServerURL(link); handleChangeBaseURL()}}
                        links={globalServers.map(ser=>`${Number(ser.status) === ServerStatus.ACTIVE ? "✅" : "❌"} ${ser.host}`)}
                        />}
            <PaymentForm />
        </div>
    )
}