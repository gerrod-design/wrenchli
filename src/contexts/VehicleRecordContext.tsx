import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useVehicleRecord } from "@/hooks/useVehicleRecord";
import { useVehicleRecalls, type RecallAlert } from "@/hooks/useVehicleRecalls";

export interface VehicleRecordContextValue {
  record: ReturnType<typeof useVehicleRecord>;
  recalls: RecallAlert[];
  recallChecks: ReturnType<typeof useVehicleRecalls>["recallChecks"];
  recallUnavailableVehicleIds: string[];
  recallsLoading: boolean;
  markRecallAsRead: ReturnType<typeof useVehicleRecalls>["markAsRead"];
  refetchRecalls: ReturnType<typeof useVehicleRecalls>["fetchRecalls"];
}

const VehicleRecordContext = createContext<VehicleRecordContextValue | undefined>(
  undefined
);

// R-28 (follow-up): ONE shared record context for the vehicle record page.
// The provider is the single place the record + recalls hooks run for this
// page; every child consumes the same fetched data instead of the page's
// components fetching overlapping record data independently.
export function VehicleRecordProvider({
  vehicleId,
  children,
}: {
  vehicleId?: string;
  children: ReactNode;
}) {
  const record = useVehicleRecord(vehicleId);
  const vehicleIds = useMemo(() => (vehicleId ? [vehicleId] : []), [vehicleId]);
  const recallsApi = useVehicleRecalls(vehicleIds);

  const value = useMemo<VehicleRecordContextValue>(
    () => ({
      record,
      recalls: recallsApi.recalls,
      recallChecks: recallsApi.recallChecks,
      recallUnavailableVehicleIds: recallsApi.recallUnavailableVehicleIds,
      recallsLoading: recallsApi.loading,
      markRecallAsRead: recallsApi.markAsRead,
      refetchRecalls: recallsApi.fetchRecalls,
    }),
    [record, recallsApi]
  );

  return (
    <VehicleRecordContext.Provider value={value}>
      {children}
    </VehicleRecordContext.Provider>
  );
}

export function useVehicleRecordContext(): VehicleRecordContextValue {
  const ctx = useContext(VehicleRecordContext);
  if (ctx === undefined) {
    throw new Error("useVehicleRecordContext must be used within VehicleRecordProvider");
  }
  return ctx;
}
