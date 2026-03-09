import { ParticipantType } from '@typings';

export function incWin(
    scores: number,
    winnerId: string,
    opponent: string,
    pairIndex: number,
    poolIndex: number,
    setter: React.Dispatch<React.SetStateAction<ParticipantType[][][]>>,
    warnings: number,
    protests: number,
    doubleHits: number,
    isLosse=false,
    draws=0
)
{
  setter(prev =>{
      const buf: ParticipantType[][][] = JSON.parse(JSON.stringify(prev))
      buf[poolIndex] = buf[poolIndex].map((pair, i) =>{
            if (pairIndex === i) {
                return pair.map(p =>
                    p.id === winnerId ? { ...p, wins: (isLosse && !draws) ? 0 : 1, scores, losses: (isLosse && !draws) ? 1: 0, draws: p.draws + draws, opponents: [...p.opponents, opponent], warnings, protests, doubleHits } : p
                )
            }
            return pair
        }
      )
      return buf
    });
}