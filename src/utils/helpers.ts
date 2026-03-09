import { STORAGE_PREFIX } from "@/constants";
import { ParticipantType } from "@/typings";

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

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};