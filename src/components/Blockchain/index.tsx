import { contractType } from "@/constants"
import { capitalizeFirstLetter } from "@/utils/helpers"
import { useTranslation } from "react-i18next"

export default function Blockchain() {
    const { t } = useTranslation()

    return (
        <div className="container">
            <h1 className="title">{t("blockchain")}</h1>
            {Object.keys(contractType).map((contract, i)=>(
                // @ts-ignore
                <span key={i}>{capitalizeFirstLetter(contract)}: {contractType[contract].address}</span>
            ))}
        </div>
    )
}