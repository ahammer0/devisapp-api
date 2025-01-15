import { customer, customer_create } from "./customers";

export type quote = {
  id: number;
  user_id: number;
  customer_id: number | null;
  global_discount: number; //default 0.0
  name: string | null;
  general_infos: string | null;
  status: "quote" | "draft" | "invoice" | "validated"; //default draft
  expires_at: string | Date;
  created_at: string; //default now()
};
export type quote_create = Partial<
  Omit<quote, "id" | "user_id" | "created_at">
> & {
  user_id: quote["user_id"];
};

export type quote_element = {
  id: number;
  quote_id: number;
  work_id: number;
  quote_section: string;
  discount: number;
  quantity: number;
};
export type quote_element_create = Omit<quote_element, "id" | "quote_id">;

export type quote_media = {
  id: number;
  path_name: string;
  alt_text: string;
  quote_id: number;
};
export type quote_media_create = Omit<quote_media, "id" | "quote_id">;

export type full_quote = Omit<quote, "customer_id"> & {
  customer: customer | null;
  quote_elements: quote_element[];
  quote_medias: quote_media[];
};

export type quote_full_create = Exclude<quote_create, "customer_id"> & {
  quote_elements?: quote_element_create[];
  quote_medias?: quote_media_create[];
} & (
    | { customer?: customer_create; customer_id?: never }
    | { customer_id: customer["id"]; customer?: never }
  );
