import { NATIVE_CURRENCIES } from '@/constants';
import { useContract } from './useContract';
import { ethers } from 'ethers';
import { useCallback } from 'react';
import { PaymentType, ServerType } from '@/typings';

export function useServerRegistry() {
  const { useContractQuery, mutateData, contract, address, provider } = useContract("server");
  // Query: Получение информации о сервере по имени хоста
  const getUserLastPayment = () => {
    return useContractQuery<PaymentType>(
      'getUserLastPayment',
      [address]
    );
  };

  // Query: Получение информации о сервере по имени хоста
  const useServerByHost = (host: string) => {
    return useContractQuery<ServerType>(
      'getServerByHost',
      [host]
    );
  };

  // Query: Получение информации о серверах по кошельку владельца
  const useServersIdsByOwner = (wallet: string) => {
    return useContractQuery<bigint[]>(
      'getOwnerServers',
      [wallet]
    );
  };

  // Query: Получение информации о сервере
  const useServer = (serverId: number) => {
    return useContractQuery<ServerType>(
      'servers',
      [serverId],
      { shouldFetch: serverId > 0 }
    );
  };

  // Query: Проверка статуса сервера
  const getServerStatus = (server: ServerType|undefined) => {
    return {
      isActive: Number(server?.status) === 0,
      isInactive: Number(server?.status) === 1,
      isSuspended: Number(server?.status) === 2,
      status: server?.status,
    };
  };

  // Query: Получение информации о токене сети
  const getToken = async () => {
    const network = await provider.getNetwork()
    const token = NATIVE_CURRENCIES[Number(network.chainId)]
    if (!token)
      throw new Error()
    return token
  }

  // Query: Получение даты конца аренды за сервер
  const getExpiresDate = async (paymentId: number) => {
    const payment = await contract.getPayment(paymentId);
    const date = new Date(Number(payment.expiresAt) * 1000)
    return date
  }

  // Mutation: payToServer (ETH)
  const payWithNative = useCallback(async (
    serverId: number,
    durationMonths: number
  ) => {
    // Сначала получаем цену сервера за месяц
    const server = await contract.servers(serverId);
    const pricePerMonth = server.pricePerMonth;
    const totalAmount = ethers.parseEther(`${pricePerMonth * BigInt(durationMonths)}`);

    const balance = await provider.getBalance(address);
    if (balance < totalAmount) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(totalAmount)} tokens`);
    }

    const result = await mutateData<ethers.TransactionResponse>(
      'payToServer',
      [serverId, durationMonths],
      [],
      { value: totalAmount, gasLimit: 500000 }
    );

    const receipt = await result.wait();
    // @ts-ignore
    return ethers.toNumber(receipt?.logs[0]?.topics[1]);
  }, [mutateData, contract]);

  // Mutation: activateServer
  const activateServer = useCallback(async (serverId: number) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'activateServer',
      [serverId]
    );
    await result.wait();
    return result;
  }, [mutateData]);

  // Mutation: deactivateServer
  const deactivateServer = useCallback(async (serverId: number) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'deactivateServer',
      [serverId]
    );
    await result.wait();
    return result;
  }, [mutateData]);

  // Mutation: requestRefund
  const requestRefund = useCallback(async (paymentId: number) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'requestRefund',
      [paymentId]
    );
    const receipt = await result.wait();
    // @ts-ignore
    return ethers.formatEther(receipt?.logs[0]?.topics[3]);
  }, [mutateData]);

  // Mutation: releaseDaily
  const releaseDaily = useCallback(async (serverId: number) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'releaseDaily',
      [serverId]
    );
    const receipt = await result.wait();
    // @ts-ignore
    return ethers.formatEther(receipt?.logs[0]?.topics[3]);
  }, [mutateData]);

  // Mutation: setServerPrice
  const setServerPrice = useCallback(async (serverId: number, pricePerMonth: number) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'setServerPrice',
      [serverId, pricePerMonth]
    );
    await result.wait();
    return result;
  }, [mutateData]);

  // Mutation: setServerHost
  const setServerHost = useCallback(async (serverId: number, host: string) => {
    const result = await mutateData<ethers.TransactionResponse>(
      'setServerHost',
      [serverId, host]
    );
    await result.wait();
    return result;
  }, [mutateData]);

  return {
    // Queries
    useServer,
    useServerByHost,
    getUserLastPayment,
    useServersIdsByOwner,
    // Mutations
    payWithNative,
    requestRefund,
    activateServer,
    deactivateServer,
    releaseDaily,
    // Utils
    getExpiresDate,
    getServerStatus,
    setServerPrice,
    setServerHost,
    getToken,
    address,
    contract,
  };
}