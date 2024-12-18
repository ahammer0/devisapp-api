export type work = {
  id: number;
  user_id: number;
  name: string;
  unit: string;
  unit_price: number;
  unit_time: number;
  buy_price: number;
  isFavorite: boolean;
  type: "template" | "custom";
};
export type workCreate = Omit<work, "id">;
