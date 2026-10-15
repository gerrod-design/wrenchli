import { useEffect, useState } from 'react';
import {
  getLatestJourneyPlanForVehicle,
  saveJourneyPlan,
  getServiceContracts,
  saveServiceContract,
  JourneyPlanRow,
  VehicleServiceContractRow,
} from '@/lib/journeyPlanData';
import JourneyPlanCard from '@/components/journey/JourneyPlanCard';
import ServiceContractForm from '@/components/journey/ServiceContractForm';

export interface JourneyPlanSectionProps {
  vehicleId: string;
  userId: string;
  issueCategory?: string;
}

type SavePlanInput = Parameters<typeof saveJourneyPlan>[2];
type SavePlanResult = Parameters<typeof saveJourneyPlan>[3];
type SaveContractInput = Parameters<typeof saveServiceContract>[2];

export default function JourneyPlanSection({
  vehicleId,
  userId,
  issueCategory,
}: JourneyPlanSectionProps): JSX.Element {
  const [plan, setPlan] = useState<JourneyPlanRow | null>(null);
  const [contracts, setContracts] = useState<VehicleServiceContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getLatestJourneyPlanForVehicle(vehicleId),
      getServiceContracts(vehicleId),
    ])
      .then(([planResult, contractsResult]) => {
        if (!active) return;
        setPlan(planResult ?? null);
        setContracts(contractsResult ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [vehicleId]);

  const handleSavePlan = async (input: SavePlanInput, result: SavePlanResult) => {
    const row = await saveJourneyPlan(userId, vehicleId, input, result);
    setPlan(row);
  };

  const handleSaveContract = async (input: SaveContractInput) => {
    const row = await saveServiceContract(userId, vehicleId, input);
    setContracts((prev) => [row, ...prev]);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">While your car is being fixed</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <JourneyPlanCard
            mode="consumer"
            existingPlan={plan}
            shopCapabilities={null}
            serviceContractProvider={contracts[0]?.provider_name}
            onSave={handleSavePlan}
          />

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Service contracts</h3>
            {contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No service contract on file yet. Add one so we can flag when repairs may be
                covered.
              </p>
            ) : (
              <ul className="space-y-2">
                {contracts.map((contract) => (
                  <li key={contract.id} className="text-sm space-y-0.5">
                    <div className="font-semibold">{contract.provider_name}</div>
                    {contract.plan_name && <div>{contract.plan_name}</div>}
                    {contract.coverage_notes && (
                      <div className="text-muted-foreground">{contract.coverage_notes}</div>
                    )}
                    {contract.expires_on && (
                      <div className="text-muted-foreground">Expires {contract.expires_on}</div>
                    )}
                    <div className="text-xs text-muted-foreground">Reported by you</div>
                  </li>
                ))}
              </ul>
            )}

            <ServiceContractForm onSave={handleSaveContract} />
          </div>
        </>
      )}
    </section>
  );
}
