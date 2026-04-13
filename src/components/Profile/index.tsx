import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Award, Sword, TrendingUp, Flag, LogOut, Mars, Venus, Swords, Trophy, Trash2 } from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import styles from './index.module.css';
import { useAtom } from 'jotai';
import { languageAtom, userAtom } from '@/store';
import { capitalizeFirstLetter, formatDate, getNewImageName, getNominationTitleByTournaments } from '@/utils/helpers';
import Tabs from '../Tabs';
import { Pages, usePage } from '@/hooks/usePage';
import { useUserRating } from '@/hooks/useRatings';
import WeaponNominationsSelect from '../WeaponNominationsSelect';
import { useNominations } from '@/hooks/useNominations';
import Table from '../Table';
import InputText from '../InputText';
import { useAuth } from '@/hooks/useAuth';
import { deleteUser, getPredict, updateUser } from '@/utils/api';
import { useUser, useUsers } from '@/hooks/useUsers';
import Select from '../Select';
import { PredictType, WinnersByNomination } from "@/typings"
import ErrorPage from '../ErrorPage';
import { useTournamentsByUserId } from '@/hooks/useTournaments';
import ImageUploader from '../ImageUploader';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import { ShareButton } from '../ShareButton';
import ModalWindow from '../ModalWindow';

export default function Profile({ id }:{ id?: string }) {
  const { t } = useTranslation();
  const { setPage } = usePage()
  const { logout } = useAuth()
  const { api } = useApi()
  const tabs = ['info', 'stats', 'predictions', 'weaponDetails'] as const
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('info');
  const [lang] = useAtom(languageAtom)
  const { users } = useUsers(lang)
  const { user: anotherUser } = useUser(id)
  const [meUser, setUser] = useAtom(userAtom)
  const [predictionsStates, setPredictionsStates] = useState({
    opponent: "",
    weaponId: undefined,
    nominationId: undefined,
    result: {} as PredictType
  })
  const [avatar, setAvatar] = useState(new FormData())
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [weaponId, setWeaponId] = useState<number>()
  const [nominationId, setNominationId] = useState<number>()
  const [showDelete, setShowDelete] = useState(false)
  const { nominations } = useNominations(lang)
  const user = id ? anotherUser : meUser
  const { tournaments } = useTournamentsByUserId(user?.id, lang)
  const tournamentsCount = tournaments?.length || 0
  const { stats } = useUserRating(user?.id)

  const getUserWinsByNomination = useCallback((
  winnersArray: WinnersByNomination[],
  userId: string
  ) => {
    const result: Record<number, number> = {};

    for (const winners of winnersArray) {
      for (const [nominationId, winnerIds] of Object.entries(winners)) {
        const id = Number(nominationId);
        const wins = winnerIds.filter(id => id === userId).length;

        if (wins > 0) {
          result[id] = (result[id] || 0) + wins;
        }
      }
    }

    return result;
  }, [tournaments])

  useEffect(()=>{
    if (predictionsStates.opponent) {
      (async ()=>{
        // @ts-ignore
        const res = await getPredict(user.id, predictionsStates.opponent, predictionsStates.weaponId, predictionsStates.nominationId)
        handlePredictionsStates("result", res)
      })()
    }
  }, [predictionsStates.opponent])

  if (!user) return <ErrorPage message={t("notFound")} />

  const winsCount = tournaments?.map(t=>Object.values(t.winners)).flat().flat().filter(userId=>userId === user.id).length

  const handlePredictionsStates = (field: keyof typeof predictionsStates, value: any) => {
    setPredictionsStates(state=>({ ...state, [field]: value }))
  }

  const nominationsWins = getUserWinsByNomination(tournaments?.map(t=>t.winners) || [], user.id)

  const updateInfo = async () => {
    const fileName = await getNewImageName(user.image, avatar, "profiles")
    const res = await updateUser({
      password,
      email,
      username,
      id: user.id,
      image: fileName
    }, lang)
    if (res) {
      toast.success(t("dataUpdated"))
      setUser(res)
    }
  }

  const isI = meUser?.id === user.id

  return !!user && (
    <div className={styles.container}>
      {/* Шапка профиля */}
      <div className={styles.header}>
        <ImageUploader disabled={!isI} name={user.username} type="avatar" value={user.image ? api.profiles + user.image : null} setValue={setAvatar} />
        <div className={styles.headerInfo}>
          <h1 className={styles.username}>{user.username}</h1>
          <div className={styles.userMeta}>
            <div className={styles.metaItem + " title"} style={{ fontSize: "14px", cursor: "pointer", margin: "0", backgroundSize: "160% 160%" }}>
              <Flag size={16} color="var(--placeholder)" />
              <span onClick={()=>setPage(Pages.CLUB, { id: user.club.id })}>{user.club.title}</span>
            </div>
            <div className={styles.metaItem}>
              <MapPin size={16} color="var(--placeholder)" />
              <span>{user.city.title}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} color="var(--placeholder)" />
              <span>{t('registered')}: {formatDate(user.createdAt, lang)}</span>
            </div>
          </div>
          <div className={styles.links}>
            {isI &&
            <>
            <Button
            stroke
            className={styles.delete}
            onClick={()=>setShowDelete(true)}
            >
              <Trash2 size={28} color="var(--fg)" />
            </Button>
            <Button
            stroke
            className={styles.logout}
            onClick={async () => { await logout(); setUser(undefined); setPage(Pages.SETTINGS) }}
            >
              <LogOut size={28} color="var(--fg)" />
            </Button>
            </>
            }
            <ShareButton className={styles.link} type="profile" id={user.id} />
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Award size={24} color="var(--accent)" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{tournamentsCount}</span>
            <span className={styles.statLabel}>{t('tournaments')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Trophy size={24} color="var(--accent)" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{winsCount}</span>
            <span className={styles.statLabel}>{t('win')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Swords size={24} color="var(--accent)" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{user.totalMatches}</span>
            <span className={styles.statLabel}>{t('fights')}</span>
          </div>
        </div>
      </div>

      {/* Табы с информацией */}
      <Tabs
      tabs={tabs}
      titles={[t('profileInfo'), t('statistics'), <><TrendingUp size={20} color="var(--fg)" />{t('predictions')}</>, <><Sword size={20} color="var(--fg)" />{t('weaponDetails')}</>]}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      />

      {/* Контент табов */}
      <Section>
        {activeTab === 'info' && (
          <div className={styles.infoContent}>
            {isI &&
            <>
            <InputText placeholder={t("email")} type="email" value={email} setValue={setEmail} />
            <InputText placeholder={t("username")} value={username} setValue={setUsername} />
            <InputText placeholder={t("password")} type="password" value={password} setValue={setPassword} />
            <Button title={t("updateData")} onClick={()=>updateInfo()}/>
            </>
            }
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('email')}:</span>
              <span className={styles.infoValue}>{user.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('gender')}:</span>
              <span className={styles.infoValue}>
                {user.gender ? <Mars size={20} color="var(--fg)" /> : <Venus size={20} color="var(--fg)" />}
              </span>
            </div>
          </div>
        )}
        {activeTab === "stats" && (
          <div className={styles.statsContent}>
            {tournamentsCount > 0 && tournaments && (
              <div className={styles.statRow}>
                <span>{t('tournamentsList')}:</span>
                <span className={styles.statNumber}>&nbsp;
                  {tournaments.map((t, index) => (
                    <span key={t.id} className="link" style={{ color: "var(--accent)" }} onClick={()=>setPage(Pages.TOURNAMENT, { id: t.id })}>
                      {t.title}
                      {index < tournamentsCount - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            )}
            {!!tournaments &&
            <div className={styles.statRow}>
              <span>{t('win')}</span>
              <span className={styles.statNumber}>
                {Object.keys(nominationsWins).map((nomId, index)=>`${getNominationTitleByTournaments(tournaments, Number(nomId))}: ${nominationsWins[Number(nomId)]} ${index < Object.keys(nominationsWins).length - 1 ? ', ' : ""}`)}
              </span>
            </div>
            }
            {!!tournaments &&
            <div className={styles.statRow}>
              <span>{t('winRate')}</span>
              <span className={styles.statNumber}>{(Object.keys(nominationsWins).length / tournaments.length) * 100}%</span>
            </div>
            }
          </div>
        )}
        {activeTab === "predictions" &&
        <>
          <WeaponNominationsSelect
          nominations={nominations}
          weaponId={predictionsStates.weaponId}
          nominationId={predictionsStates.nominationId}
          setNominationId={(val)=>handlePredictionsStates("nominationId", val)}
          setWeaponId={(val)=>handlePredictionsStates("weaponId", val)}
          />
          {predictionsStates.weaponId && predictionsStates.nominationId &&
          <Select
          placeholder={t("fighters")}
          options={users.filter(u=>u.id !== user.id).map(u=>({ label: u.username, value: u.id }))}
          value={predictionsStates.opponent}
          setValue={(val)=>handlePredictionsStates("opponent", val)}
          style={{ marginTop: "10px" }}
          />
          }
          {!!Object.keys(predictionsStates.result).length &&
          <Table
          titles={[`${t("win")} ${user.username}`, `${t("win")} ${users.find(u=>u.id === predictionsStates.opponent)?.username}`]}
          data={[[String(predictionsStates.result.fighterRed.winProbability) + "%", String(predictionsStates.result.fighterBlue.winProbability) + "%"]]}
          />
          }
        </>
        }
        {activeTab === "weaponDetails" && (
          <>
            <WeaponNominationsSelect
            nominations={nominations}
            weaponId={weaponId}
            nominationId={nominationId}
            setNominationId={setNominationId}
            setWeaponId={setWeaponId}
            />
            {stats && !!stats.ratings.length && nominationId &&
            <Table
            titles={[t("rating"), t("rank"), t("volatility"), "RD", capitalizeFirstLetter(t("stage"))]}
            // @ts-ignore
            data={[stats.ratings.find(r=>r.id === nominationId)].map(r=>[String(r.rating.toFixed(2)), String(r.rank), String(r.volatility.toFixed(2)), String(r.rd.toFixed(2)), String(r.matches)])}
            />
            }
          </>
        )}
      </Section>
      <ModalWindow isOpen={showDelete} onClose={()=>setShowDelete(false)}>
        <Section title={t("realyDelete")}>
          <Button
          onClick={async () => { await deleteUser(user.id); await logout(); setUser(undefined); setPage(Pages.SETTINGS) }}
          >
            <Trash2 size={28} color="var(--fg)" />
          </Button>
        </Section>
      </ModalWindow>
    </div>
  );
}