// Funciones puras de cálculo (replican las reglas de la Fase 1 / Excel)

export function basesTotal(hits: number, doubles: number, triples: number, homeRuns: number): number {
  return (hits - doubles - triples - homeRuns) + doubles * 2 + triples * 3 + homeRuns * 4;
}

export function battingAverage(hits: number, atBats: number): number {
  if (atBats === 0) return 0;
  return hits / atBats;
}

export function slugging(bases: number, atBats: number): number {
  if (atBats === 0) return 0;
  return bases / atBats;
}

// innings en tercios (3.1 = 3 entradas + 1 out) -> outs
export function inningsOuts(innings: number): number {
  const whole = Math.floor(innings);
  const frac = Math.round((innings - whole) * 10);
  return whole * 3 + frac;
}

export function pclEra(earnedRuns: number, totalOuts: number): number {
  if (totalOuts === 0) return 0;
  return (earnedRuns * 27) / totalOuts;
}

// outs -> notación de tercios (18 outs -> 6.0, 10 outs -> 3.1)
export function outsToInnings(outs: number): number {
  const whole = Math.floor(outs / 3);
  const frac = outs % 3;
  return whole + frac / 10;
}

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
