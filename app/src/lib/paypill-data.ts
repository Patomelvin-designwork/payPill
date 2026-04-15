import type { SupabaseClient } from "@supabase/supabase-js";

/** True when PostgREST reports missing column/relation (common when DB is on legacy DDL). */
export function isPostgrestSchemaMismatch(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const code = String(error.code ?? "");
  const msg = String(error.message ?? "").toLowerCase();
  if (code === "42703") return true;
  if (code === "PGRST204") return true;
  if (msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"))) return true;
  return false;
}

export type DashboardMedication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: "taken" | "due";
};

export type DashboardContract = {
  id: string;
  endDate: string | null;
  lockedPrice: number | null;
  quantity: string | null;
};

export type DashboardAdherenceEvent = { status: string; at: string };

function mapMedicationRows(rows: unknown[] | null): DashboardMedication[] {
  return (rows ?? []).map((m: any) => ({
    id: m.id,
    name: m.medications?.name ?? "Medication",
    dosage: m.dosage,
    frequency: m.frequency,
    status: "due" as const,
  }));
}

export async function fetchPatientMedicationsDashboard(
  client: SupabaseClient,
  userId: string,
  limit = 5
): Promise<{ data: DashboardMedication[]; error: Error | null }> {
  const modern = await client
    .from("patient_medications")
    .select("id,dosage,frequency,medications(name)")
    .eq("profile_id", userId)
    .eq("status", "active")
    .limit(limit);
  if (!modern.error) {
    return { data: mapMedicationRows(modern.data as unknown[]), error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("patient_medications")
    .select("id,dosage,frequency,medications(name)")
    .eq("user_id", userId)
    .eq("active", true)
    .limit(limit);
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  return { data: mapMedicationRows(legacy.data as unknown[]), error: null };
}

export async function fetchSmartContractsActiveDashboard(
  client: SupabaseClient,
  userId: string
): Promise<{ data: DashboardContract[]; error: Error | null }> {
  const modern = await client
    .from("smart_contracts")
    .select("id,end_date,locked_price,quantity,status")
    .eq("profile_id", userId)
    .eq("status", "active");
  if (!modern.error) {
    const data = (modern.data ?? []).map((c: any) => ({
      id: c.id,
      endDate: c.end_date ?? null,
      lockedPrice: c.locked_price ?? null,
      quantity: c.quantity ?? null,
    }));
    return { data, error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("smart_contracts")
    .select("id,end_at,locked_price,quantity,status")
    .eq("user_id", userId)
    .eq("status", "active");
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  const data = (legacy.data ?? []).map((c: any) => ({
    id: c.id,
    endDate: c.end_at ?? null,
    lockedPrice: c.locked_price ?? null,
    quantity: c.quantity ?? null,
  }));
  return { data, error: null };
}

export async function fetchAdherenceLast30DaysDashboard(
  client: SupabaseClient,
  userId: string,
  sinceIso: string
): Promise<{ data: DashboardAdherenceEvent[]; error: Error | null }> {
  const modern = await client
    .from("medication_adherence_events")
    .select("status,event_time")
    .eq("profile_id", userId)
    .gte("event_time", sinceIso);
  if (!modern.error) {
    const data = (modern.data ?? []).map((e: any) => ({
      status: e.status,
      at: e.event_time,
    }));
    return { data, error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("adherence_events")
    .select("status,occurred_at")
    .eq("user_id", userId)
    .gte("occurred_at", sinceIso);
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  const data = (legacy.data ?? []).map((e: any) => ({
    status: e.status,
    at: e.occurred_at,
  }));
  return { data, error: null };
}

export async function insertAdherenceTakenForMedications(
  client: SupabaseClient,
  userId: string,
  patientMedicationIds: string[]
): Promise<{ error: Error | null }> {
  const rows = patientMedicationIds.map((id) => ({
    profile_id: userId,
    patient_medication_id: id,
    status: "taken" as const,
  }));
  const modern = await client.from("medication_adherence_events").insert(rows);
  if (!modern.error) return { error: null };
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { error: new Error(modern.error.message) };
  }
  const legacyRows = patientMedicationIds.map((patient_medication_id) => ({
    user_id: userId,
    patient_medication_id,
    status: "taken",
  }));
  const legacy = await client.from("adherence_events").insert(legacyRows);
  if (legacy.error) {
    return { error: new Error(legacy.error.message) };
  }
  return { error: null };
}

export type ContractListRow = Record<string, unknown>;

export async function fetchSmartContractsListPage(
  client: SupabaseClient,
  userId: string
): Promise<{ data: ContractListRow[]; error: Error | null }> {
  const modern = await client
    .from("smart_contracts")
    .select("id,contract_ref,status,start_date,end_date,locked_price,quantity,blockchain,tx_hash")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  if (!modern.error) {
    return { data: (modern.data ?? []) as ContractListRow[], error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("smart_contracts")
    .select(
      "id,contract_ref,medication_name,status,locked_price,quantity,start_at,end_at,chain,tx_hash,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  const normalized = (legacy.data ?? []).map((c: any) => ({
    id: c.id,
    contract_ref: c.contract_ref,
    medication_name: c.medication_name,
    status: c.status,
    locked_price: c.locked_price,
    quantity: c.quantity,
    start_date: c.start_at,
    end_date: c.end_at,
    blockchain: c.chain,
    tx_hash: c.tx_hash,
  }));
  return { data: normalized as ContractListRow[], error: null };
}

export async function fetchPatientMedicationsTreatments(
  client: SupabaseClient,
  userId: string
): Promise<{ data: unknown[]; error: Error | null }> {
  const modern = await client
    .from("patient_medications")
    .select("id,dosage,frequency,status,medications(name)")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  if (!modern.error) {
    return { data: modern.data ?? [], error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("patient_medications")
    .select("id,dosage,frequency,active,medications(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  const mapped = (legacy.data ?? []).map((r: any) => ({
    ...r,
    status: r.active ? "active" : "paused",
  }));
  return { data: mapped, error: null };
}

export async function fetchAdherenceEventsCalendar(
  client: SupabaseClient,
  userId: string
): Promise<{ data: Array<{ status: string; occurred_at: string }>; error: Error | null }> {
  const modern = await client
    .from("medication_adherence_events")
    .select("status,event_time")
    .eq("profile_id", userId)
    .order("event_time", { ascending: false })
    .limit(200);
  if (!modern.error) {
    const data = (modern.data ?? []).map((row: any) => ({
      status: row.status,
      occurred_at: row.event_time,
    }));
    return { data, error: null };
  }
  if (!isPostgrestSchemaMismatch(modern.error)) {
    return { data: [], error: new Error(modern.error.message) };
  }
  const legacy = await client
    .from("adherence_events")
    .select("status,occurred_at")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (legacy.error) {
    return { data: [], error: new Error(legacy.error.message) };
  }
  return { data: (legacy.data ?? []) as Array<{ status: string; occurred_at: string }>, error: null };
}

export type AiRecommendationUi = {
  id: string;
  medication_name: string;
  confidence: number | null;
  rationale: string | null;
  estimated_monthly_savings: number | null;
};

export async function fetchLatestAiRecommendations(
  client: SupabaseClient,
  userId: string
): Promise<{ data: AiRecommendationUi[]; error: Error | null }> {
  const modernAnalysis = await client
    .from("ai_analyses")
    .select("id")
    .eq("profile_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let analysisId: string | null = null;
  if (!modernAnalysis.error && modernAnalysis.data?.id) {
    analysisId = modernAnalysis.data.id;
  } else if (modernAnalysis.error && isPostgrestSchemaMismatch(modernAnalysis.error)) {
    const leg = await client
      .from("ai_analyses")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (leg.error || !leg.data?.id) {
      return { data: [], error: leg.error ? new Error(leg.error.message) : null };
    }
    analysisId = leg.data.id;
  } else if (modernAnalysis.error) {
    return { data: [], error: new Error(modernAnalysis.error.message) };
  }

  if (!analysisId) {
    return { data: [], error: null };
  }

  const modernRec = await client
    .from("ai_recommendations")
    .select("id,recommendation_text,medications(name),confidence,estimated_monthly_cost,estimated_savings")
    .eq("analysis_id", analysisId)
    .order("confidence", { ascending: false });
  if (!modernRec.error) {
    const data = (modernRec.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      medication_name: (row.medications as { name?: string } | null)?.name ?? "Recommendation",
      confidence: row.confidence as number | null,
      rationale: (row.recommendation_text as string) || null,
      estimated_monthly_savings:
        (row.estimated_savings as number | null) ?? (row.estimated_monthly_cost as number | null),
    }));
    return { data, error: null };
  }
  if (!isPostgrestSchemaMismatch(modernRec.error)) {
    return { data: [], error: new Error(modernRec.error.message) };
  }
  const legacyRec = await client
    .from("ai_recommendations")
    .select("id,medication_name,confidence,rationale,estimated_monthly_savings")
    .eq("analysis_id", analysisId)
    .order("confidence", { ascending: false });
  if (legacyRec.error) {
    return { data: [], error: new Error(legacyRec.error.message) };
  }
  const data = (legacyRec.data ?? []) as AiRecommendationUi[];
  return { data, error: null };
}
