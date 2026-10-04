// Seeds default categories for every existing user that has none.
// New users are seeded automatically on first login (see lib/auth.ts).
import { prisma } from "../lib/prisma";
import { seedDefaultCategories } from "../lib/default-categories";

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    const count = await prisma.category.count({ where: { userId: u.id } });
    if (count === 0) {
      await seedDefaultCategories(u.id);
      console.log(`Seeded default categories for user ${u.id}`);
    }
  }
  console.log(`Done. Checked ${users.length} user(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
