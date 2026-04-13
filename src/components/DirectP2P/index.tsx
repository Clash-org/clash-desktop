// components/DirectP2P.tsx
import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas as QRCode} from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAtom } from 'jotai';
import { fighterPairsAtom, duelsAtom, playoffAtom, participantsAtom, poolsAtom, isPoolEndAtom } from '@/store';
import Button from '@/components/Button';
import styles from './index.module.css';
import InputText from '../InputText';
import { useTranslation } from 'react-i18next';
import { encodeToBase64, decodeFromBase64, generateId } from '@/utils/helpers';
import { Users, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

const STUNservers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.voipstunt.com:3478' },
  { urls: 'stun:stun.ekiga.net:3478' },
  { urls: 'stun:stun.ideasip.com:3478' },
  { urls: 'stun:stun.schlund.de:3478' },
  { urls: 'stun:stun.voipbuster.com:3478' },
  { urls: 'stun:stun.1und1.de:3478' },
  { urls: 'stun:stun.gmx.net:3478' },
  { urls: 'stun:stun.rt.ru:3478' },
  { urls: 'stun:stun.mts.ru:3478' },
  { urls: 'stun:stun.sipnet.ru:3478' },
  { urls: 'stun:stun.chinaunix.com:3478' },
  { urls: 'stun:stun.qq.com:3478' },
];

interface PeerConnection {
  peer: any;
  peerId: string;
  connected: boolean;
  isServer: boolean;
  clientId?: string;
}

interface DirectP2PProps {
  onPeerConnected?: () => void;
}

export default function DirectP2P({ onPeerConnected }: DirectP2PProps) {
  const { t } = useTranslation();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
  const [answerSignal, setAnswerSignal] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [isServer, setIsServer] = useState<boolean>(false);

  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [peerList, setPeerList] = useState<string[]>([]);
  const [pendingSignals, setPendingSignals] = useState<Map<string, { signal: string, peer: any }>>(new Map());
  const [copied, setCopied] = useState<string>('');

  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [participants, setParticipants] = useAtom(participantsAtom);
  const [pools, setPools] = useAtom(poolsAtom);
  const [isPoolEnd, setIsPoolEnd] = useAtom(isPoolEndAtom);

  const fighterPairsRef = useRef(fighterPairs);
  const participantsRef = useRef(participants);
  const poolsRef = useRef(pools);
  const duelsRef = useRef(duels);
  const playoffRef = useRef(playoff);
  const isPoolEndRef = useRef(isPoolEnd);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const SimplePeerRef = useRef<any>(null);

  useEffect(() => { fighterPairsRef.current = fighterPairs; }, [fighterPairs]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { poolsRef.current = pools; }, [pools]);
  useEffect(() => { duelsRef.current = duels; }, [duels]);
  useEffect(() => { playoffRef.current = playoff; }, [playoff]);
  useEffect(() => { isPoolEndRef.current = isPoolEnd; }, [isPoolEnd]);

  const initPeer = async () => {
    try {
      if (typeof global === 'undefined') {
        window.global = window;
      }

      if (!SimplePeerRef.current) {
        SimplePeerRef.current = (await import('simple-peer')).default;
      }
      return SimplePeerRef.current;
    } catch (error) {
      console.error('Failed to load simple-peer:', error);
      addMessage(t('p2pLoadError'));
      return null;
    }
  }

  const createServer = async () => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      setIsServer(true);
      setConnectionStatus('connected');

      const serverId = generateId('server');
      setMyPeerId(serverId);

      addMessage(t('p2pCreating'));
      addMessage(`🆔 ${t('serverId')}: ${serverId}`);

    } catch (error) {
      console.error('Error creating server:', error);
      addMessage(`${t('p2pConnectionError')}: ${error}`);
    }
  }

  const connectToServer = async (serverId: string) => {
    const SimplePeer = await initPeer();
    if (!SimplePeer) return;

    try {
      setIsServer(false);
      setConnectionStatus('connecting');
      setMyPeerId(serverId);

      addMessage(`🔌 ${t('p2pConnecting')} ${serverId}`);

      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: STUNservers
        }
      });

      const clientId = generateId('client');

      const peerConnection: PeerConnection = {
        peer: newPeer,
        peerId: serverId,
        connected: false,
        isServer: false,
        clientId
      };

      setPeers(prev => new Map(prev.set(serverId, peerConnection)));

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        const encodedSignal = encodeToBase64(signalString);
        setRemotePeerId(encodedSignal);
        addMessage(t('p2pSignalGenerated'));
      });

      setupPeer(newPeer, serverId);

    } catch (error) {
      console.error('Error connecting to server:', error);
      addMessage(`${t('p2pConnectionError')}: ${error}`);
    }
  }

  const acceptClientSignal = async (clientSignal: string) => {
    const SimplePeer = await initPeer();
    if (!SimplePeer || !isServer) return;

    try {
      addMessage(t('p2pSendingSignal'));

      const signal = JSON.parse(decodeFromBase64(clientSignal));

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        config: {
          iceServers: STUNservers
        }
      });

      const clientId = generateId('client');

      const peerConnection: PeerConnection = {
        peer: newPeer,
        peerId: clientId,
        connected: false,
        isServer: true,
        clientId
      };

      setPeers(prev => new Map(prev.set(clientId, peerConnection)));
      setPeerList(prev => [...prev, clientId]);

      newPeer.signal(signal);

      newPeer.on('signal', (data: any) => {
        const signalString = JSON.stringify(data);
        const encodedSignal = encodeToBase64(signalString);

        setPendingSignals(prev => new Map(prev.set(clientId, {
          signal: encodedSignal,
          peer: newPeer
        })));

        addMessage(`${t('p2pAnswerGenerated')} ${clientId.substring(0, 8)}...`);
      });

      setupPeer(newPeer, clientId);

    } catch (error) {
      console.error('Error accepting client:', error);
      addMessage(`${t('p2pConnectionError')}: ${error}`);
    }
  }

  const acceptServerAnswer = async (answerSignal: string, serverId: string) => {
    const SimplePeer = await initPeer();
    if (!SimplePeer || isServer) return;

    try {
      addMessage(t('p2pSendingAnswer'));

      const signal = JSON.parse(decodeFromBase64(answerSignal));

      const peerConn = peers.get(serverId);
      if (!peerConn) {
        addMessage(t('p2pNoPeerFound'));
        return;
      }

      peerConn.peer.signal(signal);

      addMessage(t('p2pAnswerSent'));

    } catch (error) {
      console.error('Error accepting server answer:', error);
      addMessage(`${t('p2pAnswerError')}: ${error}`);
    }
  }

  const sendFullDataToPeer = (peer: any, targetPeerId: string) => {
    const dataToSend = {
      type: 'full-sync',
      fighterPairs: fighterPairsRef.current,
      participants: participantsRef.current,
      pools: poolsRef.current,
      isPoolEnd: isPoolEndRef.current,
      duels: duelsRef.current,
      playoff: playoffRef.current,
      sourceId: isServer ? 'server' : myPeerId
    };

    peer.send(JSON.stringify(dataToSend));
    toast.success(`${t('p2pDataSent')} ${targetPeerId.substring(0, 8)}...`)
    addMessage(`${t('p2pDataSent')} ${targetPeerId.substring(0, 8)}...`);
  };

  const sendPoolDataToPeer = (peer: any, targetPeerId: string, poolIndex: number) => {
    const dataToSend = {
      type: 'pool',
      payload: {
        poolIndex,
        isPoolPlayoff: isPoolEndRef.current[poolIndex],
        duels: duelsRef.current,
        fighterPairs: fighterPairsRef.current,
        pools: poolsRef.current,
        participants: participantsRef.current
      },
      sourceId: isServer ? 'server' : myPeerId
    };

    peer.send(JSON.stringify(dataToSend));
    toast.success(`${t('p2pDataSent')} ${targetPeerId.substring(0, 8)}...`)
    addMessage(`${t('p2pDataSent')} ${targetPeerId.substring(0, 8)}...`);
  };

  const broadcastFullData = () => {
    if (peerList.length === 0) {
      addMessage(t('p2pNoPeersConnected'));
      return;
    }

    peers.forEach((conn, peerId) => {
      if (conn.connected) {
        sendFullDataToPeer(conn.peer, peerId);
      }
    });
  }

  const broadcastPoolData = (poolIndex: number) => {
    if (peerList.length === 0) {
      addMessage(t('p2pNoPeersConnected'));
      return;
    }

    peers.forEach((conn, peerId) => {
      if (conn.connected) {
        sendPoolDataToPeer(conn.peer, peerId, poolIndex);
      }
    });
  }

  const sendClientDataToServer = () => {
    const serverConn = Array.from(peers.values()).find(conn => conn.peerId === myPeerId);

    if (serverConn?.connected) {
      sendFullDataToPeer(serverConn.peer, myPeerId);
      addMessage(t('p2pClientDataSentToServer'));
    } else {
      addMessage(t('p2pNoServerConnection'));
    }
  }

  const sendClientPoolToServer = (poolIndex: number) => {
    const serverConn = Array.from(peers.values()).find(conn => conn.peerId === myPeerId);

    if (serverConn?.connected) {
      sendPoolDataToPeer(serverConn.peer, myPeerId, poolIndex);
      addMessage(`${t('p2pPoolDataSentToServer')} ${poolIndex + 1}`);
    } else {
      addMessage(t('p2pNoServerConnection'));
    }
  }

  const requestDataFromServer = () => {
    const serverConn = Array.from(peers.values()).find(
      conn => conn.peerId === myPeerId && conn.isServer === false
    );

    if (!serverConn) {
      addMessage(t('p2pServerConnNotFound'));
      return;
    }

    if (!serverConn.connected) {
      addMessage(t('p2pWaitingConnection'));
      return;
    }

    const requestData = {
      type: 'request-sync',
      clientId: myPeerId,
      requester: 'client',
      timestamp: Date.now()
    };

    try {
      serverConn.peer.send(JSON.stringify(requestData));
      toast.success(t('p2pRequestSyncSent'))
      addMessage(t('p2pRequestSyncSent'));
    } catch (err) {
      console.error('Failed to send request-sync:', err);
      addMessage(`${t('p2pSendError')}: ${err}`);
    }
  }

  const setupPeer = (peer: any, peerId: string) => {
    peer.on('connect', () => {
      addMessage(`${t('p2pConnected')} ${peerId.substring(0, 8)}...`);

      setPeers(prev => {
        const updated = new Map(prev);
        const conn = updated.get(peerId);
        if (conn) {
          conn.connected = true;
          updated.set(peerId, conn);
        }
        return updated;
      });

      setConnectionStatus('connected');

      if (onPeerConnected) {
        onPeerConnected();
      }
    });

    peer.on('data', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        handleReceivedData(parsed, peerId);
      } catch (error) {
        console.error('Error processing data:', error);
      }
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      addMessage(`${t('p2pError')} ${peerId.substring(0, 8)}...: ${err.message}`);

      setPeers(prev => {
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
      });
      setPeerList(prev => prev.filter(id => id !== peerId));
    });

    peer.on('close', () => {
      addMessage(`${t('p2pClosed')} ${peerId.substring(0, 8)}...`);

      setPeers(prev => {
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
      });
      setPeerList(prev => prev.filter(id => id !== peerId));
    });
  };

  const handleReceivedData = (data: any, fromPeerId: string) => {
    addMessage(`${t('p2pDataReceived')} ${fromPeerId.substring(0, 8)}...: ${data.type}`);

    switch (data.type) {
      case 'full-sync':
        if (data.fighterPairs) setFighterPairs(data.fighterPairs);
        if (data.participants) setParticipants(data.participants);
        if (data.pools) setPools(data.pools);
        if (data.duels) setDuels(data.duels);
        if (data.playoff) setPlayoff(data.playoff);
        if (data.isPoolEnd) setIsPoolEnd(data.isPoolEnd)
        toast.success(t('p2pDataSynced'))
        addMessage(t('p2pDataSynced'));
        break;

      case 'pool':
        const payload = data.payload
        if (payload.poolIndex !== undefined) {
          setFighterPairs(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.fighterPairs[payload.poolIndex]
            return buf
          })
          setDuels(state=>{
            const buf = JSON.parse(JSON.stringify(state))
            buf[payload.poolIndex] = payload.duels[payload.poolIndex]
            setIsPoolEnd(isEnds=>{
              const bufEnds = [...isEnds]
              bufEnds[payload.poolIndex] = payload.isPoolPlayoff
              return bufEnds
            })
            return buf
          })
          setParticipants(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.participants[payload.poolIndex]
            return buf
          })
          setPools(state=>{
            const buf = [...state]
            buf[payload.poolIndex] = payload.pools[payload.poolIndex]
            return buf
          })
          toast.success(`${t('p2pPoolSynced')} ${payload.poolIndex + 1}`)
          addMessage(`${t('p2pPoolSynced')} ${payload.poolIndex + 1}`);
        }
        break;

      case 'request-sync':
        if (!isServer) {
          addMessage(t('p2pRequestSyncIgnoredClient'));
          return;
        }

        addMessage(`${t('p2pServerReceivedRequest')} ${fromPeerId.substring(0, 8)}...`);

        let targetPeer = peers.get(fromPeerId);

        if (!targetPeer && data.clientId) {
          for (const [key, conn] of peers.entries()) {
            if (conn.clientId === data.clientId) {
              targetPeer = conn;
              addMessage(`${t('p2pFoundPeerFallback')}: ${key}`);
              break;
            }
          }
        }

        if (!targetPeer) {
          addMessage(`${t('p2pPeerNotFound')} fromPeerId=${fromPeerId}, clientId=${data.clientId}`);
          return;
        }

        if (!targetPeer.connected) {
          addMessage(`${t('p2pPeerNotConnected')} ${fromPeerId}`);
          return;
        }

        try {
          toast.success(`${t('p2pSendingFullSync')} ${fromPeerId.substring(0, 8)}...`)
          addMessage(`${t('p2pSendingFullSync')} ${fromPeerId.substring(0, 8)}...`);
          sendFullDataToPeer(targetPeer.peer, fromPeerId);
        } catch (err) {
          console.error('Failed to send sync response:', err);
          addMessage(`${t('p2pResponseError')}: ${err}`);
        }
        break;

      default:
        addMessage(`${t('p2pUnknownType')}: ${data.type}`);
    }
  };

  const startScanner = () => {
    setShowScanner(!showScanner);

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        if (decodedText.startsWith('SERVER:')) {
          const serverId = decodedText.replace('SERVER:', '');
          connectToServer(serverId);
        } else {
          if (isServer) {
            acceptClientSignal(decodedText);
          } else {
            acceptServerAnswer(decodedText, myPeerId);
          }
        }
        scanner.clear();
        setShowScanner(false);
      }, (error) => {
        console.warn('Scan error:', error);
      });

      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
    addMessage(t('p2pSignalCopied'));
  };

  const disconnectAll = () => {
    peers.forEach((conn) => {
      if (conn.peer) {
        conn.peer.destroy();
      }
    });

    setPeers(new Map());
    setPeerList([]);
    setConnectionStatus('disconnected');
    setIsServer(false);
    setMyPeerId('');
    setPendingSignals(new Map());
    setRemotePeerId('');
    setAnswerSignal('');
    addMessage(t('p2pDisconnected'));
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      disconnectAll();
    };
  }, []);

  const syncAllData = () => {
    if (isServer) {
      broadcastFullData();
    } else {
      requestDataFromServer();
    }
  }

  return (
    <div className={styles.directP2P}>
      <h3 className={styles.title}>
        <Wifi size={20} /> {t('p2pDirectConnection')}
      </h3>

      {connectionStatus === 'disconnected' && (
        <div className={styles.connectionControls}>
          <Button
            title={t('p2pCreateInitiator')}
            onClick={createServer}
            className={styles.primaryButton}
          />

          <div className={styles.qrControls}>
            <Button
              title={t('p2pScanQR')}
              onClick={startScanner}
              className={styles.secondaryButton}
            />
          </div>

          <div className={styles.manualConnect}>
            <InputText
              placeholder={t('p2pPasteSignal')}
              value={remotePeerId}
              setValue={setRemotePeerId}
            />
            <Button
              title={t('p2pConnect')}
              onClick={() => connectToServer(remotePeerId)}
              disabled={!remotePeerId}
            />
          </div>
        </div>
      )}

      {isServer && myPeerId && (
        <div className={styles.serverInfo}>
          <h4>🎮 {t('serverId')}:</h4>
          <div className={styles.serverId}>
            <code>SERVER:{myPeerId}</code>
            <Button
              title={copied === 'server' ? '✓' : t('p2pCopySignal')}
              onClick={() => copyToClipboard(`SERVER:${myPeerId}`, 'server')}
              className={styles.smallButton}
            />
          </div>
          <Button
            title={t('p2pShowQR')}
            onClick={() => setShowQR(!showQR)}
            className={styles.secondaryButton}
          />
        </div>
      )}

      {showQR && myPeerId && (
        <div className={styles.qrContainer}>
          <h4>{t('p2pScanQRToConnect')}</h4>
          <QRCode value={`SERVER:${myPeerId}`} size={200} />
          <Button
            title={t('p2pHideQR')}
            onClick={() => setShowQR(false)}
            className={styles.smallButton}
          />
        </div>
      )}

      {showScanner && (
        <div className={styles.scannerContainer}>
          <h4>{t('p2pPointCamera')}</h4>
          <div id="qr-reader" className={styles.scanner}></div>
          <Button
            title={t('p2pCloseScanner')}
            onClick={stopScanner}
            className={styles.smallButton}
          />
        </div>
      )}

      {!isServer && remotePeerId && connectionStatus === 'connecting' && (
        <div className={styles.signalSection}>
          <h4>📤 {t('p2pSendThisSignal')}</h4>
          <p className={styles.signalHelp}>
            {t('p2pSendThisSignal')}:
          </p>
          <div className={styles.signalBox}>
            <InputText
              value={remotePeerId}
              rows={5}
              className={styles.signalText}
            />
            <Button
              title={copied === 'client' ? '✓' : t('p2pCopySignal')}
              onClick={() => copyToClipboard(remotePeerId, 'client')}
              className={styles.copyButton}
            />
          </div>
          <p className={styles.signalNote}>
            {t('p2pSendAnswerToInitiator')}
          </p>
        </div>
      )}

      {!isServer && connectionStatus === 'connecting' && (
        <div className={styles.answerSection}>
          <h4>📥 {t('p2pPasteAnswer')}</h4>
          <div className={styles.answerInput}>
            <InputText
              placeholder={t('p2pPasteAnswerHere')}
              value={answerSignal}
              setValue={setAnswerSignal}
              rows={4}
              multiline
            />
            <Button
              title={t('p2pSendAnswer')}
              onClick={() => acceptServerAnswer(answerSignal, myPeerId)}
              disabled={!answerSignal}
              className={styles.primaryButton}
            />
          </div>
        </div>
      )}

      {isServer && pendingSignals.size > 0 && (
        <div className={styles.pendingSignals}>
          <h4>📨 {t('p2pSendAnswerToInitiator')}</h4>
          {Array.from(pendingSignals.entries()).map(([clientId, data]) => (
            <div key={clientId} className={styles.pendingSignal}>
              <div className={styles.pendingSignalHeader}>
                <span>{t('p2pClient')}: {clientId.substring(0, 8)}...</span>
                <Button
                  title={copied === `answer-${clientId}` ? '✓' : t('p2pCopyAnswer')}
                  onClick={() => copyToClipboard(data.signal, `answer-${clientId}`)}
                  className={styles.smallButton}
                />
              </div>
              <div className={styles.pendingSignalBody}>
                <InputText
                  value={data.signal}
                  rows={4}
                  className={styles.signalText}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {isServer && connectionStatus === 'connected' && (
        <div className={styles.clientSignalInput}>
          <h4>📥 {t('p2pPasteAnswer')}</h4>
          <div className={styles.answerInput}>
            <InputText
              placeholder={t('p2pPasteAnswerHere')}
              value={remotePeerId}
              setValue={setRemotePeerId}
              rows={4}
              multiline
            />
            <Button
              title={t('p2pSendAnswer')}
              onClick={() => acceptClientSignal(remotePeerId)}
              disabled={!remotePeerId}
              className={styles.primaryButton}
            />
          </div>
        </div>
      )}

      {peerList.length > 0 && (
        <div className={styles.peersList}>
          <h4><Users size={16} /> {t('p2pConnectedPeers')} ({peerList.length})</h4>
          <div className={styles.peerItems}>
            {peerList.map(peerId => {
              const conn = peers.get(peerId);
              return (
                <div key={peerId} className={styles.peerItem}>
                  <span>🟢 {peerId.substring(0, 8)}...</span>
                  {conn?.connected ? '✅' : '⏳'}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className={styles.connected}>
          <div className={styles.statusBadge}>
            {isServer ? t('server') : t('p2pClient')} • {t('p2pConnectedStatus')}
          </div>

          <div className={styles.connectedControls}>
            <Button
              title={t('p2pSyncAll')}
              onClick={syncAllData}
              className={styles.primaryButton}
            />

            <Button
              title={t('p2pDisconnect')}
              onClick={disconnectAll}
              className={styles.dangerButton}
            />
          </div>

          <div className={styles.syncActions}>
            <h4>{t('p2pQuickSync')}</h4>
            <div className={styles.actionButtons}>
              {fighterPairs.map((_, poolIndex) => (
                <Button
                  key={poolIndex}
                  title={`${t("pool")} ${poolIndex + 1}`}
                  onClick={() => {
                    if (isServer) {
                      broadcastPoolData(poolIndex);
                    } else {
                      sendClientPoolToServer(poolIndex);
                    }
                  }}
                  className={styles.secondaryButton}
                />
              ))}
            </div>
          </div>

          {!isServer && (
            <div className={styles.clientControls}>
              <Button
                title={t('p2pSendMyDataToServer')}
                onClick={sendClientDataToServer}
                className={styles.secondaryButton}
              />
            </div>
          )}
        </div>
      )}

      <div className={styles.messageLog}>
        <h4>{t('p2pConnectionLog')}</h4>
        <div className={styles.logEntries}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.logEntry}>{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}