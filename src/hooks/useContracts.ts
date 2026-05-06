import { useContext } from "react";
import { ContractConfig, ContractContext, ContractContextType } from "@/providers/ContractProvider";

// Основной хук для работы с контрактами
export const useContracts = (): ContractContextType => {
    const context = useContext(ContractContext);
    if (!context) {
        throw new Error('useContracts must be used within a ContractProvider');
    }
    return context;
};

// Хук для получения текущего адреса контракта
export const useContractAddress = (contractType: keyof ContractConfig): string => {
    const { manager } = useContracts();
    return manager.getCurrentAddress(contractType);
};