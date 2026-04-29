import TournamentABI from "../../blockchain/abi/ClashTournament.json"
import UserABI from "../../blockchain/abi/ClashUser.json"
import ServerABI from "../../blockchain/abi/ClashServer.json"
import addresses from "../../blockchain/addresses.json"
import { storage } from "@/utils/storage";
import { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import i18n from "@/utils/i18n";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";
import toast from "react-hot-toast";

export interface ContractAddress {
    address: string;
    note: string;
}

export interface ContractConfig {
    tournament: {
        addresses: ContractAddress[];
        currentIndex: number;
        abi: any[];
    };
    user: {
        addresses: ContractAddress[];
        currentIndex: number;
        abi: any[];
    };
    server: {
        addresses: ContractAddress[];
        currentIndex: number;
        abi: any[];
    };
}

const defaultAddresses: ContractConfig = {
    tournament: {
        addresses: [{ address: addresses.Tournament || "", note: "" }],
        abi: TournamentABI || [],
        currentIndex: 0
    },
    user: {
        addresses: [{ address: addresses.User || "", note: "" }],
        abi: UserABI || [],
        currentIndex: 0
    },
    server: {
        addresses: [{ address: addresses.Server || "", note: "" }],
        abi: ServerABI || [],
        currentIndex: 0
    }
};

const STORAGE_KEY = 'contract_config';

// Получить сохранённую конфигурацию
export const loadContractConfig = async (): Promise<ContractConfig> => {
    await storage.init();
    const saved = await storage.get<ContractConfig>(STORAGE_KEY);

    if (saved) {
        return {
            tournament: { ...saved.tournament, abi: TournamentABI || [] },
            user: { ...saved.user, abi: UserABI || [] },
            server: { ...saved.server, abi: ServerABI || [] }
        };
    }

    const tournamentAddresses = [{ address: addresses.Tournament || "", note: i18n.t("baseTournamentContract") }]
    const userAddresses = [{ address: addresses.User || "", note: i18n.t("baseUserContract") }]
    const serverAddresses = [{ address: addresses.Server || "", note: i18n.t("baseServerContract") }]
    // Инициализация с дефолтными адресами
    return {
        tournament: { ...defaultAddresses.tournament, addresses: tournamentAddresses },
        user: { ...defaultAddresses.user, addresses: userAddresses },
        server: { ...defaultAddresses.server, addresses: serverAddresses }
    };
};

// Сохранить конфигурацию
export const saveContractConfig = async (config: ContractConfig) => {
    await storage.init();
    const { abi: userAbi, ...otherServer } = config.server
    const { abi: abiTournament, ...otherTournament } = config.tournament
    const { abi: abiUser, ...otherUser } = config.user
    await storage.set(STORAGE_KEY, {
        server: otherServer,
        tournament: otherTournament,
        user: otherUser
    });
};

// Класс для управления контрактами
export class ContractManager {
    private _config: ContractConfig;

    constructor(config: ContractConfig) {
        this._config = config;
    }

    // Получить текущий адрес для конкретного типа контракта
    getCurrentAddress(contractType: keyof ContractConfig): string {
        const contract = this._config[contractType];
        return contract.addresses[contract.currentIndex]?.address || "";
    }

    // Получить текущую заметку для конкретного типа контракта
    getCurrentNote(contractType: keyof ContractConfig): string {
        const contract = this._config[contractType];
        return contract.addresses[contract.currentIndex]?.note || "";
    }

    // Получить все адреса для конкретного типа контракта
    getAllAddresses(contractType: keyof ContractConfig): ContractAddress[] {
        return this._config[contractType].addresses;
    }

    // Получить ABI для конкретного типа контракта
    getAbi(contractType: keyof ContractConfig): any[] {
        return this._config[contractType].abi;
    }

    // Получить полный объект конфигурации контракта
    getContract(contractType: keyof ContractConfig) {
        return {
            address: this.getCurrentAddress(contractType),
            abi: this.getAbi(contractType),
            note: this.getCurrentNote(contractType),
            addresses: this.getAllAddresses(contractType),
            currentIndex: this._config[contractType].currentIndex
        };
    }

    // Переключиться на другой адрес по индексу
    switchToAddress(contractType: keyof ContractConfig, index: number): boolean {
        const contract = this._config[contractType];
        if (index >= 0 && index < contract.addresses.length) {
            contract.currentIndex = index;
            return true;
        }
        return false;
    }

    // Добавить новый адрес
    addAddress(contractType: keyof ContractConfig, address: string, note: string): void {
        this._config[contractType].addresses.push({ address, note });
    }

    // Удалить адрес по индексу
    removeAddress(contractType: keyof ContractConfig, index: number): boolean {
        const contract = this._config[contractType];
        if (index >= 0 && index < contract.addresses.length) {
            contract.addresses.splice(index, 1);
            // Корректируем currentIndex если нужно
            if (contract.currentIndex >= contract.addresses.length) {
                contract.currentIndex = Math.max(0, contract.addresses.length - 1);
            }
            return true;
        }
        return false;
    }

    // Обновить адрес по индексу
    updateAddress(contractType: keyof ContractConfig, index: number, address: string, note: string): boolean {
        const contract = this._config[contractType];
        if (index >= 0 && index < contract.addresses.length) {
            contract.addresses[index] = { address, note };
            return true;
        }
        return false;
    }

    // Получить всю конфигурацию
    getFullConfig(): ContractConfig {
        return { ...this._config };
    }

    // Обновить всю конфигурацию
    updateFullConfig(newConfig: ContractConfig): void {
        this._config = newConfig;
    }

    // Проверить есть ли адреса для типа контракта
    hasAddresses(contractType: keyof ContractConfig): boolean {
        return this._config[contractType].addresses.length > 0;
    }

    // Получить количество адресов
    getAddressesCount(contractType: keyof ContractConfig): number {
        return this._config[contractType].addresses.length;
    }
}

// Тип для контекста
export interface ContractContextType {
    manager: ContractManager;
    tournament: ReturnType<ContractManager['getContract']>;
    user: ReturnType<ContractManager['getContract']>;
    server: ReturnType<ContractManager['getContract']>;
    switchTournamentAddress: (index: number) => void;
    switchUserAddress: (index: number) => void;
    switchServerAddress: (index: number) => void;
    addTournamentAddress: (address: string, note: string) => void;
    addUserAddress: (address: string, note: string) => void;
    addServerAddress: (address: string, note: string) => void;
    removeTournamentAddress: (index: number) => void;
    removeUserAddress: (index: number) => void;
    removeServerAddress: (index: number) => void;
    updateTournamentAddress: (index: number, address: string, note: string) => void;
    updateUserAddress: (index: number, address: string, note: string) => void;
    updateServerAddress: (index: number, address: string, note: string) => void;
    saveConfig: () => Promise<void>;
    reloadConfig: () => Promise<void>;
}

// Создаём контекст
export const ContractContext = createContext<ContractContextType | undefined>(undefined);

// Провайдер контекста
interface ContractProviderProps {
    children: ReactNode;
    initialConfig?: ContractConfig;
}

export const ContractProvider: React.FC<ContractProviderProps> = ({
    children,
    initialConfig
}) => {
    const [manager, setManager] = useState<ContractManager | null>(null);
    const [, setUpdateTrigger] = useState(0);
    const lang = useAtomValue(languageAtom)

    // Форсируем обновление
    const forceUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    // Загрузка конфигурации
    const loadConfig = useCallback(async () => {
        const config = await loadContractConfig();
        const newManager = new ContractManager(initialConfig || config);
        setManager(newManager);
    }, [initialConfig]);

    // Сохранение конфигурации
    const saveConfig = useCallback(async () => {
        if (manager) {
            await saveContractConfig(manager.getFullConfig());
            toast.success(i18n.t("settingsSaved"))
        }
    }, [manager]);

    // Перезагрузка конфигурации
    const reloadConfig = useCallback(async () => {
        await loadConfig();
    }, [loadConfig]);

    // Инициализация
    useEffect(() => {
        loadConfig();
    }, [loadConfig, lang]);

    // Создаём обёртки для методов с автосохранением и обновлением UI
    const createContractWrapper = useCallback((contractType: keyof ContractConfig) => {
        const switchAddress = (index: number) => {
            if (manager && manager.switchToAddress(contractType, index)) {
                forceUpdate();
            }
        };

        const addAddress = (address: string, note: string) => {
            if (manager) {
                manager.addAddress(contractType, address, note);
                forceUpdate();
            }
        };

        const removeAddress = (index: number) => {
            if (manager) {
                manager.removeAddress(contractType, index);
                forceUpdate();
            }
        };

        const updateAddress = (index: number, address: string, note: string) => {
            if (manager) {
                manager.updateAddress(contractType, index, address, note);
                forceUpdate();
            }
        };

        return { switchAddress, addAddress, removeAddress, updateAddress };
    }, [manager, saveConfig, forceUpdate]);

    if (!manager) {
        return null; // или лоадер
    }

    const tournamentWrapper = createContractWrapper('tournament');
    const userWrapper = createContractWrapper('user');
    const serverWrapper = createContractWrapper('server');

    const contextValue: ContractContextType = {
        manager,
        tournament: manager.getContract('tournament'),
        user: manager.getContract('user'),
        server: manager.getContract('server'),
        switchTournamentAddress: tournamentWrapper.switchAddress,
        switchUserAddress: userWrapper.switchAddress,
        switchServerAddress: serverWrapper.switchAddress,
        addTournamentAddress: tournamentWrapper.addAddress,
        addUserAddress: userWrapper.addAddress,
        addServerAddress: serverWrapper.addAddress,
        removeTournamentAddress: tournamentWrapper.removeAddress,
        removeUserAddress: userWrapper.removeAddress,
        removeServerAddress: serverWrapper.removeAddress,
        updateTournamentAddress: tournamentWrapper.updateAddress,
        updateUserAddress: userWrapper.updateAddress,
        updateServerAddress: serverWrapper.updateAddress,
        saveConfig,
        reloadConfig
    };

    return (
        <ContractContext.Provider value={contextValue}>
            {children}
        </ContractContext.Provider>
    );
};