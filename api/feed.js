// ライブ画面の予備の読み取り口。中継（ntfy）の内容をそのまま返す。
// 会場の回線が中継側の回数制限に当たって直接つなげないときに、画面がここを読む。
// 同じ問い合わせは数秒間まとめて1回にする（s-maxage）。中継側へ行く回数を抑えるため。
module.exports = async (req, res) => {
  const topic = String(req.query.t || ""), since = String(req.query.since || "all");
  if (!/^bothack-(selftest-)?[0-9a-f]{12,16}$/.test(topic)) return res.status(400).send("bad topic");
  if (!/^[A-Za-z0-9]{1,20}$/.test(since)) return res.status(400).send("bad since");
  try {
    const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=${since}`);
    if (!r.ok) return res.status(502).send("relay " + r.status);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=4, stale-while-revalidate=4");
    return res.status(200).send(await r.text());
  } catch (e) {
    return res.status(502).send(String(e));
  }
};
