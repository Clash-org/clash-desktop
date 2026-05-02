export const langLabels: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    zh: 'zh-CN',
};

export const PAGE_SIZE = 10

export const NATIVE_CURRENCIES: Record<number, { symbol: string; network: string }> = {
  1: { symbol: 'ETH', network: 'Ethereum' },
  137: { symbol: 'MATIC', network: 'Polygon' },
  56: { symbol: 'BNB', network: 'BNB Smart Chain' },
  43114: { symbol: 'AVAX', network: 'Avalanche' },
  10: { symbol: 'ETH', network: 'Optimism' },
  42161: { symbol: 'ETH', network: 'Arbitrum' },
  250: { symbol: 'FTM', network: 'Fantom' },
  8453: { symbol: 'ETH', network: 'Base' },
};

export const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.voipstunt.com:3478' },
  { urls: 'stun:stun.ekiga.net:3478' },
  { urls: 'stun:stun.ideasip.com:3478' },
  { urls: 'stun:stun.schlund.de:3478' },
  { urls: 'stun:stun.voipbuster.com:3478' },
  { urls: 'stun:stun.1und1.de:3478' },
  { urls: 'stun:stun.gmx.net:3478' },
  { urls: 'stun:stun.rt.ru:3478' },
  { urls: 'stun:stun.mts.ru:3478' },
  { urls: 'stun:stun.sipnet.ru:3478' },
  { urls: 'stun:stun.chinaunix.com:3478' },
  { urls: 'stun:stun.qq.com:3478' },
];