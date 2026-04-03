import { langLabels, STORAGE_PREFIX } from "@/constants";
import { CurrencyType, LangType, MatchMetadataType, MatchType, MatchTypesType, ParticipantPlayoffType, ParticipantType, TournamentMatchType, TournamentStatusType, TournamentType } from "@/typings";
import { createMath, uploadImage } from "./api";

export const truncate = (str: string, max = 9) => str?.length > max ? `${str.slice(0, max-2)}…` : (str ? str: '');

export const onlySurname = (name: string, max = 9) => {
    const nameArray = name.split(" ")
    return nameArray[0][0] + ". " + truncate(nameArray[1], max)
}

export const truncateFullName = (name: string, max = 9) => {
    const nameArray = name.split(" ")
    return truncate(nameArray[0], max) + " " + truncate(nameArray[1], max)
}

export const LocalStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(STORAGE_PREFIX + key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  },
  clear: async (): Promise<void> => {
    localStorage.clear();
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }
};

export function getName(name: string) {
  return name.length <= 14 ? name : onlySurname(name, 14)
}

export function generateId(name: string): string {
  return `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

export const encodeToBase64 = (str: string): string => {
  try {
    // Для поддержки Unicode
    const utf8Bytes = new TextEncoder().encode(str);
    const binaryString = String.fromCharCode(...utf8Bytes);
    return btoa(binaryString);
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return str;
  }
};

export const decodeFromBase64 = (str: string): string => {
  try {
    const binaryString = atob(str);
    const utf8Bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
    return new TextDecoder().decode(utf8Bytes);
  } catch (error) {
    console.error('Error decoding from base64:', error);
    return str;
  }
};

export function isPoolEndByDuels(duels: ParticipantType[][][][], poolIndex: number) {
  try {
    const fightersCount = duels[poolIndex][0].reduce((sum, pair)=>pair.flat().filter(man=>man.name !== "—").length + sum, 0)
    const battlesCountMustBe = (fightersCount * (fightersCount-1))/2
    const battlesCount = duels[poolIndex].reduce((sum, pairs)=>pairs.filter(pair=>pair[0].name !== "—" && pair[1].name !== "—").length + sum, 0)
    return battlesCount === battlesCountMustBe
  } catch(e) {
    return false
  }
}

export function formatDate(dateString: string, lang: LangType, short?: boolean): string;
export function formatDate(date: Date, lang: LangType, short?: boolean): string;
export function formatDate(date: string | Date, lang: LangType, short=false) {
  const code = langLabels[lang]
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  return dateObj.toLocaleDateString(code, {
    day: short ? '2-digit' : 'numeric',
    month: short ? '2-digit' : 'long',
    year: 'numeric'
  });
};

export function getSymbolCurrencyByCode(code: CurrencyType) {
  switch (code) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "CNY":
      return "¥";
    case "RUB":
      return "₽";
    case "CHF":
      return "Fr";
    case "CAD":
      return "C$";
    case "AUD":
      return "A$";
    case "INR":
      return "₹";
    case "BRL":
      return "R$";
    case "KRW":
      return "₩";
    case "SGD":
      return "S$";
    case "NZD":
      return "NZ$";
    case "MXN":
      return "Mex$";
    case "HKD":
      return "HK$";
    case "NOK":
      return "kr";
    case "SEK":
      return "kr";
    case "TRY":
      return "₺";
    case "ZAR":
      return "R";
    case "AED":
      return "د.إ";
    case "PLN":
      return "zł";
    case "THB":
      return "฿";
    case "IDR":
      return "Rp";
    case "SAR":
      return "﷼";
    case "MYR":
      return "RM";
    case "DKK":
      return "kr";
    case "CZK":
      return "Kč";
    case "HUF":
      return "Ft";
    case "ILS":
      return "₪";
    default:
      return "?";
  }
}

export function translateStatus(status: TournamentStatusType, lang: LangType): string {
  switch(status) {
    case "active": {
      return lang === "en" ? status : (lang === "ru" ? "активный" : "活动中")
    }
    case "pending": {
      return lang === "en" ? status : (lang === "ru" ? "ожидаемый" : "预期的")
    }
    case "completed": {
      return lang === "en" ? status : (lang === "ru" ? "завершённый" : "已完成")
    }
  }
}

export function capitalizeFirstLetter(str: string) { return str.charAt(0).toUpperCase() + str.slice(1); }

export function getFileNameFromPath(path: string) {
  const pathArr = path.split(/[\\/]/);
  return pathArr[pathArr.length - 1]
}

export function getMatchesFromDuels(data: [ParticipantType, ParticipantType][][]|ParticipantPlayoffType[][][], poolIndex?: number, type: MatchTypesType = "pool", metadata?: MatchMetadataType){
  const matches: TournamentMatchType[] = []
  data.forEach(pairs=>{
    pairs.forEach(pair=>{
      matches.push({
        redId: pair[0].id,
        blueId: pair[1].id,
        resultRed: pair[0].wins === pair[1].wins ? 0.5: (pair[0].wins > pair[1].wins ? 1 : 0),
        doubleHits: pair[0].doubleHits,
        protestsRed: pair[0].protests,
        protestsBlue: pair[1].protests,
        warningsRed: pair[0].warnings,
        warningsBlue: pair[1].warnings,
        scoreRed: pair[0].scores,
        scoreBlue: pair[1].scores,
        poolIndex,
        type,
        metadata
      })
    })
  })

  return matches
}

export async function createMatches(tournamentId: number, weaponId: number, nominationId: number, matches: TournamentMatchType[]) {
  const result: boolean[] = new Array(matches.length)
  for (let [i, match] of matches.entries()) {
    const res = await createMath(tournamentId, weaponId, nominationId, match)
    result[i] = !!res
  }
  return !result.includes(false)
}

export function getNominationTitleByTournaments(
  tournaments: TournamentType[],
  nominationId: number
): string | undefined {
  for (const tournament of tournaments) {
    const nomination = tournament.nominations.find(n => n.id === nominationId);
    if (nomination) {
      return nomination.title;
    }
  }
  return undefined;
}

export const getNewImageName = async (value: string, formData: FormData, dir: "covers"|"profiles" = "covers") => {
      let newName = value || ""
      if (formData.get("image")) {
        const path = await uploadImage(formData, dir)
        if (path)
          newName = getFileNameFromPath(path)
      }
      return newName
}

export function getMatchesByPools(matches: MatchType[]) {
  const pools: MatchType[][] = [[]]
  for (let match of matches) {
    if (pools[match?.poolIndex || 0]) {
      pools[match?.poolIndex || 0].push({...match})
    } else {
      pools[match?.poolIndex || 0] = [{...match}]
    }
  }
  return pools
}