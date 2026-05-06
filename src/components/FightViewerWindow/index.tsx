// components/FightViewerWindow.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { listen } from '@tauri-apps/api/event';
import { formatTime, truncateFullName } from '@/utils/helpers';
import styles from './index.module.css';

interface FightData {
  score1: number;
  score2: number;
  protests1: number;
  protests2: number;
  warnings1: number;
  warnings2: number;
  doubleHits: number;
  timeLeft: number;
  isRunning: boolean;
  redName: string;
  blueName: string;
  nextRedName: string;
  nextBlueName: string;
  isReverseSides: boolean;
  isFinished?: boolean;
  winner?: string;
}

export default function FightViewerWindow() {
  const { t } = useTranslation();

  const [fightData, setFightData] = useState<FightData>({
    score1: 0,
    score2: 0,
    protests1: 0,
    protests2: 0,
    warnings1: 0,
    warnings2: 0,
    doubleHits: 0,
    timeLeft: 180,
    isRunning: false,
    redName: '',
    blueName: '',
    nextRedName: '',
    nextBlueName: '',
    isReverseSides: false,
    isFinished: false,
    winner: ''
  });

  const [timeLeft, setTimeLeft] = useState(fightData.timeLeft);
  const [showWinner, setShowWinner] = useState(false);

  // Слушаем события от основного окна
  useEffect(() => {
    const unlisten = listen('fight-data-updated', (event: any) => {
      setFightData(event.payload);
      setTimeLeft(event.payload.timeLeft);

      // Если бой завершен, показываем победителя
      if (event.payload.isFinished) {
        setShowWinner(true);
        // Скрываем сообщение о победителе через 5 секунд
        setTimeout(() => setShowWinner(false), 9000);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (fightData.isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [fightData.isRunning, timeLeft]);

  // Обработка закрытия окна
  useEffect(() => {
    const appWindow = getCurrentWebviewWindow();

    const unlisten = appWindow.onCloseRequested(async () => {
      await appWindow.close();
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Если нет имен бойцов, показываем загрузку
  if (!fightData.redName && !fightData.blueName) {
    return (
      <div className={styles.viewerContainer} style={{ flexDirection: "row" }}>
        <div className={styles.viewerCenter}>
          <div className={styles.viewerVS}>{t('waitingForFight')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.viewerContainer} style={fightData.isReverseSides ? { flexDirection: "row" } : {}}>
      <FighterSide
        side="red"
        name={fightData.redName}
        score={fightData.score1}
        protests={fightData.protests1}
        warnings={fightData.warnings1}
        nextName={fightData.nextRedName}
        winner={fightData.winner}
        t={t}
      />

      {/* Центральная панель */}
      <div className={styles.viewerCenter}>
        {showWinner && fightData.isFinished && fightData.winner ? (
          <div className={styles.winnerAnnouncement}>
            <div className={styles.winnerTrophy}>🏆</div>
            <div className={styles.winnerText}>
                {t('win')}<br />{truncateFullName(fightData.winner, 15)}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.viewerTimer}>{formatTime(timeLeft)}</div>
            {!!fightData.doubleHits && (
              <div className={styles.viewerDoubleHits}>
                <span className={styles.doubleHitsLabel}>{t('doubleHits')}</span>
                <span className={styles.doubleHitsValue}>{fightData.doubleHits}</span>
              </div>
            )}
          </>
        )}
      </div>

      <FighterSide
        side="blue"
        name={fightData.blueName}
        score={fightData.score2}
        protests={fightData.protests2}
        warnings={fightData.warnings2}
        nextName={fightData.nextBlueName}
        winner={fightData.winner}
        t={t}
      />
    </div>
  );
}

type FighterSideProps = {
  side: 'red' | 'blue';
  name: string | null | undefined;
  score: number | string;
  protests: number;
  warnings: number;
  nextName: string;
  winner: string | null | undefined;
  t: (key: string) => string;
}

const FighterSide = ({
  side, // 'red' или 'blue'
  name,
  score,
  protests,
  warnings,
  nextName,
  winner,
  t // функция перевода
}:FighterSideProps) => {
  const sideClass = side === 'red' ? styles.red : styles.blue;
  const isWinner = winner === name;

  return (
    <div className={`${styles.viewerSide} ${side} ${sideClass} ${isWinner ? styles.winnerSide : ''}`}>
      <div className={styles.viewerName}>
        {name ? truncateFullName(name, 15).split(' ').map((line, idx) => (
          <span key={idx}>{line}<br /></span>
        )) : '—'}
      </div>

      <div className={styles.viewerScore}>{score}</div>

      <div className={styles.viewerStats}>
        <div className={styles.viewerStat}>
          <span className={styles.statLabel}>{t('protests')}</span>
          <span className={styles.statValue}>{protests}</span>
        </div>
        <div className={styles.viewerStat}>
          <span className={styles.statLabel}>{t('warnings')}</span>
          <span className={styles.statValue}>{warnings}</span>
        </div>
      </div>

      <span className={styles.nextPair}>{truncateFullName(nextName, 15)}</span>
    </div>
  );
};