import { CSSProperties } from "react";
import styles from "./index.module.css"

type CheckboxProps<T> = {
    values: T[];
    value: T;
    setValue: (data: T[])=>void;
    title: string;
    className?: string;
    style?: CSSProperties;
}

export default function Checkbox<T>({ values, value, setValue, title, className, style }:CheckboxProps<T>) {
    return (
        <label className={[styles.checkboxLabel, className].join(" ")} style={style}>
            <input
                type="checkbox"
                checked={values.includes(value)}
                onChange={(e) => {
                const newVal = e.target.checked
                    ? [...values, value]
                    : values.filter(id => id !== value);
                setValue(newVal);
                }}
                className={styles.checkbox}
            />
            <span>{title}</span>
        </label>
    )
}