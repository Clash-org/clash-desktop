import { CSSProperties, ReactNode } from "react";
import styles from "./index.module.css"

type CommonProps = {
    title: string;
    postfix?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

// Перегрузки для разных типов
type CheckboxPropsMultiple<T> = {
    values: T[];
    value: T;
    setValue: (data: T[]) => void;
    title: string;
    postfix?: ReactNode;
    className?: string;
    style?: CSSProperties;
} & CommonProps

type CheckboxPropsSingle = {
    values?: never;
    value: boolean;
    setValue: (data: boolean) => void;
} & CommonProps

type CheckboxProps<T> = CheckboxPropsMultiple<T> | CheckboxPropsSingle;

export default function Checkbox<T>(props: CheckboxProps<T>) {
    const { value, setValue, title, postfix, className, style } = props;
    const values = 'values' in props ? props.values : undefined;

    // Определяем checked состояние
    const checked = values
        ? values.includes(value as T)
        : Boolean(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (values) {
            // Режим с массивом (T[])
            const newValues = e.target.checked
                ? [...values, value as T]
                : values.filter(id => id !== value);
            (setValue as (data: T[]) => void)(newValues);
        } else {
            // Режим с boolean
            (setValue as (data: boolean) => void)(e.target.checked);
        }
    };

    return (
        <label className={[styles.checkboxLabel, className].join(" ")} style={style}>
            <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                className={styles.checkbox}
            />
            <span>{title} {postfix}</span>
        </label>
    );
}