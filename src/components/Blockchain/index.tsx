import { contractType } from "@/constants"
import { capitalizeFirstLetter } from "@/utils/helpers"
import { useTranslation } from "react-i18next"
import { BlockchainWallet } from "../BlockchainWallet"
import Section from "../Section"

export default function Blockchain() {
    const { t } = useTranslation()

    return (
        <div className="container">
            <h1 className="title">{t("blockchain")}</h1>
            <Section title={t("smartContracts")}>
                {Object.keys(contractType).map((contract, i)=>(
                    // @ts-ignore
                    <span key={i}><span style={{ color: "var(--accent)" }}>{"Clash" + capitalizeFirstLetter(contract)}:</span> {contractType[contract].address}</span>
                ))}
            </Section>
            <BlockchainWallet />
        </div>
    )
}