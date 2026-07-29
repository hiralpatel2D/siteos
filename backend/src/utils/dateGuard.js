// Project instruction #12: prompt to type today's date before any delete goes through.
// Enforced here server-side too (not just as a UI dialog) so the rule can't be bypassed.
export function isTodayConfirmed(confirmDate) {
  if (!confirmDate) return false;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, server clock
  return confirmDate === today;
}

export function requireTodayConfirmation(req, res) {
  const { confirmDate } = req.body || {};
  if (!isTodayConfirmed(confirmDate)) {
    res.status(400).json({ error: "Deletion requires confirming today's date (confirmDate=YYYY-MM-DD)." });
    return false;
  }
  return true;
}
