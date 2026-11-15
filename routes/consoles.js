const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');
const { validateConsole, normalizeDate } = require('../middleware/validator');

/**
 * TWIST ENDPOINT:
 * GET /consoles/available?date=YYYYMMDD
 * Lists the consoles with no booking covering that date.
 * (Placed before /:id route to prevent route collision)
 */
router.get('/available', async (req, res, next) => {
  try {
    const { date, platform } = req.query;

    if (!date) {
      return res.status(400).json({
        error: "Query parameter 'date' is required in YYYYMMDD or YYYY-MM-DD format (e.g. ?date=20261111)."
      });
    }

    const normalizedDate = normalizeDate(String(date));
    if (!normalizedDate) {
      return res.status(400).json({
        error: "Invalid date format. Expected YYYYMMDD or YYYY-MM-DD (e.g. ?date=20261111 or ?date=2026-11-11)."
      });
    }

    // A booking covers target date D when start_date <= D AND end_date >= D
    let sql = `
      SELECT id, name, platform, status
      FROM consoles
      WHERE id NOT IN (
        SELECT console_id
        FROM bookings
        WHERE start_date <= ? AND end_date >= ?
      )
    `;
    const params = [normalizedDate, normalizedDate];

    // Optional additional filtering by platform
    if (platform) {
      sql += ` AND LOWER(platform) LIKE ?`;
      params.push(`%${platform.toLowerCase()}%`);
    }

    sql += ` ORDER BY id ASC`;

    const availableConsoles = await all(sql, params);
    return res.status(200).json({
      query_date: normalizedDate,
      total_available: availableConsoles.length,
      consoles: availableConsoles
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /consoles
 * Search consoles by query parameter:
 * e.g., ?platform=PlayStation or ?name=Station
 */
router.get('/', async (req, res, next) => {
  try {
    const { platform, name, search } = req.query;
    let sql = `SELECT * FROM consoles WHERE 1=1`;
    const params = [];

    if (platform) {
      sql += ` AND LOWER(platform) LIKE ?`;
      params.push(`%${platform.toLowerCase()}%`);
    }

    if (name) {
      sql += ` AND LOWER(name) LIKE ?`;
      params.push(`%${name.toLowerCase()}%`);
    }

    if (search) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(platform) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    sql += ` ORDER BY id ASC`;
    const consoles = await all(sql, params);
    return res.status(200).json(consoles);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /consoles/:id
 * Retrieve a single console by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Console ID must be a numeric integer." });
    }

    const consoleItem = await get(`SELECT * FROM consoles WHERE id = ?`, [id]);
    if (!consoleItem) {
      return res.status(404).json({ error: `Console with ID ${id} not found.` });
    }

    return res.status(200).json(consoleItem);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /consoles
 * Add a new console (name and platform required)
 * Status: 201 Created
 */
router.post('/', validateConsole, async (req, res, next) => {
  try {
    const { name, platform, status } = req.body;
    const result = await run(
      `INSERT INTO consoles (name, platform, status) VALUES (?, ?, ?)`,
      [name, platform, status || 'active']
    );

    const newConsole = await get(`SELECT * FROM consoles WHERE id = ?`, [result.id]);
    return res.status(201).json(newConsole);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /consoles/:id
 * Update an existing console (validation on name and platform)
 * Status: 200 OK
 */
router.put('/:id', validateConsole, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Console ID must be a numeric integer." });
    }

    const existing = await get(`SELECT * FROM consoles WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: `Console with ID ${id} not found.` });
    }

    const { name, platform, status } = req.body;
    await run(
      `UPDATE consoles SET name = ?, platform = ?, status = ? WHERE id = ?`,
      [name, platform, status || existing.status, id]
    );

    const updated = await get(`SELECT * FROM consoles WHERE id = ?`, [id]);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /consoles/:id
 * Delete a console by ID
 * Status: 200 OK (with confirmation message and deleted object)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Console ID must be a numeric integer." });
    }

    const existing = await get(`SELECT * FROM consoles WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: `Console with ID ${id} not found.` });
    }

    await run(`DELETE FROM consoles WHERE id = ?`, [id]);
    return res.status(200).json({
      message: `Console with ID ${id} ('${existing.name}') successfully deleted.`,
      deleted: existing
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

