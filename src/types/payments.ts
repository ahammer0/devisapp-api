export type payment = {
  id: number;
  user_id: number;
  amount: number;
  is_valid: boolean;
  stripe_pi: string;
  date: Date;
};
export type paymentCreate = {
  user_id: number;
  amount: number;
  stripe_pi: string;
};
