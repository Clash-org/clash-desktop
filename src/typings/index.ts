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

export type SelectOptionType = { label: string, value: number }

export type UserType = {
  id: string;
  email: string;
  username: string;
  gender: boolean;
  isAdmin: boolean;
  city: CityType;
  totalMatches: number;
  createdAt: string;
}

export type RegistrationType = {
  accessToken: string;
  refreshToken: string;
  user: UserType
}

export type TournamentType = {
  id: number;
  title: string;
  weaponsIds: number[];
  nominationsIds: number[];
  organizerId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  image: string,
  date: string;
  city: CityType;
  description: string;
  socialMedias: string[];
  participants: UserType[];
  participantsCount: number[];
  matchesCount: number[];
  createdAt: Date;
}

export type TournamentSliceType = Omit<TournamentType, "participants"|"participantsCount"|"matchesCount"|"description"|"organizerId"|"weaponsIds">

export type TournamentFormData = {
  title: string;
  description: string;
  date: Date;
  cityId: number;
  image: string;
  weaponsIds: number[];
  nominationsIds: number[];
  socialMedias: string[];
  isChildlike: boolean;
  participantsCount: {[nominationId: number]: number};
}

export type WeaponType = {
  id: number;
  title: string;
  createdAt: string;
}

export type NominationType = WeaponType & {
  weapon: WeaponType
}