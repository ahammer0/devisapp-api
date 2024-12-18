export type user = {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_address: string;
  siret: string;
  ape_code: string;
  rcs_code: string;
  tva_number: string;
  company_type: "Individuelle" | "SAS" | "SARL" | "EURL";
  account_status: "valid" | "blocked" | "deleted" | "waiting";
  subscription_plan: "free" | "paid";
  created_at: Date; //timestamp
  updated_at: Date; //timestamp
  quote_infos: string;
};
export type userCreate = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_address?: string;
  siret?: string;
  ape_code?: string;
  rcs_code?: string;
  tva_number?: string;
  company_type: "Individuelle" | "SAS" | "SARL" | "EURL";
  account_status: "valid" | "blocked" | "deleted" | "waiting";
  subscription_plan: "free" | "paid";
  created_at?: Date; //timestamp
  expires_at?: Date; //timestamp
  quote_infos?: string;
};
