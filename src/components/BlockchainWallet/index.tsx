import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { blockchainAtom } from "@/store";
import { useTranslation } from "react-i18next";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { Copy, Check, Wallet, Key, Eye, EyeOff, LogOut, RefreshCw } from "lucide-react";
import Section from "@/components/Section";
import Button from "@/components/Button";
import InputText from "@/components/InputText";
import styles from "./index.module.css";
import { RPC_URL } from "@/constants";
import Checkbox from "../Checkbox";
import { storage } from "@/utils/storage";

export function BlockchainWallet() {
  const { t } = useTranslation();
  const [blockchainData, setBlockchainData] = useAtom(blockchainAtom);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [copied, setCopied] = useState<"address" | "privateKey" | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isImportPrivatekey, setIsImportPrivatekey] = useState(false)
  const [isSavePrivatekey, setIsSavePrivatekey] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [isPrivateKeyInSettings, setIsPrivateKeyInSettings] = useState(false)

  // Загрузка баланса и информации о сети
  useEffect(() => {
    if (blockchainData.wallet && blockchainData.privateKey) {
      fetchBalance();
      fetchNetwork();
    }
  }, [blockchainData.wallet, blockchainData.privateKey]);

  useEffect(()=>{
    storage.has("privateKey").then(res=>setIsPrivateKeyInSettings(res))
  }, [])

  const fetchBalance = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const balanceWei = await provider.getBalance(blockchainData.wallet);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    }
  };

  const fetchNetwork = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const network = await provider.getNetwork();
      setNetwork(`${network.name || "Unknown"} (${Number(network.chainId)})`);
    } catch (error) {
      console.error("Failed to fetch network:", error);
      setNetwork(null);
    }
  };

  const copyToClipboard = async (text: string, type: "address" | "privateKey") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast.success(t("copied"));
  };

  const importPrivateKey = async () => {
    if (!privateKey) return;

    try {
      const wallet = new ethers.Wallet(privateKey);
      setBlockchainData({
        wallet: wallet.address,
        privateKey: privateKey,
      });
      if (isSavePrivatekey) {
        await storage.set("privateKey", privateKey)
      }
      toast.success(t("walletImported"));
    } catch (error) {
      toast.error(t("invalidPrivateKey"));
    }
  };

  const disconnectWallet = () => {
    setBlockchainData({
      wallet: "",
      privateKey: "",
    });
    setBalance(null);
    setNetwork(null);
    toast.success(t("walletDisconnected"));
  };

  return (
    <Section title={t("cryptoWallet")}>
      <div className={styles.walletContainer}>
        {/* Статус подключения */}
        <div className={styles.statusRow}>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${blockchainData.wallet ? styles.connected : styles.disconnected}`} />
            <span className={styles.statusText}>
              {blockchainData.wallet ? t("connected") : t("notConnected")}
            </span>
          </div>
          {network && (
            <div className={styles.networkInfo}>
              <span className={styles.networkLabel}>{t("network")}:</span>
              <span className={styles.networkValue}>{network}</span>
            </div>
          )}
        </div>

        {/* Адрес кошелька */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Wallet size={16} />
            <span>{t("walletAddress")}</span>
          </label>
          <div className={styles.inputWithButton}>
            <InputText
              value={blockchainData.wallet || ""}
              type={showWallet ? "text" : "password"}
              className={styles.walletInput}
              disabled
            />
            <button
              onClick={() => setShowWallet(!showWallet)}
              className={styles.copyBtn}
            >
              {showWallet ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {blockchainData.wallet && (
              <button
                onClick={() => copyToClipboard(blockchainData.wallet, "address")}
                className={styles.copyBtn}
              >
                {copied === "address" ? <Check size={18} /> : <Copy size={18} />}
              </button>
            )}
          </div>
          {blockchainData.wallet && (
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>{t("balance")}:</span>
              <span className={styles.balanceValue}>
                {balance !== null ? `${balance} ETH` : t("loading")}
              </span>
              <button onClick={fetchBalance} className={styles.refreshBtn}>
                <RefreshCw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Приватный ключ */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Key size={16} />
            <span>{t("privateKey")}</span>
          </label>
          <div className={styles.inputWithButton}>
            <InputText
              value={blockchainData.privateKey || ""}
              type={showPrivateKey ? "text" : "password"}
              className={styles.walletInput}
              disabled
            />
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className={styles.copyBtn}
            >
              {showPrivateKey ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {blockchainData.privateKey && (
              <button
                onClick={() => copyToClipboard(blockchainData.privateKey, "privateKey")}
                className={styles.copyBtn}
              >
                {copied === "privateKey" ? <Check size={18} /> : <Copy size={18} />}
              </button>
            )}
          </div>
        </div>

        <Checkbox title={t("savePrivateKey")} value={isSavePrivatekey} setValue={setIsSavePrivatekey} />
        {isPrivateKeyInSettings &&
        <Button title={t("deletePrivateKey")} onClick={async ()=>{await storage.delete("privateKey"); toast.success(t("settingsSaved"))}} stroke />
        }

        {isImportPrivatekey &&
        <InputText placeholder={t("privateKey")} value={privateKey} setValue={setPrivateKey} />
        }

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <Button
            onClick={isImportPrivatekey ? importPrivateKey : ()=>setIsImportPrivatekey(true)}
            stroke
            className={styles.actionBtn}
          >
            <Key size={18} />
            {t("importPrivateKey")}
          </Button>

          {blockchainData.wallet && (
            <Button
              onClick={disconnectWallet}
              stroke
              className={`${styles.actionBtn} ${styles.disconnectBtn}`}
            >
              <LogOut size={18} />
              {t("disconnect")}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}