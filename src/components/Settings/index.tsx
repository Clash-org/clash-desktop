import {
  CheckCircle,
  PictureInPicture2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./index.module.css";
import { open } from "@tauri-apps/plugin-dialog";
import { copyFile, mkdir, remove } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import Button from "@/components/Button";
import Section from "@/components/Section";
import InputText from "@/components/InputText";
import { generateId, getName, isPoolEndByDuels } from "@/utils/helpers";
import { useAtom } from "jotai";
import {
  currentPairIndexAtom,
  currentPoolIndexAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterDefault,
  fighterPairsAtom,
  fightTimeAtom,
  fightTimeDefault,
  historyAtom,
  hitZonesAtom,
  hitZonesDefault,
  HitZonesType,
  hotKeysAtom,
  hotKeysDefault,
  HotKeysType,
  isPoolEndAtom,
  isPoolRatingAtom,
  tournamentSystemAtom,
  languageAtom,
  pairsDefault,
  participantsAtom,
  poolCountDeleteAtom,
  poolsAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  warnings1Atom,
  warnings2Atom,
  playoffAtom,
  userAtom,
  currentTournamentAtom,
  currentWeaponIdAtom,
  currentNominationIdAtom,
  currentPoolIdAtom
} from "@store";
import { NominationType, NominationUser, ParticipantStatus, ParticipantType, PoolCreatedType, TournamentStatus, TournamentSystem } from "@typings";
import { langLabels } from "@constants";
import toast from "react-hot-toast";
import Switch from "@/components/Switch";
import { generatePairs } from "@/utils/generatePairs";
import InputNumber from "@/components/InputNumber";
import TimePicker from "@/components/TimePicker";
import SelectPair from "@/components/SelectPair";
import { importExcel } from "@/utils/importExcel";
import { openFightViewerWindow } from "@/utils/windowManager";
import { storage } from "@/utils/storage";
import RadioGroup from "@/components/RadioGroup";
import { useParticipants } from "@/hooks/useParticipants";
import { useOrganizerTournaments, usePool, useTournamentsByIds } from "@/hooks/useTournaments";
import Select from "../Select";
import WeaponNominationsSelect from "../WeaponNominationsSelect";
import { createPool, getMathes, updatePool } from "@/utils/api";
import { useNominations } from "@/hooks/useNominations";
import { useUpdater } from "@/hooks/useUpdater";

type TrashPairProps = {
  setFighterPairs: React.Dispatch<React.SetStateAction<[ParticipantType, ParticipantType][][]>>;
  setPools: React.Dispatch<React.SetStateAction<[ParticipantType, ParticipantType][][]>>;
  setСurrentPoolIndex: React.Dispatch<React.SetStateAction<number>>;
  setParticipants: Dispatch<SetStateAction<ParticipantType[][]>>;
  setDuels: Dispatch<SetStateAction<[ParticipantType, ParticipantType][][][]>>;
  setIsPoolEnd: Dispatch<SetStateAction<boolean[]>>;
  currentPoolIndex: number;
  isEnd: boolean;
  pool: number;
};

function PoolControllers({
  setFighterPairs,
  setPools,
  setDuels,
  setСurrentPoolIndex,
  setParticipants,
  setIsPoolEnd,
  isEnd,
  pool,
  currentPoolIndex,
}: TrashPairProps) {
  const deleteHandler = () => {
    setFighterPairs((state) => {
      const buf = [...state].filter((_, index) => index !== pool);
      return buf;
    });
    setPools((state) => {
      const buf = [...state].filter((_, index) => index !== pool);
      return buf;
    });
    setСurrentPoolIndex((state) =>
      pool <= currentPoolIndex ? state - 1 : state,
    );
    setParticipants((state) => {
      const buf = [...state].filter((_, index) => index !== pool);
      return buf;
    });
    setIsPoolEnd((state) => state.filter((_, idx) => idx !== pool));
  };

  const importFile = async () => {
    const res = await importExcel();
    if (res) {
      const [data, length] = res;
      const stateHandlerWrap =
        (onlyFirst: boolean) => (state: [ParticipantType, ParticipantType][][]) => {
          let firstList: [ParticipantType, ParticipantType][] = [];
          const allLists: [ParticipantType, ParticipantType][][] = [];
          if (onlyFirst) {
            for (let i = 0; i < Math.floor(data.length / length); i++) {
              firstList.push([
                {
                  ...fighterDefault,
                  scores: data[i][0].scores,
                  warnings: data[i][0].warnings,
                  protests: data[i][0].protests,
                  doubleHits: data[i][0].doubleHits,
                  wins: data[i][0].wins,
                  name: data[i][0].name,
                  id: data[i][0].id,
                },
                {
                  ...fighterDefault,
                  scores: data[i][1].scores,
                  warnings: data[i][1].warnings,
                  protests: data[i][1].protests,
                  doubleHits: data[i][1].doubleHits,
                  wins: data[i][1].wins,
                  name: data[i][1].name,
                  id: data[i][1].id,
                },
              ]);
            }
          } else {
            for (let i = 0; i < data.length; i++) {
              firstList.push([
                {
                  ...fighterDefault,
                  scores: data[i][0].scores,
                  warnings: data[i][0].warnings,
                  protests: data[i][0].protests,
                  doubleHits: data[i][0].doubleHits,
                  wins: data[i][0].wins,
                  name: data[i][0].name,
                  id: data[i][0].id,
                },
                {
                  ...fighterDefault,
                  scores: data[i][1].scores,
                  warnings: data[i][1].warnings,
                  protests: data[i][1].protests,
                  doubleHits: data[i][1].doubleHits,
                  wins: data[i][1].wins,
                  name: data[i][1].name,
                  id: data[i][1].id,
                },
              ]);
              if ((i + 1) % Math.floor(data.length / length) === 0) {
                allLists.push([...firstList]);
                firstList = [];
              }
            }
          }
          if (onlyFirst) {
            const buf = [...state];
            buf[pool] = firstList;
            return buf;
          } else {
            return allLists;
          }
        };
      setFighterPairs((state) => {
        const buf = [...state];
        buf[pool] = stateHandlerWrap(false)(state)[0];
        return buf;
      });
      setPools((state) => stateHandlerWrap(true)(state));
      setDuels((state) => {
        const buf: [ParticipantType, ParticipantType][][][] = JSON.parse(JSON.stringify(state));
        buf[pool] = [];
        buf[pool] = stateHandlerWrap(false)(buf[pool]);
        setIsPoolEnd((isEnds) => {
          const bufEnds = [...isEnds];
          if (isPoolEndByDuels(buf, pool)) {
            bufEnds[pool] = true;
          } else {
            bufEnds[pool] = false;
          }
          return bufEnds;
        });
        return buf;
      });
      setParticipants((state) => {
        const buf = [...state];
        const virtualArr: [ParticipantType, ParticipantType][][] = new Array(pool + 1);
        virtualArr[pool] = [...buf] as [ParticipantType, ParticipantType][];
        buf[pool] = stateHandlerWrap(true)(virtualArr)
          [pool].flat()
          .filter((item) => item.name !== "—") as [ParticipantType, ParticipantType];
        return buf;
      });
    }
  };

  return (
    <div className={styles.poolController}>
      {isEnd && <CheckCircle color="var(--accent)" />}
      <Upload className={styles.trashIcon} onClick={importFile} />
      {pool !== 0 ? (
        <Trash2 className={styles.trashIcon} onClick={deleteHandler} />
      ) : (
        <></>
      )}
    </div>
  );
}

type PoolContentProps = {
  pairs: [ParticipantType, ParticipantType][];
  nominationId: number|undefined;
  nominations: NominationType[];
}

function PoolContent({ pairs, nominationId, nominations }:PoolContentProps) {
  return <>
    {nominationId && <span style={{ color: "var(--accent)" }}>{nominations.find(nom=>nom.id === nominationId)?.title}</span>}
    {pairs.map((pair, idx) => (
      <span key={idx}>
        {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
      </span>
    ))}
  </>
}

function App() {
  const { t, i18n } = useTranslation();
  const { checkForUpdates } = useUpdater()
  /* ---------- атомы ---------- */
  const [user] = useAtom(userAtom);
  const [poolCountDelete, setPoolCountDelete] = useAtom(poolCountDeleteAtom);
  const [isPoolRating, setIsPoolRating] = useAtom(isPoolRatingAtom);
  const [fightTime, setFightTime] = useAtom(fightTimeAtom);
  const [hitZones, setHitZones] = useAtom(hitZonesAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [pools, setPools] = useAtom(poolsAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex, setСurrentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [currentPoolId, setCurrentPoolId] = useAtom(currentPoolIdAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [tournamentSystem, setTournamentSystem] = useAtom(tournamentSystemAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [hotKeys, setHotKeys] = useAtom(hotKeysAtom);
  const [isPoolEnd, setIsPoolEnd] = useAtom(isPoolEndAtom);
  const [participants, setParticipants] = useAtom(participantsAtom);
  const [, setPlayoff] = useAtom(playoffAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom)
  const [currentTournament, setCurrentTournament] = useAtom(currentTournamentAtom)
  const [weaponId, setWeaponId] = useAtom(currentWeaponIdAtom)
  const [nominationId, setNominationId] = useAtom(currentNominationIdAtom)

  const { tournaments } = useOrganizerTournaments(user?.id, language)
  const { tournaments: tournamentsOfModerator } = useTournamentsByIds(user?.moderatorTournamentsIds, language)
  const { pools: poolsFromServer } = usePool(currentTournament?.id)
  const { participants: tournamentParticipants } = useParticipants(currentTournament?.id, currentTournament?.nominationsIds || [])
  const { nominations } = useNominations(language)
  /* ---------- состояние ---------- */
  const [currentTournamentParticipants, setCurrentTournamentParticipants] = useState<NominationUser[]>([])
  const [currentModeratorId, setCurrentModeratorId] = useState("")
  const [newName, setNewName] = useState("");
  const [isSounds, setIsSounds] = useState(true);
  const [showUpdates, setShowUpdates] = useState(true);
  const hotKeysActions = [
    t("addScoreRed"),
    t("removeScoreRed"),
    t("addScoreBlue"),
    t("removeScoreBlue"),
    t("history"),
    t("start"),
    t("viewer"),
  ];
  const systems = [
    {
      label: t("hybridSystem"),
      value: TournamentSystem.HYBRID
    },
    {
      label: t("olympicSystem"),
      value: TournamentSystem.OLYMPIC
    },
    {
      label: t("roundRobin"),
      value: TournamentSystem.ROBIN
    },
    {
      label: t("swissSystem"),
      value: TournamentSystem.SWISS
    }
  ]

  useEffect(()=>{
    if (poolsFromServer && poolsFromServer.length && duels[currentPoolIndex].length === 0) {
      for (let [poolIndex] of poolsFromServer.entries()) {
        setFighterPairs(state=>{
          const buf = [...state]
          buf[poolIndex] = poolsFromServer[poolIndex].pairs.map(pair=>[
            pair[0] !== null ?
            {
              ...fighterDefault,
              name: pair[0].username,
              id: pair[0].id
            } : {...fighterDefault},
            pair[1] !== null ?
            {
              ...fighterDefault,
              name: pair[1].username,
              id: pair[1].id
            } : {...fighterDefault}
          ])

          setPools([...buf])
          return buf
        })
        setParticipants(state=>{
          const buf = [...state]
          buf[poolIndex] = poolsFromServer[poolIndex].pairs.map(pair=>{
            const fighters: ParticipantType[] = []
            if (pair[0] !== null)
              fighters.push({
                ...fighterDefault,
                name: pair[0].username,
                id: pair[0].id
              })
            if (pair[1] !== null)
              fighters.push({
                ...fighterDefault,
                name: pair[1].username,
                id: pair[1].id
              })
            return fighters
          }).flat()

          return buf
        })
        setCurrentPairIndex(state => {
          const buf = [...state]
          buf[poolIndex] = 0
          return buf
        });
        setIsPoolEnd(state=>{
          const buf = [...state]
          buf[poolIndex] = poolsFromServer[poolIndex].isEnd || false
          return buf
        })
        setIsPoolRating(poolsFromServer[poolIndex].isPoolRating)
        setPoolCountDelete(poolsFromServer[poolIndex].poolCountDelete)
        if (poolsFromServer[poolIndex].isEnd) {
          (async ()=>{
            const matches = await getMathes(poolsFromServer[poolIndex].tournamentId, poolsFromServer[poolIndex].nominationId)
            if (Object.keys(matches).length) {
              setDuels(state=>{
                const buf = [...state]
                // @ts-ignore
                buf[poolIndex] = matches.filter(m=>m.poolIndex === poolIndex).map(match=>[[
                  {
                    ...fighterDefault,
                    id: match.red.id,
                    name: match.red.username,
                    wins: match.resultRed,
                    scores: match.scoreRed!,
                    warnings: match.warningsRed!,
                    protests: match.protestsRed!,
                    doubleHits: match.doubleHits!,
                  },
                  {
                    ...fighterDefault,
                    id: match.blue.id,
                    name: match.blue.username,
                    wins: match.resultRed === 1 ? 0 : 1,
                    scores: match.scoreBlue!,
                    warnings: match.warningsBlue!,
                    protests: match.protestsBlue!,
                    doubleHits: match.doubleHits!,
                  },
                ]]).reverse()
                return buf
              })
            }
          })()
        } else {
          setDuels(state => {
            const buf = [...state]
            buf[poolIndex] = []
            return buf
          });
        }
      }
      setTournamentSystem(poolsFromServer[0].system)
      setCurrentPoolId(poolsFromServer[0].id)
      setСurrentPoolIndex(0)
      setHitZones(poolsFromServer[0].hitZones)
      setFightTime(poolsFromServer[0].time)
      setNominationId(poolsFromServer[0].nominationId)
      setWeaponId(nominations.find(nom=>nom.id === poolsFromServer[0].nominationId)?.weapon.id)
    }
  }, [poolsFromServer])

  useEffect(()=>{
    if (tournamentParticipants && nominationId && tournamentParticipants[nominationId]) {
      setCurrentTournamentParticipants(tournamentParticipants[nominationId])
    }
  }, [nominationId])
  /* ---------- загрузка ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [t, z, p, h, s, r, c, lang, isShowUpdates] = await Promise.all([
          storage.get<number>("fightTime"),
          storage.get<HitZonesType>("hitZones"),
          storage.get<ParticipantType[][]>("participants"),
          storage.get<HotKeysType>("hotKeys"),
          storage.get<boolean>("isSounds"),
          storage.get<boolean>("isPoolRating"),
          storage.get<number>("poolCountDelete"),
          storage.get<string>("language"),
          storage.get<boolean>("showUpdates")
        ]);

        if (t) setFightTime(t);
        if (z) setHitZones(z);
        if (p && !participants[0].length) setParticipants(p);
        if (h) setHotKeys(h);
        if (s !== undefined) setIsSounds(s);
        if (r !== undefined) setIsPoolRating(r);
        if (c) setPoolCountDelete(c);
        if (lang) {
          // @ts-ignore
          setLanguage(lang);
          await i18n.changeLanguage(lang);
        }
        if (isShowUpdates) {
          setShowUpdates(isShowUpdates)
        }
        await checkForUpdates(isShowUpdates)
      } catch (error) {
        toast.error(t("settingsLoadError"));
      }
    })();
  }, []);

  /* ---------- сохранение ---------- */
  const saveAll = async () => {
    await storage.set("fightTime", fightTime);
    await storage.set("hitZones", hitZones);
    await storage.set("participants", participants);
    await storage.set("hotKeys", hotKeys);
    await storage.set("isPoolRating", isPoolRating);
    await storage.set("poolCountDelete", poolCountDelete);
    toast.success(t("settingsSaved"));
  };

  const selectPair = (idx: number) => {
    setCurrentPairIndex((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = idx;
      return buf;
    });
  };

  /* ---------- участники ---------- */
  const addPeopleWrap = (callback: ()=>void, resetDuels=false) => {
    if (resetDuels)
      setDuels((state) => {
        const buf = JSON.parse(JSON.stringify(state));
        buf[currentPoolIndex] = [];
        return buf;
      });
    setIsPoolEnd((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = false;
      return buf;
    });

    setCurrentPairIndex(state=>{
      const buf = [...state]
      buf[currentPoolIndex] = 0;
      return buf
    })

    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setHistory([])
    setPlayoff([])
    callback()
  }

  const addPeople = (isOne=false) => {
    addPeopleWrap(()=>
    setFighterPairs(state=>{
      try {
        const buf = [...state];
        if (isOne) {
          buf[currentPoolIndex] = [[
            { ...participants[currentPoolIndex][participants[currentPoolIndex].length-1] },
            { ...fighterDefault }
          ], ...buf[currentPoolIndex]]
        } else {
          buf[currentPoolIndex] = [[
            { ...participants[currentPoolIndex][participants[currentPoolIndex].length-1] },
            { ...participants[currentPoolIndex][participants[currentPoolIndex].length-2] }
          ], ...buf[currentPoolIndex]]
        }
        setPools((p) => {
          const b = [...p];
          b[currentPoolIndex] = [...buf[currentPoolIndex]];
          return b;
        });
        return buf
      } catch(e) {
        return state
      }
    }))
  }

  const addParticipant = (nameProp = "", id="") => {
    if (nameProp && id)
      setCurrentTournamentParticipants(state=>state.filter(s=>s.id !== id))
    const name = nameProp || newName.trim();
    if (!name) return;
    setParticipants((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = [
        ...buf[currentPoolIndex],
        { ...fighterDefault, name, id: id || generateId(name)},
      ];
      return buf;
    });
    setNewName("");
  };

  const removeParticipant = (id: string) => {
    if (nominationId && tournamentParticipants)
      setCurrentTournamentParticipants(state=>[...state, tournamentParticipants[nominationId].find(user=>user.id === id)!].filter(Boolean))
    setParticipants((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = buf[currentPoolIndex].filter(p => p.id !== id);
      return buf;
    });
  }

  const genPairs = () => {
    let newParticipants = [...participants];

    if (newParticipants[currentPoolIndex].length < 2) {
      toast.error(t("addTwoFighters"));
      return;
    }

    addPeopleWrap(()=>{
      const pairs = generatePairs(
        newParticipants[currentPoolIndex],
        tournamentSystem,
        currentPoolIndex,
        setFighterPairs,
        setCurrentPairIndex,
      );

      setPools((state) => {
        const buf = [...state];
        buf[currentPoolIndex] = [...pairs[currentPoolIndex]];
        return buf;
      });
    }, true)
  };

  /* ---------- звуки ---------- */
  const pickSound = async (type: "bell") => {
    try {
      // 1. Показываем системный диалог выбора файла
      const selected = await open({
        multiple: false,
        filters: [{ name: "Audio", extensions: ["mp3", "wav", "ogg", "flac"] }],
      });
      if (!selected) return; // пользователь нажал «отмена»

      const sourcePath = Array.isArray(selected) ? selected[0] : selected;

      // 2. Формируем путь назначения
      const appDir = await appDataDir();
      const destDir = await join(appDir, "sounds");
      const destPath = await join(destDir, `sound_${type}.mp3`);
      await mkdir(destDir, { recursive: true });
      // 3. Копируем
      await copyFile(sourcePath, destPath);
      toast.success(t("fileImportSuccess"));
      storage.set(`${type}Sound`, destPath);
    } catch (err) {
      // @ts-ignore
      toast.error(err);
    }
  };

  const changeLang = async () => {
    const langs = Object.keys(langLabels);
    const currentIndex = langs.indexOf(language);
    const newIndex = currentIndex + 1;
    const newLang = langs[newIndex === langs.length ? 0 : newIndex];

    await i18n.changeLanguage(newLang);
    await storage.set("language", newLang);
    // @ts-ignore
    setLanguage(newLang);
  };

  async function deleteCustomSounds(type: "bell" | "all", isNotify = true) {
    if (type === "bell" || type === "all") {
      const customBellPath = await storage.get<string>("bellSound");
      if (customBellPath) {
        await remove(customBellPath);
        await storage.delete("bellSound");
        if (isNotify) toast.success(t("reset"));
      }
    }
  }

  const savePool = async ()=>{
    if (currentTournament && nominationId) {
      const data: PoolCreatedType = {
          tournamentId: currentTournament.id,
          nominationId,
          time: fightTime,
          system: tournamentSystem,
          hitZones,
          moderatorId: currentModeratorId,
          pairsIds: fighterPairs[currentPoolIndex].map(pair=>[pair[0].id, pair[1].id]),
          isPoolRating,
          poolCountDelete
      }
      if (currentPoolId) {
        const res = await updatePool(currentPoolId, data)
        if (res) {
          toast.success(t("saved"))
        }
      } else {
        const res = await createPool(data)
        if (res) {
          toast.success(t("saved"))
        }
      }
    }
  }

  const resetAll = async () => {
    setFightTime(fightTimeDefault);
    setHitZones(hitZonesDefault);
    setHotKeys(hotKeysDefault);
    setIsPoolRating(true);
    setPoolCountDelete(1);
    await deleteCustomSounds("all", false);
    await storage.clear();

    toast.success(t("reset"));
  };

  useEffect(() => {
    (async () => {
      await storage.set("isSounds", isSounds);
    })();
  }, [isSounds]);

  const isSimpleMode = !poolsFromServer || user?.id === currentTournament?.organizerId

  return (
    <div className={styles.container}>
      <div className={styles.pool} style={{ paddingLeft: "30px" }}>
        {pools
          .filter((_, idx) => idx % 2 === 0)
          .map((pairs, i) => (
            <Section title={t("pool") + " " + (i * 2 + 1).toString()} key={i}>
              <PoolControllers
                pool={i * 2}
                isEnd={isPoolEnd[i * 2]}
                setIsPoolEnd={setIsPoolEnd}
                currentPoolIndex={currentPoolIndex}
                setDuels={setDuels}
                setPools={setPools}
                setFighterPairs={setFighterPairs}
                setСurrentPoolIndex={setСurrentPoolIndex}
                setParticipants={setParticipants}
              />
              <PoolContent nominationId={poolsFromServer?.[i * 2]?.nominationId || nominationId} pairs={pairs} nominations={nominations} />
            </Section>
          ))}
      </div>
      <div className={styles.content}>
        {/* Кнопка смены языка */}
        <div className={styles.langRow}>
          <button
            onClick={changeLang}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <span className={styles.langBtn}>{language.toUpperCase()}</span>
          </button>
        </div>

        {(!!tournaments.length || !!tournamentsOfModerator?.length) && user &&
        (
          <Section title={t("tournaments")}>
            <Select
              placeholder={t("yourTournamets")}
              setValue={(val)=>setCurrentTournament(JSON.parse(val))}
              value={JSON.stringify(currentTournament)}
              options={(tournaments.length ? tournaments : tournamentsOfModerator!).filter(t=>t.status === TournamentStatus.ACTIVE).map(t=>({ label: t.title, value: JSON.stringify(t) }))}
            />
            {currentTournament && !!tournaments.length &&
            <>
              <WeaponNominationsSelect
              nominations={currentTournament.nominations}
              weaponId={weaponId}
              nominationId={nominationId}
              setNominationId={setNominationId}
              setWeaponId={setWeaponId}
              />
              {tournamentParticipants && nominationId && currentTournament.organizerId === user.id &&
              <>
              <span style={{ marginTop: "10px" }}>{t("participants")}</span>
              {currentTournamentParticipants?.filter(p=>p.status === ParticipantStatus.CONFIRMED).map((p, idx)=>
                <div key={idx} className={styles.participantRow}>
                  <span className={styles.participantTxt}>{p.username}</span>
                  <button onClick={()=>addParticipant(p.username, p.id)}>
                    <Plus size={22} color="var(--fg)" />
                  </button>
                </div>
              )}
              <span>{t("moderator")}</span>
              <Select
              options={currentTournament.moderators.map(m=>({ label: m.username, value: m.id }))}
              value={currentModeratorId}
              setValue={setCurrentModeratorId}
              />
              <Button
              title={t("savePoolsForModerator")}
              onClick={savePool}
              disabled={!currentModeratorId || !fighterPairs[currentPoolIndex].length}
              />
            </>
            }
            </>
            }
          </Section>
        )
        }

        {/* --- 1. Участники --- */}
        <Section title={t("participants")}>
          <>
            <InputText
              placeholder={t("name")}
              value={newName}
              setValue={setNewName}
            />

            <Button
              className={styles.addBtn}
              onClick={()=>addParticipant()}
            >
              <Plus size={28} color="var(--fg)" />
            </Button>

            {isSimpleMode && participants[currentPoolIndex]?.map((p, idx) => (
              <div key={idx} className={styles.participantRow}>
                <span className={styles.participantTxt}>{p.name}</span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={22} color="var(--fg)" />
                </button>
              </div>
            ))}

            <div className={styles.zoneRow} style={{ marginTop: "20px" }}>
              {t("pool")}
              <InputNumber
                value={currentPoolIndex + 1}
                setValue={(pool) => {
                  if (pool - 1 === fighterPairs.length) {
                    setFighterPairs((state) => [...state, ...pairsDefault]);
                    setPools((state) => [...state, ...pairsDefault]);
                    setParticipants((state) => [...state, []]);
                    setCurrentPairIndex((state) => [...state, 0]);
                    setDuels((state) => [...state, []]);
                    setIsPoolEnd((state) => [...state, false]);
                  }

                  if (poolsFromServer && poolsFromServer.length >= pool) {
                    setСurrentPoolIndex(pool - 1);
                    setCurrentPoolId(poolsFromServer[pool - 1].id)
                    setHitZones(poolsFromServer[pool - 1].hitZones)
                    setFightTime(poolsFromServer[pool - 1].time)
                    setNominationId(poolsFromServer[pool - 1].nominationId)
                    setWeaponId(nominations.find(nom=>nom.id === poolsFromServer[pool - 1].nominationId)!.weapon.id)
                  } else if (isSimpleMode)
                    setСurrentPoolIndex(pool - 1);
                }}
                min={1}
                max={!isSimpleMode ? poolsFromServer.length : undefined}
              />
            </div>
            <RadioGroup disabled={!isSimpleMode} name="system" onChange={(val)=>setTournamentSystem(val)} value={tournamentSystem} options={systems} />
          </>

          <Button
            style={{ marginTop: 10 }}
            title={t("addNewPair")}
            onClick={()=>addPeople(false)}
            disabled={participants[currentPoolIndex].length < 2}
            stroke
          />

          <Button
            title={t("addNewPerson")}
            onClick={()=>addPeople(true)}
            disabled={participants[currentPoolIndex].length < 1}
            stroke
          />

          <Button
            onClick={genPairs}
            title={t("randomizePairs")}
            stroke
          />
        </Section>

        <SelectPair
          poolIndex={currentPoolIndex}
          fighterPairs={fighterPairs}
          currentPairIndex={currentPairIndex[currentPoolIndex]}
          selectPair={selectPair}
          onPairsReordered={setFighterPairs}
          setPools={isSimpleMode ? setPools : undefined}
          onDeletePair={(id1, id2)=>{ removeParticipant(id1); removeParticipant(id2) }}
          manualMode
        />
        {/* --- 2. Длительность --- */}
        <Section title={t("fightDuration")}>
          <TimePicker onChange={setFightTime} value={fightTime} />
        </Section>

        {/* --- 3. Зоны поражения --- */}
        <Section title={t("hitZones")}>
          {Object.entries(hitZones).map(([zone, pts]) => (
            <div key={zone} className={styles.zoneRow}>
              <span className={styles.zoneLabel}>{t(zone)}</span>
              <InputNumber
                value={pts}
                setValue={(val) =>
                  setHitZones({ ...hitZones, [zone]: Number(val) || 0 })
                }
              />
            </div>
          ))}
          <Button
            onClick={() => setHitZones(hitZonesDefault)}
            style={{ marginTop: 10 }}
            stroke
          >
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        {/* --- 4. Системные звуки --- */}
        <Section title={t("sounds")}>
          <Button
            onClick={() => pickSound("bell")}
            title={t("changeBellSound")}
          />
          <Switch
            title={t("soundsOn")}
            value={isSounds}
            setValue={setIsSounds}
          />
          <Button
            onClick={() => deleteCustomSounds("all")}
            style={{ marginTop: 10 }}
            stroke
          >
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        <Section title={t("hotKeys")}>
          {Object.keys(hotKeys).map((action, idx) => (
            <div key={idx} className={styles.zoneRow}>
              {hotKeysActions[idx]}
              <InputText
                //@ts-ignore
                value={hotKeys[action]}
                onKeyDown={(e) =>
                  setHotKeys((prev) => ({ ...prev, [action]: e.code }))
                }
                style={{ width: "130px", textAlign: "center" }}
                maxLength={1}
              />
            </div>
          ))}
          <Button
            onClick={() => setHotKeys(hotKeysDefault)}
            style={{ marginTop: 10 }}
            stroke
          >
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
        </Section>

        <Section title={t("pool")}>
          <div className={styles.zoneRow}>
            <span style={{ width: "200px", wordBreak: "break-word" }}>
              {t("poolCountDelete")}
            </span>
            <InputNumber
              value={poolCountDelete}
              setValue={setPoolCountDelete}
              min={1}
            />
          </div>
          <Switch
            title={t("isPoolRating")}
            value={isPoolRating}
            setValue={setIsPoolRating}
          />
        </Section>

        <Section title={t("notifications")}>
          <Switch
            title={t("applicationUpdates")}
            value={showUpdates}
            setValue={async (val)=>{ setShowUpdates(val); await storage.set<boolean>("showUpdates", val) }}
          />
        </Section>

        {/* --- 5. Сохранить --- */}
        <Section>
          <Button onClick={saveAll}>
            <Save size={28} color="var(--fg)" />
          </Button>
          <Button onClick={resetAll} style={{ marginTop: 10 }} stroke>
            <RefreshCw size={28} color="var(--fg)" />
          </Button>
          <Button onClick={openFightViewerWindow} stroke>
            <PictureInPicture2 size={28} color="var(--fg)" />
          </Button>
        </Section>
      </div>
      <div className={styles.pool} style={{ paddingRight: "30px" }}>
        {pools
          .filter((_, idx) => idx % 2 !== 0)
          .map((pairs, i) => (
            <Section title={t("pool") + " " + ((i + 1) * 2).toString()} key={i}>
              <PoolControllers
                pool={(i + 1) * 2 - 1}
                isEnd={isPoolEnd[(i + 1) * 2 - 1]}
                setIsPoolEnd={setIsPoolEnd}
                currentPoolIndex={currentPoolIndex}
                setDuels={setDuels}
                setPools={setPools}
                setFighterPairs={setFighterPairs}
                setСurrentPoolIndex={setСurrentPoolIndex}
                setParticipants={setParticipants}
              />
              <PoolContent nominationId={poolsFromServer?.[(i + 1) * 2 - 1]?.nominationId || nominationId} pairs={pairs} nominations={nominations} />
            </Section>
          ))}
      </div>
    </div>
  );
}

export default App;
