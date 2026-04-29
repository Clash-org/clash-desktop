import { blockchainAtom } from '@/store';
import { ethers, Overrides } from 'ethers';
import { useAtomValue } from 'jotai';
import useSWR, { mutate } from 'swr';
import { useContracts } from './useContracts';
import { ContractConfig } from '@/providers/ContractProvider';
import { useApi } from './useApi';

export function useContract(type: keyof ContractConfig) {
  const userData = useAtomValue(blockchainAtom)
  const { manager } = useContracts()
  const { rpc } = useApi()

  const provider = new ethers.JsonRpcProvider(rpc);
  const signer = new ethers.Wallet(userData.privateKey, provider);
  const contractData = manager.getContract(type);
  const contract = new ethers.Contract(contractData.address, contractData.abi, signer);
  const fetcher = async (method: string, ...args: any[]) => {
    try {
      const result = await contract[method](...args);
      return result;
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      throw error;
    }
  };

  const useContractQuery = <T = any>(
    method: string,
    args?: any[],
    options?: {
      refreshInterval?: number;
      shouldFetch?: boolean;
    }
  ) => {
    return useSWR<T>(
      [method, args],
      () => fetcher(method, ...(args || [])),
      {
        revalidateOnFocus: false,
        refreshInterval: options?.refreshInterval,
        isPaused: () => options?.shouldFetch === false,
      }
    );
  };

async function mutateData<T = any>(
  method: string,
  args: any[] = [],
  invalidateKeys?: string | string[],
  overrides?: Overrides
): Promise<T> {
    try {
      const callArgs = overrides ? [...args, overrides] : args;
      const result = await contract[method](...callArgs) as T;

      if (invalidateKeys) {
        const keys = Array.isArray(invalidateKeys)
          ? invalidateKeys
          : [invalidateKeys];

        await Promise.all(keys.map(key => mutate(key)));
      }

      return result;
    } catch (error) {
      console.error(`Mutation error (${method}):`, error);
      throw error;
    }
  };

  return {
    useContractQuery,
    mutateData,
    contract,
    provider,
    address: signer.address,
  }
}