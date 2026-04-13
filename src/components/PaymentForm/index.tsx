import { useEffect, useState } from 'react';
import { useServerRegistry } from '@/hooks/useServerRegistry';
import Button from '@/components/Button';
import ModalWindow from '@/components/ModalWindow';
import styles from './index.module.css';
import InputNumber from '../InputNumber';
import toast from 'react-hot-toast';
import { useApi } from '@/hooks/useApi';
import { useTranslation } from 'react-i18next';
import { NATIVE_CURRENCIES } from '@/constants';
import { Wallet } from 'lucide-react';
import { formatDate, parseContractError } from '@/utils/helpers';
import { useAtomValue } from 'jotai';
import { languageAtom } from '@/store';

export function PaymentForm() {
  const { t } = useTranslation();
  const { baseUrl } = useApi()
  const lang = useAtomValue(languageAtom)
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationMonths, setDurationMonths] = useState(1);
  const [token, setToken] = useState(NATIVE_CURRENCIES[137]);

  const {
    useServerByHost,
    getUserLastPayment,
    getServerStatus,
    getExpiresDate,
    payWithNative,
    requestRefund,
    getToken
  } = useServerRegistry();

  const { data: server, isLoading: serverLoading } = useServerByHost(baseUrl)
  const { isActive, status } = getServerStatus(server);
  const { data: payment, mutate: paymentMutate } = getUserLastPayment()
  const [expiresDate, setExpiresDate] = useState<Date|undefined>(payment?.expiresAt ? new Date(Number(payment?.expiresAt) * 1000) : undefined)
  const [refundAmount, setRefundAmount] = useState<string>()

  const handleConfirmPay = async () => {
    if (server) {
      setIsSubmitting(true);
      try {
        const paymentId = await payWithNative(Number(server.id), durationMonths);
        toast.success(t("paymentSuccess"));
        setShowConfirm(false);
        setExpiresDate(await getExpiresDate(paymentId))
        paymentMutate()
      } catch (error: any) {
        toast.error(parseContractError(error));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRefund = async () => {
    if (payment) {
      setIsSubmitting(true);
      try {
        const amount = await requestRefund(Number(payment.id))
        setRefundAmount(amount)
        setExpiresDate(undefined)
      } catch (error: any) {
        toast.error(parseContractError(error))
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const getStatusInfo = () => {
    switch (Number(status)) {
      case 0:
        return { label: 'ACTIVE', className: styles.statusActive };
      case 1:
        return { label: 'INACTIVE', className: styles.statusInactive };
      default:
        return { label: 'SUSPENDED', className: styles.statusInactive };
    }
  };

  const statusInfo = getStatusInfo();

  useEffect(()=>{
    getToken().then(res=>setToken(res)).catch(()=>setToken(NATIVE_CURRENCIES[137]))
  }, [])

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t("payServer")}</h2>

      {/* Server Info */}
      <div className={styles.serverInfo}>
        {server ? (
          <>
          <h3 className={styles.serverTitle}>{t("server")} #{server.id}</h3>
          <div className={styles.serverDetails}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>URL:</span>
              <span className={styles.infoValue}>{server.host}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("owner")}:</span>
              <span className={styles.infoValue}>{server.owner}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("status")}:</span>
              <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("price")}:</span>
              <span className={styles.infoValue}>{server.pricePerMonth} {token.symbol}</span>
            </div>
            {expiresDate &&
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t("serviceExpires")}:</span>
              <span className={styles.infoValue}>{formatDate(expiresDate, lang, true)}</span>
            </div>
            }
          </div>
          </>
        ) : (
          <p className={styles.errorText}>Server not found</p>
        )}
      </div>

      {/* Duration Months Input */}
      <div className={styles.field}>
        <span className={styles.label}>{t("durationMonths")}</span>
        <InputNumber
          value={durationMonths}
          setValue={setDurationMonths}
          min={1}
          placeholder="Duration Months"
          className={styles.full}
        />
      </div>

      {/* Pay Button */}
      <Button
        onClick={()=>setShowConfirm(true)}
        disabled={!isActive || serverLoading || isSubmitting}
        style={{ width: "100%" }}
      >
        {t("payServer")}
      </Button>

      {!!expiresDate &&
      <Button
        onClick={handleRefund}
        style={{ width: "100%", marginTop: "15px" }}
        disabled={serverLoading || isSubmitting}
      >
        {t("refundMoney")}
      </Button>
      }

      {/* Confirmation Modal */}
      <ModalWindow
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
      >
        <div className={styles.confirmContent}>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{t("serverId")}:</span>
            <span className={styles.confirmValue}>#{server?.id}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{t("network")}:</span>
            <span className={styles.confirmValue}>{token.network}</span>
          </div>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{t("price")}:</span>
            <span className={styles.confirmAmount}>{server?.pricePerMonth} {token.symbol}</span>
          </div>
          <div className={styles.confirmActions}>
            <Button
              onClick={handleConfirmPay}
              disabled={isSubmitting}
              className={styles.full}
            >
              <Wallet size={28} color="var(--fg)" />
            </Button>
          </div>
        </div>
      </ModalWindow>
      <ModalWindow isOpen={!!refundAmount} onClose={()=>setRefundAmount(undefined)}>
        <div className={styles.confirmContent}>
          <div className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{t("refundAmount")}:</span>
            <span className={styles.confirmValue}>{refundAmount}</span>
          </div>
        </div>
      </ModalWindow>
    </div>
  );
}