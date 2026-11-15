const express = require('express');
const router = express.Router();
const { all, get, run } = require('../db/database');
const { validateGamer } = require('../middleware/validator');

/**
 * GET /gamers
 * List all registered gamers (optional search by ?name or ?email)
 */
router.get('/', async (req, res, next) => {
  try {
    const { name, email } = req.query;
    let sql = `SELECT * FROM gamers WHERE 1=1`;
    const params = [];

    if (name) {
      sql += ` AND LOWER(name) LIKE ?`;
      params.push(`%${name.toLowerCase()}%`);
    }

    if (email) {
      sql += ` AND LOWER(email) LIKE ?`;
      params.push(`%${email.toLowerCase()}%`);
    }

    sql += ` ORDER BY id ASC`;
    const gamers = await all(sql, params);
    return res.status(200).json(gamers);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /gamers/:id
 * Retrieve single gamer details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Gamer ID must be a numeric integer." });
    }

    const gamer = await get(`SELECT * FROM gamers WHERE id = ?`, [id]);
    if (!gamer) {
      return res.status(404).json({ error: `Gamer with ID ${id} not found.` });
    }

    return res.status(200).json(gamer);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /gamers
 * Register a new gamer
 * Status: 201 Created
 */
router.post('/', validateGamer, async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check if email already exists
    const existing = await get(`SELECT id FROM gamers WHERE LOWER(email) = LOWER(?)`, [email]);
    if (existing) {
      return res.status(400).json({
        error: `A gamer with email '${email}' is already registered.`
      });
    }

    const result = await run(
      `INSERT INTO gamers (name, email) VALUES (?, ?)`,
      [name, email]
    );

    const newGamer = await get(`SELECT * FROM gamers WHERE id = ?`, [result.id]);
    return res.status(201).json(newGamer);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /gamers/:id
 * Update gamer details
 * Status: 200 OK
 */
router.put('/:id', validateGamer, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Gamer ID must be a numeric integer." });
    }

    const existing = await get(`SELECT * FROM gamers WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: `Gamer with ID ${id} not found.` });
    }

    const { name, email } = req.body;

    // If changing email, check for duplicate
    if (email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailInUse = await get(`SELECT id FROM gamers WHERE LOWER(email) = LOWER(?) AND id != ?`, [email, id]);
      if (emailInUse) {
        return res.status(400).json({
          error: `Email '${email}' is already in use by another gamer.`
        });
      }
    }

    await run(`UPDATE gamers SET name = ?, email = ? WHERE id = ?`, [name, email, id]);
    const updated = await get(`SELECT * FROM gamers WHERE id = ?`, [id]);
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /gamers/:id
 * Delete a gamer
 * Status: 200 OK
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Gamer ID must be a numeric integer." });
    }

    const existing = await get(`SELECT * FROM gamers WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: `Gamer with ID ${id} not found.` });
    }

    await run(`DELETE FROM gamers WHERE id = ?`, [id]);
    return res.status(200).json({
      message: `Gamer with ID ${id} ('${existing.name}') successfully deleted.`,
      deleted: existing
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

