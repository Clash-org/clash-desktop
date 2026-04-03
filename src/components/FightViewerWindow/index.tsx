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
    <div className={styles.viewerContainer}>
      {/* Левая сторона - Красный угол */}
      <div className={`${styles.viewerSide} ${styles.red} ${fightData.winner === fightData.redName ? styles.winnerSide : ''}`}>
        <div className={styles.viewerName}>
          {fightData.redName ? truncateFullName(fightData.redName, 15).split(' ').map((line, idx) => (
            <span key={idx}>{line}<br /></span>
          )) : '—'}
        </div>
        <div className={styles.viewerScore}>{fightData.score1}</div>

        <div className={styles.viewerStats}>
          <div className={styles.viewerStat}>
            <span className={styles.statLabel}>{t('protests')}</span>
            <span className={styles.statValue}>{fightData.protests1}</span>
          </div>
          <div className={styles.viewerStat}>
            <span className={styles.statLabel}>{t('warnings')}</span>
            <span className={styles.statValue}>{fightData.warnings1}</span>
          </div>
        </div>
        <span className={styles.nextPair}>{truncateFullName(fightData.nextRedName, 15)}</span>
      </div>

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

      {/* Правая сторона - Синий угол */}
      <div className={`${styles.viewerSide} ${styles.blue} ${fightData.winner === fightData.blueName ? styles.winnerSide : ''}`}>
        <div className={styles.viewerName}>
          {fightData.blueName ? truncateFullName(fightData.blueName, 15).split(' ').map((line, idx) => (
            <span key={idx}>{line}<br /></span>
          )) : '—'}
        </div>
        <div className={styles.viewerScore}>{fightData.score2}</div>

        <div className={styles.viewerStats}>
          <div className={styles.viewerStat}>
            <span className={styles.statLabel}>{t('protests')}</span>
            <span className={styles.statValue}>{fightData.protests2}</span>
          </div>
          <div className={styles.viewerStat}>
            <span className={styles.statLabel}>{t('warnings')}</span>
            <span className={styles.statValue}>{fightData.warnings2}</span>
          </div>
        </div>
        <span className={styles.nextPair}>{truncateFullName(fightData.nextBlueName, 15)}</span>
      </div>
    </div>
  );
}