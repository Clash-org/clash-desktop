import { X } from "lucide-react"
import styles from "./index.module.css"

type LinksListProps = {
    links: string[];
    texts?: string[];
    setLinks?: (links: string[], removeIdx: number)=>void;
    setTexts?: (texts: string[])=>void;
    onClick?: (link: string, idx: number)=>void;
}

export default function LinksList({ links, texts, setLinks, setTexts, onClick }:LinksListProps) {
    const removeLink = (idx: number) => {
        const newLinks = links.filter((_, i)=>i !== idx)
        setLinks?.(newLinks, idx)
        if (texts)
            setTexts?.(texts?.filter((_, i)=>i !== idx))
    }
    return !!links.length &&
    <div className={styles.links}>
    {links.map((link, i) => (
        <span className={styles.link} onClick={()=>onClick?.(link, i)} style={onClick ? { cursor: "pointer" } : {}} key={i}>
            {link}
            {setLinks &&
            <X className={styles.removeBtn} onClick={(e)=>{ e.stopPropagation(); removeLink(i) }} size={25} />
            }
        </span>
    ))}
    </div>
}