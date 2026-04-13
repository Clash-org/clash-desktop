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
import { useState } from "react";
import toast from "react-hot-toast";

export default function Blockchain({ t }:{ t: TFunction<"translation", undefined> }) {
    const { wallet } = useAtomValue(blockchainAtom)
    const {
        activateServer,
        deactivateServer,
        useServersIdsByOwner,
        useServer,
        getServerStatus,
        setServerPrice,
        setServerHost,
        releaseDaily
    } = useServerRegistry()
    const { data: serversIds } = useServersIdsByOwner(wallet)
    const [currentServerId, setCurrentServerId] = useState<number>()
    const { data: server } = useServer(currentServerId || Number(serversIds?.[0]))
    const [pricePerMonth, setPricePerMonth] = useState(Number(server?.pricePerMonth))
    const [host, setHost] = useState(String(server?.host))
    const { isActive } = getServerStatus(server)
    const [totalAmount, setTotalAmount] = useState<string>()

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

    return (
        <div className={styles.content}>
        {serversIds?.length &&
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

        <span>{t("pricePerMonth")}</span>
        <InputNumber
        min={1}
        value={pricePerMonth}
        setValue={setPricePerMonth}
        style={{ width: "100%" }}
        />
        <Button onClick={()=>setServerPrice(currentServerId, pricePerMonth)} stroke>
            {t("updateData")}
        </Button>

        <span>URL</span>
        <InputText
        value={host}
        setValue={setHost}
        />
        <Button onClick={()=>setServerHost(currentServerId, host)} stroke>
            {t("updateData")}
        </Button>
        <Button onClick={releaseFunds} title={t("getMoney")} />
        {!!totalAmount && <span>{t("totalAmount")}: {totalAmount}</span>}
        </>
        }
        </>
        }
        </div>
    )
}