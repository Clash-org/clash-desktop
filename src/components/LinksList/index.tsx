import { X } from "lucide-react"
import styles from "./index.module.css"

type LinksListProps = {
    links: string[]
    setLinks?: (links: string[])=>void;
    onClick?: (link: string)=>void;
}

export default function LinksList({ links, setLinks, onClick }:LinksListProps) {
    const removeLink = (link: string) => {
        const newLinks = links.filter(l=>l !== link)
        setLinks?.(newLinks)
    }
    return !!links.length &&
    <div className={styles.links}>
    {links.map((link, i) => (
        <span className={styles.link} onClick={()=>onClick?.(link)} style={onClick ? { cursor: "pointer" } : {}} key={i}>
            {link}
            {setLinks &&
            <X className={styles.removeBtn} onClick={(e)=>{ e.stopPropagation(); removeLink(link) }} size={25} />
            }
        </span>
    ))}
    </div>
}