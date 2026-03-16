// Haversine formula to calculate distance between two points on the earth
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1)); // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Shipping Zone calculation based on distance
export interface ShippingInfo {
  distance: number;
  zone: number;
  costPerKg: number;
  estimatedDays: string;
  isEligibleForSameDay: boolean;
}

export function calculateShippingInfo(distance: number): ShippingInfo {
  let zone = 1;
  let costPerKg = 5000;
  let estimatedDays = "1-2 Hari";
  let isEligibleForSameDay = true;

  if (distance > 25 && distance <= 75) {
    zone = 2;
    costPerKg = 15000;
    estimatedDays = "2-3 Hari";
    isEligibleForSameDay = false;
  } else if (distance > 75) {
    zone = 3;
    costPerKg = 30000;
    estimatedDays = "3-5 Hari";
    isEligibleForSameDay = false;
  }

  return {
    distance,
    zone,
    costPerKg,
    estimatedDays,
    isEligibleForSameDay
  };
}
