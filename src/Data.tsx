export interface Cell {
  key: "id" | "status" | "timestamp";
  label: string;
}

export default interface Lamp {
  id: number;
  status: boolean;
  timestamp: Date;
}
