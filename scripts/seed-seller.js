const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function run() {
  const existing = await db.user.findUnique({ where: { email: 'suman.paul.botanomaniac@gmail.com' } });
  if (existing) {
    console.log('EXISTS: ' + existing.id);
    // Update profile to set QR
    await db.sellerProfile.upsert({
      where: { userId: existing.id },
      update: { qrCodeUrl: '/phonepe-qr.png', upiId: 'botanomaniac@phonepe', isVerified: true, shopName: 'Botanomaniac' },
      create: { userId: existing.id, shopName: 'Botanomaniac', upiId: 'botanomaniac@phonepe', qrCodeUrl: '/phonepe-qr.png', isVerified: true }
    });
    console.log('Profile updated with QR');
    await db.$disconnect();
    return;
  }

  const user = await db.user.create({
    data: {
      name: 'Suman Paul',
      email: 'suman.paul.botanomaniac@gmail.com',
      phone: '7001274562',
      passwordHash: '$2b$12$FoQK9jDnHjvvUJ12Gchg0.8ZhCPGZvdJhLdgP6pkYKd1KIqaPahae',
      role: 'SELLER',
      bio: 'Plant lover and botanomaniac. Instagram: @botanomaniac.i.am | WhatsApp: 7001274562',
      isActive: true,
      sellerProfile: {
        create: {
          shopName: 'Botanomaniac',
          shopBio: 'Your one-stop shop for exotic plants, seeds, and planters.',
          upiId: 'botanomaniac@phonepe',
          qrCodeUrl: '/phonepe-qr.png',
          isVerified: true
        }
      }
    },
    select: { id: true, name: true, email: true }
  });
  console.log('CREATED: ' + user.id + ' | ' + user.email);
  await db.$disconnect();
}

run().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
