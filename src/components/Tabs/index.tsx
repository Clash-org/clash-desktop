import { ReactNode } from "react";
import Button from "../Button";
import styles from "./index.module.css"

type TabsProps<T> = {
    titles: string[]|ReactNode[],
    tabs: readonly T[],
    activeTab: T;
    setActiveTab: (val: T)=>void;
    withoutBottom?: boolean
}

export default function Tabs<T>({ titles, tabs, activeTab, setActiveTab, withoutBottom }:TabsProps<T>) {
    return (
        <div className={styles.tabs} style={withoutBottom ? { marginBottom: 0 } : {}}>
            {titles.map((title, i)=>
                <Button
                key={i}
                className={`${styles.tab} ${activeTab === tabs[i] ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tabs[i])}
                >
                {title}
                </Button>
            )}
        </div>
    )
}