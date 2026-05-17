import { useEffect, useState} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Eye,
  Users,
  Wallet,
  Loader2,
  RefreshCw,
  Copy,
  Medal,
  Star,
  DollarSign,
  AlertCircle,
  Trophy,
  Handshake,
  Percent,
  Gavel,
  Video
} from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import InputText from '@/components/InputText';
import InputNumber from '@/components/InputNumber';
import Select from '@/components/Select';
import styles from './index.module.css';
import ModalWindow from '@/components/ModalWindow';
import toast from 'react-hot-toast';
import { useAtom } from 'jotai';
import { fightIdAtom, isReverseSidesAtom, score1Atom, score2Atom } from '@/store';
import { formatEther, parseEther } from 'ethers';
import { useBet } from '@/hooks/useBet';
import CryptoRestrictions from '../CryptoRestrictions';
import Tabs from '../Tabs';
import { useToken } from '@/hooks/useToken';
import { parseContractError, truncateAddress } from '@/utils/helpers';
import { openUrl } from '@tauri-apps/plugin-opener';

type BetType = {
  better: string;
  fighterId: bigint;
  claimed: boolean;
}

type FightType = {
  judge: string;
  fighterRed: string;
  fighterBlue: string;
  fighterStake: bigint;
  spectatorStake: bigint;
  started: boolean;
  ended: boolean;
  isDraw: boolean;
  totalSpectatorPool: bigint;
  winnerSpectatorPool: bigint;
  winnerFighterId: bigint;
  streamUrl: string;
}

export default function Bet() {
  const { t } = useTranslation();
  const [scoreRed] = useAtom(score1Atom)
  const [scoreBlue] = useAtom(score2Atom)
  const [isReverseSides] = useAtom(isReverseSidesAtom)
  const [selectedFightId, setSelectedFightId] = useAtom(fightIdAtom)
  const { token } = useToken()
  const {
    useContractQuery,
    address,
    createFight,
    payFighterStake,
    placeBet,
    closeBetting,
    fightEnd,
    getBetsCount,
    getBetInfo,
    withdrawJudgeFee,
    withdrawSpectator,
    withdrawFighter,
    setFightFighterStake,
    setFightSpectatorStake
  } = useBet();

    // Получаем список боёв
  const { data: nextFightId, mutate: mutateNextFightId } = useContractQuery<bigint>('nextFightId');
  const totalFights = nextFightId ? Number(nextFightId) : 0;
  const { data: currentFightInfo, mutate: mutateFightInfo } = useContractQuery<FightType>(
    'getFightInfo',
    [selectedFightId],
    { shouldFetch: (selectedFightId !== undefined) && totalFights > 0, refreshInterval: 300_000 }
  );

  const [fighterRed, setFighterRed] = useState(currentFightInfo?.fighterRed || '');
  const [fighterBlue, setFighterBlue] = useState(currentFightInfo?.fighterBlue || '');
  const [fighterStake, setFighterStake] = useState(Number(formatEther(currentFightInfo?.fighterStake || 0)));
  const [spectatorStake, setSpectatorStake] = useState(Number(formatEther(currentFightInfo?.spectatorStake || 0)));
  const [betFighterId, setBetFighterId] = useState<0 | 1>(0);
  const [showBetsModal, setShowBetsModal] = useState(false);
  const [betsList, setBetsList] = useState<BetType[]>([]);
  const [streamUrl, setStreamUrl] = useState(currentFightInfo?.streamUrl || "")
  const [loading, setLoading] = useState(false);

  const isJudge = currentFightInfo?.judge === address;
  const isFighterRed = currentFightInfo?.fighterRed === address;
  const isFighterBlue = currentFightInfo?.fighterBlue === address;
  const isWinner = address === (currentFightInfo && currentFightInfo.winnerFighterId ? fighterBlue : fighterRed)
  const isSpectator = address !== fighterRed && address !== fighterBlue && !isJudge

  const titles = [t("createFight"), currentFightInfo && t("bets"), isJudge && t("manageFight")].filter(Boolean)
  const tabs = ["createFight", "bets", "manageFight"] as const
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>(tabs[0])

  const fightIds = Array.from({ length: totalFights }, (_, i) => i+1);

  const { data: betsCount } = useContractQuery<bigint>(
    'getBetsCount',
    [selectedFightId],
    { shouldFetch: (selectedFightId !== undefined) && totalFights > 0 }
  );

  const { data: JUDGE_FEE } = useContractQuery<bigint>('JUDGE_FEE');
  const { data: WINNER_FEE } = useContractQuery<bigint>('WINNER_FEE');

  const loadBets = async () => {
    if (!selectedFightId && selectedFightId !== 0) return;
    const count = await getBetsCount(selectedFightId);
    const bets: BetType[] = [];
    for (let i = 0; i < Number(count); i++) {
      const bet = await getBetInfo(selectedFightId, i);
      bets.push(bet);
    }
    setBetsList(bets);
  };

  const handleCreateFight = async () => {
    if (!fighterStake || !spectatorStake) {
      toast.error(t('fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      await createFight(fighterRed, fighterBlue, parseEther(String(fighterStake)), parseEther(String(spectatorStake)), streamUrl);
      toast.success(t('fightCreated'));
      await mutateNextFightId();
      await mutateFightInfo();
      setFighterRed('');
      setFighterBlue('');
      setFighterStake(0);
      setSpectatorStake(0);
      setSelectedFightId(fightIds.length + 1)
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePayFighterStake = async () => {
    setLoading(true);
    try {
      await payFighterStake(selectedFightId);
      toast.success(t('stakePaid'));
      await mutateFightInfo();
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    setLoading(true);
    try {
      await placeBet(selectedFightId, betFighterId);
      toast.success(t('betPlaced'));
      await mutateFightInfo();
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBetting = async () => {
    setLoading(true);
    try {
      await closeBetting(selectedFightId);
      toast.success(t('bettingClosed'));
      await mutateFightInfo();
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (currentFightInfo && !currentFightInfo.ended) return
    setLoading(true);
    try {
      if (isJudge && !currentFightInfo.isDraw) {
        await withdrawJudgeFee(selectedFightId);
      } else if (!isFighterRed && !isFighterBlue) {
        await withdrawSpectator(selectedFightId);
      } else if (isFighterRed || isFighterBlue) {
        if (isWinner)
          await withdrawFighter(selectedFightId)
        else
          return
      }
      toast.success(t('checkWallet'));
      await mutateFightInfo();
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFightEnd = async () => {
    setLoading(true);
    try {
      await fightEnd(selectedFightId, scoreRed, scoreBlue);
      toast.success(t('dataUpdated'));
      await mutateFightInfo();
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (isFighter=true) => {
    setLoading(true);
    try {
      if (isFighter) {
        await setFightFighterStake(selectedFightId, parseEther(String(fighterStake)))
      } else {
        await setFightSpectatorStake(selectedFightId, parseEther(String(spectatorStake)))
      }
      await mutateFightInfo();
      toast.success("dataUpdated")
    } catch (error: any) {
      toast.error(parseContractError(error));
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  };

  useEffect(()=>{
    setFighterStake(Number(formatEther(currentFightInfo?.fighterStake || 0)))
    setSpectatorStake(Number(formatEther(currentFightInfo?.spectatorStake || 0)))
    setFighterRed(currentFightInfo?.fighterRed || "")
    setFighterBlue(currentFightInfo?.fighterBlue || "")
    setStreamUrl(currentFightInfo?.streamUrl || "")
  }, [currentFightInfo])

  return (
    <div className="container" style={{ gap: 0 }}>
      <h1 className="title">
        {t('bets')}
      </h1>
      <CryptoRestrictions />
      <div className={styles.warning} style={{ marginBottom: "15px" }}>
        <AlertCircle size={20} />
        <span>{t('warningBets')}</span>
      </div>
      {/* Выбор боя */}
      <Section title={t('selectFight')}>
        {(isJudge || !currentFightInfo) &&
        <InputText
          value={streamUrl}
          setValue={setStreamUrl}
          placeholder={t("streamUrl")}
        />
        }
        <div className={styles.fightSelector}>
          <Select
            placeholder={t('fightId')}
            options={fightIds.map(id => ({ label: `${id}`, value: id }))}
            value={selectedFightId}
            setValue={(val) => setSelectedFightId(val)}
          />
          {currentFightInfo && (
            <div className={styles.fightStatus}>
              {!currentFightInfo.ended &&
              <span className={`${styles.statusBadge} ${currentFightInfo.started ? styles.statusActive :  styles.statusPending}`}>
                {currentFightInfo.started ? t('started') : t('pending')}
              </span>
              }
              {currentFightInfo.started &&
              <span className={`${styles.statusBadge} ${currentFightInfo.ended ? styles.statusEnded : styles.statusActive}`}>
                {currentFightInfo.ended ? (currentFightInfo.isDraw ? t('draw') : t('completed')) : t('active')}
              </span>
              }
            </div>
          )}
        </div>
      </Section>

      {/* Информация о бое */}
      {currentFightInfo && currentFightInfo.judge !== '0x0000000000000000000000000000000000000000' && (
        <Section title={t('fightInfo')}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
              <div className={styles.infoLabel}>
                <Gavel size={16} />
                {t('judge')}
              </div>
              <div className={styles.infoValue}>
                {currentFightInfo.judge}
                <Copy size={14} onClick={() => copyToClipboard(currentFightInfo.judge)} className={styles.copyIcon} />
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <Medal size={16} />
                {t('fighterRed')}
              </div>
              <div className={styles.infoValue}>
                {truncateAddress(currentFightInfo.fighterRed)}
                {currentFightInfo.fighterRed && <Copy size={14} onClick={() => copyToClipboard(currentFightInfo.fighterRed)} className={styles.copyIcon} />}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <Medal size={16} />
                {t('fighterBlue')}
              </div>
              <div className={styles.infoValue}>
                {truncateAddress(currentFightInfo.fighterBlue)}
                {currentFightInfo.fighterBlue && <Copy size={14} onClick={() => copyToClipboard(currentFightInfo.fighterBlue)} className={styles.copyIcon} />}
              </div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <DollarSign size={16} />
                {t('fighterStake')}
              </div>
              <div className={styles.infoValue}>{formatEther(currentFightInfo.fighterStake)} {token.symbol}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <DollarSign size={16} />
                {t('spectatorStake')}
              </div>
              <div className={styles.infoValue}>{formatEther(currentFightInfo.spectatorStake)} {token.symbol}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <Percent size={16} />
                {t('judgeFee')}
              </div>
              <div className={styles.infoValue}>{JUDGE_FEE}%</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>
                <Percent size={16} />
                {t('winnerFee')}
              </div>
              <div className={styles.infoValue}>{WINNER_FEE}%</div>
            </div>
            {Number(currentFightInfo.totalSpectatorPool) > 0 &&
            <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
              <div className={styles.infoLabel}>
                <Wallet size={16} />
                {t('totalSpectatorPool')}
              </div>
              <div className={styles.infoValue}>{formatEther(currentFightInfo.totalSpectatorPool)} {token.symbol}</div>
            </div>
            }
            {!!currentFightInfo.winnerSpectatorPool && Number(currentFightInfo.winnerSpectatorPool) !== 0 && (
              <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
                <div className={styles.infoLabel}>
                  <Star size={16} />
                  {t('winnerSpectatorPool')}
                </div>
                <div className={styles.infoValue}>{formatEther(currentFightInfo.winnerSpectatorPool)} {token.symbol}</div>
              </div>
            )}
            {betsCount !== undefined && Number(betsCount) > 0 && (
              <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
                <div className={styles.infoLabel}>
                  <Users size={16} />
                  {t('totalBets')}
                </div>
                <div className={styles.infoValue}>
                  {Number(betsCount)}
                  <Eye size={14} onClick={() => { loadBets(); setShowBetsModal(true); }} className={styles.copyIcon} />
                </div>
              </div>
            )}
            {currentFightInfo.isDraw && currentFightInfo.ended &&
            <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
                <div className={styles.infoLabel} style={{ position: "relative", top: "5px" }}>
                  <Handshake size={16} />
                  {t('draw')}
                </div>
            </div>
            }
            {!currentFightInfo.isDraw && currentFightInfo.ended &&
              <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
                <div className={styles.infoLabel}>
                  <Trophy size={16} />
                  {t('win')}
                </div>
                <div className={styles.infoValue}>
                  {Number(currentFightInfo.winnerFighterId) === 0 ?
                  currentFightInfo.fighterRed : currentFightInfo.fighterBlue }
                </div>
              </div>
            }
            {currentFightInfo.streamUrl &&
            <div className={styles.infoCard} style={{ gridColumn: "1 / 3" }}>
              <div className={styles.infoLabel}>
                <Video size={16} />
                {t('streamUrl')}
              </div>
              <div className={styles.infoValue}>
                <span className='link' onClick={async ()=>await openUrl(currentFightInfo.streamUrl)}>{currentFightInfo.streamUrl}</span>
              </div>
            </div>
            }
          </div>
        </Section>
      )}


      <Tabs titles={titles} tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Шаг 1: Создание боя */}
      {activeTab === "createFight" && (
        <Section title={t('createNewFight')} classNameContent={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('fighterStake')} ({token.symbol}) *</label>
            <InputNumber
              value={fighterStake}
              setValue={setFighterStake}
              placeholder="1.0"
              step={0.1}
            />
            {isJudge && currentFightInfo && !currentFightInfo.started &&
            <Button
            title={t("updateData")}
            onClick={handleStake}
            />
            }
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('spectatorStake')} ({token.symbol}) *</label>
            <InputNumber
              value={spectatorStake}
              setValue={setSpectatorStake}
              placeholder="0.1"
              step={0.01}
            />
            {isJudge && currentFightInfo && !currentFightInfo.started &&
            <Button
            title={t("updateData")}
            onClick={()=>handleStake(false)}
            />
            }
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('fighterRedAddress')} *</label>
            <InputText
              value={fighterRed}
              setValue={setFighterRed}
              placeholder="0x..."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('fighterBlueAddress')} *</label>
            <InputText
              value={fighterBlue}
              setValue={setFighterBlue}
              placeholder="0x..."
            />
          </div>
          <Button
            title={t('createFight')}
            onClick={handleCreateFight}
            disabled={loading || !fighterStake || !spectatorStake || !fighterRed || !fighterBlue}
          >
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <Plus size={20} />}
            <span>{t('createFight')}</span>
          </Button>
          <Button
            title={t('closeBetting')}
            onClick={handleCloseBetting}
            disabled={loading || !currentFightInfo || currentFightInfo?.started || !isJudge}
            stroke
          >
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <RefreshCw size={20} />}
            <span>{t('closeBetting')}</span>
          </Button>
          {!isJudge && currentFightInfo && !currentFightInfo.started && (
            <div className={styles.warning}>
              <AlertCircle size={20} />
              <span>{t('onlyJudgeCanRegister')}</span>
            </div>
          )}
        </Section>
      )}

      {/* Шаг 3: Управление боем */}
      {activeTab === "bets" && currentFightInfo && (
        <div className={styles.manageContainer}>
          <Section title={t('placeBet')} classNameContent={styles.content}>
          {/* Ставка бойца */}
          {(isFighterRed || isFighterBlue) && !currentFightInfo.ended && !currentFightInfo.started && (
            <>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>{t('yourStake')}</div>
                <div className={styles.infoValue}>{formatEther(currentFightInfo.fighterStake)} {token.symbol}</div>
              </div>
              <Button
                title={t('placeBet')}
                onClick={handlePayFighterStake}
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className={styles.spinner} /> : <Wallet size={20} />}
                <span>{t('placeBet')}</span>
              </Button>
            </>
          )}
          {/* Ставка зрителя */}
          {!isFighterRed && !isFighterBlue && !currentFightInfo.ended && !currentFightInfo.started && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('fighters')}</label>
                <div className={styles.betOptions}>
                  <button
                    className={`${styles.betOption} ${betFighterId === 0 ? styles.selected : ''}`}
                    onClick={() => setBetFighterId(0)}
                  >
                    🔴 {t('fighterRed')}
                  </button>
                  <button
                    className={`${styles.betOption} ${betFighterId === 1 ? styles.selected : ''}`}
                    onClick={() => setBetFighterId(1)}
                  >
                    🔵 {t('fighterBlue')}
                  </button>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoLabel}>{t('betAmount')}</div>
                <div className={styles.infoValue}>{formatEther(currentFightInfo.spectatorStake)} {token.symbol}</div>
              </div>
              {!isJudge &&
              <Button
                title={t('placeBet')}
                onClick={handlePlaceBet}
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className={styles.spinner} /> : <Plus size={20} />}
                <span>{t('placeBet')}</span>
              </Button>
              }
            </>
          )}
          {currentFightInfo.ended && (
            <Button title={t('withdrawFunds')} onClick={handleWithdraw} disabled={loading || (!isWinner && !isSpectator && !isJudge)} />
          )}
          {currentFightInfo.started && !currentFightInfo.ended && (
            <div className={styles.warning}>
              <AlertCircle size={20} />
              <span>{t('notBettingAfterStart')}</span>
            </div>
          )}
          </Section>
        </div>
      )}
      {/* Установка счёта (только судья) */}
      {activeTab === "manageFight" && !!currentFightInfo && (
        <Section title={t('fightEnd')} classNameContent={styles.content}>
          <div className={styles.sides} style={isReverseSides ? { flexDirection: "row-reverse" } : {}}>
            <div className="red">{scoreRed}</div>
            <div className="blue">{scoreBlue}</div>
          </div>
          <Button
            title={t('fightEnd')}
            onClick={handleFightEnd}
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className={styles.spinner} /> : <Trophy size={20} />}
            <span>{t('fightEnd')}</span>
          </Button>
          {currentFightInfo.ended &&
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>{currentFightInfo.isDraw ? t('draw') : t('win')}</div>
            {!currentFightInfo.isDraw && currentFightInfo.ended &&
            <div className={styles.infoValue}>
              {Number(currentFightInfo.winnerFighterId) === 0 ?
                currentFightInfo.fighterRed :
                currentFightInfo.fighterBlue}
            </div>
            }
          </div>
          }
        </Section>
      )}

      {/* Модальное окно со списком ставок */}
      <ModalWindow isOpen={showBetsModal} onClose={() => setShowBetsModal(false)}>
        <Section title={t('betsList')}>
          <div className={styles.betsList}>
            {betsList.map((bet, idx) => (
              <div key={idx} className={styles.betItem}>
                <span>{truncateAddress(bet.better)}</span>
                <span className={Number(bet.fighterId) === 0 ? styles.redText : styles.blueText}>
                  {Number(bet.fighterId) === 0 ? t('fighterRed') : t('fighterBlue')}
                </span>
                <span>{bet.claimed ? t('claimed') : t('pending')}</span>
              </div>
            ))}
            {betsList.length === 0 && <div className={styles.emptyList}>{t('noBets')}</div>}
          </div>
        </Section>
      </ModalWindow>
    </div>
  );
}