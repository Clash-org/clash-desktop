import { fighterDefault } from "@/store";
import { ParticipantType } from "@/typings";

export const getTopThreeFighters = (duels: ParticipantType[][][]): ParticipantType[] => {
  // Создаем объект для подсчета побед
  const winsMap: Record<string, ParticipantType> = {};

  // Перебираем все дуэли и бои
  duels.forEach(round => {
    round.forEach(match => {
      match.forEach(fighter => {
        const key = fighter.id;

        if (!winsMap[key]) {
          winsMap[key] = { ...fighter };
        }

        winsMap[key].wins += fighter.wins;
      });
    });
  });

  // Преобразуем в массив и сортируем по количеству побед
  const fightersWithWins = Object.values(winsMap);
  fightersWithWins.sort((a, b) => b.wins - a.wins);
  if (fightersWithWins.length < 3) fightersWithWins.push({ ...fighterDefault })

  // Берем топ-3 и возвращаем только информацию о бойцах
  return fightersWithWins.slice(0, 3);
};

/**
 * Определение победителей в круговой системе
 * Возвращает массив из трёх лучших участников (1-е, 2-е, 3-е место)
 */
export function getWinnersRobin(
  participants: ParticipantType[]
): {
  winners: ParticipantType[];
  ranking: ParticipantType[]; // полный рейтинг на случай если нужно
} {
  if (participants.length < 3) {
    throw new Error("Для круговой системы нужно минимум 3 участника");
  }

  // 1. Вычисляем дополнительные показатели для каждого участника
  const participantsWithStats = participants.map(p => {
    const totalFights = p.wins + p.losses + p.draws;
    const tournamentPoints = p.wins * 3 + p.draws; // 3 за победу, 1 за ничью

    return {
      ...p,
      tournamentPoints,
      totalFights,
      avgScorePerFight: totalFights > 0 ? p.scores / totalFights : 0
    };
  });

  // 2. Сортируем по всем критериям
  const sorted = [...participantsWithStats].sort((a, b) => {
    // 1. ГЛАВНЫЙ КРИТЕРИЙ: турнирные очки (wins*3 + draws)
    if (a.tournamentPoints !== b.tournamentPoints) {
      return b.tournamentPoints - a.tournamentPoints;
    }

    // 2. При равенстве очков - количество побед
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    // 3. Затем - меньше поражений
    if (a.losses !== b.losses) {
      return a.losses - b.losses;
    }

    // 4. Затем - общее количество технических очков
    if (a.scores !== b.scores) {
      return b.scores - a.scores;
    }

    // 5. Затем - среднее количество очков за бой
    if (a.avgScorePerFight !== b.avgScorePerFight) {
      return b.avgScorePerFight - a.avgScorePerFight;
    }

    // 6. Если всё равно - по алфавиту
    return a.name.localeCompare(b.name);
  });

  // // 3. Формируем детальную информацию
  // const details = sorted.map((p, index) => ({
  //   place: index + 1,
  //   name: p.name,
  //   points: p.tournamentPoints,
  //   wins: p.wins,
  //   draws: p.draws,
  //   losses: p.losses,
  //   totalScore: p.scores,
  //   avgScorePerFight: Math.round(p.avgScorePerFight * 10) / 10
  // }));

  return {
    winners: [sorted[0], sorted[1], sorted[2]],
    ranking: sorted
  };
}

export function getWinnersSwiss(participants: ParticipantType[]) {
  const sortedParticipants =  [...participants].sort((a, b) => {
    // 1. Главный критерий - ОЧКИ (победы + 0.5*ничьи)
    const pointsA = a.wins + a.draws * 0.5;
    const pointsB = b.wins + b.draws * 0.5;

    if (Math.abs(pointsA - pointsB) > 0.01) {
      return pointsB - pointsA; // больше очков = выше место
    }

    // 2. ПРИ РАВЕНСТВЕ ОЧКОВ - коэффициент Бухгольца
    // (сумма очков всех соперников)
    if (a.buchholz !== b.buchholz) {
      return b.buchholz - a.buchholz;
    }

    // 3. При равенстве Бухгольца - усечённый Бухгольц
    // (без учёта лучшего и худшего результата)
    const medianBuchholzA = calculateMedianBuchholz(a, participants);
    const medianBuchholzB = calculateMedianBuchholz(b, participants);

    if (medianBuchholzA !== medianBuchholzB) {
      return medianBuchholzB - medianBuchholzA;
    }

    // 5. Количество побед
    if (a.wins !== b.wins) {
      return b.wins - a.wins;
    }

    // 6. Доп. показатели (технические очки, меньше поражений и т.д.)
    return 0;
  });

  return {
    winners: sortedParticipants.slice(0, 3),
    ranking: sortedParticipants
  }
}

function calculateMedianBuchholz(
  fighter: ParticipantType,
  allParticipants: ParticipantType[]
): number {
  // Если нет соперников, возвращаем 0
  if (!fighter.opponents || fighter.opponents.length === 0) {
    return 0;
  }

  // Собираем ОЧКИ (wins + 0.5*draws) всех соперников
  const opponentsPoints: number[] = [];

  for (const opponentId of fighter.opponents) {
    const opponent = allParticipants.find(p => p.id === opponentId);
    if (opponent) {
      // Используем те же очки, что и в основном критерии
      const opponentPoints = opponent.wins + opponent.draws * 0.5;
      opponentsPoints.push(opponentPoints);
    }
  }

  // Если меньше 3 соперников, возвращаем обычную сумму
  if (opponentsPoints.length < 3) {
    return opponentsPoints.reduce((sum, points) => sum + points, 0);
  }

  // Сортируем по возрастанию
  opponentsPoints.sort((a, b) => a - b);

  // Убираем лучшего и худшего соперника
  opponentsPoints.pop();      // убираем лучшего
  opponentsPoints.shift();    // убираем худшего

  // Суммируем оставшиеся
  return opponentsPoints.reduce((sum, points) => sum + points, 0);
}

export function getAllInOneParticipants(duels: ParticipantType[][][], fightersBuchholz?: {[id: string]: number}) {
  const allInOneParticipants: Record<string, ParticipantType> = {};
  duels.forEach(round => {
    round.forEach(match => {
      match.forEach(fighter => {
        const key = fighter.id;

        if (!allInOneParticipants[key]) {
          allInOneParticipants[key] = {
            ...fighter,
            wins: 0,
            draws: 0,
            losses: 0,
            scores: 0,
            buchholz: fightersBuchholz ? fightersBuchholz[key] : fighter.buchholz
          };
        }

        allInOneParticipants[key].wins += fighter.wins;
        allInOneParticipants[key].draws += fighter.draws;
        allInOneParticipants[key].scores += fighter.scores;
        allInOneParticipants[key].losses += fighter.losses;
      });
    });
  });

  return Object.values(allInOneParticipants);
}

// --------------------------------------------------------------------
/**
 * Тип для матча
 */
export type MatchType = {
  id: string;
  tournamentId: string;
  matchIndex: number;
  pairIndex: number;
  fighter1Id: string;
  fighter2Id: string;
  fighter1Name: string;
  fighter2Name: string;
  fighter1Score: number;  // очки первого бойца
  fighter2Score: number;  // очки второго бойца
  fighter1Stats?: {
    wins: number;
    draws: number;
    losses: number;
    scores: number;
  };
  fighter2Stats?: {
    wins: number;
    draws: number;
    losses: number;
    scores: number;
  };
  status: "scheduled"|"ongoing"|"completed"
  winnerId: string | null;
  round: number;
}

/**
 * Расчёт SD (разницы очков) для всех участников на основе массива пар
 * @param pairs - массив пар формата ParticipantType[][][], где самый вложенный массив - пара бойцов
 * @returns Map<string, number> где ключ - id бойца, значение - его SD
 */
export function calculateAllSD(pairs: ParticipantType[][][]): Map<string, number> {
  // Словарь для хранения SD каждого бойца
  const sdMap = new Map<string, number>();

  // Проходим по всем пулам
  for (const pool of pairs) {
    // Проходим по всем парам в пуле
    for (const pair of pool) {
      // Проверяем, что пара содержит ровно двух бойцов
      if (pair.length !== 2) continue;

      const [fighter1, fighter2] = pair;

      // Пропускаем пары с —
      if (fighter1.name === "—" || fighter2.name === "—") continue;

      // Вычисляем SD для этой пары
      // SD = очки первого - очки второго (в этом сходе)
      // Но у нас есть только общие scores, а не очки за конкретный бой
      // Поэтому используем разницу в scores между бойцами как приближение
      const sdForThisMatch = fighter1.scores - fighter2.scores;

      // Обновляем SD для первого бойца
      const currentSD1 = sdMap.get(fighter1.id) || 0;
      sdMap.set(fighter1.id, currentSD1 + sdForThisMatch);

      // Обновляем SD для второго бойца (с обратным знаком)
      const currentSD2 = sdMap.get(fighter2.id) || 0;
      sdMap.set(fighter2.id, currentSD2 - sdForThisMatch);
    }
  }

  return sdMap;
}

/**
 * Альтернативная версия, которая пытается определить реальные очки за этот бой
 * Предполагает, что у бойцов есть история или мы можем вычислить разницу
 */
export function calculateAllSDAdvanced(pairs: ParticipantType[][][]): Map<string, number> {
  const sdMap = new Map<string, number>();

  for (const pool of pairs) {
    for (const pair of pool) {
      if (pair.length !== 2) continue;

      const [fighter1, fighter2] = pair;

      if (fighter1.name === "—" || fighter2.name === "—") continue;

      // Пытаемся определить, сколько очков каждый получил в этом бою
      const fightResult = determineFightResult(fighter1, fighter2);

      if (fightResult) {
        const sdForFighter1 = fightResult.fighter1Score - fightResult.fighter2Score;

        sdMap.set(fighter1.id, (sdMap.get(fighter1.id) || 0) + sdForFighter1);
        sdMap.set(fighter2.id, (sdMap.get(fighter2.id) || 0) - sdForFighter1);
      }
    }
  }

  return sdMap;
}

/**
 * Определение результата боя между двумя бойцами
 * Пытается понять, сколько очков каждый набрал в этом конкретном бою
 */
function determineFightResult(
  fighter1: ParticipantType,
  fighter2: ParticipantType
): { fighter1Score: number; fighter2Score: number } | null {

  // Способ 1: Если у бойцов есть поле lastMatchScore
  const f1 = fighter1 as any;
  const f2 = fighter2 as any;

  if (f1.lastMatchScore?.opponentId === fighter2.id) {
    return {
      fighter1Score: f1.lastMatchScore.myScore,
      fighter2Score: f1.lastMatchScore.opponentScore
    };
  }

  if (f2.lastMatchScore?.opponentId === fighter1.id) {
    return {
      fighter1Score: f2.lastMatchScore.opponentScore,
      fighter2Score: f2.lastMatchScore.myScore
    };
  }

  // Способ 2: Если есть matchResults
  if (f1.matchResults?.[fighter2.id]) {
    const result = f1.matchResults[fighter2.id];
    return {
      fighter1Score: result.myScore ?? result.fighter1Score ?? 0,
      fighter2Score: result.opponentScore ?? result.fighter2Score ?? 0
    };
  }

  if (f2.matchResults?.[fighter1.id]) {
    const result = f2.matchResults[fighter1.id];
    return {
      fighter1Score: result.opponentScore ?? result.fighter2Score ?? 0,
      fighter2Score: result.myScore ?? result.fighter1Score ?? 0
    };
  }

  // Способ 3: Если есть matchHistory
  if (Array.isArray(f1.matchHistory)) {
    const match = f1.matchHistory.find((m: any) => m.opponentId === fighter2.id);
    if (match) {
      return {
        fighter1Score: match.myScore ?? match.score1 ?? 0,
        fighter2Score: match.opponentScore ?? match.score2 ?? 0
      };
    }
  }

  if (Array.isArray(f2.matchHistory)) {
    const match = f2.matchHistory.find((m: any) => m.opponentId === fighter1.id);
    if (match) {
      return {
        fighter1Score: match.opponentScore ?? match.score2 ?? 0,
        fighter2Score: match.myScore ?? match.score1 ?? 0
      };
    }
  }

  // Если ничего не нашли, используем разницу в общих scores
  // Это приближение, но может работать если scores обновляются после каждого боя
  const scoreDiff = fighter1.scores - fighter2.scores;

  // Предполагаем, что разница в scores примерно равна разнице в этом бою
  // Это неточно, если бойцы уже провели несколько боёв
  return {
    fighter1Score: Math.max(0, scoreDiff),
    fighter2Score: Math.max(0, -scoreDiff)
  };
}

/**
 * Самая простая версия - просто суммируем scores всех бойцов
 * и вычитаем друг из друга
 */
export function calculateAllSDSimple(pairs: ParticipantType[][][]): Map<string, number> {
  const totalScores = new Map<string, number>();
  const fightsCount = new Map<string, number>();

  // Сначала суммируем все scores и считаем количество боёв
  for (const pool of pairs) {
    for (const pair of pool) {
      if (pair.length !== 2) continue;

      const [fighter1, fighter2] = pair;

      if (fighter1.name === "—" || fighter2.name === "—") continue;

      totalScores.set(fighter1.id, (totalScores.get(fighter1.id) || 0) + fighter1.scores);
      totalScores.set(fighter2.id, (totalScores.get(fighter2.id) || 0) + fighter2.scores);

      fightsCount.set(fighter1.id, (fightsCount.get(fighter1.id) || 0) + 1);
      fightsCount.set(fighter2.id, (fightsCount.get(fighter2.id) || 0) + 1);
    }
  }

  // Теперь вычисляем SD как разницу между scores разных бойцов
  // Но это не совсем правильно, так как scores накапливаются
  // Правильнее было бы хранить результаты каждого боя

  // Временное решение: возвращаем просто scores
  return totalScores;
}

/**
 * Функция для тестирования - создаёт тестовые данные
 */
export function createTestPairs(): ParticipantType[][][] {
  const fighter1: ParticipantType = {
    id: '1',
    name: 'Иванов',
    wins: 0,
    scores: 0,
    losses: 0,
    draws: 0,
    warnings: 0,
    protests: 0,
    doubleHits: 0,
    opponents: [],
    buchholz: 0
  };

  const fighter2: ParticipantType = {
    id: '2',
    name: 'Петров',
    wins: 0,
    scores: 0,
    losses: 0,
    draws: 0,
    warnings: 0,
    protests: 0,
    doubleHits: 0,
    opponents: [],
    buchholz: 0
  };

  // Добавляем результаты после боя
  (fighter1 as any).lastMatchScore = {
    opponentId: '2',
    myScore: 5,
    opponentScore: 3
  };

  (fighter2 as any).lastMatchScore = {
    opponentId: '1',
    myScore: 3,
    opponentScore: 5
  };

  // Обновляем scores
  fighter1.scores = 5;
  fighter2.scores = 3;

  return [
    [[fighter1, fighter2]]
  ];
}

// --------------------------------------------------------------------

/**
 * Преобразование массива пар в массив матчей
 * @param pairs - массив пар вида [ [fighter1, fighter2], [fighter3, fighter4], ... ]
 * @param tournamentId - ID турнира
 * @param round - номер тура (опционально)
 * @returns массив матчей
 */
function convertPairsToMatches(
  pairs: ParticipantType[][][],
  tournamentId: string,
  round?: number,
  results?: Map<string, { fighter1Score: number; fighter2Score: number }>
): MatchType[] {
  const matches: MatchType[] = [];

  pairs.forEach((pool, poolIndex) => {
    pool.forEach((pair, pairIndex) => {
      if (pair.length !== 2) return;

      const [fighter1, fighter2] = pair;

      if (fighter1.name === "—" || fighter2.name === "—") return;

      const matchId = `match_${tournamentId}_r${round || 0}_p${poolIndex}_i${pairIndex}`;
      const matchResult = results?.get(matchId);

      const match: MatchType = {
        id: matchId,
        tournamentId,
        matchIndex: pairIndex,
        pairIndex,
        fighter1Id: fighter1.id,
        fighter2Id: fighter2.id,
        fighter1Name: fighter1.name,
        fighter2Name: fighter2.name,
        fighter1Score: matchResult?.fighter1Score ?? 0,
        fighter2Score: matchResult?.fighter2Score ?? 0,
        fighter1Stats: {
          wins: fighter1.wins,
          draws: fighter1.draws,
          losses: fighter1.losses,
          scores: fighter1.scores
        },
        fighter2Stats: {
          wins: fighter2.wins,
          draws: fighter2.draws,
          losses: fighter2.losses,
          scores: fighter2.scores
        },
        status: matchResult ? "completed" : "scheduled",
        winnerId: matchResult
          ? (matchResult.fighter1Score > matchResult.fighter2Score ? fighter1.id :
             matchResult.fighter2Score > matchResult.fighter1Score ? fighter2.id : null)
          : null,
        round: round || 1
      };

      matches.push(match);
    });
  });

  return matches;
}

/**
 * Генерация уникального ID для матча
 */
function generateMatchId(
  tournamentId: string,
  matchIndex: number,
  pairIndex: number,
  round?: number
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `match_${tournamentId}_r${round || 0}_p${matchIndex}_i${pairIndex}_${timestamp}_${random}`;
}

/**
 * Расширенная версия с дополнительной информацией
 */
export function convertPairsToMatchesDetailed(
  pairs: ParticipantType[][][],
  tournamentId: string,
  options?: {
    round?: number;
    startTime?: string;
    location?: string;
    judge?: string;
  }
): MatchType[] {
  const matches: MatchType[] = [];
  // const now = new Date().toISOString();

  pairs.forEach((pool, matchIndex) => {
    pool.forEach((pair, pairIndex) => {
      if (pair.length !== 2) return;

      const [fighter1, fighter2] = pair;

      // Пропускаем —
      if (fighter1.name === "—" || fighter2.name === "—") {
        return;
      }

      // Проверяем, не встречались ли они уже (опционально)
      // const havePlayedBefore = checkIfTheyPlayedBefore(fighter1, fighter2);

      const match: MatchType = {
        id: generateMatchId(tournamentId, matchIndex, pairIndex, options?.round),
        tournamentId,
        matchIndex,
        pairIndex,

        // Информация о бойцах
        fighter1Id: fighter1.id,
        fighter2Id: fighter2.id,
        fighter1Name: fighter1.name,
        fighter2Name: fighter2.name,

        // Статистика бойцов на момент матча
        fighter1Stats: {
          wins: fighter1.wins,
          draws: fighter1.draws,
          losses: fighter1.losses,
          scores: fighter1.scores
        },
        fighter2Stats: {
          wins: fighter2.wins,
          draws: fighter2.draws,
          losses: fighter2.losses,
          scores: fighter2.scores
        },

        // Результаты (пока пустые)
        fighter1Score: 0,
        fighter2Score: 0,
        winnerId: null,

        // Метаданные
        round: options?.round || 1,
        status: 'scheduled',
        // havePlayedBefore,

        // Время и место
        // scheduledTime: options?.startTime,
        // location: options?.location,
        // judge: options?.judge,

        // Таймстемпы
        // createdAt: now,
        // updatedAt: now
      };

      matches.push(match);
    });
  });

  return matches;
}

/**
 * Преобразование с группировкой по турам
 */
export function convertPairsToMatchesByRound(
  pairsByRound: ParticipantType[][][][], // [round][pool][pair]
  tournamentId: string
): MatchType[] {
  const matches: MatchType[] = [];

  pairsByRound.forEach((roundPairs, roundIndex) => {
    const roundMatches = convertPairsToMatches(
      roundPairs,
      tournamentId,
      roundIndex + 1
    );
    matches.push(...roundMatches);
  });

  return matches;
}

/**
 * Обновление результатов матчей после завершения боёв
 */
export function updateMatchResults(
  matches: MatchType[],
  results: Array<{
    matchId: string;
    fighter1Score: number;
    fighter2Score: number;
  }>
): MatchType[] {
  return matches.map(match => {
    const result = results.find(r => r.matchId === match.id);
    if (!result) return match;

    const { fighter1Score, fighter2Score } = result;
    const winnerId = fighter1Score > fighter2Score ? match.fighter1Id :
                     fighter2Score > fighter1Score ? match.fighter2Id : null;

    return {
      ...match,
      fighter1Score,
      fighter2Score,
      winnerId,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * Получение всех матчей для конкретного бойца
 */
export function getMatchesForFighter(
  matches: MatchType[],
  fighterId: string
): MatchType[] {
  return matches.filter(m =>
    m.fighter1Id === fighterId || m.fighter2Id === fighterId
  );
}

/**
 * Получение статистики по матчам для бойца
 */
export function getFighterMatchStats(
  matches: MatchType[],
  fighterId: string
): {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  totalScored: number;
  totalConceded: number;
  rd: number;
} {
  const fighterMatches = getMatchesForFighter(matches, fighterId);

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalScored = 0;
  let totalConceded = 0;

  fighterMatches.forEach(match => {
    if (match.fighter1Id === fighterId) {
      totalScored += match.fighter1Score;
      totalConceded += match.fighter2Score;
      if (match.winnerId === fighterId) wins++;
      else if (match.winnerId === match.fighter2Id) losses++;
      else if (match.winnerId === null) draws++;
    } else {
      totalScored += match.fighter2Score;
      totalConceded += match.fighter1Score;
      if (match.winnerId === fighterId) wins++;
      else if (match.winnerId === match.fighter1Id) losses++;
      else if (match.winnerId === null) draws++;
    }
  });

  return {
    totalMatches: fighterMatches.length,
    wins,
    losses,
    draws,
    totalScored,
    totalConceded,
    rd: totalScored - totalConceded
  };
}