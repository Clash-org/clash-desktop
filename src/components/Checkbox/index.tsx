import { CSSProperties, ReactNode } from "react";
import styles from "./index.module.css"

type CheckboxProps<T> = {
    values?: T[];
    value: T;
    setValue: (data: boolean|T[])=>void;
    title: string;
    postfix?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export default function Checkbox<T>({ values, value, setValue, title, postfix, className, style }:CheckboxProps<T>) {
    return (
        <label className={[styles.checkboxLabel, className].join(" ")} style={style}>
            <input
                type="checkbox"
                checked={values ? values.includes(value) : Boolean(value)}
                onChange={(e) => {
                const newVal = values ? (e.target.checked
                    ? [...values, value]
                    : values.filter(id => id !== value)) : e.target.checked
                setValue(newVal);
                }}
                className={styles.checkbox}
            />
            <span>{title} {postfix}</span>
        </label>
    )
}