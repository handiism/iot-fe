export interface Cell {
  key: "id" | "status" | "time";
  label: string;
}

export default interface Lamp {
  id: number;
  status: boolean;
  time: Date;
}
