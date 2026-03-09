import { fighterDefault } from "@/store";
import { ParticipantType, TournamentSystem } from "@/typings";
import { generateId } from "./helpers";

export const generatePairs = (
  participants: ParticipantType[],
  tournamentSystem: TournamentSystem,
  poolIndex: number,
  setFighterPairs: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>,
  setCurrentPairIndex: React.Dispatch<React.SetStateAction<number[]>>
): ParticipantType[][][] => {
  let pairs: ParticipantType[][][] = [];

  /* ---------- ОЛИМПИЙСКАЯ ---------- */
  if (tournamentSystem === TournamentSystem.OLYMPIC) {
    let shuffled = [...participants].sort(() => Math.random() - 0.5);

    const filter = (group: ParticipantType[]) => {
      for (let i = 0; i < group.length - 1; i += 2) {
        if (!pairs[poolIndex]) pairs[poolIndex] = [];
        pairs[poolIndex].push([group[i], group[i + 1]]);
      }
      if (group.length % 2 !== 0) {
        pairs[poolIndex].push([
          group[group.length - 1],
          {
            ...fighterDefault,
          },
        ]);
      }
    };

    filter(shuffled);
  } else if (tournamentSystem === TournamentSystem.HYBRID || tournamentSystem === TournamentSystem.ROBIN) {

  /* ---------- КРУГОВАЯ ---------- */
  // Если нечётное количество, добавляем "пустышку" (—)
  let players = [...participants];

  // Если нечётное количество, добавляем "—"
  if (players.length % 2 !== 0) {
    players.push({
      ...fighterDefault,
      id: generateId("bye"),
      name: "—"
    });
  }

  const numRounds = players.length - 1; // Количество туров
  const half = players.length / 2;       // Половина для разделения

  // Фиксируем первого игрока
  const fixed = players[0];
  // Остальные будут вращаться
  let rotating = players.slice(1);

  for (let round = 0; round < numRounds; round++) {
    const roundPairs: ParticipantType[][] = [];

    // Первая пара: фиксированный игрок с rotating[0]
    if (fixed.name !== "—" && rotating[0].name !== "—") {
      // Проверяем, не встречались ли они уже
      if (!fixed.opponents.includes(rotating[0].id)) {
        roundPairs.push([fixed, rotating[0]]);
      }
    }

    // Остальные пары: i-й с конца
    for (let i = 1; i < half; i++) {
      const player1 = rotating[i];
      const player2 = rotating[rotating.length - i];

      if (player1.name !== "—" && player2.name !== "—") {
        // Проверяем, не встречались ли они уже
        if (!player1.opponents.includes(player2.id)) {
          roundPairs.push([player1, player2]);
        }
      }
    }

    pairs[poolIndex] = roundPairs;

    // Ротация: сдвигаем вращающихся игроков (последний становится первым)
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  } else if (tournamentSystem === TournamentSystem.SWISS) {
    pairs = generateSwissPairs(participants, poolIndex);
  }

/**
 * Генерация пар для швейцарской системы с учётом Buchholz
 */
function generateSwissPairs(
  participants: ParticipantType[],
  poolIndex: number
): ParticipantType[][][] {
  const pairs: ParticipantType[][][] = [];

  // Фильтруем только активных участников (исключаем —)
  const activeParticipants = participants.filter(p => p.name !== "—");

  if (activeParticipants.length === 0) return pairs;

  // 1. Сортируем участников по системе "победы -> Buchholz -> тех.очки"
  const sorted = sortParticipantsBySwissCriteria(activeParticipants);

  // 2. Группируем по ПОБЕДАМ (основной критерий швейцарской системы)
  const winGroups = groupByWins(sorted);

  // 3. Генерируем пары с учётом всех правил
  const tempPairs = generatePairsFromGroups(winGroups);

  // 4. Сортируем пары (баи в конец)
  pairs[poolIndex] = sortPairsWithByes(tempPairs);

  return pairs;
}

/**
 * Сортировка участников по критериям швейцарской системы
 */
function sortParticipantsBySwissCriteria(
  participants: ParticipantType[]
): ParticipantType[] {
  return [...participants].sort((a, b) => {
    // 1. Главный критерий - ПОБЕДЫ (по убыванию)
    if (b.wins !== a.wins) return b.wins - a.wins;

    // 2. При равенстве побед - Buchholz (кто играл с более сильными)
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;

    // 3. Затем - меньше поражений
    if (a.losses !== b.losses) return a.losses - b.losses;

    // 4. Затем - больше технических очков
    if (b.scores !== a.scores) return b.scores - a.scores;

    // 5. Если всё равно - случайно
    return Math.random() - 0.5;
  });
}

/**
 * Группировка по победам
 */
function groupByWins(participants: ParticipantType[]): ParticipantType[][] {
  const groups: ParticipantType[][] = [];
  const winsMap = new Map<number, ParticipantType[]>();

  participants.forEach(p => {
    if (!winsMap.has(p.wins)) {
      winsMap.set(p.wins, []);
    }
    winsMap.get(p.wins)!.push(p);
  });

  // Сортируем группы по убыванию побед
  const sortedWins = Array.from(winsMap.keys()).sort((a, b) => b - a);

  for (const wins of sortedWins) {
    groups.push(winsMap.get(wins)!);
  }

  return groups;
}

  /**
   * Генерация пар из групп с учётом Buchholz
   */
  function generatePairsFromGroups(
    groups: ParticipantType[][]
  ): ParticipantType[][] {
    const pairs: ParticipantType[][] = [];
    const used = new Set<string>();

    // Очередь групп для обработки
    const groupsQueue = [...groups];

    while (groupsQueue.length > 0) {
      const currentGroup = groupsQueue.shift()!;

      // Сортируем участников внутри группы по Buchholz (для более справедливых пар)
      const sortedGroup = [...currentGroup].sort((a, b) => {
        // Внутри группы сначала те, у кого выше Buchholz
        return (b.buchholz || 0) - (a.buchholz || 0);
      });

      // Временный массив для неспаренных участников текущей группы
      const unpairedFromGroup: ParticipantType[] = [];

      for (let i = 0; i < sortedGroup.length; i++) {
        const player = sortedGroup[i];

        // Пропускаем уже использованных
        if (used.has(player.id)) continue;

        // Ищем соперника в текущей группе
        let opponent = findBestOpponent(
          player,
          sortedGroup,
          i,
          used
        );

        if (opponent) {
          // Определяем порядок (кто первый) на основе Buchholz
          const [first, second] = determinePairOrder(player, opponent);
          pairs.push([first, second]);

          used.add(player.id);
          used.add(opponent.id);
        } else {
          // Если нет пары в текущей группе, сохраняем для следующего шага
          unpairedFromGroup.push(player);
        }
      }

      // Если остались неспаренные в текущей группе, пробуем найти им пары в соседних группах
      if (unpairedFromGroup.length > 0) {
        const remainingGroups = groupsQueue.filter(g => g.length > 0);

        for (const player of unpairedFromGroup) {
          if (used.has(player.id)) continue;

          // Ищем соперника в соседних группах
          const opponent = findOpponentInNearbyGroups(
            player,
            remainingGroups,
            used
          );

          if (opponent) {
            const [first, second] = determinePairOrder(player, opponent);
            pairs.push([first, second]);

            used.add(player.id);
            used.add(opponent.id);
          } else {
            // Если совсем нет соперника - даём —
            pairs.push([
              player,
              {
                ...fighterDefault,
                id: player.id
              }
            ]);
            used.add(player.id);
          }
        }
      }
    }

    return pairs;
  }

  /**
   * Поиск лучшего соперника в группе с учётом Buchholz
   */
  function findBestOpponent(
    player: ParticipantType,
    group: ParticipantType[],
    startIndex: number,
    used: Set<string>
  ): ParticipantType | null {
    const candidates: ParticipantType[] = [];

    for (let j = startIndex + 1; j < group.length; j++) {
      const candidate = group[j];

      // Проверяем кандидата
      if (used.has(candidate.id)) continue;
      if (haveTheyPlayed(player, candidate)) continue;
      if (Math.abs(player.buchholz - candidate.buchholz) > 3) continue; // Опционально

      candidates.push(candidate);
    }

    if (candidates.length === 0) return null;

    // Сортируем кандидатов по близости Buchholz
    candidates.sort((a, b) => {
      const diffA = Math.abs(player.buchholz - a.buchholz);
      const diffB = Math.abs(player.buchholz - b.buchholz);
      return diffA - diffB;
    });

    // Возвращаем наиболее подходящего
    return candidates[0];
  }

  /**
   * Поиск соперника в соседних группах
   */
  function findOpponentInNearbyGroups(
    player: ParticipantType,
    groups: ParticipantType[][],
    used: Set<string>
  ): ParticipantType | null {
    const playerWins = player.wins;
    const candidates: ParticipantType[] = [];

    for (const group of groups) {
      if (group.length === 0) continue;

      const groupWins = group[0].wins;
      const winDiff = Math.abs(groupWins - playerWins);

      // Только соседние по победам группы (разница не более 1)
      if (winDiff > 1) continue;

      for (const candidate of group) {
        if (used.has(candidate.id)) continue;
        if (haveTheyPlayed(player, candidate)) continue;
        if (Math.abs(player.buchholz - candidate.buchholz) > 5) continue; // Больший допуск для межгрупповых пар

        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) return null;

    // Сортируем по близости Buchholz
    candidates.sort((a, b) => {
      const diffA = Math.abs(player.buchholz - a.buchholz);
      const diffB = Math.abs(player.buchholz - b.buchholz);
      return diffA - diffB;
    });

    return candidates[0];
  }

  /**
   * Определение порядка в паре (кто первый) на основе Buchholz
   */
  function determinePairOrder(
    a: ParticipantType,
    b: ParticipantType
  ): [ParticipantType, ParticipantType] {
    // Тот, у кого выше Buchholz, идёт первым (опционально)
    return (a.buchholz || 0) >= (b.buchholz || 0) ? [a, b] : [b, a];
  }

  /**
   * Проверка, играли ли участники друг с другом
   */
  function haveTheyPlayed(
    player1: ParticipantType,
    player2: ParticipantType
  ): boolean {
    return (
      player1.opponents?.includes(player2.id) ||
      player2.opponents?.includes(player1.id)
    );
  }

  /**
 * Сортировка пар (баи в конец)
 */
  function sortPairsWithByes(pairs: ParticipantType[][]): ParticipantType[][] {
    return [...pairs].sort((a, b) => {
      const aHasBye = a[1]?.name === "—";
      const bHasBye = b[1]?.name === "—";

      if (aHasBye === bHasBye) return 0;
      return aHasBye ? 1 : -1;
    });
  }

  // СОРТИРОВКА: пары с "—" в конец массива
  if (pairs[poolIndex] && pairs[poolIndex].length > 0) {
    pairs[poolIndex] = pairs[poolIndex].sort((a, b) => {
      const aHasDash = a[0]?.name === "—" || a[1]?.name === "—";
      const bHasDash = b[0]?.name === "—" || b[1]?.name === "—";

      // Если у обоих есть "—" или у обоих нет "—", порядок не меняем
      if (aHasDash === bHasDash) return 0;

      // Если у a есть "—", а у b нет, a должно быть после b
      return aHasDash ? 1 : -1;
    });
  }

  setFighterPairs((state) => {
    const buf = [...state];
    buf[poolIndex] = pairs[poolIndex];
    return buf;
  });
  setCurrentPairIndex((state) => {
    const buf = [...state];
    buf[poolIndex] = 0;
    return buf;
  });
  return pairs;
};
