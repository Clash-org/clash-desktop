import { Pages, usePage } from "@/hooks/usePage";
import styles from "./index.module.css"

type FightersScoresProps = {
    data: {
        idRed: string;
        nameRed: string;
        scoreRed: number;
        nameBlue: string;
        idBlue: string;
        scoreBlue: number;
    }[]
}

export default function FightersScores({ data }:FightersScoresProps) {
    const { setPage } = usePage()
    return (
        <div className={styles.wrap}>
            {data.map((d, i)=>(
                <div key={i} className={styles.cell}>
                    <span><span className="link" onClick={()=>setPage(Pages.PROFILE, { id: d.idRed })}>{d.nameRed}</span></span>
                    <span className={d.scoreRed > d.scoreBlue ? styles.win : ""}>{d.scoreRed}</span>
                    <span className={d.scoreBlue > d.scoreRed ? styles.win : ""}>{d.scoreBlue}</span>
                    <span><span className="link" onClick={()=>setPage(Pages.PROFILE, { id: d.idBlue })}>{d.nameBlue}</span></span>
                </div>
            ))}
        </div>
    )
}