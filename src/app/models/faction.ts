export interface Faction {
  id: number;
  name: string;
  color: string; // hex string from backend (e.g. "#FF0000")
  allies?: number[];
}
