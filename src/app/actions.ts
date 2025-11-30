"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithGithub() {
  const supabase = createClient();
  const origin = headers().get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with GitHub:", error);
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect(data.url);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/");
}
