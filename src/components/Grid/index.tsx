import Button from "@/components/Button";
import Table from "@/components/Table";
import {
  currentPairIndexAtom,
  currentPoolIndexAtom,
  doubleHitsAtom,
  duelsAtom,
  fighterPairsAtom,
  isPlayoffAtom,
  isPoolRatingAtom,
  playoffAtom,
  poolCountDeleteAtom,
  protests1Atom,
  protests2Atom,
  score1Atom,
  score2Atom,
  tournamentSystemAtom,
  warnings1Atom,
  warnings2Atom,
} from "@/store";
import { generatePairs } from "@/utils/generatePairs";
import { isPoolEndByDuels, truncate } from "@/utils/helpers";
import { useAtom } from "jotai";
import { ChartColumn, Save } from "lucide-react";
import { useState } from "react";

import styles from "./index.module.css";
import { ParticipantType, TournamentSystem } from "@/typings";
import { useTranslation } from "react-i18next";
import { calculateAllSD, getAllInOneParticipants, getTopThreeFighters, getWinnersRobin, getWinnersSwiss } from "@/utils/matchesHandlers";
import { exportExcel } from "@/utils/exportExcel";
import { generatePlayoffPairs } from "@/utils/generatePlayoffPairs";
import Playoff from "../Playoff";
import ModalWindow from "../ModalWindow";

export default function TournamentGridScreen({
  fightActivate,
}: {
  fightActivate: () => void;
}) {
  const { t } = useTranslation();
  const [poolCountDelete] = useAtom(poolCountDeleteAtom);
  const [isPoolRating] = useAtom(isPoolRatingAtom);
  const [fighterPairs, setFighterPairs] = useAtom(fighterPairsAtom);
  const [tournamentSystem] = useAtom(tournamentSystemAtom);
  const [winners, setWinners] = useState<string[]>([]);
  const [, setCurrentPairIndex] = useAtom(currentPairIndexAtom);
  const [currentPoolIndex] = useAtom(currentPoolIndexAtom);
  const [duels, setDuels] = useAtom(duelsAtom);
  const [, setDoubleHits] = useAtom(doubleHitsAtom);
  const [, setProtests1] = useAtom(protests1Atom);
  const [, setProtests2] = useAtom(protests2Atom);
  const [, setWarnings1] = useAtom(warnings1Atom);
  const [, setWarnings2] = useAtom(warnings2Atom);
  const [, setScore1] = useAtom(score1Atom);
  const [, setScore2] = useAtom(score2Atom);
  const [playoff, setPlayoff] = useAtom(playoffAtom);
  const [isEnd, setIsEnd] = useAtom(isPlayoffAtom);
  const [showRank, setShowRank] = useState(false)
  const [rank, setRank] = useState<ParticipantType[]>([])
  const [idsSD, setIdsSD] = useState<Map<string, number>>(new Map<string, number>())

  const isRound = tournamentSystem === TournamentSystem.HYBRID || tournamentSystem === TournamentSystem.ROBIN || tournamentSystem === TournamentSystem.SWISS

  const headers = [
    t("name"),
    t("win"),
    t("score"),
    t("score"),
    t("win"),
    t("name"),
  ];

  const headersRank = [
    t("name"),
    t("win"),
    t("losses"),
    t("draw"),
    t("score"),
    "SD",
    tournamentSystem === TournamentSystem.SWISS ? t("buchholz") : ""
  ].filter(Boolean)

  const endTournament = (endFightersBuchholz?: {[id: string]: number}) => {
    let winnersArr: string[] = new Array(3)
    if (tournamentSystem === TournamentSystem.ROBIN) {
      const { winners, ranking } = getWinnersRobin(
        getAllInOneParticipants([fighterPairs[currentPoolIndex], ...duels[currentPoolIndex]])
      )
      setRank(ranking)
      winnersArr = winners
      setIdsSD(calculateAllSD([...duels[currentPoolIndex], fighterPairs[currentPoolIndex]]))
    } else if (tournamentSystem === TournamentSystem.SWISS) {
      const all = getAllInOneParticipants(
        [fighterPairs[currentPoolIndex], ...duels[currentPoolIndex]],
        endFightersBuchholz
      )
      const { winners, ranking } = getWinnersSwiss(
        all
      )
      setRank(ranking)
      winnersArr = winners
      setIdsSD(calculateAllSD([...duels[currentPoolIndex], fighterPairs[currentPoolIndex]]))
    } else if (tournamentSystem === TournamentSystem.OLYMPIC) {
      winnersArr = getTopThreeFighters([
        ...duels[currentPoolIndex],
        fighterPairs[currentPoolIndex],
      ]);
    }
    setFighterPairs((state) => {
      const buf = JSON.parse(JSON.stringify(state));
      buf[currentPoolIndex] = [];
      return buf;
    });
    setWinners(winnersArr);
    setIsEnd((state) => {
      const buf = [...state];
      buf[currentPoolIndex] = true;
      return buf;
    });
  };

  const genPairs = async () => {
    const newFighters = !isRound
      ? (fighterPairs[currentPoolIndex]
          .map((pair) => {
            if (pair[0]?.name === "—") {
              return pair[1];
            } else if (pair[1]?.name === "—") {
              return pair[0];
            } else {
              return pair[0].wins > pair[1].wins
                ? { ...pair[0], wins: 0, scores: 0 }
                : { ...pair[1], wins: 0, scores: 0 };
            }
          })
          .filter(Boolean) as ParticipantType[])
      : fighterPairs[currentPoolIndex]
          .map((pair) => {
            if (tournamentSystem === TournamentSystem.SWISS) {
              const calculateBuchholz = (idx: number) => {
                // const currentFighters = fighterPairs[currentPoolIndex].flat()
                const allFighters = getAllInOneParticipants([fighterPairs[currentPoolIndex], ...duels[currentPoolIndex]])

                if (allFighters.length) {
                  return pair[idx].opponents
                        .reduce((sum, opId) => {
                          const opponent = allFighters.find(fighter=>fighter.id === opId)
                          return sum + (opponent?.wins || 0);  // или opponent?.scores
                        }, 0);
                } else {
                  return 0
                }
              }

              return [
                { ...pair[0], wins: 0, scores: 0, buchholz: calculateBuchholz(0) },
                { ...pair[1], wins: 0, scores: 0, buchholz: calculateBuchholz(1) },
              ];
            }
            return [
              { ...pair[0], wins: 0, scores: 0 },
              { ...pair[1], wins: 0, scores: 0 },
            ];
          })
          .flat();
    setDuels((prev) => {
      const buf = JSON.parse(JSON.stringify(prev));
      buf[currentPoolIndex].push(fighterPairs[currentPoolIndex]);
      return buf;
    });
    if (newFighters.length > 1) {
      const newPairs = generatePairs(
        newFighters,
        tournamentSystem,
        currentPoolIndex,
        setFighterPairs,
        setCurrentPairIndex
      );

      if (isRound) {
        const pairs = newPairs[currentPoolIndex].flat();
        if (
          pairs.filter((pair) => pair.name === "—").length ===
          pairs.filter((pair) => pair.name !== "—").length
        ) {
          endTournament(
            newFighters.reduce((acc, user) => {
          acc[user.id] = user.buchholz;
          return acc;
          }, {} as {[id: string]: number})
          );
        }
      }
    } else {
      endTournament();
    }

    setDoubleHits(0);
    setProtests1(0);
    setProtests2(0);
    setWarnings1(0);
    setWarnings2(0);
    setScore1(0);
    setScore2(0);
  };

  const getDataTable = (data: ParticipantType[][]) => {
    return {
      data: data.map(([f1, f2]) => [
        truncate(f1?.name || ""),
        f1.wins.toString(),
        f1.scores.toString(),
        f2.scores.toString(),
        f2.wins.toString(),
        truncate(f2?.name || ""),
      ]),
      titles: data.map(([f1, f2]) => [
        f1?.name,
        "",
        "",
        "",
        "",
        f2?.name,
      ])
    }
  }


  const getDataRankTable = (data: ParticipantType[]) => {
    return {
      data: data.map((f) => [
        truncate(f.name || ""),
        f.wins.toString(),
        f.losses.toString(),
        f.draws.toString(),
        f.scores.toString(),
        idsSD.get(f.id)?.toString() || "",
        tournamentSystem === TournamentSystem.SWISS ? f.buchholz.toString() : ""
      ]).filter(Boolean),
      titles: data.map((f) => [
        f?.name,
        "",
        "",
        "",
        "",
        "",
        ""
      ])
    }
  }

  const isPoolInProgress = !isPoolEndByDuels(duels, currentPoolIndex);
  const sections = [
    ...(isPoolInProgress &&
    fighterPairs[currentPoolIndex].filter((p) => p.length).length
      ? [
          {
            key: "current",
            title: t("currentStage"),
            content: getDataTable(fighterPairs[currentPoolIndex]),
          },
        ]
      : []),
    ...duels[currentPoolIndex].map((duel, i) => ({
      key: `duel-${i}`,
      title: `${i + 1} ${t("stage")}`,
      content: getDataTable(duel),
    })),
  ];

  return !playoff.length ? (
    <div className={styles.container}>
      {!isEnd.includes(false) && tournamentSystem === TournamentSystem.HYBRID && (
        <Button
          onClick={() =>
            setPlayoff(
              generatePlayoffPairs(duels, poolCountDelete, isPoolRating),
            )
          }
          title={t("playoff")}
          style={{ width: "100%", marginBottom: "10px" }}
        />
      )}

      {!!winners.length && tournamentSystem !== TournamentSystem.HYBRID && (
        <div className={styles.winners}>
          <span className={styles.winner}>
            <span>2</span>
            <span>{winners[1]}</span>
          </span>
          <span className={styles.first}>
            <span>1</span>
            <span>{winners[0]}</span>
          </span>
          <span className={styles.winner}>
            <span>3</span>
            <span>{winners[2]}</span>
          </span>
          {tournamentSystem !== TournamentSystem.OLYMPIC &&
          <Button onClick={()=>setShowRank(true)} style={{ position: "absolute", right: "25px", minWidth: "8px" }}>
            <ChartColumn size={28} />
          </Button>
          }
        </div>
      )}
      {sections.map((item, index) => (
        <div key={item.key} className={styles.duelWrap}>
          <h2 className={styles.duelTitle}>{item.title}</h2>
          <Table data={item.content.data} titles={item.content.titles} headers={headers} />

          {index === 0 &&
          fighterPairs[currentPoolIndex].filter((p) => p.length).length &&
          isPoolInProgress &&
          isEnd.includes(false) ? (
            <Button
              title={t("stageEnd")}
              onClick={genPairs}
              disabled={
                fighterPairs[currentPoolIndex].filter(
                  (pair) => pair[0].name !== "—" && pair[1].name !== "—",
                ).length !==
                fighterPairs[currentPoolIndex].filter(
                  (pair) =>
                    (pair[0].wins || pair[1].wins) &&
                    pair[0].name !== "—" &&
                    pair[1].name !== "—",
                ).length
              }
            />
          ) : (
            <></>
          )}
        </div>
      ))}
      <Button
        onClick={() =>
          exportExcel(
            duels[currentPoolIndex],
            `${t("pool") + " " + (currentPoolIndex + 1)}.xlsx`,
          )
        }
        style={{ width: "100%" }}
      >
        <Save size={28} />
      </Button>
      <ModalWindow isOpen={showRank} onClose={()=>setShowRank(false)} style={{ maxWidth: "40rem" }}>
        {(()=>{
          const content = getDataRankTable(rank)
          return (
            <Table data={content.data} titles={content.titles} headers={headersRank} />
          )
        })()}
      </ModalWindow>
    </div>
  ) : (
    <Playoff fightActivate={fightActivate} />
  );
}
