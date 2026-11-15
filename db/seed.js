const { db, run, all, initDatabase } = require('./database');

const seedData = async () => {
  try {
    console.log('[*] Initializing tables before seeding...');
    await initDatabase();

    // Clear existing data for clean re-runs
    await run(`DELETE FROM bookings`);
    await run(`DELETE FROM consoles`);
    await run(`DELETE FROM gamers`);
    await run(`DELETE FROM sqlite_sequence WHERE name IN ('gamers', 'consoles', 'bookings')`);

    console.log('[*] Seeding gamers...');
    await run(`
      INSERT INTO gamers (id, name, email) VALUES
      (1, 'Alex Mercer', 'alex.mercer@gmail.com'),
      (2, 'Sarah Connor', 'sarah.c@cyberdyne.io'),
      (3, 'Marcus Fenix', 'm.fenix@gearsofwar.com'),
      (4, 'Lara Croft', 'lara.croft@tombraider.org'),
      (5, 'Gordon Freeman', 'g.freeman@blackmesa.gov')
    `);

    console.log('[*] Seeding consoles (Console 4 explicitly set for Twist tests)...');
    await run(`
      INSERT INTO consoles (id, name, platform, status) VALUES
      (1, 'Station 1 - PS5 Standard', 'PlayStation 5', 'active'),
      (2, 'Station 2 - Xbox Series X', 'Xbox Series X', 'active'),
      (3, 'Station 3 - Switch OLED Lounge', 'Nintendo Switch', 'active'),
      (4, 'Station 4 - PlayStation 5 Pro', 'PlayStation 5', 'active'),
      (5, 'Station 5 - Xbox Series S', 'Xbox Series S', 'active'),
      (6, 'Station 6 - Steam Deck Station', 'PC/Steam', 'active')
    `);

    console.log('[*] Seeding bookings...');
    // Twist requirement: Booking for Console 4, 10 to 12 Nov (2026)
    await run(`
      INSERT INTO bookings (id, gamer_id, console_id, start_date, end_date) VALUES
      (1, 1, 4, '2026-11-10', '2026-11-12'),
      (2, 2, 2, '2026-11-01', '2026-11-05'),
      (3, 3, 1, '2026-11-14', '2026-11-16')
    `);

    const gamersCount = await all('SELECT COUNT(*) as count FROM gamers');
    const consolesCount = await all('SELECT COUNT(*) as count FROM consoles');
    const bookingsCount = await all('SELECT COUNT(*) as count FROM bookings');

    console.log(`[✔] Seeding completed successfully!`);
    console.log(`    - Gamers: ${gamersCount[0].count}`);
    console.log(`    - Consoles: ${consolesCount[0].count} (Console 4: 'Station 4 - PlayStation 5 Pro')`);
    console.log(`    - Bookings: ${bookingsCount[0].count} (Booking 1: Console 4 from 2026-11-10 to 2026-11-12)`);
  } catch (error) {
    console.error('[-] Seeding error:', error.message);
  }
};

// Execute if run directly via `node db/seed.js`
if (require.main === module) {
  seedData().then(() => {
    db.close();
  });
}

module.exports = seedData;

