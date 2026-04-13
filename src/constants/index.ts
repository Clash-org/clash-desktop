import TournamentABI from "../../blockchain/abi/ClashTournament.json"
import SynchronizationABI from "../../blockchain/abi/ClashSynchronization.json"
import UserABI from "../../blockchain/abi/ClashUser.json"
import ServerABI from "../../blockchain/abi/ClashServer.json"
import addresses from "../../blockchain/addresses.json"

export const STORAGE_PREFIX = '@Clash_';

export const langLabels: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    cn: 'zh-CN',
};

export const PAGE_SIZE = 10

export const RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8545/"

export const contractType = {
    tournament: {
        address: addresses.Tournament || "",
        abi: TournamentABI || []
    },
    synchronization: {
        address: addresses.Oracle || "",
        abi: SynchronizationABI || []
    },
    user: {
        address: addresses.User || "",
        abi: UserABI || []
    },
    server: {
        address: addresses.Server,
        abi: ServerABI || []
    }
}

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