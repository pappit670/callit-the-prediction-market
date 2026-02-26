// Crowd context labels
export function getCrowdContext(yesPercent: number, noPercent: number): { label: string; classes: string } {
  const diff = Math.abs(yesPercent - noPercent);
  if (yesPercent >= 75) return { label: "High Confidence", classes: "text-yes font-semibold" };
  if (noPercent >= 75) return { label: "High Confidence", classes: "text-no font-semibold" };
  if (diff <= 10) return { label: "Balanced", classes: "text-muted-foreground" };
  if (yesPercent <= 25) return { label: "Contrarian Opportunity", classes: "text-gold" };
  if (noPercent <= 25) return { label: "Contrarian Opportunity", classes: "text-gold" };
  return {
    label: `Leaning ${yesPercent > noPercent ? "Yes" : "No"}`,
    classes: yesPercent > noPercent ? "text-yes/70" : "text-no/70",
  };
}

// Payout with early multiplier and +3% floor
export function calculateNetWin(
  stakeAmount: number,
  sidePercent: number,
  multiplier: number = 1
): { netWin: number; floorApplied: boolean } {
  const rawNet = stakeAmount * (100 / sidePercent) * 0.9 * multiplier - stakeAmount;
  const minNet = stakeAmount * 0.03;
  const floorApplied = rawNet < minNet;
  return { netWin: Math.max(rawNet, minNet), floorApplied };
}

// Whale cap
export function getMaxCall(poolCoins: number): number {
  return Math.floor(poolCoins * 0.2);
}
