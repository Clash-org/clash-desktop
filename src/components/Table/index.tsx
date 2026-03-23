// components/DataTable.tsx
import { ReactNode } from 'react';
import styles from './index.module.css';

interface TableProps {
  data: (string|ReactNode)[][];
  titles?: string[];
  hints?: string[][];
  className?: string;
}

export default function Table({
  data,
  titles,
  hints,
  className = ''
}: TableProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <table className={styles.table}>
        {titles && (
          <thead>
            <tr className={styles.headerRow}>
              {titles.map((title, i) => (
                <th key={i} className={styles.headerCell}>
                  <span className={styles.headerText}>{title}</span>
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={styles.row}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={styles.cell}>
                  {typeof cell === "string" && cell.includes('\n') ? (
                    <>
                      <span
                        className={styles.text}
                        title={hints?.[rowIndex]?.[cellIndex]}
                      >
                        {cell.split('\n')[0]}
                      </span>
                      <span className={styles.hint}>
                        {cell.split('\n')[1]}
                      </span>
                    </>
                  ) : (
                    <span
                      className={styles.text}
                      title={hints?.[rowIndex]?.[cellIndex]}
                    >
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}