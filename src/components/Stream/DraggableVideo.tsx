import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Wifi,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApi } from "@/hooks/useApi";
import styles from "./DraggableVideo.module.css";
import { generateId } from "@/utils/helpers";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { STUN_SERVERS } from "@/constants";

interface DraggableVideoProps {
  streamId?: string;
  streamName?: string;
  onClose: () => void;
  isOpen: boolean;
}

export function DraggableVideo({
  streamId,
  streamName,
  onClose,
  isOpen,
}: DraggableVideoProps) {
  const { t } = useTranslation();
  const { api } = useApi();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isWebRtcConnected, setIsWebRtcConnected] = useState(false);

  const getInitPosition = () => {
    const width = 400; // ширина вашего окна
    const height = 300; // примерная высота (можно уточнить)
    return {
      x: (window.innerWidth - width) / 2,
      y: (window.innerHeight - height) / 2,
    };
  }
  const [position, setPosition] = useState(getInitPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // @ts-ignore
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const hasReceivedFirstFrame = useRef(false);
  const streamIdRef = useRef<string | undefined>(streamId);
  const activeRef = useRef(true);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const instanceId = useRef(generateId("viewer"))
  const [isInitiating, setIsInitiating] = useState(false);

  const appWindow = getCurrentWindow();

  // Конфигурация WebRTC
  const rtcConfig: RTCConfiguration = {
    iceServers: STUN_SERVERS,
  };

  // Обработка ICE кандидатов
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current?.remoteDescription) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    } else {
      pendingIceCandidatesRef.current.push(candidate);
    }
  }, []);

  // Закрытие WebRTC соединения
  const closeWebRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
    setIsWebRtcConnected(false);
  }, []);

  // Закрытие WebSocket соединения
  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsWsConnected(false);
  }, []);

  // Инициализация WebRTC соединения (создание offer)
  const initiateWebRTC = useCallback(async () => {
    if (!streamIdRef.current || !activeRef.current || isInitiating) return;
    setIsInitiating(true);
    try {
      setConnectionError(null);
      closeWebRTC();

      const peerConnection = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (videoRef.current && event.streams[0] && activeRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setIsWebRtcConnected(true);

          // Добавляем обработчик первого кадра
          videoRef.current.onloadeddata = () => {
            if (!hasReceivedFirstFrame.current) {
              hasReceivedFirstFrame.current = true;
            }
          };
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN && activeRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'ice_candidate',
            payload: event.candidate,
            streamId: streamIdRef.current
          }));
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setIsWebRtcConnected(true);
          // WebRTC установлен - закрываем WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
        } else if (peerConnection.connectionState === 'failed') {
          setConnectionError(t('connectionFailed'));
          setIsWebRtcConnected(false);
        }
      };

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          payload: offer,
          streamId: streamIdRef.current
        }));
      }

    } catch (error) {
      console.error('WebRTC connection error:', error);
      setConnectionError(t('connectionFailed'));
    } finally {
      setIsInitiating(false);
    }
  }, [rtcConfig, t, closeWebRTC, isInitiating]);

  // Обработка answer от стримера
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection for answer');
      return;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      for (const candidate of pendingIceCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingIceCandidatesRef.current = [];

    } catch (error) {
      console.error('Failed to set answer:', error);
    }
  }, []);

  // Подключение к WebSocket серверу
  const connectWebSocket = useCallback(() => {
    if (!streamIdRef.current) {
      return;
    }

    if (reconnectAttemptsRef.current > 5) {
      console.error('Max reconnection attempts reached');
      setConnectionError('Unable to connect to stream server');
      return;
    }

    try {
      const ws = new WebSocket(api.ws);
      wsRef.current = ws;

      ws.onopen = () => {
        // Если WebRTC уже активен, НЕ НАДО ничего делать
        if (isWebRtcConnected || peerConnectionRef.current?.connectionState === 'connected') {
          ws.close();
          return;
        }

        setIsWsConnected(true);
        reconnectAttemptsRef.current = 0;

        if (activeRef.current && streamIdRef.current) {
          ws.send(JSON.stringify({
            type: 'register_viewer',
            streamId: streamIdRef.current,
            viewerId: instanceId.current
          }));
        }
      };

      ws.onmessage = async (event) => {
        if (!activeRef.current) return;

        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              break;

            case 'viewer_registered':
              streamIdRef.current = data.payload.streamId;
              await initiateWebRTC();
              break;

            case 'answer':
              await handleAnswer(data.payload);
              break;

            case 'ice_candidate':
              await addIceCandidate(data.payload);
              break;

            case 'stream_ended':
              setConnectionError(t('streamEnded'));
              setTimeout(() => onClose(), 3000);
              break;

            case 'error':
              console.error('Server error:', data.payload?.message);
              setConnectionError(data.payload?.message);
              break;
          }
        } catch (err) {
          console.error('Parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!isWebRtcConnected) {
          setIsWsConnected(false);
        }
      };

      ws.onclose = (event) => {
        setIsWsConnected(false);

        // ВАЖНО: НЕ ПЕРЕПОДКЛЮЧАЕМСЯ, ЕСЛИ ВИДЕО УЖЕ ИДЁТ ИЛИ ВЫХОДИМ ИЗ FULLSCREEN
        if (activeRef.current && streamIdRef.current && !connectionError && !isWebRtcConnected && !isFullscreen) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(3000 * reconnectAttemptsRef.current, 15000);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (activeRef.current && !isWebRtcConnected && !isFullscreen) {
              connectWebSocket();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnectionError('Failed to connect to server');
    }
  }, [api.ws, onClose, t, initiateWebRTC, handleAnswer, addIceCandidate]);

  // Закрытие соединений
  const cleanup = useCallback(() => {
    activeRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      // @ts-ignore
      reconnectTimeoutRef.current = undefined;
    }

    closeWebRTC();
    closeWebSocket();

    reconnectAttemptsRef.current = 0;
    setIsWsConnected(false);
    setIsWebRtcConnected(false);
    setConnectionError(null);
  }, [closeWebRTC, closeWebSocket]);

  // Запуск при открытии
  useEffect(() => {
    if (isOpen && streamId) {
      activeRef.current = true;
      streamIdRef.current = streamId;
      reconnectAttemptsRef.current = 0;
      setConnectionError(null);

      const timer = setTimeout(() => {
        if (activeRef.current && isOpen) {
          connectWebSocket();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, streamId, connectWebSocket]);

  // При закрытии компонента
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }

    return () => {
      if (!isOpen) {
        cleanup();
      }
    };
  }, [isOpen, cleanup]);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      // Сохраняем streamId перед fullscreen
      const savedStreamId = streamIdRef.current;

      // Очищаем текущее соединение
      cleanup();

      await appWindow.setFullscreen(true);
      setIsFullscreen(true);

      // Пересоздаём соединение
      if (savedStreamId) {
        setTimeout(() => {
          activeRef.current = true;
          streamIdRef.current = savedStreamId;
          setConnectionError(null);
          connectWebSocket();
        }, 500);
      }
    } else {
      // Сохраняем streamId перед выходом из fullscreen
      const savedStreamId = streamIdRef.current;

      // Очищаем текущее соединение
      cleanup();

      await appWindow.setFullscreen(false);
      setIsFullscreen(false);
      setPosition(getInitPosition());

      // Пересоздаём соединение
      if (savedStreamId) {
        setTimeout(() => {
          activeRef.current = true;
          streamIdRef.current = savedStreamId;
          setConnectionError(null);
          connectWebSocket();
        }, 500);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const copyStreamId = () => {
    if (streamId) {
      navigator.clipboard.writeText(streamId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Только при клике на иконку
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setPosition({
      x: newX,
      y: newY,
    });
  }, [isDragging, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      // Если окно не в полноэкранном режиме, обновляем позицию
      if (!isFullscreen && containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setPosition({
          x: (window.innerWidth - width) / 2,
          y: (window.innerHeight - height) / 2,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);


  if (!isOpen) return null;

  const videoElement = (
    <div
      ref={containerRef}
      className={`${styles.draggableVideo} ${isFullscreen ? styles.fullscreen : ""}`}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: isFullscreen ? '100vw' : '400px',
        height: isFullscreen ? '100vh' : 'auto',
        background: '#1a1a1a',
        borderRadius: isFullscreen ? 0 : '12px',
        zIndex: 9999,
      }}
    >
      <div className={styles.videoHeader}
        data-drag-handle
        onMouseDown={isFullscreen ? undefined : handleMouseDown}
        style={isFullscreen ? undefined : { cursor: isDragging ?  'grabbing' : 'grab' }}
      >
          {!isFullscreen && <GripVertical size={18} className={styles.gripIcon} />}
        <span className={styles.videoTitle}>
          {streamName || t("stream")}
          {streamId && (
            <span
              className={styles.streamId}
              onClick={copyStreamId}
            >
              {isCopied ? <Check size={12} /> : <Copy size={12} />}
              <span>{streamId.slice(-8)}</span>
            </span>
          )}
        </span>
        <div className={styles.headerButtons}>
          <button onClick={toggleMute} className={styles.headerBtn}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={toggleFullscreen} className={styles.headerBtn}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={styles.videoElement}
        />

        {!videoRef.current?.srcObject && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
            <span>{t("connectingToStream")}</span>
            <div className={styles.connectionDetails}>
              {!isWsConnected && <div>🔌 Connecting to server...</div>}
              {isWsConnected && !isWebRtcConnected && <div>📡 Establishing WebRTC...</div>}
            </div>
          </div>
        )}

        {connectionError && videoRef.current?.srcObject && (
          <div className={styles.errorOverlay}>
            <span>{connectionError}</span>
            <button
              onClick={() => {
                cleanup();
                if (streamId) connectWebSocket();
              }}
              className={styles.retryBtn}
            >
              {t("retry")}
            </button>
          </div>
        )}
      </div>

      <div className={styles.videoFooter}>
        <span className={styles.liveBadge}>LIVE</span>
        {isWebRtcConnected && (
          <span className={styles.connectionBadge}>
            <Wifi size={12} />
            <span>P2P</span>
          </span>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(videoElement, document.body);
  }

  return videoElement;
}