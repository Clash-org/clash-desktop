import { HitZonesType } from "@/store";

export enum Gender {
  FEMALE,
  MALE
}

export enum TournamentSystem {
  HYBRID="hybrid",
  OLYMPIC="olympic",
  ROBIN="robin",
  SWISS="swiss"
}

export type LangType = "en"|"ru"|"cn"

export type ParticipantType = {
  id: string;               // уникальный идентификатор
  name: string;
  wins: number;             // победы
  scores: number;           // очки
  losses: number;           // поражения
  draws: number;            // ничьи
  warnings: number;
  protests: number;
  doubleHits: number;
  // для швейцарской
  opponents: string[];     // уже сыгранные соперники (чтобы не повторяться)
  buchholz: number;        // доп. показатель, если понадобится
}

export type SliceParticipantType = Pick<ParticipantType, "id"|"name"|"wins"|"scores"|"doubleHits"|"protests"|"warnings">

export type ParticipantPlayoffType = {
  id: string;
  name: string;
  differenceWinsLosses: number;
  ratioWinsLosses: number;
  wins: number;
  scores: number;
  warnings: number;
  protests: number;
  doubleHits: number;
}

export type CityType = {
  id: number;
  title: string;
  createdAt: Date;
}

export type ClubType = CityType

export type SelectOptionType = { label: string, value: number }

export type UserType = {
  id: string;
  email: string;
  username: string;
  image: string;
  gender: boolean;
  isAdmin: boolean;
  city: CityType;
  club: ClubType;
  totalMatches: number;
  moderatorTournamentsIds: number[]
  createdAt: string;
}

export type RegistrationType = {
  accessToken: string;
  user: UserType
}

export const CURRENCY_CODES = [
  "USD", "EUR", "GBP", "JPY", "CNY", "RUB", "CHF", "CAD", "AUD", "INR",
  "BRL", "KRW", "SGD", "NZD", "MXN", "HKD", "NOK", "SEK", "TRY", "ZAR",
  "AED", "PLN", "THB", "IDR", "SAR", "MYR", "DKK", "CZK", "HUF", "ILS"
] as const;

export type CurrencyType = typeof CURRENCY_CODES[number]

export type WinnersByNomination = {
  [nominationId: number]: string[];
}

export type TournamentType = {
  id: number;
  title: string;
  weaponsIds: number[];
  nominationsIds: number[];
  organizerId: string;
  winners: WinnersByNomination;
  status: TournamentStatusType;
  image: string,
  date: string;
  city: CityType;
  nominations: NominationType[];
  prices: {[nominationId: string]: number};
  currency: CurrencyType,
  description: string;
  socialMedias: string[];
  participants: UserType[];
  participantsCount: {[nominationId: number]: number};
  matchesCount: number[];
  isAdditions: {[field: string]: boolean};
  isInternal: boolean;
  moderators: UserType[];
  createdAt: Date;
}

export type NominationUser = UserType & { status: ParticipantStatusType }

export type NominationUsersType = {[nominationId: string]: NominationUser[]}

export type TournamentShortType = Pick<TournamentType, "image"|"id"|"date"|"title"|"status"> & { city: string, organizer: UserType }

export type TournamentFormData = Omit<TournamentType, "city"|"organizerId"|"matchesCount"|"date"|"createdAt"|"participants"|"nominations"|"id"|"moderators"> & { date: Date, cityId: number, moderatorsIds: string[] }

export type WeaponType = {
  id: number;
  title: string;
  createdAt: string;
}

export type NominationType = WeaponType & {
  weapon: WeaponType
}

export const ParticipantStatus = {
  REGISTERED: 'registered',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
} as const;

export type ParticipantStatusType = typeof ParticipantStatus[keyof typeof ParticipantStatus];

export const TournamentStatus = {
  PENDING: 'pending',
  COMPLETED: "completed",
  ACTIVE: 'active'
} as const;

export type TournamentStatusType = typeof TournamentStatus[keyof typeof TournamentStatus];

export const MatchTypes = {
  POOL: 'pool',
  PLAYOFF: 'playoff'
} as const;
export type MatchTypesType = typeof MatchTypes[keyof typeof MatchTypes];

export type TournamentMatchType = {
  redId: string;
  blueId: string;
  resultRed: 0 | 0.5 | 1;
  scoreRed: number;
  scoreBlue: number;
  type?: MatchTypesType;
  doubleHits?: number;
  protestsRed?: number;
  protestsBlue?: number;
  warningsRed?: number;
  warningsBlue?: number;
  metadata?: MatchMetadataType;
  poolIndex?: number;
}

export type MatchType = Omit<TournamentMatchType, "redId"|"blueId"> & { red: UserType, blue: UserType }

export type TournamentResponse = {
  processed: number;
  results: {
    userId: string;
    user: UserType;
    weaponSubtype: string;
    ratingChange: number;
    newRating: number;
    newRd: number;
    rankChange: number;
    newRank: number;
    matchesPlayed: number;
  }[]
}

export type ParticipantInfo = {
  id: number;
  createdAt: Date;
  user: UserType;
  tournamentId: number;
  info: {[field: string]: any};
}

export type AdditionsFields = {
    trainerName: string;
    age: number;
    cityId: undefined;
    fullName: string;
    phone: string;
    otherContacts: string;
    weaponsRental: {
        [weapon: string]: boolean;
    };
}

export type FighterRatingType = {
  weaponSubtype: string;
  glickoPlayer: any;
  matchesCount: number;
  lastTournamentDate?: Date;
  lastRank?: number;
  currentRank?: number;
}

export type FighterType = {
  id: string;
  name: string;
  ratings: Map<string, FighterRatingType>;
  createdAt: Date;
  totalMatches: number;
}

export type StatsType = {
  fighter: FighterType,
  ratings: {
    id: number;
    weaponSubtype: string;
    rating: number;
    rd: number;
    volatility: number;
    matches: number;
    rank?: number;
  }[]
}

export type LeaderboardType = {
    rank: number;
    userId: string;
    username: string;
    rating: number;
    rd: number;
    matches: number;
    lastActive: Date | null;
}

export type PoolType = {
    id: number;
    createdAt: Date | null;
    nominationId: number;
    tournamentId: number;
    moderatorId: string;
    system: TournamentSystem;
    hitZones: HitZonesType;
    time: number;
    pairs: [UserType|null, UserType|null][];
    isEnd: boolean | null;
    isPoolRating: boolean;
    poolCountDelete: number;
}

export type PoolCreatedType = Omit<PoolType, "createdAt"|"isEnd"|"pairs"|"id"> & { pairsIds: [string, string][] }

export type PredictType = {
    fighterRed: {
        id: string;
        winProbability: number;
    };
    fighterBlue: {
        id: string;
        winProbability: number;
    };
}

export type MatchMetadataType = {
  videoUrl?: string;
  [key: string]: any;
}

export enum ServerStatus {
  ACTIVE, // Сервер активен
  INACTIVE // Отключён владельцем
}

export type ServerType = {
  id: bigint;
  owner: string;
  host: string;
  pricePerMonth: bigint;
  status: bigint;
  registeredAt: bigint;
  exists: boolean;
}

// TypeScript интерфейс
export type  PaymentType = {
  id: bigint;
  serverId: bigint;
  payer: string;
  amount: bigint;        // uint256 → bigint (или number если конвертируете)
  createdAt: bigint;     // timestamp в секундах
  releasedAt: bigint;    // timestamp в секундах
  refundDeadline: bigint;
  refundRequested: boolean;
  ownerResponded: boolean;
  refundReason: string;
  expiresAt: bigint;     // timestamp в секундах
}