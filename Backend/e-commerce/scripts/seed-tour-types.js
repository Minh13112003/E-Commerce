const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tours = await prisma.tour.findMany();
  console.log(`Tìm thấy ${tours.length} tours.`);

  const tourTypes = [
    "TOUR OF THE YEAR 2026",
    "TOUR CAO CẤP",
    "TOUR MICE",
    "TOUR HÈ",
    "DU LỊCH XANH"
  ];

  // Gán loại tour ngẫu nhiên cho các tour hiện tại để kiểm thử
  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i];
    // Chọn loại tour dựa trên index
    const tourType = tourTypes[i % tourTypes.length];
    await prisma.tour.update({
      where: { id: tour.id },
      data: { tourType }
    });
    console.log(`Đã cập nhật tour "${tour.name}" thành loại: ${tourType}`);
  }

  console.log('Hoàn thành cập nhật seed loại tour!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
