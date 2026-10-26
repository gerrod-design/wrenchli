import { describe, expect, it } from "vitest";
import { proposeScanReportMatch } from "@/lib/scanReport/matcher";
import type { MatchableVehicle } from "@/lib/scanReport/types";

const M850I: MatchableVehicle = {
  id: "veh-m850i",
  year: 2022,
  make: "BMW",
  model: "M850i",
  vin: "WBAGV8C0XNCH32006",
};
const GLC: MatchableVehicle = {
  id: "veh-glc",
  year: 2016,
  make: "Mercedes-Benz",
  model: "GLC300",
  vin: "WDC0G4KB3GF052161",
};

describe("proposeScanReportMatch", () => {
  it("proposes an exact match when a VIN ends with the report fragment", () => {
    const proposal = proposeScanReportMatch(
      { vinFragment: "H32006", year: 2022, make: "BMW", model: "M850XI" },
      [GLC, M850I],
    );
    expect(proposal.strength).toBe("exact");
    expect(proposal.vehicleId).toBe("veh-m850i");
  });

  it("matches a lowercase or masked fragment case-insensitively", () => {
    const proposal = proposeScanReportMatch(
      { vinFragment: "h32006", year: null, make: null, model: null },
      [M850I],
    );
    expect(proposal.strength).toBe("exact");
  });

  it("uses year/make/model to narrow multiple fragment matches", () => {
    const twin: MatchableVehicle = {
      id: "veh-twin",
      year: 2021,
      make: "BMW",
      model: "840i",
      vin: "WBAGV2C0XNCH32006",
    };
    const proposal = proposeScanReportMatch(
      { vinFragment: "H32006", year: 2022, make: "BMW", model: "M850XI" },
      [twin, M850I],
    );
    expect(proposal.strength).toBe("exact");
    expect(proposal.vehicleId).toBe("veh-m850i");
  });

  it("proposes nothing when the fragment matches two vehicles ambiguously", () => {
    const twin: MatchableVehicle = { ...M850I, id: "veh-twin" };
    const proposal = proposeScanReportMatch(
      { vinFragment: "H32006", year: null, make: null, model: null },
      [M850I, twin],
    );
    expect(proposal.strength).toBe("none");
    expect(proposal.vehicleId).toBeNull();
  });

  it("falls back to a weak proposal on a unique year/make/model match", () => {
    const proposal = proposeScanReportMatch(
      { vinFragment: null, year: 2022, make: "BMW", model: "M850XI" },
      [GLC, M850I],
    );
    expect(proposal.strength).toBe("weak");
    expect(proposal.vehicleId).toBe("veh-m850i");
  });

  it("proposes nothing when year/make/model is ambiguous", () => {
    const second: MatchableVehicle = { ...M850I, id: "veh-second", vin: null };
    const proposal = proposeScanReportMatch(
      { vinFragment: null, year: 2022, make: "BMW", model: "M850XI" },
      [M850I, second],
    );
    expect(proposal.strength).toBe("none");
    expect(proposal.vehicleId).toBeNull();
  });

  it("proposes nothing when nothing matches", () => {
    const proposal = proposeScanReportMatch(
      { vinFragment: "ZZZ999", year: 2019, make: "Honda", model: "Accord" },
      [GLC, M850I],
    );
    expect(proposal.strength).toBe("none");
    expect(proposal.vehicleId).toBeNull();
  });

  it("ignores a fragment that is too short to be evidence", () => {
    const proposal = proposeScanReportMatch(
      { vinFragment: "006", year: null, make: null, model: null },
      [M850I],
    );
    expect(proposal.strength).toBe("none");
  });
});
