export type customer = {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
};

export type customer_create = Partial<Omit<customer, "id">> & {
  user_id: customer["user_id"];
};
