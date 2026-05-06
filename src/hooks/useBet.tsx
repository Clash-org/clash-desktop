import { useContract } from './useContract';

export function useBet() {
  const { useContractQuery, mutateData, contract, address, provider } = useContract("bet");

  // =========================== WRITE FUNCTIONS ===========================

  const createFight = async (fighterRed: string, fighterBlue: string, fighterStake: bigint, spectatorStake: bigint) => {
    return mutateData('createFight', [fighterRed, fighterBlue, fighterStake, spectatorStake], 'nextFightId');
  };

  const payFighterStake = async (fightId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    const fightInfo = await contract.getFightInfo(fightId);
    const stakeAmount = fightInfo.fighterStake;
    return mutateData('payFighterStake', [fightId], [`getFightInfo`], { value: stakeAmount });
  };

  const placeBet = async (fightId: number, fighterId: 0 | 1) => {
    if (!contract) throw new Error("Contract not initialized");
    const fightInfo = await contract.getFightInfo(fightId);
    const stakeAmount = fightInfo.spectatorStake;
    return mutateData('placeBet', [fightId, fighterId], [`getFightInfo`], { value: stakeAmount });
  };

  const closeBetting = async (fightId: number) => {
    return mutateData('closeBetting', [fightId], [`getFightInfo`]);
  };

  const fightEnd = async (fightId: number, scoreRed: number, scoreBlue: number) => {
    return mutateData('fightEnd', [fightId, scoreRed, scoreBlue], [`getFightInfo`]);
  };

  // =========================== VIEW FUNCTIONS ===========================

  const getFightInfo = async (fightId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    return contract.getFightInfo(fightId);
  };

  const getBetsCount = async (fightId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    return contract.getBetsCount(fightId);
  };

  const getBetInfo = async (fightId: number, betId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    return contract.getBetInfo(fightId, betId);
  };

  const getFighterId = async (fightId: number, wallet: string) => {
    if (!contract) throw new Error("Contract not initialized");
    return contract.getFighterId(fightId, wallet);
  };

  const getSpectatorWalletsCount = async (fightId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    return contract.getSpectatorWalletsCount(fightId);
  };

  const getFightInfoFormatted = async (fightId: number) => {
    if (!contract) throw new Error("Contract not initialized");
    const info = await contract.getFightInfo(fightId);
    return {
      judge: info[0],
      fighterRed: info[1],
      fighterBlue: info[2],
      fighterStake: info[3],
      spectatorStake: info[4],
      started: info[5],
      withdrawn: info[6],
      isDraw: info[7],
      totalSpectatorPool: info[8]
    };
  };

  // =========================== EVENT LISTENERS ===========================

  const onFightCreated = (callback: (fightId: bigint, judge: string) => void) => {
    if (!contract) return () => {};
    contract.on("FightCreated", callback);
    return () => {
      contract.off("FightCreated", callback);
    };
  };

  const onFightersRegistered = (callback: (fightId: bigint, fighterRed: string, fighterBlue: string) => void) => {
    if (!contract) return () => {};
    contract.on("FightersRegistered", callback);
    return () => {
      contract.off("FightersRegistered", callback);
    };
  };

  const onFighterPaid = (callback: (fightId: bigint, fighter: string, fighterId: number, amount: bigint) => void) => {
    if (!contract) return () => {};
    contract.on("FighterPaid", callback);
    return () => {
      contract.off("FighterPaid", callback);
    };
  };

  const onSpectatorBet = (callback: (fightId: bigint, spectator: string, fighterId: number, amount: bigint, betId: bigint) => void) => {
    if (!contract) return () => {};
    contract.on("SpectatorBet", callback);
    return () => {
      contract.off("SpectatorBet", callback);
    };
  };

  const onFightResult = (callback: (fightId: bigint, winnerId: number, isDraw: boolean) => void) => {
    if (!contract) return () => {};
    contract.on("FightResult", callback);
    return () => {
      contract.off("FightResult", callback);
    };
  };

  const onWinningsClaimed = (callback: (fightId: bigint, claimant: string, amount: bigint, isFighter: boolean) => void) => {
    if (!contract) return () => {};
    contract.on("WinningsClaimed", callback);
    return () => {
      contract.off("WinningsClaimed", callback);
    };
  };

  const onRefunded = (callback: (fightId: bigint, user: string, amount: bigint, reason: string) => void) => {
    if (!contract) return () => {};
    contract.on("Refunded", callback);
    return () => {
      contract.off("Refunded", callback);
    };
  };

  return {
    // SWR хук для запросов
    useContractQuery,
    // Мутация данных
    mutateData,
    // Контракт и провайдер
    contract,
    provider,
    address,
    // Write функции
    createFight,
    payFighterStake,
    placeBet,
    closeBetting,
    fightEnd,
    // View функции
    getFightInfo,
    getFightInfoFormatted,
    getBetsCount,
    getBetInfo,
    getFighterId,
    getSpectatorWalletsCount,
    // Event listeners
    onFightCreated,
    onFightersRegistered,
    onFighterPaid,
    onSpectatorBet,
    onFightResult,
    onWinningsClaimed,
    onRefunded,
  };
}