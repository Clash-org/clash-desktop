import BetAbi from "../../blockchain/abi/TournamentRegistry.json"
import SynchronizationOracleAbi from "../../blockchain/abi/SynchronizationOracle.json"
import UserRegistryAbi from "../../blockchain/abi/UserRegistry.json"
import addresses from "../../blockchain/addresses.json"

export const STORAGE_PREFIX = '@Clash_';

export const langLabels: Record<string, string> = {
    en: 'en-US',
    ru: 'ru-RU',
    cn: 'zh-CN',
};

export const PAGE_SIZE_TOURNAMENTS = 10

export const RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8545/"

export const contractType = {
    tournamentRegistry: {
        address: addresses.TournamentRegistry || "",
        abi: BetAbi || []
    },
    synchronizationOracle: {
        address: addresses.Oracle || "",
        abi: SynchronizationOracleAbi || []
    },
    UserRegistry: {
        address: addresses.UserRegistry || "",
        abi: UserRegistryAbi || []
    }
}