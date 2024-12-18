export type quote = {
  id: number;
  user_id: number;
  global_discount: number;
  general_infos: string;
  status: "quote" | "draft" | "invoice" | "validated";
  expires_at: string;
  created_at: string;
};

export type quote_element = {
  id: number;
  quote_id: number;
  work_id: number;
  quote_section: string;
  discount: number;
  quantity: number;
};

export type quote_media = {
  id: number;
  path_name: string;
  alt_text: string;
  quote_id: number;
};

export type full_quote = quote & {
  quote_elements: quote_element[];
  quote_medias: quote_media[];
};
