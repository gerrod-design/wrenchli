import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CORE_BASELINE_CHECKS,
  GARAGE_MEDIA_BUCKET,
  matchesWeakPoint,
  statusFromBaselineResponse,
  weakPointCheckKey,
} from "@/lib/garageRecord";
import { downloadGarageRecordPdf } from "@/lib/garageRecordPdf";
import type {
  BaselineResponseValue,
  GarageMediaRef,
  GarageVehicle,
  RecordLayer,
  SourceType,
  TimelineCategory,
  VehicleBaseline,
  VehicleBaselineResponse,
  VehicleConditionCheck,
  VehicleDocument,
  VehicleSharePermissionFields,
  VehicleTimelineEvent,
  WeakPointCheck,
} from "@/types/garageRecord";

export interface AddTimelineInput {
  layer: RecordLayer;
  category: TimelineCategory;
  title: string;
  detail?: string;
  sourceType: SourceType;
  sourceName: string;
  occurredAt?: string;
  odometer?: number | null;
  media?: GarageMediaRef[];
}

export interface AttachDocumentInput {
  layer: RecordLayer;
  documentKind: string;
  sourceName: string;
  title?: string;
  detail?: string;
}

export interface SaveBaselineResponseInput {
  baseline: VehicleBaseline;
  checkKey: string;
  checkLabel: string;
  response: BaselineResponseValue;
  skipReason?: string;
  note?: string;
  sourceName: string;
  weakPoint?: WeakPointCheck | null;
  sense?: VehicleConditionCheck["sense"];
  evidenceFile?: File | null;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "file";
}

function mediaKind(file: File): GarageMediaRef["kind"] {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "document";
  return "other";
}

function requireSourceName(sourceName: string) {
  const trimmed = sourceName.trim();
  if (!trimmed) throw new Error("A source name is required for every saved record entry.");
  return trimmed;
}

export function useVehicleRecord(vehicleId?: string) {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<GarageVehicle | null>(null);
  const [timeline, setTimeline] = useState<VehicleTimelineEvent[]>([]);
  const [conditionChecks, setConditionChecks] = useState<VehicleConditionCheck[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPointCheck[]>([]);
  const [baselines, setBaselines] = useState<VehicleBaseline[]>([]);
  const [responses, setResponses] = useState<VehicleBaselineResponse[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [sharePermissions, setSharePermissions] = useState<VehicleSharePermissionFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!vehicleId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const vehicleResult = await supabase
        .from("user_vehicles")
        .select("id, user_id, year, make, model, trim, nickname, vin, photo_url, current_mileage, created_at")
        .eq("id", vehicleId)
        .eq("user_id", user.id)
        .single();
      if (vehicleResult.error) throw vehicleResult.error;
      const loadedVehicle = vehicleResult.data as GarageVehicle;
      setVehicle(loadedVehicle);

      const [timelineResult, checksResult, weakResult, baselinesResult, responsesResult, docsResult, sharesResult] =
        await Promise.all([
          supabase
            .from("vehicle_timeline_events" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("occurred_at", { ascending: false }),
          supabase
            .from("vehicle_condition_checks" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("updated_at", { ascending: false }),
          supabase
            .from("weak_point_checks" as any)
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("vehicle_baselines" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("started_at", { ascending: false }),
          supabase
            .from("vehicle_baseline_responses" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("responded_at", { ascending: false }),
          supabase
            .from("vehicle_documents" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false }),
          supabase
            .from("vehicle_share_permissions" as any)
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false }),
        ]);

      const firstError =
        timelineResult.error || checksResult.error || weakResult.error || baselinesResult.error ||
        responsesResult.error || docsResult.error || sharesResult.error;
      if (firstError) throw firstError;

      setTimeline((timelineResult.data ?? []) as VehicleTimelineEvent[]);
      setConditionChecks((checksResult.data ?? []) as VehicleConditionCheck[]);
      setWeakPoints(
        ((weakResult.data ?? []) as WeakPointCheck[]).filter((check) =>
          matchesWeakPoint(check, loadedVehicle),
        ),
      );
      setBaselines((baselinesResult.data ?? []) as VehicleBaseline[]);
      setResponses((responsesResult.data ?? []) as VehicleBaselineResponse[]);
      setDocuments((docsResult.data ?? []) as VehicleDocument[]);
      setSharePermissions((sharesResult.data ?? []) as VehicleSharePermissionFields[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this vehicle record.");
    } finally {
      setLoading(false);
    }
  }, [user, vehicleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentConditionChecks = useMemo(() => {
    const latestByKey = new Map<string, VehicleConditionCheck>();
    // conditionChecks are ordered newest first by the refresh query. The first
    // row for a key is therefore the current projection, whether it came from
    // a baseline run or a standalone condition check.
    for (const check of conditionChecks) {
      if (!latestByKey.has(check.check_key)) latestByKey.set(check.check_key, check);
    }
    return [...latestByKey.values()];
  }, [conditionChecks]);

  const coreDisplayChecks = useMemo<VehicleConditionCheck[]>(() => {
    if (!vehicle || !user) return [];
    const byKey = new Map(currentConditionChecks.map((check) => [check.check_key, check]));
    return CORE_BASELINE_CHECKS.map((definition) =>
      byKey.get(definition.key) ?? {
        id: `not-checked-${definition.key}`,
        vehicle_id: vehicle.id,
        owner_user_id: user.id,
        baseline_id: null,
        weak_point_check_id: null,
        check_key: definition.key,
        label: definition.label,
        category: "condition_check",
        sense: definition.sense,
        status: "not_checked",
        last_checked_at: null,
        last_source_type: null,
        last_source_name: null,
        evidence_media: [],
        note: null,
        updated_at: vehicle.created_at ?? new Date(0).toISOString(),
      },
    );
  }, [currentConditionChecks, user, vehicle]);

  const uploadMedia = useCallback(
    async (file: File) => {
      if (!vehicle || !user) throw new Error("Sign in and open a Garage vehicle first.");
      const path = `${user.id}/${vehicle.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from(GARAGE_MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (uploadError) throw uploadError;
      return {
        bucket: GARAGE_MEDIA_BUCKET,
        path,
        name: file.name,
        contentType: file.type,
        kind: mediaKind(file),
      } satisfies GarageMediaRef;
    },
    [user, vehicle],
  );

  const getSignedMediaUrl = useCallback(async (ref: GarageMediaRef) => {
    const { data, error: signedError } = await supabase.storage
      .from(ref.bucket || GARAGE_MEDIA_BUCKET)
      .createSignedUrl(ref.path, 60 * 60);
    if (signedError) throw signedError;
    return data.signedUrl;
  }, []);

  const addTimelineEvent = useCallback(
    async (input: AddTimelineInput) => {
      if (!vehicle || !user) throw new Error("Sign in and open a Garage vehicle first.");
      const sourceName = requireSourceName(input.sourceName);
      const payload = {
        vehicle_id: vehicle.id,
        owner_user_id: user.id,
        vin: vehicle.vin,
        layer: input.layer,
        category: input.category,
        title: input.title.trim(),
        detail: input.detail?.trim() || null,
        source_type: input.sourceType,
        source_name: sourceName,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        odometer: input.odometer ?? null,
        media: input.media ?? [],
        created_by: user.id,
      };
      const { data, error: insertError } = await supabase
        .from("vehicle_timeline_events" as any)
        .insert(payload)
        .select("*")
        .single();
      if (insertError) throw insertError;
      await refresh();
      return data as VehicleTimelineEvent;
    },
    [refresh, user, vehicle],
  );

  const attachDocument = useCallback(
    async (file: File, input: AttachDocumentInput) => {
      if (!vehicle || !user) throw new Error("Sign in and open a Garage vehicle first.");
      const sourceName = requireSourceName(input.sourceName);
      const media = await uploadMedia(file);
      const event = await addTimelineEvent({
        layer: input.layer,
        category: "document",
        title: input.title?.trim() || file.name,
        detail: input.detail?.trim() || `Document saved to the ${input.layer} layer.`,
        sourceType: "document",
        sourceName,
        media: [media],
      });
      const { data, error: insertError } = await supabase
        .from("vehicle_documents" as any)
        .insert({
          vehicle_id: vehicle.id,
          owner_user_id: user.id,
          timeline_event_id: event.id,
          storage_bucket: media.bucket,
          storage_path: media.path,
          original_filename: file.name,
          content_type: file.type || null,
          byte_size: file.size,
          document_kind: input.documentKind,
          layer: input.layer,
          source_name: sourceName,
          uploaded_by: user.id,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      await refresh();
      return data as VehicleDocument;
    },
    [addTimelineEvent, refresh, uploadMedia, user, vehicle],
  );

  const startBaseline = useCallback(
    async (odometer?: number | null) => {
      if (!vehicle || !user) throw new Error("Sign in and open a Garage vehicle first.");
      const existing = baselines.find((baseline) => baseline.status === "in_progress");
      if (existing) return existing;
      const { data, error: insertError } = await supabase
        .from("vehicle_baselines" as any)
        .insert({
          vehicle_id: vehicle.id,
          owner_user_id: user.id,
          vin: vehicle.vin,
          odometer: odometer ?? vehicle.current_mileage ?? null,
          status: "in_progress",
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      await refresh();
      return data as VehicleBaseline;
    },
    [baselines, refresh, user, vehicle],
  );

  const saveBaselineResponse = useCallback(
    async (input: SaveBaselineResponseInput) => {
      if (!vehicle || !user) throw new Error("Sign in and open a Garage vehicle first.");
      if (input.baseline.status === "completed") {
        throw new Error("A saved baseline is locked. Start a new baseline or add a timeline correction.");
      }
      const sourceName = requireSourceName(input.sourceName);
      if (input.response === "skipped" && !input.skipReason?.trim()) {
        throw new Error("A skipped check needs a reason.");
      }
      const existingResponse = responses.find(
        (response) => response.baseline_id === input.baseline.id && response.check_key === input.checkKey,
      );
      const media = input.evidenceFile
        ? [await uploadMedia(input.evidenceFile)]
        : existingResponse?.media ?? [];
      const responsePayload = {
        baseline_id: input.baseline.id,
        vehicle_id: vehicle.id,
        owner_user_id: user.id,
        weak_point_check_id: input.weakPoint?.id ?? null,
        check_key: input.checkKey,
        check_label: input.checkLabel,
        response: input.response,
        skip_reason: input.response === "skipped" ? input.skipReason?.trim() : null,
        note: input.note?.trim() || null,
        media,
        source_type: "owner",
        source_name: sourceName,
        responded_at: new Date().toISOString(),
        created_by: user.id,
      };
      const { data, error: responseError } = await supabase
        .from("vehicle_baseline_responses" as any)
        .upsert(responsePayload, { onConflict: "baseline_id,check_key" })
        .select("*")
        .single();
      if (responseError) throw responseError;

      const status = statusFromBaselineResponse(input.response);
      if (!status && input.response === "skipped") {
        const { data: existingBaselineCheck, error: lookupError } = await supabase
          .from("vehicle_condition_checks" as any)
          .select("id")
          .eq("vehicle_id", vehicle.id)
          .eq("baseline_id", input.baseline.id)
          .eq("check_key", input.checkKey)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (existingBaselineCheck) {
          const { error: resetError } = await supabase
            .from("vehicle_condition_checks" as any)
            .update({
              status: "not_checked",
              last_checked_at: new Date().toISOString(),
              last_source_type: "owner",
              last_source_name: sourceName,
              evidence_media: [],
              note: `Skipped in this baseline run: ${input.skipReason?.trim()}`,
            })
            .eq("id", existingBaselineCheck.id);
          if (resetError) throw resetError;
        }
      }

      if (status) {
        const now = new Date().toISOString();
        const checkPayload = {
          vehicle_id: vehicle.id,
          owner_user_id: user.id,
          weak_point_check_id: input.weakPoint?.id ?? null,
          check_key: input.checkKey,
          label: input.checkLabel,
          category: input.weakPoint ? "condition_check" : "baseline",
          sense: input.weakPoint?.sense ?? input.sense ?? null,
          status,
          last_checked_at: now,
          last_source_type: "owner",
          last_source_name: sourceName,
          evidence_media: media,
          note: input.note?.trim() || null,
        };
        const writeConditionCheck = async (baselineId: string | null) => {
          let lookup = supabase
            .from("vehicle_condition_checks" as any)
            .select("id")
            .eq("vehicle_id", vehicle.id)
            .eq("check_key", input.checkKey);
          lookup = baselineId
            ? lookup.eq("baseline_id", baselineId)
            : lookup.is("baseline_id", null);
          const { data: existingCheck, error: lookupError } = await lookup.maybeSingle();
          if (lookupError) throw lookupError;

          const result = existingCheck
            ? await supabase
                .from("vehicle_condition_checks" as any)
                .update({ ...checkPayload, baseline_id: baselineId })
                .eq("id", existingCheck.id)
            : await supabase
                .from("vehicle_condition_checks" as any)
                .insert({ ...checkPayload, baseline_id: baselineId });
          if (result.error) throw result.error;
        };

        // One baseline-specific row is the evidence record. The current
        // vehicle view derives its state from the newest row for each key,
        // so writing a second "current" row would duplicate the timeline
        // event generated by the database trigger.
        await writeConditionCheck(input.baseline.id);
      }

      await refresh();
      return data as VehicleBaselineResponse;
    },
    [refresh, responses, uploadMedia, user, vehicle],
  );

  const completeBaseline = useCallback(
    async (baseline: VehicleBaseline, sourceName: string) => {
      const checkedSource = requireSourceName(sourceName);
      const { data, error: rpcError } = await supabase.rpc("complete_vehicle_baseline" as any, {
        p_baseline_id: baseline.id,
        p_source_name: checkedSource,
      });
      if (rpcError) throw rpcError;
      await refresh();
      return data as VehicleBaseline;
    },
    [refresh],
  );

  const exportPdf = useCallback(() => {
    if (!vehicle) return;
    downloadGarageRecordPdf({
      vehicle,
      timeline,
      checks: coreDisplayChecks,
      baselines,
      responses,
      documents,
      weakPoints,
    });
  }, [baselines, coreDisplayChecks, documents, responses, timeline, vehicle, weakPoints]);

  return {
    user,
    vehicle,
    timeline,
    conditionChecks,
    currentConditionChecks,
    coreDisplayChecks,
    weakPoints,
    baselines,
    responses,
    documents,
    sharePermissions,
    loading,
    error,
    refresh,
    uploadMedia,
    getSignedMediaUrl,
    addTimelineEvent,
    attachDocument,
    startBaseline,
    saveBaselineResponse,
    completeBaseline,
    exportPdf,
  };
}
