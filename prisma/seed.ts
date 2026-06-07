import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // upsert buyer
  await prisma.user.upsert({
    where: { id: "customer-nuh" },
    update: { name: "Nuh Pembeli", email: "nuh@example.com" },
    create: {
      id: "customer-nuh",
      name: "Nuh Pembeli",
      email: "nuh@example.com",
      passwordHash: "seed-password",
      role: "CUSTOMER",
    },
  });

  // upsert farmer
  await prisma.user.upsert({
    where: { id: "farmer-budi" },
    update: { name: "Pak Budi", email: "budi@example.com" },
    create: {
      id: "farmer-budi",
      name: "Pak Budi",
      email: "budi@example.com",
      passwordHash: "seed-password",
      role: "FARMER",
    },
  });

  // create 3 products for farmer-budi
  const products = [
    {
      id: "product-1",
      name: "Cabai Merah",
      description: "Cabai segar kualitas terbaik",
      farmerId: "farmer-budi",
      price: new Prisma.Decimal(25000),
      stock: new Prisma.Decimal(120),
      image: "/images/cabai-merah.webp",
    },
    {
      id: "product-2",
      name: "Tomat Lokal",
      description: "Tomat segar dari kebun",
      farmerId: "farmer-budi",
      price: new Prisma.Decimal(12000),
      stock: new Prisma.Decimal(80),
      image: "/images/tomat.webp",
    },
    {
      id: "product-3",
      name: "Jagung Hibrida",
      description: "Jagung siap panen",
      farmerId: "farmer-budi",
      price: new Prisma.Decimal(9000),
      stock: new Prisma.Decimal(200),
      image: "/images/jagung.webp",
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image: p.image,
        farmerId: p.farmerId,
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image: p.image,
        farmer: {
          connect: { id: p.farmerId }
        }
      },
    });
  }

  // Default logistics vehicles
  const vehicles = [
    { name: "Pick-up Cargo", vehicleType: "Pick-up Cargo", capacityTon: 1, price: 150000, isActive: true },
    { name: "Truk Sedang", vehicleType: "Truck Medium", capacityTon: 4, price: 450000, isActive: true },
    { name: "Truk Fuso", vehicleType: "Truck Large", capacityTon: 8, price: 980000, isActive: true },
    { name: "Tronton", vehicleType: "Truck Extra Large", capacityTon: 20, price: 1800000, isActive: true },
    { name: "Mini Bus", vehicleType: "Mini Bus", capacityTon: 0.5, price: 200000, isActive: true },
  ];

  for (const vehicle of vehicles) {
    await prisma.logisticsVehicle.upsert({
      where: { name: vehicle.name },
      update: { ...vehicle },
      create: { ...vehicle },
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
