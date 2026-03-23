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
}

export default function LoadWrap<T>({ page, data, setData, totalCount, setPage, loading, children }:LoadWrapProps<T>) {
    const loadMore = () => {
        setPage(page+1);
    };
    useEffect(()=>{
        setData(state=>{
        if (JSON.stringify(state) !== JSON.stringify(data))
            return [...state, ...data]
        return state
        })
    }, [page, data])
    return <>
    {children}
    <LoadBtn page={page} loadMore={loadMore} loading={loading} totalCount={totalCount} />
    </>
}