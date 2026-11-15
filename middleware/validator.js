// Month names dictionary for textual dates like "11 Nov" or "11 Nov 2026"
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

/**
 * Normalizes date inputs into canonical 'YYYY-MM-DD' format.
 * Supports:
 * - YYYYMMDD (e.g., '20261111' -> '2026-11-11')
 * - YYYY-MM-DD (e.g., '2026-11-11')
 * - Textual formats (e.g., '11 Nov', '11 Nov 2026', 'Nov 11')
 */
const normalizeDate = (input, defaultYear = 2026) => {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // Pattern 1: YYYYMMDD (e.g. 20261111)
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    const numY = parseInt(y, 10);
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  // Pattern 2: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    const numM = parseInt(m, 10);
    const numD = parseInt(d, 10);
    if (numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
      return str;
    }
    return null;
  }

  // Pattern 3: "11 Nov" or "11 Nov 2026" or "11-Nov-2026"
  const textMatch = str.match(/^(\d{1,2})[\s\-]+([A-Za-z]{3,9})(?:[\s\-]+(\d{4}))?$/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    const year = textMatch[3] ? textMatch[3] : String(defaultYear);
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Pattern 4: "Nov 11" or "Nov 11 2026"
  const textMatchRev = str.match(/^([A-Za-z]{3,9})[\s\-]+(\d{1,2})(?:[\s\-]+(\d{4}))?$/);
  if (textMatchRev) {
    const day = textMatchRev[2].padStart(2, '0');
    const monthKey = textMatchRev[1].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    const year = textMatchRev[3] ? textMatchRev[3] : String(defaultYear);
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback: standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
};

// Validate console payload (name, platform)
const validateConsole = (req, res, next) => {
  const { name, platform } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: "Validation failed: 'name' is required and must be a non-empty string."
    });
  }

  if (!platform || typeof platform !== 'string' || platform.trim() === '') {
    return res.status(400).json({
      error: "Validation failed: 'platform' is required and must be a non-empty string."
    });
  }

  req.body.name = name.trim();
  req.body.platform = platform.trim();
  next();
};

// Validate gamer payload (name, email)
const validateGamer = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: "Validation failed: 'name' is required and must be a non-empty string."
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      error: "Validation failed: 'email' is required and must be a valid email address."
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

// Validate booking payload (gamer_id, console_id, start_date, end_date)
// TWIST REQUIREMENT: An end date before start date MUST return 400!
const validateBooking = (req, res, next) => {
  const { gamer_id, console_id, start_date, end_date } = req.body;

  if (!gamer_id || isNaN(Number(gamer_id)) || Number(gamer_id) <= 0) {
    return res.status(400).json({
      error: "Validation failed: 'gamer_id' must be a valid positive integer."
    });
  }

  if (!console_id || isNaN(Number(console_id)) || Number(console_id) <= 0) {
    return res.status(400).json({
      error: "Validation failed: 'console_id' must be a valid positive integer."
    });
  }

  if (!start_date) {
    return res.status(400).json({
      error: "Validation failed: 'start_date' is required."
    });
  }

  if (!end_date) {
    return res.status(400).json({
      error: "Validation failed: 'end_date' is required."
    });
  }

  const normalizedStart = normalizeDate(String(start_date));
  const normalizedEnd = normalizeDate(String(end_date));

  if (!normalizedStart) {
    return res.status(400).json({
      error: "Validation failed: 'start_date' must be in YYYYMMDD or YYYY-MM-DD format."
    });
  }

  if (!normalizedEnd) {
    return res.status(400).json({
      error: "Validation failed: 'end_date' must be in YYYYMMDD or YYYY-MM-DD format."
    });
  }

  // TWIST: End date before start date gets 400
  if (normalizedEnd < normalizedStart) {
    return res.status(400).json({
      error: "Validation failed: 'end_date' cannot be before 'start_date'."
    });
  }

  req.body.gamer_id = Number(gamer_id);
  req.body.console_id = Number(console_id);
  req.body.start_date = normalizedStart;
  req.body.end_date = normalizedEnd;

  next();
};

module.exports = {
  normalizeDate,
  validateConsole,
  validateGamer,
  validateBooking
};

