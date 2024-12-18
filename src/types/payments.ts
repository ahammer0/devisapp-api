export type payment = {
  id: number;
  user_id: number;
  amount: number;
  date: Date;
};
export type paymentCreate = {
  user_id: number;
  amount: number;
};
