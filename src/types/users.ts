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
  company_type:"Individuelle"|"SAS"|"SARL"|"EURL";
  account_status:"valid"|"blocked"|"deleted"|"waiting";
  subscription_plan:"free"|"paid";
  created_at: string; //timestamp
  updated_at: string; //timestamp
  quote_infos: string;
}
