const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for the travel tip...');
  const tip = await prisma.travelTip.findFirst({
    where: {
      title: {
        contains: 'BenThanh Tourist chuyển mình cho những hành trình du lịch xanh',
      },
    },
  });

  if (!tip) {
    console.log('Travel tip not found in database.');
    return;
  }

  console.log(`Found tip: "${tip.title}". Setting relatedSearchQuery to null...`);
  await prisma.travelTip.update({
    where: { id: tip.id },
    data: { relatedSearchQuery: null },
  });

  console.log('Update complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
