'use client';

/**
 * Logistics Recommendation AI Engine
 * Analyzes order weight and recommends optimal vehicle combination
 * Example: 1 ton + 300kg = 1 Truk Sedang (4 ton) + 1 Pick-up Cargo (1 ton)
 */

export interface Vehicle {
  id: string;
  name: string;
  vehicleType: string;
  capacityTon: number;
  price: number;
  isActive: boolean;
}

export interface VehicleRecommendation {
  vehicleId: string;
  vehicleName: string;
  quantity: number;
  capacityTon: number;
  subtotal: number;
}

export interface LogisticsRecommendation {
  totalWeightTon: number;
  recommendations: VehicleRecommendation[];
  totalCost: number;
  discountedCost: number; // 35% discount applied
  savings: number;
  note: string;
}

/**
 * Analyze order weight and recommend vehicles
 * Uses greedy algorithm: sorts vehicles by capacity (largest first) and packs optimally
 * Applies 35% discount and limits to max 3 vehicles
 */
export function recommendVehicles(
  totalWeightTon: number,
  availableVehicles: Vehicle[]
): LogisticsRecommendation {
  // Filter active vehicles and sort by capacity (largest first)
  const sortedVehicles = availableVehicles
    .filter((v) => v.isActive)
    .sort((a, b) => b.capacityTon - a.capacityTon);

  if (sortedVehicles.length === 0) {
    return {
      totalWeightTon,
      recommendations: [],
      totalCost: 0,
      discountedCost: 0,
      savings: 0,
      note: 'Tidak ada kendaraan logistik yang tersedia',
    };
  }

  const recommendations: VehicleRecommendation[] = [];
  let remainingWeight = totalWeightTon;
  let vehicleCount = 0;
  const maxVehicles = 3;

  // Greedy packing algorithm
  for (const vehicle of sortedVehicles) {
    if (vehicleCount >= maxVehicles) {
      break;
    }

    // Calculate how many of this vehicle we need
    const vehiclesNeeded = Math.ceil(remainingWeight / vehicle.capacityTon);
    const vehiclesToUse = Math.min(vehiclesNeeded, maxVehicles - vehicleCount);

    if (vehiclesToUse > 0) {
      const subtotal = vehiclesToUse * vehicle.price;
      recommendations.push({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        quantity: vehiclesToUse,
        capacityTon: vehicle.capacityTon * vehiclesToUse,
        subtotal,
      });

      remainingWeight -= vehicle.capacityTon * vehiclesToUse;
      vehicleCount += vehiclesToUse;

      if (remainingWeight <= 0) {
        break;
      }
    }
  }

  // Calculate costs
  const totalCost = recommendations.reduce((sum, rec) => sum + rec.subtotal, 0);
  const discountedCost = Math.floor(totalCost * 0.65); // 35% discount = pay 65%
  const savings = totalCost - discountedCost;

  // Build recommendation note
  const vehicleList = recommendations.map((r) => `${r.quantity}x ${r.vehicleName}`).join(' + ');
  const note =
    remainingWeight > 0.001
      ? `Rekomendasi: ${vehicleList} (Peringatan: kapasitas mungkin kurang untuk ${remainingWeight.toFixed(2)} ton tambahan)`
      : `Rekomendasi: ${vehicleList}`;

  return {
    totalWeightTon,
    recommendations,
    totalCost,
    discountedCost,
    savings,
    note,
  };
}

/**
 * Calculate total weight from order items with product prices
 */
export function calculateOrderWeight(
  items: Array<{ quantityKg: number; product?: { name: string } }>
): number {
  const totalKg = items.reduce((sum, item) => sum + item.quantityKg, 0);
  return totalKg / 1000; // Convert kg to ton
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate if weight fits in recommended vehicles
 */
export function validateRecommendation(rec: LogisticsRecommendation): boolean {
  if (rec.recommendations.length === 0) {
    return false;
  }

  const totalCapacity = rec.recommendations.reduce((sum, r) => sum + r.capacityTon, 0);
  return totalCapacity >= rec.totalWeightTon - 0.001; // Allow small floating-point error
}

/**
 * Get single best vehicle recommendation (for simple cases)
 */
export function getSimplestVehicleRecommendation(
  totalWeightTon: number,
  availableVehicles: Vehicle[]
): Vehicle | null {
  const activeVehicles = availableVehicles
    .filter((v) => v.isActive && v.capacityTon >= totalWeightTon)
    .sort((a, b) => a.capacityTon - b.capacityTon);

  return activeVehicles.length > 0 ? activeVehicles[0] : null;
}
