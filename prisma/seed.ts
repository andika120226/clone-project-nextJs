import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with initial data...');

  // Default logistics vehicles
  const vehicles = [
    {
      name: 'Pick-up Cargo',
      vehicleType: 'Pick-up Cargo',
      capacityTon: 1,
      price: 150000,
      isActive: true,
    },
    {
      name: 'Truk Sedang',
      vehicleType: 'Truck Medium',
      capacityTon: 4,
      price: 450000,
      isActive: true,
    },
    {
      name: 'Truk Fuso',
      vehicleType: 'Truck Large',
      capacityTon: 8,
      price: 980000,
      isActive: true,
    },
    {
      name: 'Tronton',
      vehicleType: 'Truck Extra Large',
      capacityTon: 20,
      price: 1800000,
      isActive: true,
    },
    {
      name: 'Mini Bus',
      vehicleType: 'Mini Bus',
      capacityTon: 0.5,
      price: 200000,
      isActive: true,
    },
  ];

  // Upsert vehicles
  for (const vehicle of vehicles) {
    await prisma.logisticsVehicle.upsert({
      where: { name: vehicle.name },
      update: { ...vehicle },
      create: { ...vehicle },
    });
    console.log(`✅ Seeded vehicle: ${vehicle.name} (${vehicle.capacityTon} ton)`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
