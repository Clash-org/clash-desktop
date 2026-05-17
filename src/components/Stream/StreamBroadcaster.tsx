import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Copy,
  Users,
  Wifi,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Button';
import Section from '@/components/Section';
import InputText from '@/components/InputText';
import { useApi } from '@/hooks/useApi';
import styles from './Stream.module.css';
import Select from '../Select';
import { STUN_SERVERS } from '@/constants';
import { useAtom } from 'jotai';
import { fightIdAtom, userAtom } from '@/store';
import InputNumber from '../InputNumber';
import ImageUploader from '../ImageUploader';
import Switch from '../Switch';
import toast from 'react-hot-toast';
import { useContractAddress } from '@/hooks/useContracts';

interface StreamBroadcasterProps {
  onStreamStop?: () => void;
  onStreamProcess: (isProcess: boolean) => void;
}

export function StreamBroadcaster({ onStreamStop, onStreamProcess }: StreamBroadcasterProps) {
  const { t } = useTranslation();
  const { api } = useApi();
  const [user] = useAtom(userAtom);
  const currentBetAddress = useContractAddress("bet")

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState('');
  const [streamName, setStreamName] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [broadcaster, setBroadcaster] = useState(user?.username || '');
  const [betAddress, setBetAddress] = useState(currentBetAddress);
  const [fightId, setFightId] = useAtom<number>(fightIdAtom);
  const [cover, setCover] = useState('');
  const [isStreamHidden, setIsStreamHidden] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const streamIdRef = useRef<string>('');

  const rtcConfig: RTCConfiguration = {
    iceServers: STUN_SERVERS,
  };

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(api.ws);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              break;

            case 'broadcast_registered':
              const newStreamId = data.payload.streamId;
              setStreamId(newStreamId);
              streamIdRef.current = newStreamId;
              break;

            case 'offer':
              await handleOffer(data.payload, data.fromId);
              break;

            case 'ice_candidate':
              await handleIceCandidate(data.payload);
              break;

            case 'viewer_joined':
            case 'viewer_left':
            case 'viewer_count_update':
              setViewerCount(data.payload.viewerCount);
              break;

            case 'error':
              console.error('Server error:', data.payload.message);
              setConnectionError(data.payload.message);
              break;
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionError('Connection error');
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setConnectionError('Failed to connect to server');
    }
  }, [api.ws]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // Предпросмотр камеры (только видео)
  const startPreview = useCallback(async () => {
    if (isStreaming) return;

    try {
      // Останавливаем старый поток
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start preview:', error);
    }
  }, [selectedCamera, isStreaming]);

  // Запуск предпросмотра при выборе камеры
  useEffect(() => {
    if (!isStreaming) {
      startPreview();
    }
  }, [selectedCamera, isStreaming, startPreview]);

  // Получение списка устройств
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        const mics = devices.filter(device => device.kind === 'audioinput');

        setAvailableCameras(cameras);
        setAvailableMics(mics);

        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
        if (mics.length > 0) setSelectedMic(mics[0].deviceId);
      } catch (error) {
        console.error('Failed to get devices:', error);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
  }, []);

  // Получение полного потока с аудио для трансляции
  const getFullStream = useCallback(async () => {
    // Останавливаем предпросмотр
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Создаем новый полный поток
    const constraints: MediaStreamConstraints = {
      video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    return stream;
  }, [selectedCamera, selectedMic]);

  // Обработка offer от зрителя
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromId: string) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'answer',
          payload: answer,
          toId: fromId,
          streamId: streamIdRef.current
        }));
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }, []);

  // Обработка ICE кандидата
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    }
  }, []);

  // Настройка WebRTC peer connection
  const setupPeerConnection = useCallback(async (stream: MediaStream) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    // Добавляем все треки из потока
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Обработка ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice_candidate',
          payload: event.candidate,
          streamId: streamIdRef.current
        }));
      }
    };

    // Отслеживаем состояние соединения
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'failed') {
        setConnectionError('WebRTC connection failed');
      }
    };

    return peerConnection;
  }, []);

  // Начать трансляцию
  const startStream = useCallback(async () => {
    if (!isConnected) {
      setConnectionError('Not connected to server');
      return;
    }

    try {
      // Создаем полный поток с видео и аудио
      const fullStream = await getFullStream();

      if (!fullStream || fullStream.getVideoTracks().length === 0) {
        throw new Error('No video track available');
      }

      // Сохраняем состояние микрофона и камеры
      const videoTrack = fullStream.getVideoTracks()[0];
      const audioTrack = fullStream.getAudioTracks()[0];
      if (videoTrack) videoTrack.enabled = isCameraEnabled;
      if (audioTrack) audioTrack.enabled = isMicEnabled;

      // Регистрируемся как стример на сервере
      wsRef.current?.send(JSON.stringify({
        type: 'register_broadcaster',
        payload: {
          name: streamName.trim(),
          broadcaster: broadcaster.trim(),
          cover,
          betAddress: betAddress.trim(),
          fightId,
          isStreamHidden
        }
      }));

      // Настраиваем WebRTC
      await setupPeerConnection(fullStream);

      setIsStreaming(true);

      // Ждём, пока сервер вернёт streamId
      let attempts = 0;
      const maxAttempts = 50;
      const waitForStreamId = setInterval(() => {
        attempts++;
        if (streamIdRef.current) {
          clearInterval(waitForStreamId);
          onStreamProcess(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(waitForStreamId);
          console.error('Timeout waiting for streamId');
          setConnectionError('Timeout waiting for stream registration');
          stopStream();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start broadcast:', error);
      setConnectionError('Failed to start broadcast: ' + (error as Error).message);
    }
  }, [isConnected, streamName, broadcaster, cover, betAddress, fightId, isStreamHidden, getFullStream, setupPeerConnection, onStreamProcess, isCameraEnabled, isMicEnabled]);

  // Остановить трансляцию
  const stopStream = useCallback(async () => {
    // Отправляем сигнал о завершении стрима
    if (wsRef.current?.readyState === WebSocket.OPEN && streamIdRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'stream_end',
        streamId: streamIdRef.current
      }));
    }

    // Небольшая задержка, чтобы сообщение успело уйти
    await new Promise(resolve => setTimeout(resolve, 100));

    // Закрываем WebRTC соединение
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Останавливаем все треки
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Очищаем видео элемент
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setStreamId('');
    streamIdRef.current = '';
    setViewerCount(0);
    onStreamStop?.();
    onStreamProcess(false);
  }, [onStreamStop, onStreamProcess]);

  // Переключение микрофона
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(prev => !prev);
    }
  }, []);

  // Переключение камеры
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraEnabled(prev => !prev);
    }
  }, []);

  // Смена камеры во время стрима
  const changeCamera = useCallback(async (deviceId: string) => {
    setSelectedCamera(deviceId);

    if (isStreaming && localStreamRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

        // Сохраняем состояние включения
        const wasEnabled = oldVideoTrack?.enabled ?? true;
        newVideoTrack.enabled = wasEnabled;

        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }

        localStreamRef.current.addTrack(newVideoTrack);

        // Обновляем WebRTC sender
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack);
          }
        }
      } catch (error) {
        console.error('Failed to change camera:', error);
      }
    } else {
      // Если не в стриме, просто перезапускаем предпросмотр
      startPreview();
    }
  }, [isStreaming, startPreview]);

  // Копирование ID стрима
  const copyStreamId = useCallback(() => {
    if (streamId) {
      navigator.clipboard.writeText(streamId);
      toast.success(t("copied"))
    }
  }, [streamId]);

  return (
    <div className={styles.broadcasterContainer}>
      {/* Статус WebSocket подключения */}
      <div className={styles.connectionStatus}>
        <span className={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? '🟢 ' + t('connected') : '🔴 ' + t('reconnecting')}
        </span>
        {connectionError && <span className={styles.error}>{connectionError}</span>}
      </div>

      {/* Видео превью */}
      <div className={styles.videoPreview}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.videoElement}
        />

        {!isStreaming && !localStreamRef?.current?.getVideoTracks()?.length && (
          <div className={styles.previewOverlay}>
            <span>{t('cameraPreview')}</span>
          </div>
        )}

        {isStreaming && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}>●</span> LIVE
          </div>
        )}
      </div>

      {/* Настройка стрима (только до начала) */}
      {!isStreaming && (
        <>
          <Section title={t('streamSettings')}>
            <InputText
              placeholder={t('streamName')}
              value={streamName}
              setValue={setStreamName}
            />
            <InputText
              placeholder={t('organizerName')}
              value={broadcaster}
              setValue={setBroadcaster}
            />
            <InputText
              placeholder={t('smartContractAddress')}
              value={betAddress}
              setValue={setBetAddress}
            />
            <InputNumber
              placeholder={t('fightId')}
              value={fightId}
              setValue={setFightId}
            />
            <ImageUploader onChange={setCover} />
            <Switch
              value={isStreamHidden}
              setValue={setIsStreamHidden}
              title={t("streamHidden")}
            />
          </Section>

          {/* Выбор устройств */}
          <Section title={t('devices')}>
            <div className={styles.deviceSelect}>
              <label>{t('camera')}</label>
              <Select
                value={selectedCamera}
                setValue={changeCamera}
                className={styles.select}
                options={availableCameras.map((camera, idx) => ({
                  label: camera.label || t('camera') + ' ' + (idx + 1),
                  value: camera.deviceId
                }))}
              />
            </div>

            <div className={styles.deviceSelect}>
              <label>{t('microphone')}</label>
              <Select
                value={selectedMic}
                setValue={setSelectedMic}
                className={styles.select}
                options={availableMics.map((mic, idx) => ({
                  label: mic.label || t('microphone') + ' ' + (idx + 1),
                  value: mic.deviceId
                }))}
              />
            </div>
          </Section>
        </>
      )}

      {/* Элементы управления */}
      <Section title={t('broadcastControls')}>
        <div className={styles.controlButtons}>
          <Button
            onClick={startStream}
            disabled={isStreaming || !isConnected}
            className={styles.startBtn}
          >
            <Play size={20} />
            {t('startBroadcast')}
          </Button>

          <Button
            onClick={stopStream}
            disabled={!isStreaming}
            stroke
          >
            <Square size={20} />
            {t('stopBroadcast')}
          </Button>
        </div>

        {isStreaming && (
          <>
            <div className={styles.mediaControls}>
              <button
                onClick={toggleMic}
                className={`${styles.mediaBtn} ${!isMicEnabled ? styles.disabled : ''}`}
              >
                {isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`${styles.mediaBtn} ${!isCameraEnabled ? styles.disabled : ''}`}
              >
                {isCameraEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
              </button>

              {availableCameras.length > 1 && (
                <Select
                  value={selectedCamera}
                  setValue={changeCamera}
                  className={styles.cameraSelect}
                  options={availableCameras.map(camera => ({
                    label: camera.label?.slice(0, 30) || t('camera'),
                    value: camera.deviceId
                  }))}
                />
              )}
            </div>

            <div className={styles.streamInfo}>
              <div className={styles.infoRow}>
                <Users size={18} />
                <span>{t('viewers')}: {viewerCount}</span>
              </div>
              <div className={styles.infoRow}>
                <Wifi size={18} />
                <span>{t('streamId')}: {streamId.slice(-8)}</span>
              </div>
            </div>

            <div className={styles.urlSection}>
              <InputText
                value={streamId}
                disabled
              />
              <Button onClick={copyStreamId} stroke>
                <Copy size={18} />
              </Button>
            </div>

            <p className={styles.hint}>
              {t('shareStreamHint')}
            </p>
          </>
        )}
      </Section>
    </div>
  );
}