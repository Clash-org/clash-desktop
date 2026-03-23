import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Award, Target, Sword, TrendingUp, Flag, LogOut, Mars, Venus } from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import styles from './index.module.css';
import { useAtom } from 'jotai';
import { languageAtom, userAtom } from '@/store';
import { capitalizeFirstLetter, formatDate } from '@/utils/helpers';
import Tabs from '../Tabs';
import { Pages, usePage } from '@/hooks/usePage';
import { useUserRating } from '@/hooks/useRatings';
import WeaponNominationsSelect from '../WeaponNominationsSelect';
import { useNominations } from '@/hooks/useNominations';
import Table from '../Table';
import InputText from '../InputText';
import { useAuth } from '@/hooks/useAuth';
import { getPredict, updateUser } from '@/utils/api';
import { useUser, useUsers } from '@/hooks/useUsers';
import Select from '../Select';
import { PredictType } from "@/typings"

export default function Profile({ id }:{ id?: string }) {
  const { t } = useTranslation();
  const { setPage } = usePage()
  const { logout } = useAuth()
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
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [weaponId, setWeaponId] = useState<number>()
  const [nominationId, setNominationId] = useState<number>()
  const { nominations } = useNominations(lang)
  const user = anotherUser || meUser
  const { stats } = useUserRating(user?.id)
  if (!user) return

  useEffect(()=>{
    if (predictionsStates.opponent) {
      (async ()=>{
        const res = await getPredict(user.id, predictionsStates.opponent, predictionsStates.weaponId, predictionsStates.nominationId)
        handlePredictionsStates("result", res)
      })()
    }
  }, [predictionsStates.opponent])

  const handlePredictionsStates = (field: keyof typeof predictionsStates, value: any) => {
    setPredictionsStates(state=>({ ...state, [field]: value }))
  }

  const updateInfo = async () => {
    const res = await updateUser({
      password,
      email,
      username,
      id: user.id
    }, lang)
    setUser(res)
  }

  const tournamentsCount = user.totalMatches;

  return (
    <div className={styles.container}>
      {/* Шапка профиля */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user.username.charAt(0).toUpperCase()}
        </div>
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
          <Button
          stroke
          className={styles.logout}
          onClick={async () => { await logout(); setUser(undefined); setPage(Pages.SETTINGS) }}
          >
            <LogOut size={28} color="var(--fg)" />
          </Button>
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
          <Target size={24} color="var(--accent)" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>0</span>
            <span className={styles.statLabel}>{t('predictions')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Sword size={24} color="var(--accent)" />
          <div className={styles.statInfo}>
            <span className={styles.statValue}>0</span>
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
            <InputText placeholder={t("email")} type="email" value={email} setValue={setEmail} />
            <InputText placeholder={t("username")} value={username} setValue={setUsername} />
            <InputText placeholder={t("password")} type="password" value={password} setValue={setPassword} />
            <Button title={t("updateData")} onClick={()=>updateInfo()}/>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ID:</span>
              <span className={styles.infoValue}>{user.id}</span>
            </div>
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
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('tournamentsCount')}:</span>
              <span className={styles.infoValue}>{tournamentsCount}</span>
            </div>
            {tournamentsCount > 0 && (
              <div className={styles.tournamentsList}>
                <span className={styles.infoLabel}>{t('tournamentsList')}:</span>
                <div className={styles.tournamentIds}>
                  {/* {user.tournamentsIds.map((id, index) => (
                    <span key={id} className={styles.tournamentId}>
                      #{id}
                      {index < tournamentsCount - 1 && ', '}
                    </span>
                  ))} */}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "stats" && (
          <div className={styles.statsContent}>
            <div className={styles.statRow}>
              <span>{t('totalFights')}</span>
              <span className={styles.statNumber}>0</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('wins')}</span>
              <span className={styles.statNumber}>0</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('losses')}</span>
              <span className={styles.statNumber}>0</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('winRate')}</span>
              <span className={styles.statNumber}>0%</span>
            </div>
            <div className={styles.statRow}>
              <span>{t('averageScore')}</span>
              <span className={styles.statNumber}>0</span>
            </div>
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
          options={users.map(u=>({ label: u.username, value: u.id }))}
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
            {stats && nominationId &&
            <Table
            titles={[t("rating"), t("rank"), t("volatility"), "RD", capitalizeFirstLetter(t("stage"))]}
            data={[stats.ratings?.find(r=>r.id === nominationId)]?.map(r=>[String(r.rating.toFixed(2)), String(r.rank), String(r.volatility.toFixed(2)), String(r.rd.toFixed(2)), String(r.matches)])}
            />
            }
          </>
        )}
      </Section>
    </div>
  );
}