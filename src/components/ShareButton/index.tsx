import Button from "../Button";
import { useApi } from "@/hooks/useApi";
import { Link } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export function ShareButton({ type, id, className }: { type: "profile"|"tournament"|"leaderboard"|"match"; id?: string | number; className?: string }) {
  const { t } = useTranslation()
  const { api } = useApi()

  const copyToClipboard = async () => {
    const link = `${api.deeplink}${type}/${id}`
    await navigator.clipboard.writeText(link);
    toast.success(t("copied"))
  };

  return <Button onClick={copyToClipboard} className={className} stroke><Link size={28} color="var(--fg)" /></Button>
}