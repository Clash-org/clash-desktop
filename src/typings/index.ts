export enum Gender {
  FEMALE,
  MALE
}

export enum TournamentSystem {
  HYBRID,
  OLYMPIC,
  ROBIN,
  SWISS
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
  gender: boolean;
  isAdmin: boolean;
  city: CityType;
  club: ClubType;
  totalMatches: number;
  createdAt: string;
}

export type RegistrationType = {
  accessToken: string;
  refreshToken: string;
  user: UserType
}

export const CURRENCY_CODES = [
  "USD", "EUR", "GBP", "JPY", "CNY", "RUB", "CHF", "CAD", "AUD", "INR",
  "BRL", "KRW", "SGD", "NZD", "MXN", "HKD", "NOK", "SEK", "TRY", "ZAR",
  "AED", "PLN", "THB", "IDR", "SAR", "MYR", "DKK", "CZK", "HUF", "ILS"
] as const;

export type CurrencyType = typeof CURRENCY_CODES[number]

export type TournamentType = {
  id: number;
  title: string;
  weaponsIds: number[];
  nominationsIds: number[];
  organizerId: string;
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
  participantsCount: number[];
  matchesCount: number[];
  isAdditions: {[field: string]: boolean};
  createdAt: Date;
}

export type NominationUsersType = {[nominationId: string]: (UserType & { status: ParticipantStatusType })[]}

export type TournamentShortType = Pick<TournamentType, "image"|"id"|"date"|"title"|"status"> & { city: string }

export type TournamentFormData = {
  title: string;
  description: string;
  date: Date;
  cityId: number;
  image: string;
  weaponsIds: number[];
  prices: {[nominationId: string]: number};
  nominationsIds: number[];
  socialMedias: string[];
  isAdditions: {[field: string]: boolean};
  participantsCount: {[nominationId: number]: number};
  status: TournamentStatusType
}

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
  ACTIVE: 'active'
} as const;

export type TournamentStatusType = typeof TournamentStatus[keyof typeof TournamentStatus];