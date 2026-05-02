import {
  Boxes,
  ChartNoAxesCombined,
  Crown,
  Info,
  Network,
  Radio,
  ScrollText,
  Settings,
  Timer,
  Trophy,
  User,
  Video,
} from "lucide-react";
import styles from "./index.module.css";
import { useState, useEffect, CSSProperties, useCallback, useRef } from "react";
import { storage } from "@/utils/storage";
import ModalWindow from "../ModalWindow";
import DirectP2P from "../DirectP2P";
import Button from "../Button";
import Auth from "../Auth";
import { useAtom } from "jotai";
import { languageAtom, userAtom } from "@/store";
import { useMe } from "@/hooks/useAuth";
import { initPage, PageRenderer, Pages } from "@/hooks/usePage";
import { StreamList } from "../Stream/StreamList";
import { DraggableVideo } from "../Stream/DraggableVideo";
import { StreamBroadcaster } from "../Stream/StreamBroadcaster";
import { useApi } from "@/hooks/useApi";
import toast from "react-hot-toast";

function LayoutContent() {
  const { page, setPage, params, goBack } = initPage();
  const { api } = useApi()
  const [showP2P, setShowP2P] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useAtom(userAtom);
  const [lang] = useAtom(languageAtom);
  const { user: userData } = useMe(lang);
  const pageRef = useRef(page);
  const [isDraggableOpen, setIsDraggableOpen] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [showStreamList, setShowStreamList] = useState(false);
  const [showBroadcaster, setShowBroadcaster] = useState(false);
  const [pendingStreamId, setPendingStreamId] = useState<string | null>(null);
  const tempWsRef = useRef<WebSocket | null>(null);

  // Подключение к стриму по ID (WebRTC)
  const handleSelectStream = (streamId: string) => {
    setPendingStreamId(streamId);
    setShowStreamList(false);

    // Создаём временное WebSocket для проверки регистрации
    const ws = new WebSocket(api.ws);
    tempWsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'register_viewer',
        streamId: streamId
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'viewer_registered') {
        setCurrentStreamId(streamId);
        setIsDraggableOpen(true);
        setPendingStreamId(null);
        ws.close();
      } else if (data.type === 'error') {
        toast.error('Registration error:', data.payload?.message);
        setPendingStreamId(null);
        ws.close();
      }
    };

    ws.onerror = (error) => {
      toast.error('Temp WebSocket error:' + error);
      setPendingStreamId(null);
    };

    // Таймаут на случай, если ответ не пришёл
    setTimeout(() => {
      if (pendingStreamId === streamId) {
        toast.error('Registration timeout');
        setPendingStreamId(null);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    }, 10000);
  };

  // Закрытие видео плеера
  const handleCloseVideo = () => {
    setIsDraggableOpen(false);
    setCurrentStreamId(null);
    setPendingStreamId(null);
  };

  const profileHandler = () => {
    if (user) {
      setPage(Pages.PROFILE);
    } else {
      setShowAuth(true);
    }
  };

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const handleTabPress = useCallback(() => {
    const currentPage = pageRef.current;

    if (currentPage === Pages.SETTINGS) {
      setPage(Pages.TIMER);
    } else if (currentPage === Pages.TIMER) {
      setPage(Pages.GRID);
    } else if (currentPage === Pages.GRID) {
      setPage(Pages.SETTINGS);
    } else {
      setPage(Pages.SETTINGS);
    }
  }, [setPage]);

  // Проверяем URL параметры при загрузке
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "true") {
      setPage(Pages.TIMER_VIEW);
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const { code, target } = event;
      // Проверяем, не находится ли фокус на интерактивном элементе
      const targetElement = target as HTMLElement;
      const isInteractiveElement =
        targetElement.tagName === "INPUT" ||
        targetElement.tagName === "TEXTAREA" ||
        targetElement.tagName === "SELECT" ||
        targetElement.tagName === "BUTTON" ||
        targetElement.isContentEditable;

      // Если фокус на интерактивном элементе - не перехватываем Tab
      if (isInteractiveElement) {
        return; // Позволяем стандартному поведению Tab сработать
      }

      if (code === "Tab") {
        event.preventDefault();
        handleTabPress();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (tempWsRef.current && tempWsRef.current.readyState === WebSocket.OPEN) {
        tempWsRef.current.close();
      }
    };
  }, []);

  // В окне просмотра скрываем навигацию
  const isViewerMode = page === Pages.TIMER_VIEW;
  const btnStyle: CSSProperties = {
    minWidth: "8px",
    width: "50px",
    padding: "10px 10px",
  };
  const wrapBtns: (left?: boolean) => CSSProperties = (left = true) => ({
    position: "absolute",
    [left ? "left" : "right"]: "15px",
    top: "12px",
    width: "fit-content",
  });
  return (
    <div style={{ background: "var(--bg)" }}>
      {!isViewerMode && (
        <header className={styles.header}>
          <div className={styles.nav} style={wrapBtns()}>
            <Button
              stroke={page !== Pages.PROFILE}
              onClick={profileHandler}
              style={btnStyle}
            >
              <User size={28} color="var(--fg)" />
            </Button>
            <Button
              stroke={page !== Pages.TOURNAMENTS_LIST}
              onClick={() => setPage(Pages.TOURNAMENTS_LIST)}
              style={btnStyle}
            >
              <ScrollText size={28} color="var(--fg)" />
            </Button>
            <Button
              stroke={page !== Pages.TOURNAMENTS_CREATE}
              onClick={() => setPage(Pages.TOURNAMENTS_CREATE)}
              style={btnStyle}
            >
              <Trophy size={28} color="var(--fg)" />
            </Button>
            <Button
              stroke={page !== Pages.LEADERBOARD}
              onClick={() => setPage(Pages.LEADERBOARD)}
              style={btnStyle}
            >
              <ChartNoAxesCombined size={28} color="var(--fg)" />
            </Button>
          </div>
          <nav className={styles.nav}>
            <fieldset
              className={`${styles.navButton} ${page === Pages.SETTINGS ? styles.active : ""}`}
              onClick={() => setPage(Pages.SETTINGS)}
            >
              <Settings size={28} />
            </fieldset>

            <fieldset
              className={`${styles.navButton} ${page === Pages.TIMER ? styles.active : ""}`}
              onClick={() => setPage(Pages.TIMER)}
            >
              <Timer size={28} />
            </fieldset>

            <fieldset
              className={`${styles.navButton} ${page === Pages.GRID ? styles.active : ""}`}
              onClick={() => setPage(Pages.GRID)}
            >
              <Network size={28} />
            </fieldset>
          </nav>
          <div className={styles.nav} style={wrapBtns(false)}>
            {user?.isAdmin && (
              <Button
                stroke
                onClick={() => setPage(Pages.ADMIN)}
                style={btnStyle}
              >
                <Crown size={28} color="var(--fg)" />
              </Button>
            )}
            <Button
              stroke
              onClick={() => setShowStreamList(!showStreamList)}
              style={btnStyle}
            >
              <Video size={28} color="var(--fg)" />
            </Button>
            <Button stroke onClick={() => setPage(Pages.INFO)} style={btnStyle}>
              <Info size={28} color="var(--fg)" />
            </Button>
            <Button
              stroke
              onClick={() => setPage(Pages.BLOCKCHAIN)}
              style={btnStyle}
            >
              <Boxes size={28} color="var(--fg)" strokeWidth={1.5} />
            </Button>
            <Button
              stroke
              onClick={() => setPage(Pages.SERVERS)}
              style={btnStyle}
            >
              <Radio size={28} color="var(--fg)" />
            </Button>
            <Button
              stroke
              onClick={() => setShowP2P(!showP2P)}
              style={{ ...btnStyle, minHeight: "25px", height: "50px" }}
              title="P2P"
            />
          </div>
        </header>
      )}
      {/* Рендерим только активную страницу */}
      <PageRenderer
        page={page}
        setPage={setPage}
        goBack={goBack}
        params={params}
      />
      {/* Модальное окно со списком */}
      <ModalWindow
        isOpen={showStreamList}
        onClose={() => setShowStreamList(false)}
      >
         <StreamList
            onSelectStream={handleSelectStream}
            onStartNewStream={() => {
              setShowStreamList(false);
              setShowBroadcaster(true);
            }}
          />
      </ModalWindow>

      {/* Модальное окно со списком */}
      <ModalWindow
        isOpen={showBroadcaster}
        onClose={() => setShowBroadcaster(false)}
      >
          <StreamBroadcaster
            onStreamStart={(streamId) => {
              setCurrentStreamId(streamId);
              setIsDraggableOpen(true);
            }}
            onStreamStop={() => {
              handleCloseVideo();
            }}
          />
      </ModalWindow>

      {/* Draggable видео плеер */}
      <DraggableVideo
        streamId={currentStreamId || undefined}
        streamName={currentStreamId ? `Stream ${currentStreamId.slice(-8)}` : "Мой стрим"}
        isOpen={isDraggableOpen}
        onClose={handleCloseVideo}
      />
      <ModalWindow
        isOpen={showP2P}
        onClose={() => setShowP2P(!showP2P)}
        style={{ maxWidth: "38rem" }}
        hidden
      >
        <DirectP2P />
      </ModalWindow>
      <ModalWindow isOpen={showAuth} onClose={() => setShowAuth(!showAuth)}>
        <Auth
          profileActivate={() => setPage(Pages.PROFILE)}
          onClose={() => setShowAuth(!showAuth)}
          setPage={() => setPage(Pages.INFO)}
        />
      </ModalWindow>
    </div>
  );
}

export default function Layout() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    storage.init().then(() => setIsStorageReady(true));
  }, []);

  if (!isStorageReady) return null;

  return <LayoutContent key="layout" />;
}
