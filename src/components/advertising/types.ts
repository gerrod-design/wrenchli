export interface TrackingContext {
  diagnosis_title: string;
  diagnosis_code?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  source: string;
  placement: string;
}

export interface VehicleListing {
  year: number;
  make: string;
  model: string;
  price: string;
  mileage: string;
  location: string;
  dealer: string;
  features: string[];
  badge?: string;
  link: string;
}
