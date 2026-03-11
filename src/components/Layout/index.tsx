// components/Layout/index.tsx
import { Network, Radio, ScrollText, Settings, Timer, Trophy, User } from "lucide-react";
import styles from "./index.module.css"
import Setting from "../Settings";
import Fight from "../Fight";
import Grid from "../Grid";
import { useState, useEffect, CSSProperties } from "react";
import FightViewerWindow from "../FightViewerWindow";
import { storage } from "@/utils/storage";
import ModalWindow from "../ModalWindow";
import DirectP2P from "../DirectP2P";
import Button from "../Button";
import Auth from "../Auth";
import { registrationApi } from "@/utils/api";
import { useAtom, useAtomValue } from "jotai";
import { languageAtom, userAtom } from "@/store";
import Profile from "../Profile";
import TournamentsList from "../TournamentsList";
import Tournament from "../Tournament";
import CreateTournament from "../CreateTournament";
import { LocalStorage } from "@/utils/helpers";

enum Pages {
    SETTINGS,
    TIMER,
    GRID,
    TIMER_VIEW,
    PROFILE,
    TOURNAMENTS_LIST,
    TOURNAMENTS_CREATE,
    TOURNAMENT
}

export default function Layout() {
    const [page, setPage] = useState<Pages>(Pages.SETTINGS);
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [showP2P, setShowP2P] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [tournamentId, setTournamentId] = useState<number|null>(null)
    const [user, setUser] = useAtom(userAtom)
    const lang = useAtomValue(languageAtom)

    const profileHandler = () => {
        if (user) {
            setPage(Pages.PROFILE)
        } else {
            setShowAuth(true)
        }
    }

    // Проверяем URL параметры при загрузке
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'true') {
            setPage(Pages.TIMER_VIEW);
        } else if (params.get("id") !== null && window.location.pathname === "/tournament") {
            setTournamentId(Number(params.get("id")))
            setPage(Pages.TOURNAMENT)
        }
        (async ()=>{
            await storage.init()
            let res = await registrationApi.me(lang)
            if (res)
                setUser(res)
            else {
                const tokens = await registrationApi.refresh()
                if (tokens) {
                    LocalStorage.setItem("accessToken", tokens.accessToken)
                    LocalStorage.setItem("refreshToken", tokens.refreshToken)
                    res = await registrationApi.me(lang)
                    if (res)
                        setUser(res)
                }
            }
            setIsStorageReady(true)
        })()

        const handleKeyDown = (event: KeyboardEvent) => {
          const { code, target } = event;
          // Проверяем, не находится ли фокус на интерактивном элементе
          const targetElement = target as HTMLElement;
          const isInteractiveElement =
            targetElement.tagName === 'INPUT' ||
            targetElement.tagName === 'TEXTAREA' ||
            targetElement.tagName === 'SELECT' ||
            targetElement.tagName === 'BUTTON' ||
            targetElement.isContentEditable;

          // Если фокус на интерактивном элементе - не перехватываем Tab
          if (isInteractiveElement) {
            return; // Позволяем стандартному поведению Tab сработать
          }

          if (code === "Tab") {
            event.preventDefault();
            setPage(state=>{
                if (state === Pages.SETTINGS)
                    return Pages.TIMER
                else if (state === Pages.TIMER)
                    return Pages.GRID
                return Pages.SETTINGS
            })
          }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const renderPage = () => {
        switch(page) {
            case Pages.SETTINGS:
                return <Setting />;
            case Pages.TIMER:
                return <Fight />;
            case Pages.PROFILE:
                return <Profile />;
            case Pages.TIMER_VIEW:
                return <FightViewerWindow />
            case Pages.GRID:
                return <Grid fightActivate={()=>setPage(Pages.TIMER)} />;
            case Pages.TOURNAMENTS_LIST:
                return <TournamentsList />
            case Pages.TOURNAMENT:
                return <Tournament id={tournamentId} />
            case Pages.TOURNAMENTS_CREATE:
                return <CreateTournament />
            default:
                return <Setting />;
        }
    }

    // В окне просмотра скрываем навигацию
    const isViewerMode = page === Pages.TIMER_VIEW;
    const btnStyle: CSSProperties = { minWidth: "8px", width: "50px", padding: "10px 10px" }
    const absoluteBtnStyle: CSSProperties = { ...btnStyle, position: "absolute", top: "12px", right: "15px" }
    return isStorageReady && (
        <div style={{ background: "var(--bg)" }}>
            {!isViewerMode && (
                <header className={styles.header}>
                    <div className={styles.nav} style={{ position: "absolute", left: "15px", width: "fit-content" }}>
                        <Button stroke={page !== Pages.PROFILE} onClick={profileHandler} style={btnStyle}>
                            <User size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke={page !== Pages.TOURNAMENTS_LIST} onClick={()=>setPage(Pages.TOURNAMENTS_LIST)} style={btnStyle}>
                            <ScrollText size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke={page !== Pages.TOURNAMENTS_CREATE} onClick={()=>setPage(Pages.TOURNAMENTS_CREATE)} style={btnStyle}>
                            <Trophy size={28} color="var(--fg)" />
                        </Button>
                    </div>
                    <nav className={styles.nav}>
                        <button
                            className={`${styles.navButton} ${page === Pages.SETTINGS ? styles.active : ''}`}
                            onClick={() => setPage(Pages.SETTINGS)}
                            aria-label="Настройки"
                        >
                            <Settings size={28} />
                        </button>

                        <button
                            className={`${styles.navButton} ${page === Pages.TIMER ? styles.active : ''}`}
                            onClick={() => setPage(Pages.TIMER)}
                            aria-label="Таймер"
                        >
                            <Timer size={28} />
                        </button>

                        <button
                            className={`${styles.navButton} ${page === Pages.GRID ? styles.active : ''}`}
                            onClick={() => setPage(Pages.GRID)}
                            aria-label="Сетка"
                        >
                            <Network size={28} />
                        </button>
                    </nav>
                    <Button stroke onClick={()=>setShowP2P(!showP2P)} style={absoluteBtnStyle}>
                        <Radio size={28} color="var(--fg)" />
                    </Button>
                </header>
            )}
            {/* Рендерим только активную страницу */}
            {renderPage()}
            <ModalWindow isOpen={showP2P} onClose={()=>setShowP2P(!showP2P)} style={{ maxWidth: "38rem" }} hidden>
                <DirectP2P />
            </ModalWindow>
            <ModalWindow isOpen={showAuth} onClose={()=>setShowAuth(!showAuth)}>
                <Auth profileActivate={()=>setPage(Pages.PROFILE)} onClose={()=>setShowAuth(!showAuth)} />
            </ModalWindow>
        </div>
    )
}