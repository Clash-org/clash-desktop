// store.ts
import { LangType, ParticipantPlayoffType, ParticipantType, TournamentSystem, TournamentType, UserType } from '@/typings';
import { generateId } from '@/utils/helpers';
import { atom } from 'jotai';

export const fightTimeDefault = 90;
export const hitZonesDefault = {
  head: 3,
  torso: 3,
  arms: 1,
  legs: 1
}

export type HitZonesType = typeof hitZonesDefault;
export const fighterDefault: ParticipantType = {
  id: "null",
  name: "—",
  wins: 0,
  scores: 0,
  losses: 0,
  draws: 0,
  warnings: 0,
  protests: 0,
  doubleHits: 0,
  opponents: [],
  buchholz: 0
}

export const hotKeysDefault = {
  plus1: "KeyQ",
  minus1: "KeyA",
  plus2: "BracketRight",
  minus2: "Quote",
  history: "KeyH",
  start: "Space",
  viewer: "F12"
}
export type HotKeysType = typeof hotKeysDefault

export const pairsDefault: [ParticipantType, ParticipantType][][] = [[
  // Массив пар бойцов по умолчанию
  [{ ...fighterDefault, name: 'Fighter A', id: generateId("Fighter A") }, { ...fighterDefault, name: 'Fighter B', id: generateId("Fighter B") }],
  [{ ...fighterDefault, name: 'Fighter C', id: generateId("Fighter C") }, { ...fighterDefault, name: 'Fighter D', id: generateId("Fighter D") }]
]]

// Основные атомы таймера
export const fightTimeAtom = atom(fightTimeDefault); // Время боя в секундах (по умолчанию 3 минуты)
export const isRunningAtom = atom(false); // Состояние таймера (запущен/остановлен)
export const languageAtom = atom<LangType>('ru'); // Язык интерфейса ('en', 'ru', 'cn')
export const tournamentSystemAtom = atom<TournamentSystem>(TournamentSystem.HYBRID); // Система подсчёта

export const historyAtom = atom<{ score1: number, score2: number }[]>([]);
export const score1Atom = atom(0); // Количество очков 1 бойца
export const score2Atom = atom(0); // Количество очков 2 бойца
export const doubleHitsAtom = atom(0); // Флаг учета обоюдных попаданий
export const protests1Atom = atom(0); // Флаг учета протестов для бойца 1
export const protests2Atom = atom(0); // Флаг учета протестов для бойца 2
export const warnings1Atom = atom(0); // Счетчик предупреждений для бойца 1
export const warnings2Atom = atom(0); // Счетчик предупреждений для бойца 2


// Атомы для управления парами бойцов
export const fighterPairsAtom = atom(pairsDefault);

export const poolsAtom = atom(pairsDefault);

export const duelsAtom = atom<[ParticipantType, ParticipantType][][][]>([[]])

export const hitZonesAtom = atom(hitZonesDefault);

export const hotKeysAtom = atom(hotKeysDefault)

export const currentPairIndexAtom = atom([0]); // Индекс текущей выбранной пары

export const currentPoolIndexAtom = atom(0); // Индекс текущего пула

export const isPoolEndAtom = atom<boolean[]>([false]); // Содержит информацию об окончании битв в пулах

export const playoffAtom = atom<ParticipantPlayoffType[][][]>([]);

export const poolCountDeleteAtom = atom(1);

export const isPoolRatingAtom = atom(true);

export const playoffIndexAtom = atom(0);

export const playoffMatchIndexAtom = atom(0);

export const participantsAtom = atom<ParticipantType[][]>([[]])

export const userAtom = atom<UserType|undefined>()

export const currentTournamentAtom = atom<TournamentType>()

export const currentWeaponIdAtom = atom<number>()

export const currentNominationIdAtom = atom<number>()

export const currentPoolIdAtom = atom<number>()

export const blockchainAtom = atom({
    wallet: "",
    privateKey: ""
})