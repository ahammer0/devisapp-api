export type customer = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  zip: number;
  phone: string;
  email: string;
};

export type customer_create = Partial<Omit<customer, "id">> & {
  user_id: customer["user_id"];
};
