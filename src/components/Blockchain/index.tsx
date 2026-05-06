import { useTranslation } from "react-i18next"
import { BlockchainWallet } from "../BlockchainWallet"
import Section from "../Section"
import { useContracts } from "@/hooks/useContracts"
import LinksList from "../LinksList"
import InputText from "../InputText"
import Button from "../Button"
import { Bookmark, CirclePlus, Save } from "lucide-react"
import { useEffect, useState } from "react"
import CryptoRestrictions from "../CryptoRestrictions"
import { useApi } from "@/hooks/useApi"
import toast from "react-hot-toast"
import { storage } from "@/utils/storage"
import { ApiConfig, setGlobalApiConfig } from "@/providers/ApiProvider"

export default function Blockchain() {
    const { rpc, setRpc, baseUrl } = useApi()
    const [rpcURL, setRpcURL] = useState(rpc)
    const [rpcs, setRpcs] = useState<string[]>()
    const [contractAddresses, setContractAddresses] = useState(["", "", "", ""])
    const [notes, setNotes] = useState(["", "", "", ""])
    const { t } = useTranslation()
    const {
        tournament,
        user,
        server,
        bet,
        switchTournamentAddress,
        switchServerAddress,
        switchUserAddress,
        switchBetAddress,
        updateServerAddress,
        updateTournamentAddress,
        updateUserAddress,
        updateBetAddress,
        addServerAddress,
        addTournamentAddress,
        addUserAddress,
        addBetAddress,
        removeTournamentAddress,
        removeServerAddress,
        removeUserAddress,
        removeBetAddress,
        saveConfig
    } = useContracts();

    const currentContracts = [server, tournament, user, bet]
    const contractHandlers = [
        {
            update: updateServerAddress,
            add: addServerAddress
        },
        {
            update: updateTournamentAddress,
            add: addTournamentAddress
        },
        {
            update: updateUserAddress,
            add: addUserAddress
        },
        {
            update: updateBetAddress,
            add: addBetAddress
        },
    ]
    const otherAddresses = [
        server.addresses,
        tournament.addresses,
        user.addresses,
        bet.addresses
    ]

    const handleChangeRpc = async (url: string) => {
        await storage.set("rpc", url);
        setRpc(url)
        setGlobalApiConfig(new ApiConfig(baseUrl, url))
        toast.success(t("settingsSaved"))
    }

    const saveURL = async () => {
        const data = rpcs ? [...rpcs, rpcURL] : [rpcURL]
        await storage.set("rpcs", data);
        setRpcs(data)
        setRpcURL("")
        toast.success(t("settingsSaved"))
    }

    useEffect(()=>{
        storage.get<string[]>("rpcs").then(res=>setRpcs(res))
    }, [])

    return (
        <div className="container">
            <h1 className="title">{t("blockchain")}</h1>
            <CryptoRestrictions />
            <Section title="RPC">
                <InputText placeholder="RPC URL" value={rpcURL} setValue={setRpcURL} />
                <Button stroke onClick={saveURL} style={{ width: "100%" }}>
                    <Bookmark size={28} color="var(--fg)" />
                </Button>
                <Button onClick={()=>handleChangeRpc(rpcURL)} style={{ width: "100%" }}>
                    <Save size={28} color="var(--fg)" />
                </Button>
                {rpcs && <LinksList
                            onClick={(link)=>{setRpcURL(link); handleChangeRpc(link)}}
                            links={rpcs}
                            setLinks={async (links)=>{ setRpcs(links); await storage.set("rpcs", links) }}
                            />}
            </Section>
            <Section title={t("smartContracts")}>
                {currentContracts.map((contract, i)=>(
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <span style={{ color: "var(--accent)" }}>{contract.note}</span>
                        <InputText value={contract.address} setValue={(val)=>contractHandlers[i].update(contract.currentIndex, val, contract.note)} />
                        <InputText placeholder={t("description")} value={contract.note} setValue={(val)=>contractHandlers[i].update(contract.currentIndex, contract.address, val)} />
                    </div>
                ))}
                <Button onClick={saveConfig} style={{ width: "100%" }}>
                    <Save size={28} color="var(--fg)" />
                </Button>
                {contractHandlers.map((handler, i)=>(
                    <>
                    <span style={{ marginTop: "10px" }}>{currentContracts[i].addresses?.[0]?.note}</span>
                    <InputText placeholder={t("smartContractAddress")} value={contractAddresses[i]} setValue={val=>setContractAddresses(state=>{ const buf = [...state]; buf[i] = val; return buf })} />
                    <InputText placeholder={t("description")} value={notes[i]} setValue={val=>setNotes(state=>{ const buf = [...state]; buf[i] = val; return buf })} />
                    <Button onClick={()=>handler.add(contractAddresses[i], notes[i])}>
                        <CirclePlus size={28} color="var(--fg)" />
                    </Button>
                    </>
                ))}
                <LinksList
                links={otherAddresses[0].map(addr=>`${addr.note}: ${addr.address}`)}
                onClick={(_, idx)=>{ switchServerAddress(idx) }}
                setLinks={(_, idx)=>removeServerAddress(idx)}
                />
                <LinksList
                links={otherAddresses[1].map(addr=>`${addr.note}: ${addr.address}`)}
                onClick={(_, idx)=>{ switchTournamentAddress(idx) }}
                setLinks={(_, idx)=>removeTournamentAddress(idx)}
                />
                <LinksList
                links={otherAddresses[2].map(addr=>`${addr.note}: ${addr.address}`)}
                onClick={(_, idx)=>{ switchUserAddress(idx) }}
                setLinks={(_, idx)=>removeUserAddress(idx)}
                />
                <LinksList
                links={otherAddresses[3].map(addr=>`${addr.note}: ${addr.address}`)}
                onClick={(_, idx)=>{ switchBetAddress(idx) }}
                setLinks={(_, idx)=>removeBetAddress(idx)}
                />
            </Section>
            <BlockchainWallet />
        </div>
    )
}