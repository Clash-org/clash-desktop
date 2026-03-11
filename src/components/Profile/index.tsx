import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Award, Target, Sword, BarChart3, TrendingUp, Flag } from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import styles from './index.module.css';
import { useAtomValue } from 'jotai';
import { userAtom } from '@/store';
import { formatDate } from '@/utils/helpers';
import Tabs from '../Tabs';

export default function Profile() {
  const { t } = useTranslation();
  const tabs = ['info', 'stats']
  const [activeTab, setActiveTab] = useState('info');
  const user = useAtomValue(userAtom)
  if (!user) return
  const onPredictionsClick = () => {

  }

  const onWeaponDetailsClick = () => {

  }

  const onFightsGraphClick = () => {

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
              <span>{user.club.title}</span>
            </div>
            <div className={styles.metaItem}>
              <MapPin size={16} color="var(--placeholder)" />
              <span>{user.city.title}</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={16} color="var(--placeholder)" />
              <span>{t('registered')}: {formatDate(user.createdAt)}</span>
            </div>
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

      {/* Кнопки действий */}
      <div className={styles.actionButtons}>
        <Button
          title={t('predictions')}
          onClick={onPredictionsClick}
          className={styles.actionButton}
          stroke
        >
          <TrendingUp size={20} />
          <span>{t('predictions')}</span>
        </Button>
        <Button
          title={t('weaponDetails')}
          onClick={onWeaponDetailsClick}
          className={styles.actionButton}
          stroke
        >
          <Sword size={20} />
          <span>{t('weaponDetails')}</span>
        </Button>
        <Button
          title={t('fightsGraph')}
          onClick={onFightsGraphClick}
          className={styles.actionButton}
          stroke
        >
          <BarChart3 size={20} />
          <span>{t('fightsGraph')}</span>
        </Button>
      </div>

      {/* Табы с информацией */}
      <Tabs
      tabs={tabs}
      titles={[t('profileInfo'), t('statistics')]}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      />

      {/* Контент табов */}
      <Section>
        {activeTab === 'info' ? (
          <div className={styles.infoContent}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('id')}:</span>
              <span className={styles.infoValue}>{user.id}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('gender')}:</span>
              <span className={styles.infoValue}>
                {user.gender ? t('male') : t('female')}
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
        ) : (
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
      </Section>
    </div>
  );
}