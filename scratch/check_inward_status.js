
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inwards = await prisma.inwardEntry.findMany({
    take: 50,
    select: {
        id: true,
        inward_no: true,
        status: true,
        company_id: true,
        customer_name: true
    }
  });
  console.log(JSON.stringify(inwards, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
