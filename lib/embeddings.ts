import { getSupabaseAdmin } from "@/lib/supabase";

export async function createEmbedding(text: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const { data, error } = await supabase.functions.invoke("generate-embedding", {
    body: { input: text },
  });

  if (error) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }

  if (!data?.embedding || !Array.isArray(data.embedding)) {
    throw new Error("Embedding function returned an invalid response.");
  }

  return data.embedding as number[];
}
