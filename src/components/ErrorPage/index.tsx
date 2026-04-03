import { useTranslation } from "react-i18next";

type ErrorPageProps = {
    className?: string;
    message?: string;
}

export default function ErrorPage({ className, message }:ErrorPageProps) {
    const { t } = useTranslation();
    return (
      <div className={["container", className].join(" ")}>
        <h1 className="title wait">{message || t("registerFirst")}</h1>
      </div>
    )
}