import { useCallback, useEffect, useRef, useState } from "react";
import { Users, Eye, Calendar, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@/components/Button";
import Section from "@/components/Section";
import InputText from "@/components/InputText";
import styles from "./Stream.module.css";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/utils/helpers";
import { useAtomValue } from "jotai";
import { languageAtom } from "@/store";

interface StreamInfo {
  id: string;
  name: string;
  viewerCount: number;
  startedAt: string;
  broadcaster: string;
}

interface StreamListProps {
  onSelectStream: (streamId: string) => void;
  onStartNewStream?: () => void;
}

export function StreamList({
  onSelectStream,
  onStartNewStream,
}: StreamListProps) {
  const { t } = useTranslation();
  const { api } = useApi()
  const lang = useAtomValue(languageAtom)
  const [streams, setStreams] = useState<StreamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [customStreamId, setCustomStreamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  // @ts-ignore
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      const ws = new WebSocket(api.ws);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        setLoading(false);
        setError(null);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              setClientId(data.payload.clientId);
              break;

            case 'stream_list':
              setStreams(data.payload || []);
              setLoading(false);
              break;

            case 'stream_start':
              setStreams(prev => [...prev, data.payload]);
              break;

            case 'stream_end':
              setStreams(prev => prev.filter(s => s.id !== data.payload.streamId));
              break;

            case 'error':
              console.error('Server error:', data.payload.message);
              setError(data.payload.message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (isMountedRef.current) {
          setIsConnected(false);
          setError('Connection error');
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;

        setIsConnected(false);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      if (isMountedRef.current) {
        setError('Failed to connect to stream server');
        setLoading(false);
      }
    }
  }, [api.ws]);

  // Подписка на получение обновлений стримов
  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Регистрация как зритель при выборе стрима - с защитой от дублирования
  const joinStream = useCallback((streamId: string) => {
    if (isJoining) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setIsJoining(true);

      wsRef.current.send(JSON.stringify({
        type: 'register_viewer',
        streamId: streamId
      }));

      onSelectStream(streamId);

      // Сбрасываем флаг через 2 секунды
      setTimeout(() => {
        setIsJoining(false);
      }, 2000);
    } else {
      setError('Not connected to stream server');
    }
  }, [onSelectStream, isJoining]);

  const connectToCustomStream = () => {
    if (customStreamId.trim()) {
      joinStream(customStreamId.trim());
      setCustomStreamId("");
      setError(null);
    } else {
      setError(t("enterStreamId"));
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 1) return t("justNow");
    if (diff < 60) return `${diff} ${t("minutesAgo")}`;
    return formatDate(date, lang);
  };

  if (loading) {
    return (
      <Section title={t("liveStreams")}>
        <div className={styles.loadingStreams}>
          <div className={styles.spinner} />
          {t("loadingStreams")}
        </div>
      </Section>
    );
  }

  return (
    <Section title={t("liveStreams")}>
      {/* Статус подключения */}
      <div className={styles.connectionStatus}>
        <span className={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? '🟢 ' + t('connected') : '🔴 ' + t('reconnecting')}
        </span>
        {clientId && (
          <span className={styles.clientId}>
            ID: {clientId.slice(-8)}
          </span>
        )}
      </div>

      {/* Подключение по ID стрима */}
      <div className={styles.customConnect}>
        <InputText
          placeholder={t("enterStreamId")}
          value={customStreamId}
          setValue={setCustomStreamId}
          onKeyDown={(e) => e.key === "Enter" && connectToCustomStream()}
        />
        <Button style={{ width: "100%" }} onClick={connectToCustomStream} stroke disabled={!isConnected || isJoining}>
          <Eye size={18} />
          {t("connect")}
        </Button>
        {error && <span className={styles.error}>{error}</span>}
      </div>

      {/* Список активных стримов */}
      {streams.length > 0 && (
        <div className={styles.streamsList}>
          {streams.map((stream) => (
            <div
              key={stream.id}
              className={styles.streamCard}
              onClick={() => joinStream(stream.id)}
            >
              <div className={styles.streamThumbnail}>
                <div className={styles.thumbnailPlaceholder}>
                  <Eye size={24} />
                </div>
                <div className={styles.viewerBadge}>
                  <Users size={12} />
                  <span>{stream.viewerCount}</span>
                </div>
              </div>

              <div className={styles.streamInfo}>
                <div className={styles.streamTitle}>{stream.name}</div>
                <div className={styles.streamMeta}>
                  <span className={styles.broadcasterName}>
                    {stream.broadcaster}
                  </span>
                  <span>•</span>
                  <Calendar size={12} />
                  <span className={styles.streamTime}>{formatTime(stream.startedAt)}</span>
                </div>
              </div>

              <Button className={styles.watchBtn} disabled={isJoining}>
                {isJoining ? t("connecting") : t("watch")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.emptyStreams}>
        <p>{t("noActiveStreams")}</p>
        {onStartNewStream && (
          <Button
            onClick={onStartNewStream}
            className={styles.startStreamBtn}
          >
            <Plus size={18} />
            {t("startStream")}
          </Button>
        )}
      </div>

      {/* Статус WebSocket соединения */}
      {!isConnected && (
        <div className={styles.reconnectingHint}>
          <p>{t("reconnectingToServer")}</p>
        </div>
      )}
    </Section>
  );
}