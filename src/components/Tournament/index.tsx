import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, MapPin, Users,
  CheckCircle, Circle,
  ChevronRight,
  UsersRound,
  Ban,
  Info,
  Star,
  FileCheck,
  UserRoundPen
} from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import ModalWindow from '@/components/ModalWindow';
import styles from './index.module.css';
import { ParticipantStatus, TournamentStatus } from '@/typings';
import SocialMedias from '../SocialMedias';
import { useAtomValue } from 'jotai';
import { languageAtom, userAtom } from '@/store';
import Checkbox from '../Checkbox';
import Tabs from '../Tabs';
import { getMatchesByPools, getSymbolCurrencyByCode } from '@/utils/helpers';
import InputText from '../InputText';
import InputNumber from '../InputNumber';
import CitySelect from '../CitySelect';
import Icon from '../Icon';
import { useTournament } from '@/hooks/useTournaments';
import { useParticipants } from '@/hooks/useParticipants';
import { addParticipant, addParticipantInfo } from '@/utils/api';
import toast from 'react-hot-toast';
import FightersScores from '../FightersScores';
import { useMatches } from '@/hooks/useRatings';
import ErrorPage from '../ErrorPage';
import Markdown from '../Markdown';
import { ShareButton } from '../ShareButton';

export default function Tournament({ id }:{id: number|undefined}) {
  const { t } = useTranslation();
  const lang = useAtomValue(languageAtom)
  const user = useAtomValue(userAtom)
  const { tournament: tournamentData } = useTournament(id, lang)
  const { participants } = useParticipants(id, tournamentData?.nominationsIds||[])
  const [currentNomination, setCurrentNomination] = useState<number>()
  const [showMatch, setShowMatch] = useState(false)
  const { matches } = useMatches(tournamentData?.id, currentNomination)
  const matchesByPools = getMatchesByPools(matches)
  const [activeTab, setActiveTab] = useState('tournament');
  const [selectedNomination, setSelectedNomination] = useState<number | null>(null);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedNominations, setSelectedNominations] = useState<number[]>([]);
  const [additionsFields, setAdditionsFields] = useState({
    trainerName: "",
    age: "",
    cityId: undefined,
    fullName: "",
    phone: "",
    otherContacts: "",
    weaponsRental: {} as {[weapon: string]: boolean}
  })

  const isAdditionsFill = () => {
    let result = false

    if (additionsFields.trainerName && additionsFields.age && tournamentData?.isAdditions["isChildlike"]) {
      result = true
    } else if (!tournamentData?.isAdditions["isChildlike"]) {
      result = true
    } else {
      return false
    }

    if (additionsFields.cityId && tournamentData?.isAdditions["isCity"]) {
      result = true
    } else if (!tournamentData?.isAdditions["isCity"]) {
      result = true
    } else {
      return false
    }

    if (additionsFields.fullName && tournamentData?.isAdditions["isFullName"]) {
      result = true
    } else if (!tournamentData?.isAdditions["isFullName"]) {
      result = true
    } else {
      return false
    }

    if (additionsFields.otherContacts && tournamentData?.isAdditions["isOtherContacts"]) {
      result = true
    } else if (!tournamentData?.isAdditions["isOtherContacts"]) {
      result = true
    } else {
      return false
    }

    if (additionsFields.phone && tournamentData?.isAdditions["isPhone"]) {
      result = true
    } else if (!tournamentData?.isAdditions["isPhone"]) {
      result = true
    } else {
      return false
    }

    return result
  }

  useEffect(()=>{
    (async ()=>{
      if (tournamentData && id) {
        setAdditionsFields(state=>{
          return { ...state, weaponsRental: tournamentData.nominations.reduce((sum, nom)=>({ ...sum, [nom.weapon.title]: false }), {}) }
        })
      }
    })()
  }, [])
  if (!tournamentData) return
  const tabs = ['tournament', 'nominations', 'applications', new Date(tournamentData.date) >= new Date() && tournamentData.status !== TournamentStatus.COMPLETED ? 'registration' : ""].filter(Boolean)

  const nominations = tournamentData.nominations.map(nom=>({
    id: nom.id,
    name: nom.title,
    weapon: nom.weapon.title,
    weaponId: nom.weapon.id,
    participants: participants?.[nom.id],
    maxParticipants: tournamentData.participantsCount[nom.id],
    price: tournamentData.prices[nom.id]
  }))

  const handlerAdditionsFields = (field: keyof typeof additionsFields, val: any) => {
    setAdditionsFields(state=>({
      ...state,
      [field]: val
    }))
  }

  const currency = getSymbolCurrencyByCode(tournamentData.currency)
  const getTotalParticipants = (nonination: typeof nominations[number])=>`${nonination.participants?.length || 0}/${nonination.maxParticipants}`

  const handleNominationClick = (nominationId: number) => {
    setSelectedNomination(nominationId);
    setShowApplications(true);
  };

  const handleApply = async () => {
    if (tournamentData?.isAdditions["isChildlike"] &&
      tournamentData?.isAdditions["isCity"] &&
      tournamentData?.isAdditions["isFullName"] &&
      tournamentData?.isAdditions["isOtherContacts"] &&
      tournamentData?.isAdditions["isPhone"] &&
      isAdditionsFill() && user) {
      // @ts-ignore
      await addParticipantInfo(tournamentData.id, user.id, additionsFields, lang)
    }
    for (let nominationId of selectedNominations) {
      await addParticipant(tournamentData.id, nominationId)
    }
    toast.success(t("registered"))
  };

  if (tournamentData.status === TournamentStatus.PENDING) {
    return <ErrorPage message={t("waitAnnouncement")} className={styles.container} />
  }

  return (
    <div className={["container", styles.container].join(" ")}>
      {/* Заголовок турнира */}
      <div className={styles.header}>
        <h1 className={styles.title}>{tournamentData.title}</h1>
        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <Calendar size={18} />
            <span>{new Date(tournamentData.date).toLocaleDateString()}</span>
          </div>
          <div className={styles.metaItem}>
            <MapPin size={18} />
            <span>{tournamentData.city.title}</span>
          </div>
          <div className={styles.metaItem}>
            <Users size={18} />
            <span>{tournamentData.participants.length} {t('participants')}</span>
          </div>
        </div>
        <ShareButton className={styles.headerLink} type="tournament" id={tournamentData.id} />
      </div>

      {/* Табы */}
      <Tabs
      tabs={tabs}
      titles={[<><Info size={20} color="var(--fg)" />{t('tournament')}</>, <><Star size={20} color="var(--fg)" />{t('nominations')}</>, <><FileCheck size={20} color="var(--fg)" />{t('applications')}</>, <><UserRoundPen size={20} color="var(--fg)" />{t('registration')}</>]}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      />

      {/* Контент табов */}
      <Section className={styles.content}>
        {activeTab === 'tournament' && (
          <div className={styles.tournamentContent}>
            <div className={styles.description}>
              <h3>{t('aboutTournament')}</h3>
              <Markdown text={tournamentData.description} />
            </div>

            <div className={styles.actionBlock}>
              <h3>{t('participation')}</h3>
              <div className={styles.actionButtons}>
                <Button
                  title={t('apply')}
                  onClick={() => setActiveTab('registration')}
                  className={styles.applyButton}
                >
                  <UserRoundPen size={20} color="var(--fg)" />
                  <span>{t('apply')}</span>
                </Button>
                <Button
                  title={t('viewApplications')}
                  onClick={() => setActiveTab('applications')}
                  className={styles.viewButton}
                  stroke
                >
                  <FileCheck size={20} color="var(--fg)" />
                  <span>{t('viewApplications')}</span>
                </Button>
              </div>
            </div>

            <div className={styles.socialBlock}>
              <h3>{t('socialMedia')}</h3>
              <SocialMedias socialMedias={tournamentData.socialMedias} />
            </div>
          </div>
        )}

        {activeTab === 'nominations' && (
          <div className={styles.nominationsGrid}>
            {nominations.map((nomination) => (
              <div key={nomination.id} className={styles.nominationCard} onClick={()=>{ setCurrentNomination(nomination.id); setShowMatch(true) }}>
                <div className={styles.nominationImage}>
                  <span className={styles.weaponEmoji}>{<Icon type={nomination.weaponId} />}</span>
                </div>
                <div className={styles.nominationInfo}>
                  <h4>{nomination.name}</h4>
                  <div className={styles.nominationStats}>
                    <div className={styles.stat}>
                      <UsersRound size={14} />
                      <span>{getTotalParticipants(nomination)}</span>
                    </div>
                    <div className={styles.stat}>
                      <span>{nomination.price} {currency}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className={styles.nominationArrow} />
              </div>
            ))}
            <ModalWindow isOpen={showMatch && !!matchesByPools[0]?.length} onClose={()=>setShowMatch(false)} style={{ minWidth: "100vw", height: "100%" }}>
              {!!matchesByPools[0]?.length &&
              matchesByPools.map((pool, i)=>(
                <>
                <h1 style={{ textAlign: "center", fontSize: "20px" }}>{t("pool")} {i+1}</h1>
                <FightersScores
                data={pool.map(m=>({
                  nameRed: m.red.username,
                  nameBlue: m.blue.username,
                  scoreRed: m.scoreRed,
                  scoreBlue: m.scoreBlue,
                  idRed: m.red.id,
                  idBlue: m.blue.id
                }))}
                />
                </>
              ))
              }
            </ModalWindow>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className={styles.applicationsContent}>
            <div className={styles.nominationsList}>
              {nominations.map((nomination) => (
                <div key={nomination.id} className={styles.nominationItem}>
                  <button
                    className={styles.nominationButton}
                    onClick={() => handleNominationClick(nomination.id)}
                  >
                    <span className={styles.nominationName}>{nomination.name}</span>
                    <span className={styles.participantsCount}>
                      <UsersRound size={20} />
                      {participants![nomination.id]?.length || 0}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            <ModalWindow
              isOpen={showApplications}
              onClose={() => setShowApplications(false)}
            >
              {selectedNomination && (
                <div className={styles.applicationsList}>
                  <h4>{nominations.find(n => n.id === selectedNomination)?.name}</h4>
                  {participants![selectedNomination]?.map((participant) => (
                    <div key={participant.id} className={styles.applicationItem}>
                      <div className={styles.userInfo}>
                        <span className={styles.userName} style={participant.status === ParticipantStatus.CANCELLED ? { textDecoration: "line-through" } : {}}>{participant.username}</span>
                        <span className={styles.userClub}>{participant.club.title}</span>
                      </div>
                      {participant.status === ParticipantStatus.CONFIRMED && (
                        <CheckCircle size={20} className={styles.paidIcon} />
                      )}
                      {participant.status === ParticipantStatus.REGISTERED && (
                        <Circle size={20} className={styles.unpaidIcon} />
                      )}
                      {participant.status === ParticipantStatus.CANCELLED && (
                        <Ban size={20} className={styles.unpaidIcon} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ModalWindow>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className={styles.registrationContent}>
            <h3>{t('selectNominations')}</h3>
            <div className={styles.nominationsCheckboxList}>
              {nominations.map((nomination) => (
                  <Checkbox
                  key={nomination.id}
                  value={nomination.id}
                  values={selectedNominations}
                  setValue={setSelectedNominations}
                  title={`${nomination.name} ${nomination.price} ${currency}`}
                  />
              ))}
            </div>
            {(()=>{
              const nodes: ReactNode[] = []
              if (tournamentData.isAdditions["isChildlike"]) {
                nodes.push((
                  <>
                    <InputText
                    placeholder={t("trainerName")}
                    value={additionsFields.trainerName}
                    setValue={val=>handlerAdditionsFields("trainerName", val)}
                    required
                    />
                    <InputNumber
                    placeholder={t("age")}
                    // @ts-ignore
                    value={additionsFields.age}
                    setValue={val=>handlerAdditionsFields("age", val)}
                    className={styles.age}
                    required
                    />
                  </>
                ))
              }
              if (tournamentData.isAdditions["isCity"]) {
                nodes.push(
                  <CitySelect
                  required
                  cityId={additionsFields.cityId}
                  setCityId={(val)=>handlerAdditionsFields("cityId", val)}
                  />
                )
              }

              if (tournamentData.isAdditions["isFullName"]) {
                nodes.push(
                  <InputText
                  required
                  placeholder={t("fullName")}
                  value={additionsFields.fullName}
                  setValue={(val)=>handlerAdditionsFields("fullName", val)}
                  />
                )
              }

              if (tournamentData.isAdditions["isPhone"]) {
                nodes.push(
                  <InputText
                  required
                  placeholder={t("phone")}
                  value={additionsFields.phone}
                  setValue={(val)=>handlerAdditionsFields("phone", val)}
                  />
                )
              }

              if (tournamentData.isAdditions["isOtherContacts"]) {
                nodes.push(
                  <InputText
                  required
                  placeholder={t("otherContacts")}
                  value={additionsFields.otherContacts}
                  setValue={(val)=>handlerAdditionsFields("otherContacts", val)}
                  />
                )
              }
              const weapons = Object.keys(additionsFields.weaponsRental)
              if (tournamentData.isAdditions["isWeaponsRental"] && Object.keys(additionsFields.weaponsRental).length) {
                nodes.push(
                  <span>{t("weaponsRental")}</span>
                )
                nodes.push(weapons.map((weapon, i)=>(
                  <Checkbox
                  key={i}
                  title={weapon}
                  values={weapons.filter(w=>additionsFields.weaponsRental[w])}
                  value={weapon}
                  setValue={(val: string[])=>handlerAdditionsFields("weaponsRental", { ...additionsFields.weaponsRental, [weapon]: val.includes(weapon) })}
                  />
                ))
                )
              }

              return nodes
            })()
            }

            <div className={styles.totalPrice}>
              <span>{t('total')}:</span>
              <span className={styles.price}>
                {selectedNominations.reduce((sum, id) =>
                  sum + (nominations.find(n => n.id === id)?.price || 0), 0
                )} {currency}
              </span>
            </div>

            <Button
              title={t('submitApplication')}
              onClick={handleApply}
              className={styles.submitButton}
              disabled={selectedNominations.length === 0 || !isAdditionsFill()}
            >
              {t('submitApplication')}
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}