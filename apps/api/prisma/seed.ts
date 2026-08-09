import { PrismaClient, LeadStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(name: string, email: string, role: Role, managerId?: string) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.upsert({
    where: { email },
    update: { managerId },
    create: { name, email, passwordHash, role, managerId },
  });
}

async function main() {
  const admin = await upsertUser("Admin User", "admin@indiamartcrm.dev", Role.ADMIN);
  const manager = await upsertUser("Priya Manager", "manager@indiamartcrm.dev", Role.SALES_MANAGER);
  const emp1 = await upsertUser("Rahul Employee", "rahul@indiamartcrm.dev", Role.EMPLOYEE, manager.id);
  const emp2 = await upsertUser("Sneha Employee", "sneha@indiamartcrm.dev", Role.EMPLOYEE, manager.id);

  const sampleCustomers = [
    { name: "Arjun Traders", phone: "9800000001", company: "Arjun Traders", city: "Chennai", state: "Tamil Nadu", product: "Kids Dresses", status: LeadStatus.NEW, assignee: emp1.id },
    { name: "Metro Textiles", phone: "9800000002", company: "Metro Textiles", city: "Coimbatore", state: "Tamil Nadu", product: "Men's Shirts", status: LeadStatus.CONTACTED, assignee: emp1.id },
    { name: "Sunrise Garments", phone: "9800000003", company: "Sunrise Garments", city: "Bengaluru", state: "Karnataka", product: "Women's Kurtis", status: LeadStatus.INTERESTED, assignee: emp2.id },
    { name: "Global Exports", phone: "9800000004", company: "Global Exports", city: "Mumbai", state: "Maharashtra", product: "Bulk Fabric", status: LeadStatus.FOLLOW_UP, assignee: emp2.id },
    { name: "Om Enterprises", phone: "9800000005", company: "Om Enterprises", city: "Delhi", state: "Delhi", product: "Footwear", status: LeadStatus.QUOTATION_SENT, assignee: emp1.id },
    { name: "Bright Fashions", phone: "9800000006", company: "Bright Fashions", city: "Pune", state: "Maharashtra", product: "Kids Dresses", status: LeadStatus.WON, assignee: emp2.id },
    { name: "Classic Apparels", phone: "9800000007", company: "Classic Apparels", city: "Hyderabad", state: "Telangana", product: "Men's Shirts", status: LeadStatus.LOST, assignee: emp1.id },
    { name: "Zenith Trading Co", phone: "9800000008", company: "Zenith Trading Co", city: "Ahmedabad", state: "Gujarat", product: "Bags", status: LeadStatus.NEW, assignee: emp2.id },
  ];

  for (const c of sampleCustomers) {
    const customer = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        name: c.name,
        phone: c.phone,
        company: c.company,
        city: c.city,
        state: c.state,
      },
    });

    const existingLead = await prisma.lead.findFirst({ where: { customerId: customer.id } });
    if (!existingLead) {
      await prisma.lead.create({
        data: {
          customerId: customer.id,
          productInterested: c.product,
          source: "IndiaMART",
          status: c.status,
          assignedToId: c.assignee,
          dealValue: c.status === LeadStatus.WON ? 45000 : null,
        },
      });
    }
  }

  const defaultScores: Record<string, number> = {
    WHATSAPP_MESSAGE_SENT: 2,
    CATALOG_SENT: 5,
    CALL_LOGGED: 3,
    FOLLOW_UP_COMPLETED: 5,
    QUOTATION_SENT: 8,
    DEAL_WON: 25,
  };
  for (const [key, points] of Object.entries(defaultScores)) {
    await prisma.productivityScoreConfig.upsert({
      where: { key },
      update: {},
      create: { key, points },
    });
  }

  console.log("Seed complete:");
  console.log(`  Admin login:    admin@indiamartcrm.dev / password123`);
  console.log(`  Manager login:  manager@indiamartcrm.dev / password123`);
  console.log(`  Employee login: rahul@indiamartcrm.dev / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
