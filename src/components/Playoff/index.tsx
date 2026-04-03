import { useState, useEffect } from 'react';
import { ParticipantPlayoffType, TournamentMatchType } from '@/typings';
import Button from '@/components/Button';
import { useTranslation } from 'react-i18next';
import styles from './index.module.css';
import { useAtom } from 'jotai';
import { currentNominationIdAtom, currentTournamentAtom, currentWeaponIdAtom, doubleHitsAtom, historyAtom, playoffAtom, playoffIndexAtom, playoffMatchIndexAtom, protests1Atom, protests2Atom, score1Atom, score2Atom, warnings1Atom, warnings2Atom } from '@/store';
import { HardDriveUpload, Save } from 'lucide-react';
import { exportExcel } from '@/utils/exportExcel';
import { Pages, usePage } from '@/hooks/usePage';
import { processTournament } from '@/utils/api';
import { createMatches, getMatchesFromDuels } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface PlayoffProps {
  onTournamentComplete?: (winner: ParticipantPlayoffType) => void;
}

export default function Playoff({
  onTournamentComplete
}: PlayoffProps) {
  const { t } = useTranslation();
  const { setPage } = usePage()
  const [currentTournament] = useAtom(currentTournamentAtom)
  const [currentWeaponId] = useAtom(currentWeaponIdAtom)
  const [currentNominationId] = useAtom(currentNominationIdAtom)
  const [playoff, setPlayoff] = useAtom(playoffAtom)
  const [winners, setWinners] = useState<{ [key: string]: number }>({}); // Индекс победителя в паре (0 или 1)
  const [champion, setChampion] = useState<ParticipantPlayoffType | null>(null);
  const [, setPlayoffIndex] = useAtom(playoffIndexAtom)
  const [, setPlayoffMatchIndex] = useAtom(playoffMatchIndexAtom)
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom)
  const [podium, setPodium] = useState<{
    first: ParticipantPlayoffType | null;
    second: ParticipantPlayoffType | null;
    third: ParticipantPlayoffType | null;
    fourth: ParticipantPlayoffType | null;
  }>({
    first: null,
    second: null,
    third: null,
    fourth: null
  });

  const saveOnServer = async () => {
    if (currentTournament && currentNominationId && currentWeaponId) {
      const matches: TournamentMatchType[] = getMatchesFromDuels(playoff, undefined, "playoff")
      await createMatches(currentTournament.id, currentWeaponId, currentNominationId, matches)

      const res = await processTournament(currentTournament.id, currentWeaponId, currentNominationId, [String(podium.first?.id), String(podium.second?.id), String(podium.third?.id)], undefined, new Date(currentTournament.date))
      if (res)
        toast.success(t("saved"))
    }
  }

  // Обработчик клика для выбора победителя
  const handleFighterClick = (roundIndex: number, matchIndex: number, fighterIndex: number) => {
    const key = `${roundIndex}-${matchIndex}`;
    setWinners(prev => ({
      ...prev,
      [key]: fighterIndex
    }));
  };

  // Генерация следующего раунда
  const generateNextRound = () => {
    const currentRoundIndex = playoff.length - 1;
    const currentRound = playoff[currentRoundIndex];
    const nextRoundPairs: ParticipantPlayoffType[][] = [];

    // Проверяем, все ли победители определены в текущем раунде
    const allWinnersDetermined = currentRound.every((_, idx) =>
      winners[`${currentRoundIndex}-${idx}`] !== undefined
    );

    if (!allWinnersDetermined) return;

    const currentPairsCount = currentRound.length;

    // Если в текущем раунде больше 2 пар - это начальные раунды
    if (currentPairsCount > 2) {
      // Объединяем пары попарно для следующего раунда
      for (let i = 0; i < currentRound.length; i += 2) {
        if (i + 1 < currentRound.length) {
          const match1 = currentRound[i];
          const match2 = currentRound[i + 1];

          const winner1Index = winners[`${currentRoundIndex}-${i}`];
          const winner2Index = winners[`${currentRoundIndex}-${i + 1}`];

          const winner1 = match1[winner1Index];
          const winner2 = match2[winner2Index];

          nextRoundPairs.push([{...winner1, scores: 0, wins: 0}, {...winner2, scores: 0, wins: 0}]);
        }
      }
    }
    // Если в текущем раунде ровно 2 пары - это полуфинал
    else if (currentPairsCount === 2) {
      // Проверяем, не был ли предыдущий раунд тоже с 2 парами
      const hadPreviousTwoPairs = playoff.length >= 2 && playoff[currentRoundIndex - 1]?.length === 2;

      // Если предыдущий раунд НЕ был с 2 парами, значит это первый раз, когда мы видим 2 пары - это ПОЛУФИНАЛ
      if (!hadPreviousTwoPairs) {
        // Полуфинал: создаем финальный раунд с 2 парами (финал + матч за 3 место)
        const finalists: ParticipantPlayoffType[] = []; // Победители полуфиналов
        const thirdPlaceContenders: ParticipantPlayoffType[] = []; // Проигравшие в полуфиналах

        for (let i = 0; i < currentRound.length; i++) {
          const match = currentRound[i];
          const winnerIndex = winners[`${currentRoundIndex}-${i}`];
          const loserIndex = winnerIndex === 0 ? 1 : 0;

          // Победители идут в финал
          finalists.push({...match[winnerIndex], scores: 0, wins: 0});
          // Проигравшие идут в матч за 3 место
          thirdPlaceContenders.push({...match[loserIndex], scores: 0, wins: 0});
        }

        // Добавляем финал (1-2 место)
        if (finalists.length === 2) {
          nextRoundPairs.push([finalists[0], finalists[1]]);
        }

        // Добавляем матч за 3 место (3-4 место)
        if (thirdPlaceContenders.length === 2) {
          nextRoundPairs.push([thirdPlaceContenders[0], thirdPlaceContenders[1]]);
        }
      } else {
        // Если предыдущий раунд тоже был с 2 парами, значит это уже ФИНАЛЬНЫЙ РАУНД
        // Ничего не делаем, турнир завершится после определения победителей
        return;
      }
    }

    if (nextRoundPairs.length > 0) {
      setPlayoff(prev => [...prev, nextRoundPairs]);
    }
  };

  // Определение победителей турнира
  useEffect(() => {
    const lastRoundIndex = playoff.length - 1;
    const lastRound = playoff[lastRoundIndex];
    if (!lastRound) return;

    // Проверяем, все ли победители определены в последнем раунде
    const allWinnersDetermined = lastRound.every((_, idx) =>
      winners[`${lastRoundIndex}-${idx}`] !== undefined
    );

    if (!allWinnersDetermined) return;

    // Проверяем, является ли последний раунд финальным
    const isFinalRound = lastRound.length === 2 && playoff.length >= 2 && playoff[lastRoundIndex - 1]?.length === 2;
    const isSimpleFinal = lastRound.length === 1;

    if (isFinalRound) {
      // Финальный раунд с двумя матчами (финал и 3 место)
      const finalMatch = lastRound[0];
      const thirdPlaceMatch = lastRound[1];

      const finalWinnerIndex = winners[`${lastRoundIndex}-0`];
      const thirdPlaceWinnerIndex = winners[`${lastRoundIndex}-1`];

      const champion = finalMatch[finalWinnerIndex];
      const secondPlace = finalMatch[finalWinnerIndex === 0 ? 1 : 0];
      const thirdPlace = thirdPlaceMatch[thirdPlaceWinnerIndex];
      const fourthPlace = thirdPlaceMatch[thirdPlaceWinnerIndex === 0 ? 1 : 0];

      setChampion(champion);
      setPodium({
        first: champion,
        second: secondPlace,
        third: thirdPlace,
        fourth: fourthPlace
      });

      if (onTournamentComplete) {
        onTournamentComplete(champion);
      }
    }
    else if (isSimpleFinal) {
      // Простой финал с одной парой
      const finalMatch = lastRound[0];
      const winnerIndex = winners[`${lastRoundIndex}-0`];
      const champion = finalMatch[winnerIndex];
      const secondPlace = finalMatch[winnerIndex === 0 ? 1 : 0];

      setChampion(champion);
      setPodium({
        first: champion,
        second: secondPlace,
        third: null,
        fourth: null
      });

      if (onTournamentComplete) {
        onTournamentComplete(champion);
      }
    }
  }, [winners, playoff, onTournamentComplete]);

  // Проверяем, можно ли создать следующий раунд
  const canGenerateNextRound = () => {
    if (playoff.length === 0 || champion) return false;

    const lastRoundIndex = playoff.length - 1;
    const lastRound = playoff[lastRoundIndex];

    // Проверяем, все ли победители определены в текущем раунде
    const allWinnersDetermined = lastRound.every((_, idx) =>
      winners[`${lastRoundIndex}-${idx}`] !== undefined
    );

    if (!allWinnersDetermined) return false;

    const lastRoundPairsCount = lastRound.length;

    // Если в последнем раунде 1 пара - это финал, следующий раунд не нужен
    if (lastRoundPairsCount === 1) return false;

    // Если в последнем раунде 2 пары
    if (lastRoundPairsCount === 2) {
      // Проверяем, был ли предыдущий раунд тоже с 2 парами
      const hadPreviousTwoPairs = playoff.length >= 2 && playoff[lastRoundIndex - 1]?.length === 2;

      // Если предыдущий раунд был с 2 парами, значит это финальный раунд
      if (hadPreviousTwoPairs) {
        return false; // Это финальный раунд
      }

      // Иначе это полуфинал - можно создать следующий раунд
      return true;
    }

    // Для раундов с более чем 2 парами всегда можно создать следующий
    return true;
  };

  useEffect(()=>{
    playoff.forEach((play, roundIndex)=>{
      play.forEach((pair, matchIndex)=>{
        if (pair[0].scores !== pair[1].scores) {
          handleFighterClick(roundIndex, matchIndex, pair[0].scores > pair[1].scores ? 0 : 1)
        }
      })
    })
  }, [playoff])

  return (
  <div className={styles.container}>
    {podium.first && (
      <div className={styles.podium}>
        <h3 className={styles.podiumTitle}>🏆 {t("finalPlaces")} 🏆</h3>
        <div className={styles.podiumContainer}>
          <div className={styles.podiumItem}>
            <div className={styles.podiumPlace}>🥇</div>
            <div className={styles.podiumName}>{podium.first.name}</div>
          </div>

          <div className={styles.podiumItem}>
            <div className={styles.podiumPlace}>🥈</div>
            <div className={styles.podiumName}>{podium.second?.name || '—'}</div>
          </div>

          {podium.third && (
            <div className={styles.podiumItem}>
              <div className={styles.podiumPlace}>🥉</div>
              <div className={styles.podiumName}>{podium.third.name}</div>
            </div>
          )}

          {podium.fourth && (
            <div className={styles.podiumItem}>
              <div className={styles.podiumPlace}>4</div>
              <div className={styles.podiumName}>{podium.fourth.name}</div>
            </div>
          )}
        </div>
      </div>
    )}

    <div className={styles.bracket}>
      {playoff.map((round, roundIndex) => {
        const matchesCount = round.length;
        const totalRounds = playoff.length;
        const isLastRound = roundIndex === totalRounds - 1;

        // Определяем тип раунда динамически
        let roundType = '';
        let roundTitle = '';

        // Проверяем, был ли предыдущий раунд с 2 парами
        const hadPreviousTwoPairs = roundIndex > 0 && playoff[roundIndex - 1]?.length === 2;

        if (matchesCount === 4) {
          roundType = 'quarter';
          roundTitle = `1/${Math.pow(2, playoff.length - roundIndex)} ${t('final')}`;
        } else if (matchesCount === 2) {
          if (isLastRound && hadPreviousTwoPairs) {
            // Последний раунд и предыдущий был с 2 парами - это финал + 3 место
            roundType = 'finalWithThird';
            roundTitle = t('finalAndThirdPlace');
          } else if (!isLastRound) {
            // Не последний раунд с 2 парами - это полуфинал
            roundType = 'semi';
            roundTitle = t('semifinal');
          } else {
            // Последний раунд с 2 парами без предыдущего с 2 парами - тоже полуфинал
            roundType = 'semi';
            roundTitle = t('semifinal');
          }
        } else if (matchesCount === 1) {
          roundType = 'final';
          roundTitle = t('final');
        } else {
          roundType = 'other';
          roundTitle = `1/${Math.pow(2, playoff.length - roundIndex)} ${t('final')}`;
        }

        return (
          <div key={roundIndex} className={styles.roundColumn}>
            <h2 className={styles.roundTitle}>{roundTitle}</h2>

            <div className={styles.matchesContainer}>
              {round.map((match, matchIndex) => {
                const isThirdPlaceMatch = roundType === 'finalWithThird' && matchIndex === 1;
                const isFinalMatch = roundType === 'finalWithThird' && matchIndex === 0;
                const [fighter1, fighter2] = match;
                const winnerKey = `${roundIndex}-${matchIndex}`;
                const winnerIndex = winners[winnerKey];

                return (
                  <div
                    key={matchIndex}
                    className={`${styles.matchWrapper} ${
                      isFinalMatch ? styles.finalMatch :
                      isThirdPlaceMatch ? styles.thirdPlaceMatch : ''
                    }`}
                  >
                    <div
                      className={styles.matchCard}
                      onClick={() => {
                        setPlayoffIndex(roundIndex);
                        setPlayoffMatchIndex(matchIndex);
                        setScore1(0);
                        setScore2(0);
                        setDoubleHits(0);
                        setProtests1(0);
                        setProtests2(0);
                        setWarnings1(0);
                        setWarnings2(0);
                        setHistory([])
                        setPage(Pages.TIMER);
                      }}
                    >
                      {isFinalMatch && (
                        <div className={styles.matchBadge}>🏆 {t("final")}</div>
                      )}
                      {isThirdPlaceMatch && (
                        <div className={styles.matchBadge}>🥉 {t("matchThirdPlace")}</div>
                      )}

                      {/* Блок первого бойца */}
                      <div
                        className={`${styles.fighterRow} ${winnerIndex === 0 ? styles.win : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFighterClick(roundIndex, matchIndex, 0);
                        }}
                      >
                        <span className={styles.fighterName}>{fighter1.name}</span>
                        <span className={styles.fighterScore}>{fighter1.scores}</span>
                      </div>

                      <div className={styles.vsDivider}>VS</div>

                      {/* Блок второго бойца */}
                      <div
                        className={`${styles.fighterRow} ${winnerIndex === 1 ? styles.win : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFighterClick(roundIndex, matchIndex, 1);
                        }}
                      >
                        <span className={styles.fighterName}>{fighter2.name}</span>
                        <span className={styles.fighterScore}>{fighter2.scores}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>

    {/* Кнопка для перехода к следующему раунду */}
    {playoff.length > 0 && !champion && canGenerateNextRound() && (
      <div className={styles.controls}>
        <Button
          title="Следующий раунд"
          onClick={generateNextRound}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      </div>
    )}
    {podium.first && currentTournament && currentNominationId && currentWeaponId &&
      <Button
      onClick={saveOnServer}
      style={{ width: "100%", marginBottom: "10px" }}
      >
        <HardDriveUpload size={28} color="var(--fg)" />
      </Button>
    }

    <Button onClick={() => exportExcel(playoff, `${t('playoff')}.xlsx`, true)} style={{ width: "100%" }}>
      <Save size={28} />
    </Button>
  </div>
  );
}