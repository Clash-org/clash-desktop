import { PAGE_SIZE } from "@/constants";
import styles from "./index.module.css"
import { CircleArrowDown } from "lucide-react";
import Button from "@/components/Button";

type LoadBtnProps = {
    totalCount: number;
    showCount?: number;
    page: number;
    loadMore: ()=>void;
    loading: boolean;
}

export default function LoadBtn({ totalCount, page, loadMore, loading, showCount=PAGE_SIZE }:LoadBtnProps) {
    return page * showCount < totalCount && (
            <div className={styles.loadMoreWrapper}>
            <Button
                onClick={loadMore}
                className={styles.loadMoreButton}
                disabled={loading}
                stroke
            >
                {loading ? (
                <span className={styles.loadingSpinner}></span>
                ) : (
                <CircleArrowDown size={28} color="var(--fg)" />
                )}
            </Button>
            </div>
        )
}