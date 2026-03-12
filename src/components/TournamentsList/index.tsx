// components/TournamentsList/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import Button from '@/components/Button';
import Section from '@/components/Section';
import styles from './index.module.css';
import { TFunction } from 'i18next';
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/store';
import { TournamentShortType, TournamentStatus } from '@/typings';
import { formatDate } from '@/utils/helpers';
import { PAGE_SIZE_TOURNAMENTS, SERVER_COVER_HOST } from '@/constants';
import { useTournaments } from '@/hooks/useTournaments';

type ContentProps = {
    isPast?: boolean;
    t: TFunction<"translation", undefined>;
    tournaments: TournamentShortType[];
}

function Content({ isPast=false, t, tournaments }:ContentProps) {
    const handleTournamentClick = (tournamentId: number) => {
        window.location.href = `/tournament?id=${tournamentId}`
    };

    return (
        <Section title={isPast ? t('pastTournaments') : t('upcomingTournaments')} className={styles.section}>
            <div className={styles.tournamentsGrid}>
            {tournaments.map((tournament) => (
                <div
                key={tournament.id}
                className={`${styles.tournamentCard} ${isPast ? styles.pastCard : ""}`}
                onClick={() => handleTournamentClick(tournament.id)}
                >
                <div className={styles.imageWrapper}>
                    <img
                    src={SERVER_COVER_HOST + tournament.image}
                    alt={tournament.title}
                    className={`${styles.image} ${isPast ? styles.pastImage : ""}`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/cross.webp';
                    }}
                    />
                    {!isPast && tournament.status === TournamentStatus.ACTIVE && (
                    <div className={styles.registrationBadge}>
                        {t('registrationOpen')}
                    </div>
                    )}
                </div>

                <div className={styles.cardContent}>
                    <h3 className={styles.tournamentTitle}>{tournament.title}</h3>

                    <div className={styles.tournamentMeta}>
                    <div className={styles.metaItem}>
                        <Calendar size={16} />
                        <span>
                        {formatDate(tournament.date)}
                        </span>
                    </div>
                    <div className={styles.metaItem}>
                        <MapPin size={16} />
                        <span>{tournament.city}</span>
                    </div>
                    </div>

                    <div className={styles.cardFooter}>
                    <span className={styles.detailsLink}>
                        {isPast ? t('viewResults') : t('viewDetails')}
                        <ChevronRight size={16} />
                    </span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </Section>
    )
}

export default function TournamentsList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const lang = useAtomValue(languageAtom)
  const [page, setPage] = useState(1)
  const { tournaments, tournamentsCount } = useTournaments(lang, page, true)
  const [currentTournaments, setCurrentTournaments] = useState<TournamentShortType[]>([])

  useEffect(()=>{
    setCurrentTournaments(state=>{
      if (JSON.stringify(state) !== JSON.stringify(tournaments))
        return [...state, ...tournaments]
      return state
    })
  }, [page, tournaments])

  const loadMore = () => {
    setLoading(true);
    // Имитация загрузки
    setTimeout(() => {
      setPage(page+1);
      setLoading(false);
    }, 800);
  };

  const upcomingTournaments: TournamentShortType[] = [];
  const pastTournaments: TournamentShortType[] = [];
  currentTournaments.forEach(t=>{
    if (new Date(t.date) >= new Date()) {
      upcomingTournaments.push(t)
    } else {
      pastTournaments.push(t)
    }
  })

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h1 className="title">{t('tournaments')}</h1>
        <p className={styles.subtitle}>{t('findYourTournament')}</p>
      </div>
      <div className={styles.content}>
        {/* Секция предстоящих турниров */}
        <Content t={t} tournaments={upcomingTournaments} />

        {/* Секция прошедших турниров */}
        {pastTournaments.length > 0 &&
        <Content isPast t={t} tournaments={pastTournaments} />}

        {/* Кнопка "Показать больше" */}
        {page * PAGE_SIZE_TOURNAMENTS < tournamentsCount && (
            <div className={styles.loadMoreWrapper}>
            <Button
                title={t('showMore')}
                onClick={loadMore}
                className={styles.loadMoreButton}
                disabled={loading}
                stroke
            >
                {loading ? (
                <span className={styles.loadingSpinner}></span>
                ) : (
                t('showMore')
                )}
            </Button>
            </div>
        )}
      </div>
    </div>
  );
}