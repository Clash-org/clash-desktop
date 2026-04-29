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