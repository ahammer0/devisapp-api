export type ticket = {
  id: number;
  user_id: number;
  status: "open" | "closed";
  created_at: Date;
  object: string;
  text_content: string;
};
export type ticketCreate = {
  object: string;
  text_content: string;
};
