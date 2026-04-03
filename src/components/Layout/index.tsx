// components/Layout/index.tsx
import { Boxes, ChartNoAxesCombined, Crown, Info, Network, Radio, ScrollText, Settings, Timer, Trophy, User } from "lucide-react";
import styles from "./index.module.css"
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

function LayoutContent() {
    const { page, setPage, params, goBack } = initPage()
    const [showP2P, setShowP2P] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [user, setUser] = useAtom(userAtom)
    const [lang] = useAtom(languageAtom)
    const { user: userData } = useMe(lang)
    const pageRef = useRef(page);

    const profileHandler = () => {
        if (user) {
            setPage(Pages.PROFILE)
        } else {
            setShowAuth(true)
        }
    }

    useEffect(()=>{
        if (userData)
            setUser(userData)
    }, [userData])

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
        if (params.get('view') === 'true') {
            setPage(Pages.TIMER_VIEW);
        }
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
                handleTabPress()
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // В окне просмотра скрываем навигацию
    const isViewerMode = page === Pages.TIMER_VIEW;
    const btnStyle: CSSProperties = { minWidth: "8px", width: "50px", padding: "10px 10px" }
    const wrapBtns: (left?: boolean)=>CSSProperties = (left=true) => ({ position: "absolute", [left ? "left" : "right"]: "15px", top: "12px", width: "fit-content" })
    return (
        <div style={{ background: "var(--bg)" }}>
            {!isViewerMode && (
                <header className={styles.header}>
                    <div className={styles.nav} style={wrapBtns()}>
                        <Button stroke={page !== Pages.PROFILE} onClick={profileHandler} style={btnStyle}>
                            <User size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke={page !== Pages.TOURNAMENTS_LIST} onClick={()=>setPage(Pages.TOURNAMENTS_LIST)} style={btnStyle}>
                            <ScrollText size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke={page !== Pages.TOURNAMENTS_CREATE} onClick={()=>setPage(Pages.TOURNAMENTS_CREATE)} style={btnStyle}>
                            <Trophy size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke={page !== Pages.LEADERBOARD} onClick={()=>setPage(Pages.LEADERBOARD)} style={btnStyle}>
                            <ChartNoAxesCombined size={28} color="var(--fg)" />
                        </Button>
                    </div>
                    <nav className={styles.nav}>
                        <fieldset
                            className={`${styles.navButton} ${page === Pages.SETTINGS ? styles.active : ''}`}
                            onClick={() => setPage(Pages.SETTINGS)}
                        >
                            <Settings size={28} />
                        </fieldset>

                        <fieldset
                            className={`${styles.navButton} ${page === Pages.TIMER ? styles.active : ''}`}
                            onClick={() => setPage(Pages.TIMER)}
                        >
                            <Timer size={28} />
                        </fieldset>

                        <fieldset
                            className={`${styles.navButton} ${page === Pages.GRID ? styles.active : ''}`}
                            onClick={() => setPage(Pages.GRID)}
                        >
                            <Network size={28} />
                        </fieldset>
                    </nav>
                    <div className={styles.nav} style={wrapBtns(false)}>
                        {user?.isAdmin &&
                            <Button stroke onClick={()=>setPage(Pages.ADMIN)} style={btnStyle}>
                                <Crown size={28} color="var(--fg)" />
                            </Button>
                        }
                        <Button stroke onClick={()=>setPage(Pages.INFO)} style={btnStyle}>
                            <Info size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke onClick={()=>setPage(Pages.BLOCKCHAIN)} style={btnStyle}>
                            <Boxes size={28} color="var(--fg)" strokeWidth={1.5} />
                        </Button>
                        <Button stroke onClick={()=>setPage(Pages.SERVERS)} style={btnStyle}>
                            <Radio size={28} color="var(--fg)" />
                        </Button>
                        <Button stroke onClick={()=>setShowP2P(!showP2P)} style={{...btnStyle, minHeight: "25px", height: "50px"}} title="P2P" />
                    </div>
                </header>
            )}
            {/* Рендерим только активную страницу */}
            <PageRenderer page={page} setPage={setPage} goBack={goBack} params={params} />
            <ModalWindow isOpen={showP2P} onClose={()=>setShowP2P(!showP2P)} style={{ maxWidth: "38rem" }} hidden>
                <DirectP2P />
            </ModalWindow>
            <ModalWindow isOpen={showAuth} onClose={()=>setShowAuth(!showAuth)}>
                <Auth profileActivate={()=>setPage(Pages.PROFILE)} onClose={()=>setShowAuth(!showAuth)} setPage={()=>setPage(Pages.INFO)} />
            </ModalWindow>
        </div>
    )
}

export default function Layout() {
    const [isStorageReady, setIsStorageReady] = useState(false);

    useEffect(() => {
        storage.init().then(() => setIsStorageReady(true));
    }, []);

    if (!isStorageReady) return null;

    return <LayoutContent key="layout" />;
}