const { useState, useEffect, useRef } = React;

// ---------------------------------------------------------------------------
// Two Columns — a pause-and-sort tool for hooked interpersonal moments.
//
// One job: when you're spiralling about someone's reaction, it makes you
// (1) unhook from the thought, then (2) sort it — is this about the integrity
// of MY action, or about THEIR reaction? — and it withholds any help with
// managing their reaction until you've confirmed your own action was
// values-aligned. It logs nothing. It does its work in the moment and lets go.
//
// PWA build: fully offline. No server, no Claude, no storage of entries.
// Only a tiny bit of localStorage to remember your last-used unhook mode.
// ---------------------------------------------------------------------------

const PREF_KEY = "two-columns-pref";

const C = {
  bg0: "#3C4A52",
  bg1: "#2B363D",
  bg2: "#222B31",
  bone: "#E8E6DC",
  boneDim: "#C3C5BC",
  slate: "#5E6E74",
  slateLite: "#8A989E",
  olive: "#7C8350",
  oliveLite: "#9AA06A",
  line: "#46545B",
  card: "#34414A",
  warn: "#B98A57",
};

// ---- small helpers --------------------------------------------------------
function loadPref() {
  try {
    return localStorage.getItem(PREF_KEY) || "stream";
  } catch {
    return "stream";
  }
}
function savePref(v) {
  try {
    localStorage.setItem(PREF_KEY, v);
  } catch {}
}

// ===========================================================================
// ROOT — a linear flow with explicit phases. No tabs: the sequence IS the
// discipline. You can't reach "sort" without passing through "unhook".
// ===========================================================================
function App() {
  // phases: "enter" -> "unhook" -> "sort" -> "check" -> "act" | "release"
  const [phase, setPhase] = useState("enter");
  const [situation, setSituation] = useState("");
  const [mode, setMode] = useState(loadPref());
  // sorted thoughts: { text, column: "mine" | "theirs" }
  const [thoughts, setThoughts] = useState([]);
  const [valuesAligned, setValuesAligned] = useState(null); // null | true | false

  const reset = () => {
    setSituation("");
    setThoughts([]);
    setValuesAligned(null);
    setPhase("enter");
  };

  return (
    <div style={styles.shell}>
      <style>{globalCss}</style>

      <header style={styles.header}>
        <div style={styles.leafMark} aria-hidden="true">❧</div>
        <h1 style={styles.title}>Two Columns</h1>
        <div style={styles.subtitle}>step back, then sort</div>
      </header>

      <main style={styles.main}>
        {phase === "enter" && (
          <Enter
            situation={situation}
            setSituation={setSituation}
            onNext={() => setPhase("unhook")}
          />
        )}
        {phase === "unhook" && (
          <Unhook
            mode={mode}
            setMode={(m) => { setMode(m); savePref(m); }}
            situation={situation}
            onDone={() => setPhase("sort")}
          />
        )}
        {phase === "sort" && (
          <Sort
            thoughts={thoughts}
            setThoughts={setThoughts}
            onNext={() => setPhase("check")}
            onBack={() => setPhase("unhook")}
          />
        )}
        {phase === "check" && (
          <Check
            valuesAligned={valuesAligned}
            setValuesAligned={setValuesAligned}
            onActionPath={() => setPhase("act")}
            onReleasePath={() => setPhase("release")}
          />
        )}
        {phase === "act" && <ActPath thoughts={thoughts} onReset={reset} />}
        {phase === "release" && <ReleasePath onReset={reset} />}
      </main>

      <footer style={styles.footer}>
        {phase !== "enter" && (
          <button onClick={reset} style={styles.footerBtn}>
            Start over
          </button>
        )}
        <div style={styles.footerNote}>Nothing here is saved. This is a practice, not a record.</div>
      </footer>
    </div>
  );
}

// ===========================================================================
// PHASE 1 — ENTER: name the situation in one line. Deliberately one line:
// the constraint resists the rehearsing/elaborating the tool is here to stop.
// ===========================================================================
const ENTER_EXAMPLES = [
  "Bracing for how [person] takes the feedback",
  "Replaying the conversation with [person]",
  "Tempted to soften the message to [person]",
  "[person] made an unreasonable request and I said no",
  "Worried [person] is annoyed with me",
  "Rehearsing what I'll say to [person] tomorrow",
  "Drafting a follow-up to smooth things over with [person]",
];

function Enter({ situation, setSituation, onNext }) {
  const [exIndex, setExIndex] = useState(() => Math.floor(Math.random() * ENTER_EXAMPLES.length));
  useEffect(() => {
    const t = setInterval(() => setExIndex((i) => (i + 1) % ENTER_EXAMPLES.length), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <section style={styles.panel}>
      <p style={styles.lead}>
        You're hooked on something — a reaction you're bracing for, a conversation
        you keep replaying, a message you're tempted to soften.
      </p>
      <label style={styles.label}>Name it in one line</label>
      <input
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder={`e.g. ${ENTER_EXAMPLES[exIndex]}`}
        style={styles.input}
        maxLength={140}
        autoFocus
      />
      <p style={styles.hint}>One line is enough. You're not solving it here — you're stepping back from it.</p>
      <button
        onClick={onNext}
        style={{ ...styles.primary, ...(situation.trim() ? {} : styles.disabled) }}
        disabled={!situation.trim()}
      >
        Step back first →
      </button>
    </section>
  );
}

// ===========================================================================
// PHASE 2 — UNHOOK: defusion before sorting, so you're not sorting while fused.
// Three modes. Each is an experiential exercise, not relaxation.
// ===========================================================================
function Unhook({ mode, setMode, situation, onDone }) {
  const modes = [
    ["stream", "Leaves on a stream"],
    ["sky", "Sky, not the weather"],
    ["card", "Card on the lap"],
  ];
  return (
    <section style={styles.panel}>
      {situation && <div style={styles.situationChip}>{situation}</div>}
      <div style={styles.modeRow}>
        {modes.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{ ...styles.modeBtn, ...(mode === key ? styles.modeBtnActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "stream" && <LeavesOnStream onDone={onDone} />}
      {mode === "sky" && <SkyNotWeather onDone={onDone} />}
      {mode === "card" && <CardOnLap onDone={onDone} />}
    </section>
  );
}

// ---- Leaves on a stream ---------------------------------------------------
// Ambient: leaves drift across and off-screen. You place the thought on a leaf
// and watch it carried away — not pushed, just allowed to pass.
function LeavesOnStream({ onDone }) {
  const [leaves, setLeaves] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = setInterval(() => {
      const id = idRef.current++;
      const top = 12 + Math.random() * 60; // % within the stream band
      const dur = 9 + Math.random() * 5;
      const rot = -30 + Math.random() * 60;
      setLeaves((ls) => [...ls, { id, top, dur, rot }]);
      setTimeout(() => setLeaves((ls) => ls.filter((l) => l.id !== id)), dur * 1000);
    }, 1600);
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { clearInterval(spawn); clearInterval(tick); };
  }, []);

  return (
    <div>
      <p style={styles.exerciseLead}>
        Place each thought on a leaf and let the stream carry it. You're not
        getting rid of it — you're letting it float past at its own pace.
      </p>
      <div style={styles.stream} aria-hidden="true">
        <div style={styles.streamLines} />
        {leaves.map((l) => (
          <div
            key={l.id}
            style={{
              ...styles.leaf,
              top: `${l.top}%`,
              animationDuration: `${l.dur}s`,
              transform: `rotate(${l.rot}deg)`,
            }}
          >
            ❧
          </div>
        ))}
      </div>
      <UnhookFooter elapsed={elapsed} onDone={onDone} />
    </div>
  );
}

// ---- Sky, not the weather -------------------------------------------------
// Your anchor. The thoughts are weather; you are the sky that holds them and
// remains. A slow breathing dot paces the watching.
function SkyNotWeather({ onDone }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  return (
    <div>
      <p style={styles.exerciseLead}>
        The thoughts and the dread are weather — moving through. You are the sky
        that holds them and stays. Watch the weather; be the sky.
      </p>
      <div style={styles.sky} aria-hidden="true">
        <div style={styles.cloud1} />
        <div style={styles.cloud2} />
        <div style={styles.breathDot} />
      </div>
      <p style={styles.breathLabel}>Let your breath follow the light as it widens and falls.</p>
      <UnhookFooter elapsed={elapsed} onDone={onDone} />
    </div>
  );
}

// ---- Card on the lap ------------------------------------------------------
// Write the thought onto a card, then set it down on your lap — present,
// not pushed away — while you turn to the next values-based action.
function CardOnLap({ onDone }) {
  const [text, setText] = useState("");
  const [placed, setPlaced] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(tick);
  }, []);
  return (
    <div>
      <p style={styles.exerciseLead}>
        Write the thought on the card. Then set it down on your lap — you're not
        throwing it away, you're letting it rest there while you turn toward what
        matters.
      </p>
      {!placed ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The thought, in its own words…"
            style={styles.cardInput}
            rows={3}
          />
          <button
            onClick={() => setText(text.trim()) || setPlaced(true)}
            style={{ ...styles.secondary, ...(text.trim() ? {} : styles.disabled) }}
            disabled={!text.trim()}
          >
            Set it on my lap
          </button>
        </div>
      ) : (
        <div style={styles.lapWrap}>
          <div style={styles.lapCard}>{text || "…"}</div>
          <p style={styles.lapNote}>
            It's resting there. It can stay as long as it needs. Now turn your
            attention to the next thing that matters.
          </p>
          <button onClick={() => { setPlaced(false); }} style={styles.linkBtn}>
            ← write another
          </button>
        </div>
      )}
      <UnhookFooter elapsed={elapsed} onDone={onDone} minSeconds={placed ? 8 : 20} />
    </div>
  );
}

// Shared: the "ready" gate. You can't rush past the unhook — the button
// only enables after a short minimum, so the pause is real.
function UnhookFooter({ elapsed, onDone, minSeconds = 20 }) {
  const ready = elapsed >= minSeconds;
  return (
    <div style={styles.unhookFooter}>
      {!ready ? (
        <div style={styles.waitNote}>Stay with it a moment…</div>
      ) : (
        <button onClick={onDone} style={styles.primary}>
          I've stepped back — now sort →
        </button>
      )}
    </div>
  );
}

// ===========================================================================
// PHASE 3 — SORT: the spine. Each thought goes in exactly one column —
// the integrity of MY action, or THEIR reaction. The sort is the insight.
// ===========================================================================
function Sort({ thoughts, setThoughts, onNext, onBack }) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(null); // text awaiting a column

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    setPending(t);
    setDraft("");
  };
  const assign = (column) => {
    setThoughts([...thoughts, { text: pending, column }]);
    setPending(null);
  };
  const remove = (i) => setThoughts(thoughts.filter((_, idx) => idx !== i));

  const mine = thoughts.filter((t) => t.column === "mine");
  const theirs = thoughts.filter((t) => t.column === "theirs");

  return (
    <section style={styles.panel}>
      <p style={styles.lead}>
        Take each thought you're carrying and put it in one column. The question
        is not whether it's true — it's <em>which column it belongs in</em>.
      </p>

      {!pending ? (
        <div style={styles.sortInputRow}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="A thought you're hooked on…"
            style={styles.input}
            maxLength={160}
            autoFocus
          />
          <button onClick={submit} style={{ ...styles.secondary, ...(draft.trim() ? {} : styles.disabled) }} disabled={!draft.trim()}>
            Sort it
          </button>
        </div>
      ) : (
        <div style={styles.assignBox}>
          <div style={styles.assignThought}>“{pending}”</div>
          <div style={styles.assignQ}>Which column is this in?</div>
          <div style={styles.assignBtns}>
            <button onClick={() => assign("mine")} style={styles.assignMine}>
              The integrity of<br /><strong>my action</strong>
            </button>
            <button onClick={() => assign("theirs")} style={styles.assignTheirs}>
              <strong>Their reaction</strong><br />(not mine to carry)
            </button>
          </div>
        </div>
      )}

      <div style={styles.columns}>
        <Column
          title="The integrity of my action"
          tone="mine"
          items={mine}
          allItems={thoughts}
          onRemove={remove}
        />
        <Column
          title="Their reaction"
          tone="theirs"
          items={theirs}
          allItems={thoughts}
          onRemove={remove}
        />
      </div>

      <div style={styles.navRow}>
        <button onClick={onBack} style={styles.linkBtn}>← back to stepping back</button>
        <button
          onClick={onNext}
          style={{ ...styles.primary, ...(thoughts.length ? {} : styles.disabled) }}
          disabled={!thoughts.length}
        >
          I've sorted them →
        </button>
      </div>
    </section>
  );
}

function Column({ title, tone, items, allItems, onRemove }) {
  return (
    <div style={{ ...styles.column, ...(tone === "mine" ? styles.colMine : styles.colTheirs) }}>
      <div style={styles.colTitle}>{title}</div>
      {items.length === 0 ? (
        <div style={styles.colEmpty}>—</div>
      ) : (
        items.map((it) => {
          const globalIndex = allItems.indexOf(it);
          return (
            <div key={globalIndex} style={styles.colItem}>
              <span>{it.text}</span>
              <button onClick={() => onRemove(globalIndex)} style={styles.colRemove} aria-label="remove">×</button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ===========================================================================
// PHASE 4 — CHECK: the gate. Before any help with their reaction, confirm
// your own action was values-aligned. This enforces the order: integrity
// first, reaction-management second (and only if integrity is settled).
// ===========================================================================
function Check({ valuesAligned, setValuesAligned, onActionPath, onReleasePath }) {
  return (
    <section style={styles.panel}>
      <p style={styles.lead}>
        One question, and it's the hinge of the whole thing:
      </p>
      <div style={styles.bigQuestion}>
        Was your action — the thing you actually did or are about to do —
        aligned with your values?
      </div>
      <p style={styles.hint}>
        Not: did it land well. Not: were they happy. Only: did you act with
        integrity, by your own lights?
      </p>

      <div style={styles.checkBtns}>
        <button onClick={() => { setValuesAligned(true); onActionPath(); }} style={styles.checkYes}>
          Yes — I acted with integrity
        </button>
        <button onClick={() => { setValuesAligned(false); onReleasePath(); }} style={styles.checkNo}>
          No — or I'm not sure
        </button>
      </div>
    </section>
  );
}

// ===========================================================================
// PHASE 5a — ACT PATH: integrity confirmed. NOW (and only now) reaction is
// addressed — and the framing is workability, not management. Their reaction
// is in the column you don't control. The action is done. What's the next
// values-based move?
// ===========================================================================
function ActPath({ thoughts, onReset }) {
  const theirs = thoughts.filter((t) => t.column === "theirs");
  return (
    <section style={styles.panel}>
      <div style={styles.resolveBadge}>Integrity settled</div>
      <p style={styles.lead}>
        Your action was values-aligned. That part is finished — it doesn't get
        more finished by being replayed.
      </p>

      {theirs.length > 0 && (
        <div style={styles.theirsRecap}>
          <div style={styles.recapTitle}>What's in the column you don't control</div>
          {theirs.map((t, i) => (
            <div key={i} style={styles.recapItem}>{t.text}</div>
          ))}
          <p style={styles.recapNote}>
            These are real, but they're not yours to carry or to manage into a
            different shape. Bracing for them won't change them.
          </p>
        </div>
      )}

      <div style={styles.nextBox}>
        <div style={styles.nextTitle}>The only live question now</div>
        <div style={styles.nextQ}>
          What's the next thing that matters to you — and what's one small move
          toward it in the next hour?
        </div>
      </div>

      <p style={styles.hint}>
        If a follow-up to them is genuinely a values-based action — repair, clarity,
        a thing you'd do regardless of how they take it — do that. If it's only to
        soften their reaction or settle your own dread, that's the column you don't control.
      </p>

      <button onClick={onReset} style={styles.primary}>Done — let it go</button>
    </section>
  );
}

// ===========================================================================
// PHASE 5b — RELEASE PATH: integrity NOT settled. The honest move isn't to
// manage their reaction — it's to address your own action. No reaction-help
// is offered here, deliberately.
// ===========================================================================
function ReleasePath({ onReset }) {
  return (
    <section style={styles.panel}>
      <div style={{ ...styles.resolveBadge, background: C.warn }}>Integrity unsettled</div>
      <p style={styles.lead}>
        That's the useful answer, not the bad one. If the action itself wasn't
        values-aligned, no amount of managing their reaction fixes it — and
        that's exactly the move to resist.
      </p>

      <div style={styles.nextBox}>
        <div style={styles.nextTitle}>Turn toward the action, not the reaction</div>
        <div style={styles.nextQ}>
          What would it look like to make your <em>action</em> right — to repair,
          own, or redo the thing you did — independent of how they respond to it?
        </div>
      </div>

      <p style={styles.hint}>
        This is repair you'd undertake because it's right, not to buy a softer
        reaction. The reaction stays in its column. The action is the only thing
        in your hands.
      </p>

      <button onClick={onReset} style={styles.primary}>I know my next move — close</button>
    </section>
  );
}

// ===========================================================================
// STYLES
// ===========================================================================
const globalCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${C.bg1}; }
  button { cursor: pointer; font-family: inherit; }
  button:focus-visible, input:focus-visible, textarea:focus-visible {
    outline: 2px solid ${C.oliveLite}; outline-offset: 2px;
  }
  ::placeholder { color: ${C.slateLite}; opacity: 0.7; }
  @keyframes drift {
    from { left: -8%; }
    to   { left: 108%; }
  }
  @keyframes breathe {
    0%, 100% { transform: scale(0.7); opacity: 0.5; }
    50%      { transform: scale(1.25); opacity: 1; }
  }
  @keyframes cloudDrift1 { from { transform: translateX(-20px);} to { transform: translateX(20px);} }
  @keyframes cloudDrift2 { from { transform: translateX(15px);} to { transform: translateX(-15px);} }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
  }
`;

const styles = {
  shell: {
    minHeight: "100vh",
    background: `linear-gradient(170deg, ${C.bg0}, ${C.bg1} 55%, ${C.bg2})`,
    color: C.bone,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif',
    display: "flex",
    flexDirection: "column",
    padding: "0 0 32px",
  },
  header: { textAlign: "center", padding: "36px 20px 8px" },
  leafMark: { color: C.oliveLite, fontSize: 30, lineHeight: 1, transform: "rotate(8deg)" },
  title: { margin: "8px 0 0", fontSize: 26, fontWeight: 600, letterSpacing: "0.06em", color: C.bone },
  subtitle: { color: C.slateLite, fontSize: 13, marginTop: 4, letterSpacing: "0.04em" },
  main: { width: "100%", maxWidth: 560, margin: "0 auto", padding: "16px", flex: 1 },

  panel: { animation: "none" },
  lead: { fontSize: 17, lineHeight: 1.55, color: C.bone, marginTop: 4 },
  label: { display: "block", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: C.slateLite, margin: "20px 0 8px" },
  hint: { fontSize: 13.5, lineHeight: 1.5, color: C.slateLite, marginTop: 10 },

  input: {
    width: "100%", padding: "13px 14px", fontSize: 16, fontFamily: "inherit",
    background: C.bg2, color: C.bone, border: `1px solid ${C.line}`, borderRadius: 8,
  },
  primary: {
    width: "100%", marginTop: 20, padding: "14px", fontSize: 16, fontWeight: 600,
    background: C.olive, color: "#fff", border: "none", borderRadius: 8, letterSpacing: "0.02em",
  },
  secondary: {
    padding: "13px 16px", fontSize: 15, fontWeight: 600,
    background: C.slate, color: C.bone, border: "none", borderRadius: 8, whiteSpace: "nowrap",
  },
  disabled: { opacity: 0.4, cursor: "not-allowed" },
  linkBtn: { background: "transparent", border: "none", color: C.oliveLite, fontSize: 14, padding: "8px 0", textDecoration: "underline" },

  situationChip: {
    background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 999,
    padding: "8px 16px", fontSize: 14, color: C.boneDim, marginBottom: 18,
    textAlign: "center", fontStyle: "italic",
  },

  modeRow: { display: "flex", gap: 6, marginBottom: 18 },
  modeBtn: {
    flex: 1, padding: "9px 6px", fontSize: 12.5, background: C.bg2,
    color: C.slateLite, border: `1px solid ${C.line}`, borderRadius: 7, lineHeight: 1.2,
  },
  modeBtnActive: { background: C.card, color: C.bone, borderColor: C.olive },

  exerciseLead: { fontSize: 15.5, lineHeight: 1.55, color: C.boneDim, margin: "4px 0 16px" },

  // Stream
  stream: {
    position: "relative", height: 200, borderRadius: 12, overflow: "hidden",
    background: `linear-gradient(180deg, ${C.bg2}, #1d262b)`, border: `1px solid ${C.line}`,
  },
  streamLines: {
    position: "absolute", inset: 0,
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0 26px, ${C.line}33 26px 27px)`,
  },
  leaf: {
    position: "absolute", left: "-8%", fontSize: 26, color: C.oliveLite,
    animationName: "drift", animationTimingFunction: "linear", animationIterationCount: 1,
    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
  },

  // Sky
  sky: {
    position: "relative", height: 200, borderRadius: 12, overflow: "hidden",
    background: "linear-gradient(180deg, #45555e, #2f3b42)", border: `1px solid ${C.line}`,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cloud1: {
    position: "absolute", top: "26%", left: "20%", width: 120, height: 30,
    background: "#ffffff14", borderRadius: 30, filter: "blur(6px)",
    animation: "cloudDrift1 14s ease-in-out infinite alternate",
  },
  cloud2: {
    position: "absolute", top: "62%", left: "48%", width: 90, height: 24,
    background: "#ffffff10", borderRadius: 24, filter: "blur(6px)",
    animation: "cloudDrift2 18s ease-in-out infinite alternate",
  },
  breathDot: {
    width: 64, height: 64, borderRadius: "50%",
    background: "radial-gradient(circle, #fdf6e3, #d8c89a)",
    animation: "breathe 9s ease-in-out infinite", boxShadow: "0 0 40px #fdf6e355",
  },
  breathLabel: { fontSize: 13.5, color: C.slateLite, textAlign: "center", marginTop: 12 },

  // Card on lap
  cardInput: {
    width: "100%", padding: "14px", fontSize: 16, fontFamily: "inherit", lineHeight: 1.5,
    background: C.bone, color: "#2a2a2a", border: "none", borderRadius: 10, resize: "vertical",
    boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
  },
  lapWrap: { textAlign: "center" },
  lapCard: {
    background: C.bone, color: "#2a2a2a", borderRadius: 10, padding: "22px 18px",
    fontSize: 17, lineHeight: 1.5, maxWidth: 360, margin: "0 auto",
    boxShadow: "0 10px 26px rgba(0,0,0,0.4)", transform: "rotate(-1.5deg)",
  },
  lapNote: { fontSize: 14.5, color: C.boneDim, lineHeight: 1.55, margin: "18px auto 0", maxWidth: 380 },

  unhookFooter: { marginTop: 18, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" },
  waitNote: { color: C.slateLite, fontSize: 14, fontStyle: "italic" },

  // Sort
  sortInputRow: { display: "flex", gap: 8, marginTop: 16 },
  assignBox: { marginTop: 16, background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 },
  assignThought: { fontSize: 17, lineHeight: 1.45, color: C.bone, textAlign: "center", fontStyle: "italic" },
  assignQ: { fontSize: 13, color: C.slateLite, textAlign: "center", margin: "12px 0", letterSpacing: "0.04em" },
  assignBtns: { display: "flex", gap: 10 },
  assignMine: {
    flex: 1, padding: "16px 10px", fontSize: 14, lineHeight: 1.35, borderRadius: 9,
    background: "#3a4a3e", color: C.bone, border: `1px solid ${C.olive}`,
  },
  assignTheirs: {
    flex: 1, padding: "16px 10px", fontSize: 14, lineHeight: 1.35, borderRadius: 9,
    background: "#46414a", color: C.boneDim, border: `1px solid #6b6370`,
  },

  columns: { display: "flex", gap: 10, marginTop: 22 },
  column: { flex: 1, borderRadius: 12, padding: 12, minHeight: 120, border: "1px solid" },
  colMine: { background: "#33403660", borderColor: `${C.olive}88` },
  colTheirs: { background: "#403b4660", borderColor: "#6b637088" },
  colTitle: { fontSize: 12.5, fontWeight: 600, color: C.boneDim, marginBottom: 10, lineHeight: 1.3 },
  colEmpty: { color: C.slate, textAlign: "center", padding: "16px 0", fontSize: 18 },
  colItem: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6,
    background: C.bg2, borderRadius: 7, padding: "9px 10px", marginBottom: 7, fontSize: 14, lineHeight: 1.4,
  },
  colRemove: { background: "transparent", border: "none", color: C.slateLite, fontSize: 18, lineHeight: 1, padding: 0 },

  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 12 },

  // Check
  bigQuestion: {
    fontSize: 20, lineHeight: 1.4, color: C.bone, fontWeight: 600,
    margin: "16px 0", padding: "20px", background: C.bg2, borderRadius: 12,
    borderLeft: `4px solid ${C.olive}`,
  },
  checkBtns: { display: "flex", flexDirection: "column", gap: 10, marginTop: 22 },
  checkYes: { padding: "16px", fontSize: 16, fontWeight: 600, background: C.olive, color: "#fff", border: "none", borderRadius: 9 },
  checkNo: { padding: "16px", fontSize: 16, fontWeight: 600, background: "transparent", color: C.boneDim, border: `1px solid ${C.line}`, borderRadius: 9 },

  // Resolve
  resolveBadge: {
    display: "inline-block", background: C.olive, color: "#fff", fontSize: 12,
    fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "6px 12px", borderRadius: 999, marginBottom: 14,
  },
  theirsRecap: { background: C.bg2, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, margin: "18px 0" },
  recapTitle: { fontSize: 12.5, color: C.slateLite, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 },
  recapItem: { fontSize: 14.5, color: C.boneDim, padding: "6px 0", borderBottom: `1px solid ${C.line}55` },
  recapNote: { fontSize: 13.5, color: C.slateLite, lineHeight: 1.55, marginTop: 12 },
  nextBox: { background: "#33403640", border: `1px solid ${C.olive}77`, borderRadius: 12, padding: 18, margin: "18px 0" },
  nextTitle: { fontSize: 12.5, color: C.oliveLite, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 },
  nextQ: { fontSize: 17, lineHeight: 1.5, color: C.bone },

  footer: { textAlign: "center", padding: "8px 20px 0", maxWidth: 560, margin: "0 auto", width: "100%" },
  footerBtn: { background: "transparent", border: `1px solid ${C.line}`, color: C.slateLite, fontSize: 13, padding: "8px 18px", borderRadius: 999, marginBottom: 12 },
  footerNote: { fontSize: 12, color: C.slate, lineHeight: 1.5 },
};

// --- Mount -----------------------------------------------------------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
