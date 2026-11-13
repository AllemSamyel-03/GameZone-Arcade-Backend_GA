const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');
const { validateBooking } = require('../middleware/validator');

/**
 * THE JOIN ENDPOINT:
 * GET /bookings
 * Returns bookings with the gamer name and the console name.
 * Module 1 to 3 Core Requirement
 */
router.get('/', async (req, res, next) => {
  try {
    const { gamer_id, console_id } = req.query;
    let sql = `
      SELECT
        b.id,
        b.gamer_id,
        g.name AS gamer_name,
        g.email AS gamer_email,
        b.console_id,
        c.name AS console_name,
        c.platform AS console_platform,
        b.start_date,
        b.end_date,
        b.created_at
      FROM bookings b
      JOIN gamers g ON b.gamer_id = g.id
      JOIN consoles c ON b.console_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (gamer_id) {
      sql += ` AND b.gamer_id = ?`;
      params.push(gamer_id);
    }

    if (console_id) {
      sql += ` AND b.console_id = ?`;
      params.push(console_id);
    }

    sql += ` ORDER BY b.start_date DESC, b.id DESC`;

    const bookings = await all(sql, params);
    return res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /bookings/:id
 * Retrieve single booking with joined gamer and console details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Booking ID must be a numeric integer." });
    }

    const booking = await get(`
      SELECT
        b.id,
        b.gamer_id,
        g.name AS gamer_name,
        g.email AS gamer_email,
        b.console_id,
        c.name AS console_name,
        c.platform AS console_platform,
        b.start_date,
        b.end_date,
        b.created_at
      FROM bookings b
      JOIN gamers g ON b.gamer_id = g.id
      JOIN consoles c ON b.console_id = c.id
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ error: `Booking with ID ${id} not found.` });
    }

    return res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /bookings
 * Create a new booking
 * Validates dates and checks relationship existence.
 * Twist Rule (Test 1): If end_date < start_date, returns 400 Bad Request!
 * Status: 201 Created
 */
router.post('/', validateBooking, async (req, res, next) => {
  try {
    const { gamer_id, console_id, start_date, end_date } = req.body;

    // Check gamer existence
    const gamer = await get(`SELECT id, name FROM gamers WHERE id = ?`, [gamer_id]);
    if (!gamer) {
      return res.status(404).json({
        error: `Validation error: Gamer with ID ${gamer_id} does not exist.`
      });
    }

    // Check console existence
    const consoleItem = await get(`SELECT id, name FROM consoles WHERE id = ?`, [console_id]);
    if (!consoleItem) {
      return res.status(404).json({
        error: `Validation error: Console with ID ${console_id} does not exist.`
      });
    }

    // Insert new booking
    const result = await run(
      `INSERT INTO bookings (gamer_id, console_id, start_date, end_date) VALUES (?, ?, ?, ?)`,
      [gamer_id, console_id, start_date, end_date]
    );

    // Fetch newly created booking with the gamer name and console name joined
    const newBooking = await get(`
      SELECT
        b.id,
        b.gamer_id,
        g.name AS gamer_name,
        g.email AS gamer_email,
        b.console_id,
        c.name AS console_name,
        c.platform AS console_platform,
        b.start_date,
        b.end_date,
        b.created_at
      FROM bookings b
      JOIN gamers g ON b.gamer_id = g.id
      JOIN consoles c ON b.console_id = c.id
      WHERE b.id = ?
    `, [result.id]);

    return res.status(201).json(newBooking);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /bookings/:id
 * Cancel / delete a booking
 * Status: 200 OK
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Booking ID must be a numeric integer." });
    }

    const existing = await get(`SELECT * FROM bookings WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: `Booking with ID ${id} not found.` });
    }

    await run(`DELETE FROM bookings WHERE id = ?`, [id]);
    return res.status(200).json({
      message: `Booking with ID ${id} successfully cancelled.`,
      deleted: existing
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
