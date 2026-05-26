"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/session";

export async function moderateNews(itemId: string, action: "approve" | "reject") {
  await apiFetch(`/admin/news/${itemId}/${action}`, { method: "POST" });
  revalidatePath("/admin");
  revalidatePath("/admin/news");
  revalidatePath("/nyheter");
}

export async function moderateMember(appId: string, action: "accept" | "reject") {
  await apiFetch(`/admin/members/${appId}/${action}`, { method: "POST" });
  revalidatePath("/admin");
  revalidatePath("/admin/medlemmar");
}
