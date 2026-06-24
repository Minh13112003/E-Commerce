const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateTourSlug(name) {
  const nameWithoutParentheses = name.replace(/\([^)]*\)/g, '');
  return nameWithoutParentheses
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('Fetching all tours from database...');
  const tours = await prisma.tour.findMany();
  console.log(`Found ${tours.length} tours. Updating slug field...`);

  let count = 0;
  for (const tour of tours) {
    const slug = generateTourSlug(tour.name);
    await prisma.tour.update({
      where: { id: tour.id },
      data: { slug },
    });
    console.log(`Updated: "${tour.name}" -> slug: "${slug}"`);
    count++;
  }

  console.log(`Successfully updated slug for ${count} tours.`);
}

main()
  .catch((e) => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
