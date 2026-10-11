// 画面の Go の合図を、中継（ntfy）へ取り次ぐ。
// 会場の回線が中継側の回数制限に当たっていても、合図だけは通すため。
// 取り次ぐ先は合図用の名前（bothack-ctl-＋16桁）に限る。
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const { topic, payload } = req.body || {};
  if (!/^bothack-ctl-[0-9a-f]{16}$/.test(topic || "")) return res.status(400).json({ ok: false, error: "bad topic" });
  const body = JSON.stringify(payload || {});
  if (Buffer.byteLength(body) > 3800) return res.status(400).json({ ok: false, error: "too long" });
  try {
    const r = await fetch("https://ntfy.sh/" + topic, { method: "POST", body });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e) });
  }
};
