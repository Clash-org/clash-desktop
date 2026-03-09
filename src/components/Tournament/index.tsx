// components/Tournament/index.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar, MapPin, Users, Sword,
  CheckCircle, Circle, DollarSign,
  ChevronRight,
  UsersRound
} from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import ModalWindow from '@/components/ModalWindow';
import styles from './index.module.css';
import { TournamentType } from '@/typings';
import { tournamentsApi } from '@/utils/api';
import SocialMedias from '../SocialMedias';
import remarkGfm from 'remark-gfm';
import Markdown from 'react-markdown'
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/store';
import Checkbox from '../Checkbox';
import Tabs from '../Tabs';

interface Nomination {
  id: number;
  name: string;
  weapon: 'foil' | 'epee' | 'saber';
  participants: number;
  maxParticipants: number;
  price: number;
  image?: string;
}

interface Application {
  userId: number;
  userName: string;
  club: string;
  paid: boolean;
}

export default function Tournament({ id }:{id: number|null}) {
  const { t } = useTranslation();
  const tabs = ['tournament', 'nominations', 'applications', 'registration']
  const [activeTab, setActiveTab] = useState('tournament');
  const [selectedNomination, setSelectedNomination] = useState<number | null>(null);
  const [showApplications, setShowApplications] = useState(false);
  const [selectedNominations, setSelectedNominations] = useState<number[]>([]);
  const [tournamentData, setTournamentData] = useState<TournamentType>()
  const lang = useAtomValue(languageAtom)

  useEffect(()=>{
    (async ()=>{
      if (id) {
        const tournament = await tournamentsApi.getById(id, lang)
        if (tournament)
          setTournamentData(tournament)
      }
    })()
  }, [id])

  // Моковые данные для номинаций
  const nominations: Nomination[] = [
    { id: 1, name: t('foil'), weapon: 'foil', participants: 12, maxParticipants: 32, price: 1500 },
    { id: 2, name: t('epee'), weapon: 'epee', participants: 8, maxParticipants: 32, price: 1500 },
    { id: 3, name: t('saber'), weapon: 'saber', participants: 15, maxParticipants: 32, price: 1500 },
    { id: 4, name: t('foil'), weapon: 'foil', participants: 5, maxParticipants: 16, price: 1200 },
    { id: 5, name: t('epee'), weapon: 'epee', participants: 3, maxParticipants: 16, price: 1200 },
  ];

  // Моковые данные для заявок
  const applications: Record<number, Application[]> = {
    1: [
      { userId: 1, userName: 'Иван Петров', club: 'Спартак', paid: true },
      { userId: 2, userName: 'Петр Сидоров', club: 'Динамо', paid: false },
      { userId: 3, userName: 'Алексей Иванов', club: 'ЦСКА', paid: true },
    ],
    2: [
      { userId: 4, userName: 'Мария Смирнова', club: 'Спартак', paid: true },
      { userId: 5, userName: 'Елена Кузнецова', club: 'Динамо', paid: true },
    ],
    3: [
      { userId: 6, userName: 'Дмитрий Волков', club: 'Локомотив', paid: false },
    ],
  };

  const getWeaponIcon = (weapon: string) => {
    switch(weapon) {
      case 'foil': return '🤺';
      case 'epee': return '⚔️';
      case 'saber': return '🗡️';
      default: return '🤺';
    }
  };

  const handleNominationClick = (nominationId: number) => {
    setSelectedNomination(nominationId);
    setShowApplications(true);
  };

  const handleApply = () => {
  };

  return tournamentData && (
    <div className={styles.container}>
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
      </div>

      {/* Табы */}
      <div className={styles.tabs}>
        <Tabs
        tabs={tabs}
        titles={[t('tournament'), t('nominations'), t('applications'), t('registration')]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        />
      </div>

      {/* Контент табов */}
      <Section className={styles.content}>
        {activeTab === 'tournament' && (
          <div className={styles.tournamentContent}>
            <div className={styles.description}>
              <h3>{t('aboutTournament')}</h3>
              <Markdown remarkPlugins={[remarkGfm]}>{tournamentData.description}</Markdown>
            </div>

            <div className={styles.actionBlock}>
              <h3>{t('participation')}</h3>
              <div className={styles.actionButtons}>
                <Button
                  title={t('apply')}
                  onClick={() => { setActiveTab('registration'); scroll({ top: 0, left: 0 }) }}
                  className={styles.applyButton}
                >
                  <Sword size={20} />
                  <span>{t('apply')}</span>
                </Button>
                <Button
                  title={t('viewApplications')}
                  onClick={() => { setActiveTab('applications'); window.scroll({ top: 0, left: 0 }); }}
                  className={styles.viewButton}
                  stroke
                >
                  <Users size={20} />
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
              <div key={nomination.id} className={styles.nominationCard}>
                <div className={styles.nominationImage}>
                  <span className={styles.weaponEmoji}>{getWeaponIcon(nomination.weapon)}</span>
                </div>
                <div className={styles.nominationInfo}>
                  <h4>{nomination.name}</h4>
                  <div className={styles.nominationStats}>
                    <div className={styles.stat}>
                      <UsersRound size={14} />
                      <span>{nomination.participants}/{nomination.maxParticipants}</span>
                    </div>
                    <div className={styles.stat}>
                      <DollarSign size={14} />
                      <span>{nomination.price} ₽</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className={styles.nominationArrow} />
              </div>
            ))}
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
                      {applications[nomination.id]?.length || 0}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>

            <ModalWindow
              isOpen={showApplications}
              onClose={() => setShowApplications(false)}
            //   title={t('applications')}
            >
              {selectedNomination && (
                <div className={styles.applicationsList}>
                  <h4>{nominations.find(n => n.id === selectedNomination)?.name}</h4>
                  {applications[selectedNomination]?.map((app) => (
                    <div key={app.userId} className={styles.applicationItem}>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{app.userName}</span>
                        <span className={styles.userClub}>{app.club}</span>
                      </div>
                      {app.paid ? (
                        <CheckCircle size={20} className={styles.paidIcon} />
                      ) : (
                        <Circle size={20} className={styles.unpaidIcon} />
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
                  value={nomination.id}
                  values={selectedNominations}
                  setValue={setSelectedNominations}
                  title={`${nomination.participants}/${nomination.maxParticipants} ${nomination.price}`}
                  />
              ))}
            </div>

            <div className={styles.totalPrice}>
              <span>{t('total')}:</span>
              <span className={styles.price}>
                {selectedNominations.reduce((sum, id) =>
                  sum + (nominations.find(n => n.id === id)?.price || 0), 0
                )} ₽
              </span>
            </div>

            <Button
              title={t('submitApplication')}
              onClick={handleApply}
              className={styles.submitButton}
              disabled={selectedNominations.length === 0}
            >
              {t('submitApplication')}
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}