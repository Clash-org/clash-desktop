import {
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
  isPlayoffAtom,
  isPoolRatingAtom,
  isSwissAtom,
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
} from "@store";
import { ParticipantType } from "@typings";
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

type TrashPairProps = {
  setFighterPairs: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>;
  setPools: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>;
  setСurrentPoolIndex: React.Dispatch<React.SetStateAction<number>>;
  setParticipants: Dispatch<SetStateAction<ParticipantType[][]>>;
  setDuels: Dispatch<SetStateAction<ParticipantType[][][][]>>;
  setIsPlayoff: Dispatch<SetStateAction<boolean[]>>;
  currentPoolIndex: number;
  pool: number;
};

function PoolControllers({
  setFighterPairs,
  setPools,
  setDuels,
  setСurrentPoolIndex,
  setParticipants,
  setIsPlayoff,
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
    setIsPlayoff((state) => state.filter((_, idx) => idx !== pool));
  };

  const importFile = async () => {
    const res = await importExcel();
    if (res) {
      const [data, length] = res;
      const stateHandlerWrap =
        (onlyFirst: boolean) => (state: ParticipantType[][][]) => {
          let firstList: ParticipantType[][] = [];
          const allLists: ParticipantType[][][] = [];
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
        const buf: ParticipantType[][][][] = JSON.parse(JSON.stringify(state));
        buf[pool] = [];
        buf[pool] = stateHandlerWrap(false)(buf[pool]);
        setIsPlayoff((isEnds) => {
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
        const virtualArr: ParticipantType[][][] = new Array(pool + 1);
        virtualArr[pool] = [...buf];
        buf[pool] = stateHandlerWrap(true)(virtualArr)
          [pool].flat()
          .filter((item) => item.name !== "—");
        return buf;
      });
    }
  };

  return (
    <div className={styles.poolController}>
      <Upload className={styles.trashIcon} onClick={importFile} />
      {pool !== 0 ? (
        <Trash2 className={styles.trashIcon} onClick={deleteHandler} />
      ) : (
        <></>
      )}
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  /* ---------- атомы ---------- */
  const [poolCountDelete, setPoolCountDelete] = useAtom(poolCountDeleteAtom);
  const [isPoolRating, setIsPoolRating] = useAtom(isPoolRatingAtom);
  const [fightTime, setFightTime] = useAtom(fightTimeAtom);
  const [hitZones, setHitZones] = useAtom(hitZonesAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [pools, setPools] = useAtom(poolsAtom);
  const [currentPairIndex, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex, setСurrentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [isSwiss, setisRobin] = useAtom(isSwissAtom);
  const [, setDuels] = useAtom(duelsAtom);
  const [hotKeys, setHotKeys] = useAtom(hotKeysAtom);
  const [, setIsPlayoff] = useAtom(isPlayoffAtom);
  const [participants, setParticipants] = useAtom(participantsAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [, setHistory] = useAtom(historyAtom)

  /* ---------- состояние ---------- */
  const [newName, setNewName] = useState("");
  const [isSounds, setIsSounds] = useState(true);
  const hotKeysActions = [
    t("addScoreRed"),
    t("removeScoreRed"),
    t("addScoreBlue"),
    t("removeScoreBlue"),
    t("history"),
    t("start"),
    t("viewer"),
  ];
  /* ---------- загрузка ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [t, z, p, h, s, r, c, lang] = await Promise.all([
          storage.get<number>("fightTime"),
          storage.get<HitZonesType>("hitZones"),
          storage.get<ParticipantType[][]>("participants"),
          storage.get<HotKeysType>("hotKeys"),
          storage.get<boolean>("isSounds"),
          storage.get<boolean>("isPoolRating"),
          storage.get<number>("poolCountDelete"),
          storage.get<string>("language"),
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
      } catch (error) {
        console.error("❌ Failed to load settings:", error);
        toast.error("Failed to load settings");
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
    setIsPlayoff((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = false;
      return buf;
    });

    setCurrentPairIndex(state=>{
      const buf = [...state]
      buf[currentPoolIndex] = 0;
      return buf
    })
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
          b[currentPoolIndex] = buf[currentPoolIndex];
          return b;
        });
        return buf
      } catch(e) {
        return state
      }
    }))
    setScore1(0);
    setScore2(0);
    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setHistory([])
  }

  const addParticipant = () => {
    const name = newName.trim();
    if (!name) return;
    setParticipants((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = [
        ...buf[currentPoolIndex],
        { ...fighterDefault, name, id: generateId(name) },
      ];
      return buf;
    });
    setNewName("");
  };

  const removeParticipant = (idx: number) =>
    setParticipants((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = buf[currentPoolIndex].filter((_, i) => i !== idx);
      return buf;
    });

  const genPairs = () => {
    let newParticipants = [...participants];

    if (newParticipants[currentPoolIndex].length < 2) {
      toast.error(t("addTwoFighters"));
      return;
    }

    addPeopleWrap(()=>{
      const pairs = generatePairs(
        newParticipants[currentPoolIndex],
        isSwiss,
        currentPoolIndex,
        setFighterPairs,
        setCurrentPairIndex,
      );

      setPools((state) => {
        const buf = [...state];
        buf[currentPoolIndex] = pairs[currentPoolIndex];
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
      toast.success(`Трек загружен:\n${destPath}`);
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

  return (
    <div className={styles.container}>
      <div className={styles.pool} style={{ paddingLeft: "30px" }}>
        {pools
          .filter((_, idx) => idx % 2 === 0)
          .map((pairs, i) => (
            <Section title={t("pool") + " " + (i * 2 + 1).toString()} key={i}>
              <PoolControllers
                pool={i * 2}
                setIsPlayoff={setIsPlayoff}
                currentPoolIndex={currentPoolIndex}
                setDuels={setDuels}
                setPools={setPools}
                setFighterPairs={setFighterPairs}
                setСurrentPoolIndex={setСurrentPoolIndex}
                setParticipants={setParticipants}
              />
              {pairs.map((pair, idx) => (
                <span key={idx}>
                  {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                </span>
              ))}
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
              onClick={addParticipant}
            >
              <Plus size={28} color="var(--fg)" />
            </Button>

            {participants[currentPoolIndex]?.map((p, idx) => (
              <div key={idx} className={styles.participantRow}>
                <span className={styles.participantTxt}>{p.name}</span>
                <button
                  onClick={() => removeParticipant(idx)}
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
                onChange={(pool) => {
                  if (pool - 1 === fighterPairs.length) {
                    setFighterPairs((state) => [...state, ...pairsDefault]);
                    setPools((state) => [...state, ...pairsDefault]);
                    setParticipants((state) => [...state, []]);
                    setCurrentPairIndex((state) => [...state, 0]);
                    setDuels((state) => [...state, []]);
                    setIsPlayoff((state) => [...state, false]);
                  }
                  setСurrentPoolIndex(pool - 1);
                }}
                min={1}
              />
            </div>
            <Switch
              title={t("swissSystem")}
              value={isSwiss}
              setValue={setisRobin}
            />
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
                onChange={(val) =>
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
              onChange={setPoolCountDelete}
              min={1}
            />
          </div>
          <Switch
            title={t("isPoolRating")}
            value={isPoolRating}
            setValue={setIsPoolRating}
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
                setIsPlayoff={setIsPlayoff}
                currentPoolIndex={currentPoolIndex}
                setDuels={setDuels}
                setPools={setPools}
                setFighterPairs={setFighterPairs}
                setСurrentPoolIndex={setСurrentPoolIndex}
                setParticipants={setParticipants}
              />
              {pairs.map((pair, idx) => (
                <span key={idx}>
                  {`${getName(pair[0].name)} VS ${getName(pair[1].name)}`}
                </span>
              ))}
            </Section>
          ))}
      </div>
    </div>
  );
}

export default App;
