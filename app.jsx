
const { useState, useMemo, useEffect, useRef } = React;

const FALLBACK_BODY_SHAPES = {
  "giant-schnauzer": "M 80 220 C 90 160 150 140 210 140 L 400 140 C 450 140 520 160 540 210 L 560 260 L 600 260 C 620 260 630 280 630 300 L 630 320 C 630 340 620 350 600 350 L 540 350 L 520 420 L 480 420 L 460 350 L 240 350 L 220 420 L 180 420 L 160 350 L 120 350 C 100 350 90 340 90 320 L 90 300 C 90 280 100 260 120 260 L 160 260 Z",
  "golden-retriever": "M 70 230 C 90 170 160 150 230 145 L 420 145 C 470 145 520 165 545 210 L 565 255 L 605 260 C 625 262 635 282 635 300 L 636 322 C 636 340 625 352 605 352 L 545 352 L 525 420 L 485 420 L 465 352 L 245 352 L 225 420 L 185 420 L 165 352 L 120 352 C 100 352 88 340 88 322 L 88 302 C 88 280 101 265 122 262 L 165 258 Z",
  "german-shepherd": "M 60 235 C 85 170 160 150 235 148 L 420 148 C 485 148 540 170 560 210 L 578 252 L 620 258 C 640 260 650 280 650 298 L 650 318 C 650 340 640 352 620 352 L 560 352 L 540 420 L 500 420 L 480 352 L 255 352 L 230 415 L 190 415 L 170 352 L 120 352 C 100 352 88 340 88 320 L 88 300 C 88 280 100 265 120 262 L 165 258 Z",
};

function EarsOverlay({ option }) {
  if (option === "cropped") return (<path d="M 240 140 L 250 90 L 260 140 Z M 440 140 L 450 90 L 460 140 Z" fill="#111" />);
  if (option === "natural") return (<path d="M 230 140 C 240 110 260 110 270 140 Z M 430 140 C 440 110 460 110 470 140 Z" fill="#111" />);
  return null;
}
function TailOverlay({ option }) {
  if (option === "docked") return (<rect x={560} y={250} width={20} height={20} fill="#111" />);
  if (option === "bobtail") return (<rect x={555} y={250} width={10} height={14} fill="#111" />);
  return null;
}

function App() {
  const [breedMeta, setBreedMeta] = useState({});
  const [silhouettes, setSilhouettes] = useState({});

  const [breed, setBreed] = useState("giant-schnauzer");
  const [ears, setEars] = useState("natural");
  const [tail, setTail] = useState("natural");
  const [connector, setConnector] = useState("classic");
  const [callName, setCallName] = useState("Sunny");
  const [regName, setRegName] = useState("Gloris Caramel RN BCAT CGCU TKA ATT");

  const [titlesData, setTitlesData] = useState({});
  const [registry, setRegistry] = useState("AKC");
  const [sport, setSport] = useState("Rally");
  const [selectedInd, setSelectedInd] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);

  const [customText, setCustomText] = useState("");
  const [customPieces, setCustomPieces] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch("breed_options.json").then(r => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      setBreedMeta(data || {});
      const first = Object.keys(data || {})[0] || "giant-schnauzer";
      setBreed(first);
      setEars(data[first]?.defaultEar || "natural");
      setTail(data[first]?.defaultTail || "natural");
    }).catch(()=>{});

    fetch("silhouettes.json").then(r => r.ok ? r.json() : {}).then(setSilhouettes).catch(()=>{});

    Promise.all([
      fetch("titles_akc.json").then(r => r.ok ? r.json() : {}),
      fetch("titles_ukc.json").then(r => r.ok ? r.json() : {}),
    ]).then(([akc, ukc]) => {
      const merged = {}; if (Object.keys(akc).length) merged.AKC = akc; if (Object.keys(ukc).length) merged.UKC = ukc;
      setTitlesData(merged);
      const firstSport = merged["AKC"] ? Object.keys(merged["AKC"])[0] : (merged["UKC"] ? Object.keys(merged["UKC"])[0] : undefined);
      if (firstSport) setSport(firstSport);
    });
  }, []);

  useEffect(() => {
    const meta = breedMeta[breed] || {};
    if (!meta.allowedEars?.includes(ears)) setEars(meta.defaultEar || "natural");
    if (!meta.allowedTails?.includes(tail)) setTail(meta.defaultTail || "natural");
  }, [breed, breedMeta]);

  function sanitizeTitle(s) { return (s || "").toUpperCase().replace(/[^A-Z0-9 .&+\-\/]/g,"").slice(0,14); }
  function addCustomPiece() {
    const t = sanitizeTitle(customText.trim()); if (!t) return;
    const id = `c${Date.now()}`; setCustomPieces(arr => [...arr, { id, x: 680, y: 540, title: t }]); setCustomText("");
  }

  const meta = breedMeta[breed] || {};
  const allowedEars = meta.allowedEars || ["natural"];
  const allowedTails = meta.allowedTails || ["natural"];
  const sil = silhouettes[breed];

  return (
    <div className="container" style={{maxWidth:1200, margin:"0 auto", padding:16, display:"grid", gridTemplateColumns:"330px 1fr", gap:16}}>
      <style>{`
        .panel{background:#fff;border-radius:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:16px}
        .btn{padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}
        .btn.active{background:#0f172a;color:#fff}
        .label{font-weight:700;display:block;margin:10px 0 6px}
        .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        select,input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px}
        .muted{font-size:12px;color:#64748b}
      `}</style>

      <div className="panel">
        <h1 style={{fontSize:22,fontWeight:700,margin:"2px 0 14px"}}>Wag &amp; Brag — Builder</h1>

        <div className="label">Breed</div>
        <select value={breed} onChange={(e)=>setBreed(e.target.value)}>
          {Object.entries(breedMeta).map(([id, b]) => (<option key={id} value={id}>{b.label}</option>))}
        </select>
        <div className="muted" style={{marginTop:6}}>Silhouette source: {sil ? "custom (silhouettes.json)" : (FALLBACK_BODY_SHAPES[breed] ? "fallback" : "none")}</div>

        <div className="label">Ears</div>
        <div className="row">{allowedEars.map(opt => (<button key={opt} className={"btn " + (ears===opt? "active":"")} onClick={()=>setEars(opt)}>{opt}</button>))}</div>

        <div className="label">Tail</div>
        <div className="row">{allowedTails.map(opt => (<button key={opt} className={"btn " + (tail===opt? "active":"")} onClick={()=>setTail(opt)}>{opt}</button>))}</div>

        <div className="label">Connector style</div>
        <div className="row">{["classic","rounded","angular"].map(c => (<button key={c} className={"btn " + (connector===c? "active":"")} onClick={()=>setConnector(c)}>{c}</button>))}</div>

        <div className="label">Call name</div>
        <input value={callName} onChange={(e)=>setCallName(e.target.value)} />
        <div className="label">Registered name</div>
        <input value={regName} onChange={(e)=>setRegName(e.target.value)} />

        <div className="label" style={{marginTop:10}}>Custom titles</div>
        <div className="row">
          <input placeholder="Enter title (e.g., THDN, BH-VT, RESCUE)" value={customText} onChange={(e)=>setCustomText(e.target.value)} />
          <button className="btn active" onClick={addCustomPiece}>Add</button>
        </div>
        <div className="muted" style={{marginTop:6}}>Auto-uppercase • ~14 chars • allowed: A–Z, 0–9, space, . & + - /</div>
      </div>

      <div className="panel">
        <svg ref={svgRef} width={900} height={720} viewBox="0 0 900 720" xmlns="http://www.w3.org/2000/svg">
          <rect x={0} y={0} width={900} height={720} fill="#ffffff" />
          <g opacity={0.15}>
            {Array.from({ length: 90 }).map((_, i) => (<line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={720} stroke="#94a3b8" strokeWidth={0.5} />))}
            {Array.from({ length: 72 }).map((_, i) => (<line key={`h${i}`} x1={0} y1={i * 10} x2={900} y2={i * 10} stroke="#94a3b8" strokeWidth={0.5} />))}
          </g>

          <g transform="translate(100,60)">
            {/* Dog silhouette */}
            {sil ? (
              <g transform={`translate(${sil.dx || 0},${sil.dy || 0}) scale(${(sil.scaleX ?? sil.scale ?? 1)}, ${(sil.scaleY ?? sil.scale ?? 1)})`}>
                <path d={sil.d} fill="#111" />
              </g>
            ) : (
              <path d={FALLBACK_BODY_SHAPES[breed] || FALLBACK_BODY_SHAPES["giant-schnauzer"]} fill="#111" />
            )}

            {/* Labels */}
            <text x={320} y={110} textAnchor="middle" fontFamily="ui-sans-serif" fontSize={28}>{regName}</text>
            <text x={320} y={130} textAnchor="middle" fontFamily="ui-sans-serif" fontSize={40} fontWeight={700}>{callName}</text>
          </g>

          {/* Title pieces */}
          {customPieces.map((p) => (
            <g key={p.id} transform={`translate(${p.x}, ${p.y})`} style={{ cursor:"grab" }}>
              <rect x={0} y={0} width={180} height={120} fill="#f8fafc" stroke="#0f172a" rx={8} />
              <text x={90} y={60} textAnchor="middle" dominantBaseline="middle" fontSize={20} fontFamily="ui-sans-serif">{p.title}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
