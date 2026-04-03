import { Dispatch, ReactNode, SetStateAction, useEffect } from "react"
import LoadBtn from "./LoadBtn";

type LoadWrapProps<T> = {
    page: number;
    setPage: Dispatch<SetStateAction<number>>;
    data: T[];
    setData: Dispatch<SetStateAction<T[]>>;
    children: ReactNode;
    totalCount: number;
    loading: boolean;
    showCount?: number;
    filterKey?: string;
}

export default function LoadWrap<T>({ page, data, setData, totalCount, setPage, loading, showCount, filterKey="id", children }:LoadWrapProps<T>) {
    const loadMore = () => {
        setPage(page+1);
    };
    useEffect(()=>{
        setData(state=>{
            const filteredState = state.filter(stateItem =>
            // @ts-ignore
            !data.some(dataItem => dataItem?.[filterKey] === stateItem?.[filterKey])
            );
            return [...filteredState, ...data]
        })
    }, [page, data])
    return <>
    {children}
    <LoadBtn page={page} loadMore={loadMore} loading={loading} totalCount={totalCount} showCount={showCount} />
    </>
}