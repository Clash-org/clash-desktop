// components/SelectPair/index.tsx
import { ParticipantType } from "@/typings"
import Section from "../Section"
import Button from "../Button"
import styles from "./index.module.css"
import { getName } from "@/utils/helpers"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Trash2 } from "lucide-react"

type SelectPairProps = {
    poolIndex: number;
    fighterPairs: ParticipantType[][][];
    currentPairIndex: number;
    selectPair: (idx: number) => void;
    deleteEmptyPairs?: boolean;
    manualMode?: boolean;
    onPairsReordered?: (newPairs: ParticipantType[][][]) => void;
    onDeletePair?: (id1: string, id2: string) => void
    setPools?: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>;
}

export default function SelectPair({
    fighterPairs,
    poolIndex,
    currentPairIndex,
    selectPair,
    deleteEmptyPairs = false,
    manualMode = false,
    onPairsReordered,
    onDeletePair,
    setPools
}: SelectPairProps) {
    const { t } = useTranslation()
    const [draggedParticipant, setDraggedParticipant] = useState<{
        pairIndex: number;
        position: 0 | 1;
    } | null>(null)

    const handleDragStart = (e: React.DragEvent, pairIndex: number, position: 0 | 1) => {
        if (!manualMode) return
        e.stopPropagation()
        setDraggedParticipant({ pairIndex, position })
        e.dataTransfer.setData('text/plain', JSON.stringify({ pairIndex, position }))
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (!manualMode) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, targetPairIndex: number, targetPosition: 0 | 1) => {
        if (!manualMode || !onPairsReordered) {
            return
        }
        e.preventDefault()
        e.stopPropagation()

        const dragData = e.dataTransfer.getData('text/plain')
        if (!dragData) {
            return
        }

        try {
            const source = JSON.parse(dragData)

            if (source.pairIndex === targetPairIndex && source.position === targetPosition) {
                setDraggedParticipant(null)
                return
            }

            // Создаём глубокую копию с гарантией нового референса
            const newPairs: ParticipantType[][][] = fighterPairs.map(pool =>
                pool.map(pair =>
                    pair.map(participant => ({ ...participant }))
                )
            )

            // Проверка границ
            if (!newPairs[poolIndex]?.[source.pairIndex]?.[source.position] ||
                !newPairs[poolIndex]?.[targetPairIndex]?.[targetPosition]) {
                return
            }

            const sourceParticipant = newPairs[poolIndex][source.pairIndex][source.position]
            const targetParticipant = newPairs[poolIndex][targetPairIndex][targetPosition]

            // Меняем местами
            newPairs[poolIndex][source.pairIndex][source.position] = targetParticipant
            newPairs[poolIndex][targetPairIndex][targetPosition] = sourceParticipant

            onPairsReordered(newPairs)

        } catch (error) {
            console.error('❌ Drop error:', error)
        }

        setDraggedParticipant(null)
    }

    const handleDragEnd = () => {
        setDraggedParticipant(null)
    }

    const isDragging = (pairIndex: number, position: 0 | 1) => {
        return draggedParticipant?.pairIndex === pairIndex &&
               draggedParticipant?.position === position
    }

    return !manualMode ?
    <>
      {fighterPairs[poolIndex]?.[0]?.[0] ?
      <Section title={t('pairs') + ": " + t("pool") + " " + (poolIndex + 1).toString()}>
          {fighterPairs[poolIndex].map((pair, idx) => {
              if (deleteEmptyPairs && (pair[0].name === "—" || pair[1].name === "—")) {
                  return null
              }
              return (
                  <Button
                      key={idx}
                      className={styles.pairItem}
                      style={currentPairIndex === idx ? { backgroundColor: "var(--accent)" } : { backgroundColor: "var(--accent-transparent)" }}
                      title={`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                      onClick={() => selectPair(idx)}
                  />
              )
          })}
      </Section>
      :
      <></>}
    </>
    :
    (
    <>
        {fighterPairs[poolIndex]?.[0]?.[0] ? (
            <Section title={t('pairs') + ": " + t("pool") + " " + (poolIndex + 1)}>
                <div className={styles.manualPairsContainer}>
                    {fighterPairs[poolIndex].map((pair, originalIdx) => {
                        // Пропускаем рендер пустых пар, если нужно
                        if (deleteEmptyPairs &&
                            (pair[0].name === "—" || pair[1].name === "—")) {
                            return null;
                        }

                        return (
                            <div
                                key={originalIdx}
                                className={`${styles.manualPairRow} ${
                                    currentPairIndex === originalIdx ? styles.activeManualPair : ''
                                }`}
                                onClick={() => selectPair(originalIdx)}
                            >
                                {/* Левый участник */}
                                <div
                                    className={`${styles.manualParticipant} ${styles.leftParticipant} ${
                                        isDragging(originalIdx, 0) ? styles.dragging : ''
                                    }`}
                                    draggable={manualMode}
                                    onDragStart={(e) => handleDragStart(e, originalIdx, 0)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, originalIdx, 0)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className={styles.participantName}>
                                        {getName(pair[0].name)}
                                    </span>
                                    <span className={styles.dragIndicator}>⋮⋮</span>
                                </div>

                                <div className={styles.manualVsDivider}>VS</div>

                                {/* Правый участник */}
                                <div
                                    className={`${styles.manualParticipant} ${styles.rightParticipant} ${
                                        isDragging(originalIdx, 1) ? styles.dragging : ''
                                    }`}
                                    draggable={manualMode}
                                    onDragStart={(e) => handleDragStart(e, originalIdx, 1)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, originalIdx, 1)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className={styles.participantName}>
                                        {getName(pair[1].name)}
                                    </span>
                                    <span className={styles.dragIndicator}>⋮⋮</span>
                                </div>
                                {onDeletePair && onPairsReordered && setPools &&
                                <button
                                className={styles.deletePair}
                                onClick={()=>{
                                    const buf = [...fighterPairs]
                                    buf[poolIndex][originalIdx] = []
                                    buf[poolIndex] = buf[poolIndex].filter(pairs=>pairs.length)
                                    onPairsReordered(buf)
                                    setPools(buf)
                                    onDeletePair(pair[0].id, pair[1].id);
                                }}>
                                    <Trash2 size={28} color="var(--fg)" />
                                </button>
                                }
                            </div>
                        );
                    })}
                </div>
            </Section>
        ) : null}
    </>
    )
}