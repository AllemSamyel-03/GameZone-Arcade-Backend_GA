const { app, startServer } = require('../server');
const seedData = require('../db/seed');

let server;
const PORT = 3899;
const BASE_URL = `http://localhost:${PORT}`;

let passedCount = 0;
let failedCount = 0;

const assert = (condition, description) => {
  if (condition) {
    console.log(`  [✔ PASS] ${description}`);
    passedCount++;
  } else {
    console.error(`  [✖ FAIL] ${description}`);
    failedCount++;
  }
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🎮 RUNNING GAMEZONE ARCADE COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  // Seed fresh database
  await seedData();

  // Start temporary test server
  server = app.listen(PORT);

  try {
    // -----------------------------------------------------------------
    // TWIST TESTS (Required by Client Brief)
    // -----------------------------------------------------------------
    console.log('\n--- 1. TWIST TESTS ("Free on this date") ---');

    // TEST 1: End before start -> 400
    console.log('Testing Twist Test 1: End date before start date must return 400...');
    const test1Res = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gamer_id: 1,
        console_id: 2,
        start_date: '20261115',
        end_date: '20261110' // End before start!
      })
    });
    const test1Body = await test1Res.json();
    assert(test1Res.status === 400, `Test 1: Status code is 400 (Received: ${test1Res.status})`);
    assert(
      test1Body.error && test1Body.error.includes('cannot be before'),
      `Test 1: Returns clear error message: "${test1Body.error}"`
    );

    // TEST 2: Booking for Console 4, 10 to 12 Nov; available?date=11 Nov -> 200, Console 4 missing
    console.log('\nTesting Twist Test 2: available?date=20261111 (11 Nov) -> Console 4 must be MISSING...');
    // Test with YYYYMMDD
    const test2Res = await fetch(`${BASE_URL}/consoles/available?date=20261111`);
    const test2Data = await test2Res.json();
    assert(test2Res.status === 200, `Test 2: Status code is 200 for date=20261111`);
    const console4InTest2 = test2Data.consoles.find(c => c.id === 4);
    assert(!console4InTest2, `Test 2: Console 4 is missing from available consoles on 11 Nov (20261111)`);

    // Also test with textual "11 Nov"
    const test2TextRes = await fetch(`${BASE_URL}/consoles/available?date=11%20Nov`);
    const test2TextData = await test2TextRes.json();
    const console4InTest2Text = test2TextData.consoles.find(c => c.id === 4);
    assert(!console4InTest2Text, `Test 2 (textual format): Console 4 is missing for date="11 Nov"`);

    // TEST 3: available?date=13 Nov -> 200, Console 4 listed
    console.log('\nTesting Twist Test 3: available?date=20261113 (13 Nov) -> Console 4 must be LISTED...');
    const test3Res = await fetch(`${BASE_URL}/consoles/available?date=20261113`);
    const test3Data = await test3Res.json();
    assert(test3Res.status === 200, `Test 3: Status code is 200 for date=20261113`);
    const console4InTest3 = test3Data.consoles.find(c => c.id === 4);
    assert(!!console4InTest3, `Test 3: Console 4 is LISTED as available on 13 Nov (20261113)`);

    // Also test with textual "13 Nov"
    const test3TextRes = await fetch(`${BASE_URL}/consoles/available?date=13%20Nov`);
    const test3TextData = await test3TextRes.json();
    const console4InTest3Text = test3TextData.consoles.find(c => c.id === 4);
    assert(!!console4InTest3Text, `Test 3 (textual format): Console 4 is LISTED for date="13 Nov"`);

    // -----------------------------------------------------------------
    // CRUD TESTS FOR CONSOLES (Get all, get one, add, update, delete)
    // -----------------------------------------------------------------
    console.log('\n--- 2. CONSOLE CRUD ENDPOINTS & STATUS CODES ---');

    // Get All Consoles
    const getAllRes = await fetch(`${BASE_URL}/consoles`);
    const allConsoles = await getAllRes.json();
    assert(getAllRes.status === 200, `GET /consoles: Returns 200 OK`);
    assert(Array.isArray(allConsoles) && allConsoles.length >= 6, `GET /consoles: Returns array with ${allConsoles.length} consoles`);

    // Get One Console
    const getOneRes = await fetch(`${BASE_URL}/consoles/4`);
    const console4 = await getOneRes.json();
    assert(getOneRes.status === 200, `GET /consoles/4: Returns 200 OK`);
    assert(console4.id === 4 && console4.name.includes('PlayStation'), `GET /consoles/4: Returns correct console (${console4.name})`);

    // Get Non-Existent Console -> 404
    const getNotFoundRes = await fetch(`${BASE_URL}/consoles/9999`);
    assert(getNotFoundRes.status === 404, `GET /consoles/9999: Returns 404 Not Found`);

    // Add Console (POST /consoles) -> 201 Created
    const createRes = await fetch(`${BASE_URL}/consoles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Station 7 - Nintendo Switch OLED',
        platform: 'Nintendo Switch'
      })
    });
    const createdConsole = await createRes.json();
    assert(createRes.status === 201, `POST /consoles: Returns 201 Created`);
    assert(createdConsole.id && createdConsole.name === 'Station 7 - Nintendo Switch OLED', `POST /consoles: Returns created console object with ID ${createdConsole.id}`);

    // Update Console (PUT /consoles/:id) -> 200 OK
    const updateRes = await fetch(`${BASE_URL}/consoles/${createdConsole.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Station 7 - Nintendo Switch Pro Edition',
        platform: 'Nintendo Switch'
      })
    });
    const updatedConsole = await updateRes.json();
    assert(updateRes.status === 200, `PUT /consoles/${createdConsole.id}: Returns 200 OK`);
    assert(updatedConsole.name === 'Station 7 - Nintendo Switch Pro Edition', `PUT /consoles/:id: Console name updated properly`);

    // Delete Console (DELETE /consoles/:id) -> 200 OK
    const deleteRes = await fetch(`${BASE_URL}/consoles/${createdConsole.id}`, {
      method: 'DELETE'
    });
    assert(deleteRes.status === 200, `DELETE /consoles/${createdConsole.id}: Returns 200 OK`);

    // -----------------------------------------------------------------
    // VALIDATION AND SEARCH TESTS
    // -----------------------------------------------------------------
    console.log('\n--- 3. VALIDATION AND SEARCH ---');

    // Validation: Missing platform on POST /consoles -> 400
    const invalidConsoleRes = await fetch(`${BASE_URL}/consoles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Station Without Platform'
      })
    });
    const invalidConsoleBody = await invalidConsoleRes.json();
    assert(invalidConsoleRes.status === 400, `Validation: Missing platform returns 400 Bad Request`);
    assert(invalidConsoleBody.error && invalidConsoleBody.error.includes("'platform' is required"), `Validation: Clear error message received`);

    // Search: Query parameter ?platform=PlayStation
    const searchRes = await fetch(`${BASE_URL}/consoles?platform=PlayStation`);
    const searchConsoles = await searchRes.json();
    assert(searchRes.status === 200, `Search: GET /consoles?platform=PlayStation returns 200 OK`);
    const allArePlayStation = searchConsoles.every(c => c.platform.toLowerCase().includes('playstation'));
    assert(searchConsoles.length > 0 && allArePlayStation, `Search: Found ${searchConsoles.length} PlayStation consoles exclusively`);

    // -----------------------------------------------------------------
    // JOIN ENDPOINT TEST: Bookings with Gamer Name and Console Name
    // -----------------------------------------------------------------
    console.log('\n--- 4. THE JOIN ENDPOINT (bookings + gamer name + console name) ---');

    const joinRes = await fetch(`${BASE_URL}/bookings`);
    const joinedBookings = await joinRes.json();
    assert(joinRes.status === 200, `GET /bookings: Returns 200 OK`);
    assert(Array.isArray(joinedBookings) && joinedBookings.length > 0, `GET /bookings: Returns array of joined bookings`);

    const firstBooking = joinedBookings[0];
    assert(
      firstBooking.gamer_name !== undefined &&
      firstBooking.console_name !== undefined &&
      firstBooking.start_date !== undefined &&
      firstBooking.end_date !== undefined,
      `Join check: Contains gamer_name ('${firstBooking.gamer_name}') and console_name ('${firstBooking.console_name}')`
    );

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('====================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite encountered an error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
};

runTests();
