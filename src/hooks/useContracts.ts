import { useContext } from "react";
import { ContractContext, ContractContextType } from "@/providers/ContractProvider";

// Основной хук для работы с контрактами
export const useContracts = (): ContractContextType => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error('useContracts must be used within a ContractProvider');
    }
    return context;
};

// Хук для получения конкретного контракта
export const useContract = <T extends keyof ContractContextType>(
    contractType: 'tournament' | 'user' | 'server'
) => {
    const { manager } = useContracts();
    return manager.getContract(contractType);
};

// Хук для получения текущего адреса контракта
export const useContractAddress = (contractType: 'tournament' | 'user' | 'server'): string => {
    const { manager } = useContracts();
    return manager.getCurrentAddress(contractType);
};

// Хук для переключения адресов
export const useContractSwitcher = (contractType: 'tournament' | 'user' | 'server') => {
    const {
        switchTournamentAddress,
        switchUserAddress,
        switchServerAddress
    } = useContracts();

    const switchers = {
        tournament: switchTournamentAddress,
        user: switchUserAddress,
        server: switchServerAddress
    };

    return switchers[contractType];
};

// Хук для управления адресами
export const useContractManager = (contractType: 'tournament' | 'user' | 'server') => {
    const {
        manager,
        addTournamentAddress,
        addUserAddress,
        addServerAddress,
        removeTournamentAddress,
        removeUserAddress,
        removeServerAddress,
        updateTournamentAddress,
        updateUserAddress,
        updateServerAddress
    } = useContracts();

    const adders = {
        tournament: addTournamentAddress,
        user: addUserAddress,
        server: addServerAddress
    };

    const removers = {
        tournament: removeTournamentAddress,
        user: removeUserAddress,
        server: removeServerAddress
    };

    const updaters = {
        tournament: updateTournamentAddress,
        user: updateUserAddress,
        server: updateServerAddress
    };

    return {
        addresses: manager.getAllAddresses(contractType),
        currentIndex: manager.getFullConfig()[contractType].currentIndex,
        addAddress: adders[contractType],
        removeAddress: removers[contractType],
        updateAddress: updaters[contractType]
    };
};