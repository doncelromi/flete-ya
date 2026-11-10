/** Opens a clean printable HTML report in a new window and triggers print. Returns false if blocked. */
export interface PrintSection {
  title: string
  head: string[]
  rows: (string | number)[][]
  alignRight?: number[]
}

const esc = (s: string | number) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)

export function printReport(o: {
  lang: 'es' | 'en'
  title: string
  subtitle: string
  generated: string
  kpis: { label: string; value: string }[]
  sections: PrintSection[]
  footer: string
}) {
  const w = window.open('', '_blank', 'width=900,height=1100')
  if (!w) return false
  const kpis = o.kpis.map((k) => `<div class="kpi"><div class="kl">${esc(k.label)}</div><div class="kv">${esc(k.value)}</div></div>`).join('')
  const sections = o.sections
    .map(
      (s) => `<h2>${esc(s.title)}</h2><table><thead><tr>${s.head
        .map((h, i) => `<th${s.alignRight?.includes(i) ? ' class="r"' : ''}>${esc(h)}</th>`)
        .join('')}</tr></thead><tbody>${s.rows
        .map((r) => `<tr>${r.map((c, i) => `<td${s.alignRight?.includes(i) ? ' class="r"' : ''}>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`,
    )
    .join('')
  w.document.write(`<!doctype html><html lang="${o.lang}"><head><meta charset="utf-8"><title>${esc(o.title)}</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#09090b;margin:0;padding:40px 48px;font-size:12px}
.top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1F5BFF;padding-bottom:14px;margin-bottom:20px}
.brand{font-size:20px;font-weight:800;letter-spacing:-.02em}.brand span{color:#1F5BFF}
h1{font-size:18px;margin:4px 0 2px}.sub{color:#71717a}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
.kpi{border:1px solid #e4e4e7;border-radius:10px;padding:10px 12px}.kl{font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;color:#71717a;font-weight:600}
.kv{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:17px;font-weight:700;margin-top:4px}
h2{font-size:13px;margin:22px 0 8px}table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:#71717a;border-bottom:1px solid #e4e4e7;padding:6px 8px;background:#fafafa}
td{padding:6px 8px;border-bottom:1px solid #f1f1f3;font-variant-numeric:tabular-nums}.r{text-align:right}
.foot{margin-top:28px;color:#a1a1aa;font-size:10px;border-top:1px solid #e4e4e7;padding-top:10px}
@media print{body{padding:18px 8px}}
</style></head><body>
<div class="top"><div><div class="brand">Fletes <span>ya</span></div><h1>${esc(o.title)}</h1><div class="sub">${esc(o.subtitle)}</div></div><div class="sub">${esc(o.generated)}</div></div>
<div class="kpis">${kpis}</div>${sections}<div class="foot">${esc(o.footer)}</div>
<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},250)}</script>
</body></html>`)
  w.document.close()
  return true
}
