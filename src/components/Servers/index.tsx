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
    const { data: totalServers, isLoading } = useContractQuery<bigint>("totalServers")
    const totalCount = Number(totalServers)
    const { setBaseUrl, baseUrl, rpc } = useApi()
    const [serverURL, setServerURL] = useState(baseUrl)
    const [servers, setServers] = useState<string[]>()
    const [globalServers, setGlobalServers] = useState<ServerType[]>()

    const handleChangeBaseURL = async (url: string) => {
        try {
            const res = await fetch(url + "health")
            if (res.ok) {
                await storage.set("server", url);
                setBaseUrl(url)
                setGlobalApiConfig(new ApiConfig(url, rpc))
                toast.success(t("settingsSaved"))
            }
        } catch {
            toast.error(t("p2pConnectionError").slice(1))
        }
    }

    const saveURL = async () => {
        const data = servers ? [...servers, serverURL] : [serverURL]
        await storage.set("servers", data);
        setServers(data)
        setServerURL("")
        toast.success(t("settingsSaved"))
    }

    useEffect(()=>{
        (async ()=>{
            if (!isLoading) {
                const serversArr: ServerType[] = []
                for (let i = 1; i <= totalCount; i++) {
                    serversArr.push(await contract.getServer(i))
                }
                setGlobalServers(serversArr)
            }
        })()
    }, [isLoading])

    useEffect(()=>{
        storage.get<string[]>("servers").then(res=>setServers(res))
    }, [])

    return (
        <div className="container" style={{ paddingBottom: "100px" }}>
            <h1 className="title">{t("server")}</h1>
            <InputText placeholder={t("server")} value={serverURL} setValue={setServerURL} />
            <Button stroke onClick={saveURL} style={{ width: "100%" }}>
                <Bookmark size={28} color="var(--fg)" />
            </Button>
            <Button onClick={()=>handleChangeBaseURL(serverURL)} style={{ width: "100%" }}>
                <Save size={28} color="var(--fg)" />
            </Button>
            {servers && <LinksList
                        onClick={(link)=>{setServerURL(link); handleChangeBaseURL(link)}}
                        links={servers}
                        setLinks={async (links)=>{ setServers(links); await storage.set("servers", links) }}
                        />}
            {globalServers && <LinksList
                        onClick={(link)=>{setServerURL(link); handleChangeBaseURL(link)}}
                        links={globalServers.map(s=>`${Number(s.status) === ServerStatus.ACTIVE ? "✅" : "❌"} ${s.host} – ${s.city}`)}
                        />}
            <PaymentForm />
        </div>
    )
}