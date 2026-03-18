import { ReactNode } from "react";
import Button from "../Button";
import styles from "./index.module.css"

type TabsProps<T> = {
    titles: string[]|ReactNode[],
    tabs: T[],
    activeTab: T;
    setActiveTab: (val: T)=>void;
}

export default function Tabs<T>({ titles, tabs, activeTab, setActiveTab }:TabsProps<T>) {
    return (
        <div className={styles.tabs}>
            {tabs.map((tab, i)=>
                <Button
                key={i}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab)}
                >
                {titles[i]}
                </Button>
            )}
        </div>
    )
}