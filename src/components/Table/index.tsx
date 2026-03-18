// components/DataTable.tsx
import styles from './index.module.css';

interface TableProps {
  data: string[][];
  headers?: string[];
  hints?: string[][];
  className?: string;
}

export default function Table({
  data,
  headers,
  hints,
  className = ''
}: TableProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      {headers && (
        <div className={styles.header}>
          {headers.map((h, i) => (
            <div key={i} className={styles.headerCell}>
              <span className={styles.headerText}>{h}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`${styles.body}`}>
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className={styles.cell}>
                {cell.includes('\n') ? (
                  <>
                    <span className={styles.text} title={hints ? hints[rowIndex][cellIndex] : undefined}>{cell.split('\n')[0]}</span>
                    <span className={styles.hint}>{cell.split('\n')[1]}</span>
                  </>
                ) : (
                  <span className={styles.text} title={hints ? hints[rowIndex][cellIndex] : undefined}>{cell}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}