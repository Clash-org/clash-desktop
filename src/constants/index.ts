let TournamentRegistryAbi: any = { abi: [] };
let SynchronizationOracleAbi: any = { abi: [] };
let UserRegistryAbi: any = { abi: [] };
let addresses: any = {
    TournamentRegistry: "",
    Oracle: "",
    UserRegistry: ""
};

try {
    TournamentRegistryAbi = require("../../blockchain/abi/TournamentRegistry.json");
} catch {
    console.warn('TournamentRegistry.json not found, using default');
}

try {
    SynchronizationOracleAbi = require("../../blockchain/abi/SynchronizationOracle.json");
} catch {
    console.warn('SynchronizationOracle.json not found, using default');
}

try {
    UserRegistryAbi= require("../../blockchain/abi/UserRegistry.json");
} catch {
    console.warn('UserRegistry.json not found, using default');
}

try {
    addresses = require("../../blockchain/addresses.json");
} catch {
    console.warn('addresses.json not found, using default');
}

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
        abi: TournamentRegistryAbi || []
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