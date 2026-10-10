#!/usr/bin/env python3
"""WealthPlaner command-center — static server + real /command-center automation loop.

The /api/run endpoint drives the mechanical spine of the pipeline: it verifies each
gate against the REAL files (G4 actually runs the test suite + production build),
advances stage by stage, and STOPS honestly at the first Class B / missing evidence.
It never fakes a pass — mirroring the standing working condition.
"""
import json, os, re, subprocess, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.normpath(os.path.join(HERE, "..", "project"))
APP  = os.path.join(PROJ, "4-build", "wealthplaner")
PORT = int(os.environ.get("CC_PORT", "3300"))

def exists(*parts):
    return os.path.isfile(os.path.join(PROJ, *parts))

def release_fields():
    """Return {target,approver,rollback} -> bool 'still TBD' from project.yml."""
    out = {"target": True, "approver": True, "rollback": True}
    try:
        txt = open(os.path.join(PROJ, "project.yml"), encoding="utf-8").read()
    except OSError:
        return out
    m = re.search(r"^release:\s*$(.*?)^\S", txt, re.M | re.S)
    block = m.group(1) if m else txt
    for k in out:
        mm = re.search(rf"^\s*{k}:\s*(.+)$", block, re.M)
        val = (mm.group(1) if mm else "").split("#")[0]
        out[k] = "TBD" in val
    return out

def rehearsed():
    log = os.path.join(PROJ, "6-release", "rollback-rehearsal.log")
    try:
        return "rehearse ok" in open(log, encoding="utf-8").read()
    except OSError:
        return False

def run(cmd):
    try:
        p = subprocess.run(cmd, cwd=APP, capture_output=True, text=True, timeout=180)
        return p.returncode == 0, (p.stdout + p.stderr)
    except Exception as e:                       # noqa
        return False, str(e)

GATE_OWNER = {"G1":"product-owner","G2":"system-analyst","G3":"design-sys-arch",
              "G4":"developer","G5":"code-reviewer","G6":"quality-assurance"}

def _project_text():
    try: return open(os.path.join(PROJ, "project.yml"), encoding="utf-8").read()
    except OSError: return ""

def parse_gates(txt):
    m = re.search(r"\ngates:\s*\n(.*?)(?:\n[a-z_]+:\s*\n)", txt, re.S)
    body = "\n" + (m.group(1) if m else "")   # leading \n so the first "- id:" also splits
    out = []
    for blk in re.split(r"\n  - id:", body):
        blk = blk.strip()
        gid = re.match(r"(G\d)", blk)
        if not gid: continue
        nm = re.search(r"name:\s*(.+)", blk)
        ck = re.search(r"checked:\s*(\S+)", blk)
        rs = re.search(r"result:\s*(\w+)", blk)
        out.append({"id": gid.group(1),
                    "name": (nm.group(1).strip() if nm else ""),
                    "when": (ck.group(1) if ck else ""),
                    "result": (rs.group(1) if rs else "")})
    return out

def build_activity():
    txt = _project_text()
    acts = []
    for g in parse_gates(txt):
        acts.append({"kind": "gate", "id": g["id"], "result": g["result"],
                     "when": g["when"], "owner": GATE_OWNER.get(g["id"], ""),
                     "label": g["name"]})
    try:
        for line in open(os.path.join(PROJ, "REGISTER.md"), encoding="utf-8"):
            m = re.match(r"\|\s*([A-Z]{2,4}-WPN-\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\S+)\s*\|", line)
            if m:
                acts.append({"kind": "doc", "code": m.group(1), "label": m.group(2),
                             "status": m.group(4), "when": m.group(5)})
    except OSError:
        pass
    for parts, label in [(("5-quality","review-report.md"), "Code review report (G5)"),
                         (("5-quality","QAR-WPN-001.md"), "QA report — PASS WITH ADVISORIES"),
                         (("6-release","release-checklist-WPN.md"), "Release checklist + watch plan"),
                         (("6-release","rollback.sh"), "rollback.sh (executable + rehearse gate)")]:
        if exists(*parts):
            acts.append({"kind": "file", "label": label, "when": ""})
    return acts

# ── the gate checks: (id, name, owner, check) → check() yields log lines and returns (ok, missing[]) ──
def check_G1():
    ok = exists("1-product", "PRD-WPN-001.md") and exists("1-product", "REQ-WPN-001.md")
    return ok, [] if ok else ["PRD/REQ-WPN-001 ยังไม่มี"]

def check_G2():
    ok = exists("2-analysis", "SRS-WPN-001.md") and exists("2-analysis", "TST-WPN-001.md")
    return ok, [] if ok else ["SRS/TST-WPN-001 ยังไม่มี"]

def check_G3():
    ok = exists("3-design", "DSN-WPN-001.md")
    return ok, [] if ok else ["DSN-WPN-001 ยังไม่มี"]

def check_G5():
    ok = exists("5-quality", "review-report.md")
    return ok, [] if ok else ["review report ยังไม่มี"]

def check_G6():
    miss = []
    rf = release_fields()
    for k, tbd in rf.items():
        if tbd: miss.append(f"release.{k} ยังเป็น TBD")
    if not rehearsed(): miss.append("rollback ยังไม่เคยซ้อมจริง (--rehearse)")
    if not exists("5-quality", "QAR-WPN-001.md"): miss.append("QAR ยังไม่มี")
    return (len(miss) == 0), miss

def sse(emit, **ev):
    emit("data: " + json.dumps(ev, ensure_ascii=False) + "\n\n")

def run_loop(emit):
    sse(emit, type="log", msg="▶ /command-center — เริ่ม loop · verify กับไฟล์จริง")
    time.sleep(.2)
    stages = [
        ("G1", "Definition of Ready",  "product-owner",     check_G1),
        ("G2", "Design handback",      "system-analyst",    check_G2),
        ("G3", "Design system ready",  "design-sys-arch",   check_G3),
        ("G4", "Definition of Done",   "developer",         None),      # special: tests+build
        ("G5", "Code review",          "code-reviewer",     check_G5),
        ("G6", "Ready to release",     "quality-assurance", check_G6),
    ]
    reached = "quality"
    for gid, name, owner, chk in stages:
        sse(emit, type="gate", id=gid, state="checking")
        sse(emit, type="log", msg=f"· {gid} {name} — {owner} กำลังตรวจ…")
        time.sleep(.35)
        if gid == "G4":
            sse(emit, type="log", msg="  ↳ รัน npm test …")
            ok_t, out_t = run(["npm", "test"])
            mp = re.search(r"pass (\d+)", out_t); mf = re.search(r"fail (\d+)", out_t)
            passN = mp.group(1) if mp else "?"; failN = mf.group(1) if mf else "0"
            tot = str(int(passN) + int(failN)) if mp else "?"
            sse(emit, type="log", msg=("  ✓ tests: %s/%s ผ่าน" % (passN, tot)) if ok_t else ("  ✗ tests ล้มเหลว (fail %s)" % failN))
            sse(emit, type="log", msg="  ↳ รัน npm run build …")
            ok_b, out_b = run(["npm", "run", "build"])
            routes = len(re.findall(r"[┌├└]\s+○", out_b)) or len(re.findall(r"\n[┌├└]", out_b))
            sse(emit, type="log", msg=("  ✓ build ผ่าน · %d routes" % routes) if ok_b else "  ✗ build ล้มเหลว")
            ok, miss = (ok_t and ok_b), ([] if ok_t and ok_b else ["tests/build ไม่ผ่าน"])
        else:
            ok, miss = chk()
        if ok:
            sse(emit, type="gate", id=gid, state="pass")
            sse(emit, type="log", msg=f"  ✓ {gid} PASS — {owner} approve → เดินต่อ")
            time.sleep(.3)
        else:
            sse(emit, type="gate", id=gid, state="fail")
            sse(emit, type="log", msg=f"  ▲ {gid} NOT YET — หยุด (Class B / หลักฐานไม่พอ)")
            for m in miss:
                sse(emit, type="log", msg=f"     · {m}")
            sse(emit, type="stop", gate=gid, missing=miss)
            emit_flush(emit)
            return
    sse(emit, type="log", msg="✓ ทุก gate ผ่าน — pipeline ถึง release")
    sse(emit, type="done")

def emit_flush(emit):
    sse(emit, type="end")

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def _static(self):
        path = self.path.split("?")[0]
        if path == "/": path = "/index.html"
        fp = os.path.normpath(os.path.join(HERE, path.lstrip("/")))
        if not fp.startswith(HERE) or not os.path.isfile(fp):
            self.send_error(404); return
        ext = os.path.splitext(fp)[1]
        ctype = {".html":"text/html; charset=utf-8", ".jpg":"image/jpeg",
                 ".png":"image/png", ".js":"text/javascript", ".css":"text/css",
                 ".sh":"text/plain; charset=utf-8"}.get(ext, "application/octet-stream")
        data = open(fp, "rb").read()
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data))); self.end_headers()
        self.wfile.write(data)

    def _json(self, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(200); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data))); self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/activity":
            self._json(build_activity()); return
        if self.path.split("?")[0] == "/api/run":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            def emit(s):
                try:
                    self.wfile.write(s.encode("utf-8")); self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    raise
            try:
                run_loop(emit); emit_flush(emit)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        self._static()

if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    print(f"command-center runner on http://127.0.0.1:{PORT}  (project={PROJ})")
    srv.serve_forever()
