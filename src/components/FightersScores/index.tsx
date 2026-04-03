import { Pages, usePage } from "@/hooks/usePage";
import { useTranslation } from "react-i18next";
import styles from "./index.module.css"

type FightersScoresProps = {
    data: {
        idRed: string;
        nameRed: string;
        scoreRed: number;
        nameBlue: string;
        idBlue: string;
        scoreBlue: number;
    }[],
    withoutLinks?: boolean
}

export default function FightersScores({ data, withoutLinks=false }: FightersScoresProps) {
    const { setPage } = usePage();
    const { t } = useTranslation();
    const goToProfile = (id: string) => {
        setPage(Pages.PROFILE, { id })
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.headerRow}>
                        <th className={styles.headerCell}>{t("name")}</th>
                        <th className={styles.headerCell}>{t("score")}</th>
                        <th className={styles.headerCell}>{t("score")}</th>
                        <th className={styles.headerCell}>{t("name")}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d, i) => (
                        <tr key={i} className={styles.row}>
                            <td className={styles.cell}>
                                <span
                                    className={!withoutLinks ? "link" : ""}
                                    onClick={!withoutLinks ? () => goToProfile(d.idRed) : undefined}
                                >
                                    {d.nameRed}
                                </span>
                            </td>
                            <td className={`${styles.cell} ${styles.scoreCell} ${d.scoreRed > d.scoreBlue ? styles.win : ''}`}>
                                {d.scoreRed}
                            </td>
                            <td className={`${styles.cell} ${styles.scoreCell} ${d.scoreBlue > d.scoreRed ? styles.win : ''}`}>
                                {d.scoreBlue}
                            </td>
                            <td className={styles.cell}>
                                <span
                                    className={!withoutLinks ? "link" : ""}
                                    onClick={!withoutLinks ? () => goToProfile(d.idBlue) : undefined}
                                >
                                    {d.nameBlue}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}