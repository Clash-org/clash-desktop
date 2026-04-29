import Button from "@/components/Button";
import InputNumber from "@/components/InputNumber";
import InputText from "@/components/InputText";
import Select from "@/components/Select";
import styles from "../index.module.css"
import { useServerRegistry } from "@/hooks/useServerRegistry";
import { blockchainAtom } from "@/store";
import { parseContractError } from "@/utils/helpers";
import { TFunction } from "i18next";
import { useAtomValue } from "jotai";
import { Power, PowerOff } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NATIVE_CURRENCIES } from "@/constants";
import { CURRENCY_CODES, CurrencyType } from "@/typings";
import Tabs from "@/components/Tabs";
import { createFiatPayment } from "@/utils/api";
import { useFiatPayment } from "@/hooks/useFiatPayment";

export default function Server({ t }:{ t: TFunction<"translation", undefined> }) {
    const { fiat } = useFiatPayment()
    const { wallet } = useAtomValue(blockchainAtom)
    const {
        activateServer,
        deactivateServer,
        useServersIdsByOwner,
        useServer,
        getServerStatus,
        getToken,
        setServerPrice,
        setServerHost,
        releaseDaily
    } = useServerRegistry()
    const titles = [t("cryptocurrency"), t("fiat")]
    const tabs = ["cryptocurrency", "fiat"] as const
    const [activeTab, setActiveTab] = useState<typeof tabs[number]>("cryptocurrency")
    const { data: serversIds } = useServersIdsByOwner(wallet)
    const [currentServerId, setCurrentServerId] = useState<number>()
    const { data: server } = useServer(currentServerId || Number(serversIds?.[0]))
    const [pricePerMonth, setPricePerMonth] = useState(Number(server?.pricePerMonth))
    const [host, setHost] = useState(String(server?.host))
    const { isActive } = getServerStatus(server)
    const [totalAmount, setTotalAmount] = useState<string>()
    const [token, setToken] = useState(NATIVE_CURRENCIES[137]);
    const [payLink, setPayLink] = useState(fiat?.link)
    const [currencyCode, setCurrencyCode] = useState<CurrencyType>(fiat?.currencyCode || "RUB")
    const [fiatPrice, setFiatPrice] = useState<number>(fiat?.price || 0)

    const toggleServer = async () => {
        if (currentServerId) {
            try {
                isActive ? await deactivateServer(currentServerId) : await activateServer(currentServerId)
                toast.success(isActive ? t("serverOff") : t("serverOn"))
            } catch (error: any) {
                toast.error(error.message)
            }
        }
    }

    const releaseFunds = async () => {
        if (server) {
            try {
                const amount = await releaseDaily(Number(server.id));
                setTotalAmount(amount);
                toast.success(t("checkWallet"))

            } catch(error: any) {
                toast.error(parseContractError(error))
            }
        }
    }

    useEffect(()=>{
        getToken().then(res=>setToken(res)).catch(()=>setToken(NATIVE_CURRENCIES[137]))
    }, [])

    return (
        <div className={styles.content}>
        <Tabs titles={titles} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab === "cryptocurrency" && serversIds?.length &&
        <>
            <Select
            options={serversIds.map(id=>({ value: Number(id), label: String(id) }))}
            value={currentServerId}
            setValue={setCurrentServerId}
            placeholder={t("serverId")}
            />
            {currentServerId &&
            <>
                <Button
                onClick={toggleServer} stroke={isActive}
                >
                    {isActive ? <PowerOff size={28} color="var(--fg)" /> : <Power size={28} color="var(--fg)" />}
                </Button>

                <span>{t("pricePerMonth")} {token.symbol}</span>
                <InputNumber
                min={1}
                value={pricePerMonth}
                setValue={setPricePerMonth}
                style={{ width: "100%" }}
                />
                <Button
                title={t("updateData")}
                onClick={async ()=>{ await setServerPrice(currentServerId, pricePerMonth); toast.success(t("dataUpdated"))}}
                stroke
                />

                <span>URL</span>
                <InputText
                value={host}
                setValue={setHost}
                />
                <Button
                title={t("updateData")}
                onClick={async ()=>{ await setServerHost(currentServerId, host); toast.success(t("dataUpdated"))}}
                stroke
                />
                <Button onClick={releaseFunds} title={t("getMoney")} />
                {!!totalAmount && <span>{t("totalAmount")}: {totalAmount}</span>}
            </>
            }
        </>
        }
        {activeTab === "fiat" &&
        <>
            <InputText
            value={payLink}
            setValue={setPayLink}
            placeholder={t("payServerLink")}
            />
            <Select
            options={CURRENCY_CODES.map(code=>({ label: code, value: code }))}
            value={currencyCode}
            setValue={setCurrencyCode}
            />
            <InputNumber
            value={fiatPrice}
            setValue={setFiatPrice}
            max={10000000000}
            style={{ width: "100%" }}
            />
            <Button
            title={t("updateData")}
            onClick={async ()=>{await createFiatPayment(fiatPrice, payLink, currencyCode); toast.success(t("dataUpdated"))}}
            />
        </>
        }
        </div>
    )
}