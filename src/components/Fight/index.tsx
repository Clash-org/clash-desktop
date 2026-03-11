import { useAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

import Button from '@/components/Button';
import Counter from '@/components/Counter';
import {
  currentPairIndexAtom,
  doubleHitsAtom,
  fighterPairsAtom,
  fightTimeAtom,
  hotKeysAtom,
  hitZonesAtom,
  isRunningAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
  historyAtom,
  currentPoolIndexAtom,
  isPlayoffAtom,
  playoffAtom,
  playoffIndexAtom,
  playoffMatchIndexAtom,
} from '@/store';
import { formatTime, truncateFullName } from '@/utils/helpers';
import { incWin } from '@/utils/incWin';
import { History, Medal, Minus, Pause, Play, RefreshCw, UsersRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

import styles from './index.module.css';
import { useTranslation } from 'react-i18next';
import ModalWindow from '@/components/ModalWindow';
import SelectPair from '@/components/SelectPair';
import { emit } from '@tauri-apps/api/event';
import { openFightViewerWindow } from '@/utils/windowManager';
import { storage } from '@/utils/storage';



export default function FightScreen() {
  const [bellSound, setBellSound] = useState(new Howl({ src: ['/sounds/bell.mp3'] }));
  const { t: translate } = useTranslation()
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [isRunning, setIsRunning] = useAtom(isRunningAtom);
  const [hitZones] = useAtom(hitZonesAtom);
  const [fightTime] = useAtom(fightTimeAtom);
  const [doubleHits, setDoubleHits] = useAtom(doubleHitsAtom);
  const [protests1, setProtests1] = useAtom(protests1Atom);
  const [protests2, setProtests2] = useAtom(protests2Atom);
  const [warnings1, setWarnings1] = useAtom(warnings1Atom);
  const [warnings2, setWarnings2] = useAtom(warnings2Atom);
  const [score1, setScore1] = useAtom(score1Atom);
  const [score2, setScore2] = useAtom(score2Atom);
  const [isPlayoff] = useAtom(isPlayoffAtom);
  const isPlayOff = !isPlayoff.includes(false)
  const [playoff, setPlayoff] = useAtom(playoffAtom)
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [history, setHistory] = useAtom(historyAtom)
  const [hotKeys] = useAtom(hotKeysAtom)
  const [playoffIndex] = useAtom(playoffIndexAtom)
  const [playoffMatchIndex] = useAtom(playoffMatchIndexAtom)

  const prevPairIndexRef = useRef(currentPairIndex)
  const [isOpen, setIsOpen] = useState(false)
  const [isHistory, setIsHistory] = useState(false)
  const [timeLeft, setTimeLeft] = useState(fightTime);
  const [bellUri, setBellUri] = useState("");
  const [isSounds, setIsSounds] = useState(true)
  const [winner, setWinner] = useState("")
  const [isFinished, setIsFinished] = useState(false)
  const getFighterData = () => {
    let name1 = '', name2 = '', id1 = '', id2 = '';

    try {
      if (isPlayOff) {
        if (playoff?.[playoffIndex]?.[playoffMatchIndex]?.[0]) {
          name1 = playoff[playoffIndex][playoffMatchIndex][0]?.name || '';
          name2 = playoff[playoffIndex][playoffMatchIndex][1]?.name || '';
          id1 = playoff[playoffIndex][playoffMatchIndex][0]?.id || '';
          id2 = playoff[playoffIndex][playoffMatchIndex][1]?.id || '';
        }
      } else {
        const currentIndex = currentPairIndex[currentPoolIndex];
        if (fighterPairs?.[currentPoolIndex]?.[currentIndex]?.[0]) {
          name1 = fighterPairs[currentPoolIndex][currentIndex]?.[0]?.name || '';
          name2 = fighterPairs[currentPoolIndex][currentIndex]?.[1]?.name || '';
          id1 = fighterPairs[currentPoolIndex][currentIndex]?.[0]?.id || '';
          id2 = fighterPairs[currentPoolIndex][currentIndex]?.[1]?.id || '';
        }
      }
    } catch (e) {
      console.error('Ошибка получения данных бойцов:', e);
    }

    return { fighter1: name1, fighter2: name2, fighterId1: id1, fighterId2: id2 };
  };

  const { fighter1, fighter2, fighterId1, fighterId2 } = getFighterData();

  const sendDataToViewer = async () => {
    try {
      await emit('fight-data-updated', {
        score1,
        score2,
        protests1,
        protests2,
        warnings1,
        warnings2,
        doubleHits,
        timeLeft,
        isRunning,
        fighter1,
        fighter2,
        isPlayOff,
        isFinished,
        winner
      });
    } catch (error) {
      console.error('Ошибка отправки данных:', error);
    }
  };

  useEffect(() => {
    sendDataToViewer();
  }, [
    score1, score2,
    protests1, protests2,
    warnings1, warnings2,
    doubleHits,
    timeLeft,
    isRunning,
    fighter1,
    fighter2,
    isPlayOff
  ]);
  // @ts-ignore
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkCustomSounds = async () => {
    const b = await storage.get<string>('bellSound')
    const s = await storage.get<boolean>("isSounds")
    const baseURL = (url: string) => `http://localhost:9527/${url}`
    if (b) setBellUri(baseURL(b).replace(/\\/g, '/'));
    if (s !== undefined) setIsSounds(s);
  };

  const fightStop = () => {
      setIsRunning(false);
      const isDraw = score1 === score2;
      const changePlayoffScores = () => {
        setPlayoff(state=>{
          const buf = [...state]
          buf[playoffIndex][playoffMatchIndex][0] = {
            ...buf[playoffIndex][playoffMatchIndex][0],
            scores: score1,
            wins: score1 > score2 ? 1 : 0,
            differenceWinsLosses: score1 - score2
          }
          buf[playoffIndex][playoffMatchIndex][1] = {
            ...buf[playoffIndex][playoffMatchIndex][1],
            scores: score2,
            wins: score1 < score2 ? 1 : 0,
            differenceWinsLosses: score2 - score1
          }
          return buf
        })
      }
      if (!isDraw) {
        if (score1 > score2) {
          if (isPlayOff) {
            changePlayoffScores()
          } else {
            incWin(score1, fighterId1, fighterId2, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings1, protests1, doubleHits);
            incWin(score2, fighterId2, fighterId1, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings2, protests2, doubleHits, true);
          }
        } else {
          if (isPlayOff) {
            changePlayoffScores()
          } else {
            incWin(score2, fighterId2, fighterId1, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings2, protests2, doubleHits);
            incWin(score1, fighterId1, fighterId2, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings1, protests1, doubleHits, true);
          }
        }
      } else {
        if (!isPlayOff) {
          incWin(score1, fighterId1, fighterId2, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings1, protests1, doubleHits, false, 1);
          incWin(score2, fighterId2, fighterId1, currentPairIndex[currentPoolIndex], currentPoolIndex, setFighterPairs, warnings2, protests2, doubleHits, false, 1);
        }
      }

      const winnerName = score1 > score2 ? fighter1 : fighter2
      setWinner(winnerName)
      setIsFinished(true)
      toast.success(isDraw ? translate('draw') : `${translate('win')}: ${winnerName}`, {
        duration: 3000,
        style: {
          fontSize: '20px',
          fontFamily: 'var(--font-semi-bold)',
          marginTop: '100px'
        }
      });
  }

  useEffect(() => {
    checkCustomSounds();
  }, []);

  useEffect(() => {
    if (bellUri) {
      setBellSound(new Howl({ src: [bellUri] }))
    }
  }, [bellUri]);

  /* таймер */
  useEffect(() => {
    // @ts-ignore
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          const next = t - 1;

          if (next === 15) {
            toast(translate("last15seconds"), { icon: "ℹ️", style: { marginTop: '100px' } })
          }

          if (next === 0) {
            if (isSounds) {
              bellSound.play();
              setTimeout(()=>bellSound.stop(), 5000)
            }
            fightStop()

            return fightTime;
          }
          return next;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const resetFight = () => {
    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setTimeLeft(fightTime);
    setIsRunning(false);
    setHistory([])
    bellSound.stop();
  };

  /* helpers */
  const addPoints = (setter: React.Dispatch<React.SetStateAction<number>>, zone: keyof typeof hitZones) => {
    const p = hitZones[zone];
    setter((s) => s + p);
  };

  const removePoints = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter((s) => Math.max(0, s - 1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { code } = event;

      switch (code) {
        case hotKeys.plus1:
          event.preventDefault();
          setScore1(prev=>prev+1)
          break;
        case hotKeys.plus2:
          event.preventDefault();
          setScore2(prev=>prev+1)
          break;
        case hotKeys.minus1:
          event.preventDefault();
          setScore1(prev=>Math.max(0, prev-1))
          break;
        case hotKeys.minus2:
          event.preventDefault();
          setScore2(prev=>Math.max(0, prev-1))
          break;
        case hotKeys.history:
          event.preventDefault();
          setIsHistory(prev=>!prev)
          break;
        case hotKeys.start:
          event.preventDefault();
          setIsRunning(prev=>!prev)
          break;
        case hotKeys.viewer:
          event.preventDefault();
          openFightViewerWindow().then(()=>{
            setTimeout(()=>sendDataToViewer(), 1000)
          })
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(()=>{
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (score1 !== 0 || score2 !== 0)
    timeoutRef.current = setTimeout(()=>setHistory(prev=>[...prev, { score1, score2 }]), 3000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [score1, score2])

  useEffect(() => {
    setTimeLeft(fightTime);
  }, [fightTime]);

  useEffect(() => {
    if (prevPairIndexRef.current[currentPoolIndex] !== currentPairIndex[currentPoolIndex])
      resetFight();
  }, [currentPairIndex, currentPoolIndex]);

  const fighterData = [
    {
      name: fighter1,
      score: score1,
      setScore: setScore1,
      protests: protests1,
      setProtests: setProtests1,
      warnings: warnings1,
      setWarnings: setWarnings1,
      styleWrap: styles.red
    },
    {
      name: fighter2,
      score: score2,
      setScore: setScore2,
      protests: protests2,
      setProtests: setProtests2,
      warnings: warnings2,
      setWarnings: setWarnings2,
      styleWrap: styles.blue
    }
  ];

  return (
    <div className={styles.container}>
      {/* левая и правая половины */}
      {fighterData.map((data, i) => (
        <div key={i} className={`${styles.side} ${data.styleWrap}`}>
          <div className={styles.name}>
            {truncateFullName(String(data.name), 19).split(' ').map((line, idx) => (
              <span key={idx}>{line}<br /></span>
            ))}
          </div>
          <div className={styles.score}>{data.score}</div>

          {Object.entries(hitZones).map(([zone, pts]) => (
            <button
              key={`${i}-${zone}`}
              className={styles.zoneBtn}
              onClick={() => addPoints(data.setScore, zone as keyof typeof hitZones)}
            >
              <span className={styles.zoneTxt}>
                {translate(zone)} (+{pts})
              </span>
            </button>
          ))}

          <button
            className={styles.zoneBtn}
            onClick={() => removePoints(data.setScore)}
          >
            <Minus size={28} color="var(--fg)" />
          </button>

          <div className={styles.warnings} style={i === 0 ? { flexDirection: "row-reverse" }:{}}>
            <Counter
              label={translate('protests')}
              value={data.protests}
              onInc={data.setProtests}
              onDec={data.setProtests}
            />

            <Counter
              label={translate('warnings')}
              value={data.warnings}
              onInc={data.setWarnings}
              onDec={data.setWarnings}
            />
          </div>
        </div>
      ))}


      {/* НИЖНЯЯ ПАНЕЛЬ */}
      <div className={styles.bottomBar}>
        <div className={styles.winsBar}>
          <Counter
            label={translate('doubleHits')}
            value={doubleHits}
            onInc={setDoubleHits}
            onDec={setDoubleHits}
          />
        </div>

        <div className={styles.timerWrap}>
          <Button stroke title='-' onClick={()=>setTimeLeft(state=>state-1)} style={{ height: "20px", width: "10px", minWidth: "10px", marginTop: "-10px" }} />
          <div className={styles.timer}>{formatTime(timeLeft)}</div>
          <Button stroke title='+10' onClick={()=>setTimeLeft(state=>state+10)} style={{ height: "20px", width: "10px", minWidth: "10px", marginTop: "-10px" }} />
        </div>

        <div className={styles.controls}>
          <Button onClick={()=>{setIsRunning(false);setTimeLeft(fightTime);}}>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
          <Button onClick={()=>setIsOpen(true)}>
            <UsersRound size={28} color="var(--fg)" />
          </Button>
          <Button onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause size={28} color="var(--fg)" /> : <Play size={28} color="var(--fg)" />}
          </Button>
          <Button onClick={()=>setIsHistory(true)}>
            <History size={28} color="var(--fg)" />
          </Button>
          <Button onClick={fightStop}>
            <Medal size={28} color="var(--fg)" />
          </Button>
        </div>
      </div>
      <ModalWindow isOpen={isOpen} onClose={()=>setIsOpen(false)}>
        <SelectPair deleteEmptyPairs fighterPairs={fighterPairs} poolIndex={currentPoolIndex} currentPairIndex={currentPairIndex[currentPoolIndex]} selectPair={(idx)=>setCurrentPairIndex(state=>{const buf = [...state]; buf[currentPoolIndex] = idx; return buf})} />
      </ModalWindow>
      <ModalWindow isOpen={isHistory} onClose={()=>setIsHistory(false)}>
        <div className={styles.history}>
          {history.map((his, idx)=>(
            <button onClick={()=>{ setScore1(his.score1); setScore2(his.score2); setIsHistory(false) }} style={{ display: "flex", gap: "5px", width: "60px" }}>
              <span style={{ color: "var(--placeholder)", alignItems: "flex-start", width: "15px" }}>{idx+1}.</span><span style={{ width: "45px" }}>{his.score1} : {his.score2}</span>
            </button>
          ))}
        </div>
      </ModalWindow>
    </div>
  );
}