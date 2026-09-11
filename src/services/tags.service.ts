import { supabase } from "@/integrations/supabase/client";
import { Tag } from "@/lib/types";
import { Database } from "@/integrations/supabase/types";

type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
  }));
}

export async function insertTag(tag: Omit<Tag, "id"> & { id?: string }): Promise<Tag> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No authenticated user");

  const insertPayload: Database["public"]["Tables"]["tags"]["Insert"] = {
    user_id: user.id,
    name: tag.name,
    color: tag.color,
  };
  if (tag.id) {
    insertPayload.id = tag.id;
  }

  const { data, error } = await supabase
    .from("tags")
    .upsert(insertPayload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    color: data.color,
  };
}

export async function updateTagRemote(id: string, updates: Partial<Tag>): Promise<void> {
  const payload: TagUpdate = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.color !== undefined) payload.color = updates.color;

  const { error } = await supabase
    .from("tags")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTagRemote(id: string): Promise<void> {
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
