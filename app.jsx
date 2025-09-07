
const { useState, useEffect, useRef } = React;

/** Fallback dog shapes if a breed has no custom silhouette */
const FALLBACK_BODY_SHAPES = {
  "giant-schnauzer": "M 80 220 C 90 160 150 140 210 140 L 400 140 C 450 140 520 160 540 210 L 560 260 L 600 260 C 620 260 630 280 630 300 L 630 320 C 630 340 620 350 600 350 L 540 350 L 520 420 L 480 420 L 460 350 L 240 350 L 220 420 L 180 420 L 160 350 L 120 350 C 100 350 90 340 90 320 L 90 300 C 90 280 100 260 120 260 L 160 260 Z",
  "golden-retriever": "M 70 230 C 90 170 160 150 230 145 L 420 145 C 470 145 520 165 545 210 L 565 255 L 605 260 C 625 262 635 282 635 300 L 636 322 C 636 340 625 352 605 352 L 545 352 L 525 420 L 485 420 L 465 352 L 245 352 L 225 420 L 185 420 L 165 352 L 120 352 C 100 352 88 340 88 322 L 88 302 C 88 280 101 265 122 262 L 165 258 Z",
  "german-shepherd": "M 60 235 C 85 170 160 150 235 148 L 420 148 C 485 148 540 170 560 210 L 578 252 L 620 258 C 640 260 650 280 650 298 L 650 318 C 650 340 640 352 620 352 L 560 352 L 540 420 L 500 420 L 480 352 L 255 352 L 230 415 L 190 415 L 170 352 L 120 352 C 100 352 88 340 88 320 L 88 300 C 88 280 100 265 120 262 L 165 258 Z",
};

/** Main App */
function App() {
  // Data
  const [breedMeta, setBreedMeta] = useState({});
  const [silhouettes, setSilhouettes] = useState({});
  const [titles, setTitles] = useState({ AKC: {}, UKC: {} });
  const [connectors, setConnectors] = useState({}); // name -> { label, src, width, height, textX, textY }

  // UI state
  const [breed, setBreed] = useState("giant-schnauzer");
  const [ears, setEars] = useState("natural");
  const [tail, setTail] = useState("natural");
  const [facing, setFacing] = useState("right"); // "right" | "left", UI says rotate
  const [regName, setRegName] = useState("Kennel Name’s Leading by Example"); // sample value
  const [callName, setCallName] = useState("Call Name: Demo"); // sample value
  const [font, setFont] = useState("ui-sans-serif");

  const [registry, setRegistry] = useState("AKC");
  const [sport, setSport] = useState("");
  const [selConn, setSelConn] = useState("hearts"); // default connector style

  const [selectedInd, setSelectedInd] = useState([]);
  const [pieces, setPieces] = useState([]); // [{id, x,y, title, connector}]

  const svgRef = useRef(null);

  // Load external files
  useEffect(() => {
    fetch("breed_options.json").then(r => r.ok ? r.json() : {}).then((data) => {
      if (data && Object.keys(data).length) {
        setBreedMeta(data);
        const first = Object.keys(data)[0];
        setBreed(first);
        setEars(data[first]?.defaultEar || "natural");
        setTail(data[first]?.defaultTail || "natural");
      }
    });
    fetch("silhouettes.json").then(r => r.ok ? r.json() : {}).then(setSilhouettes).catch(()=>{});
    Promise.all([
      fetch("titles_akc.json").then(r => r.ok ? r.json() : {}),
      fetch("titles_ukc.json").then(r => r.ok ? r.json() : {}),
      fetch("connectors.json").then(r => r.ok ? r.json() : {})
    ]).then(([akc, ukc, conns]) => {
      const merged = { AKC: akc || {}, UKC: ukc || {} };
      setTitles(merged);
      setConnectors(conns || {});
      const firstSport = Object.keys(merged["AKC"] || {}).concat(Object.keys(merged["UKC"] || {}))[0] || "";
      setSport(firstSport);
      if (conns && conns.hearts) setSelConn("hearts");
      else if (conns && Object.keys(conns).length) setSelConn(Object.keys(conns)[0]);
    });
  }, []);

  // Keep ears/tail valid when breed changes
  useEffect(() => {
    const meta = breedMeta[breed];
    if (!meta) return;
    if (!meta.allowedEars?.includes(ears)) setEars(meta.defaultEar || "natural");
    if (!meta.allowedTails?.includes(tail)) setTail(meta.defaultTail || "natural");
  }, [breed, breedMeta]);

  // Derived
  const meta = breedMeta[breed] || {};
  const allowedEars = meta.allowedEars || ["natural"];
  const allowedTails = meta.allowedTails || ["natural"];
  const dogSil = silhouettes[breed]; // { d, scale/scaleX/scaleY, dx, dy }

  // Flip around center of dog area to simulate left/right orientation
  const centerX = 320; // box center inside translate(100,60)
  const faceTransform = facing === "left" ? `translate(${centerX},0) scale(-1,1) translate(${-centerX},0)` : "";

  function addSelectedTitles() {
    const list = (titles[registry]?.[sport]?.individual || [])
      .filter(it => selectedInd.includes(it.abbr));
    list.forEach((it, i) => {
      const id = `t-${it.abbr}-${Date.now()}-${i}`;
      setPieces(arr => [...arr, { id, x: 60 + (i % 3) * 200, y: 520 + Math.floor(i/3)*140, title: it.abbr, connector: selConn }]);
    });
    setSelectedInd([]);
  }

  // Simple draggable (snap 10px)
  function movePiece(id, dx, dy) {
    setPieces(arr => arr.map(p => p.id === id ? { ...p, x: Math.round((p.x + dx) / 10) * 10, y: Math.round((p.y + dy) / 10) * 10 } : p));
  }

  return (
    <div style={{maxWidth:1200, margin:"0 auto", padding:16, display:"grid", gridTemplateColumns:"360px 1fr", gap:16}}>
      <style>{`
        .panel{background:#fff;border-radius:14px;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:16px}
        .btn{padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;cursor:pointer}
        .btn.active{background:#0f172a;color:#fff}
        .label{font-weight:700;display:block;margin:10px 0 6px}
        .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        select,input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px}
        .muted{font-size:12px;color:#64748b}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      `}</style>

      {/* Left panel */}
      <div className="panel">
        <h1 style={{fontSize:22,fontWeight:700,margin:"2px 0 14px"}}>Wag &amp; Brag — Builder</h1>

        <div className="label">Breed</div>
        <select value={breed} onChange={(e)=>setBreed(e.target.value)}>
          {Object.entries(breedMeta).map(([id, b]) => (<option key={id} value={id}>{b.label}</option>))}
        </select>
        <div className="muted" style={{marginTop:6}}>Silhouette source: {dogSil ? "custom (silhouettes.json)" : (FALLBACK_BODY_SHAPES[breed] ? "fallback" : "none")}</div>

        <div className="label">Orientation</div>
        <div className="row">
          <button className={"btn " + (facing==="right"?"active":"")} onClick={()=>setFacing("right")}>Rotate Right →</button>
          <button className={"btn " + (facing==="left"?"active":"")} onClick={()=>setFacing("left")}>← Rotate Left</button>
        </div>

        <div className="label">Ears</div>
        <div className="row">{allowedEars.map(opt => (<button key={opt} className={"btn " + (ears===opt? "active":"")} onClick={()=>setEars(opt)}>{opt}</button>))}</div>

        <div className="label">Tail</div>
        <div className="row">{allowedTails.map(opt => (<button key={opt} className={"btn " + (tail===opt? "active":"")} onClick={()=>setTail(opt)}>{opt}</button>))}</div>

        <div className="label">Enter Your Dog's Registered name (no titles)</div>
        <input value={regName} placeholder="Kennel Name’s Leading by Example" onChange={(e)=>setRegName(e.target.value)} />

        <div className="label">Call Name (optional)</div>
        <input value={callName} placeholder="Call Name: Demo" onChange={(e)=>setCallName(e.target.value)} />

        <div className="label">Connector style</div>
        <div className="row">
          {Object.entries(connectors).map(([key, c]) => (
            <button key={key} className={"btn " + (selConn===key? "active":"")} onClick={()=>setSelConn(key)}>{c.label || key}</button>
          ))}
        </div>
        <div className="muted">Select from your uploaded connector styles. Add more via <code>connectors.json</code>.</div>

        <div className="label" style={{marginTop:10}}>AKC & UKC Titles</div>
        <div className="row" style={{marginBottom:6}}>
          {["AKC","UKC"].map(r => (
            <button key={r} className={"btn " + (registry===r? "active":"")} onClick={()=>{ setRegistry(r); const first = Object.keys(titles[r] || {})[0] || ""; setSport(first); setSelectedInd([]); }}>{r}</button>
          ))}
        </div>
        <select value={sport} onChange={(e)=>{ setSport(e.target.value); setSelectedInd([]); }}>
          {Object.keys(titles[registry] || {}).map(sp => (<option key={sp} value={sp}>{sp}</option>))}
        </select>

        <div className="muted" style={{marginTop:6}}>Select as many single titles as you like, then click “Add selected”. BragPacks (by sport) appear if defined in your titles files.</div>
        <div className="grid" style={{marginTop:6}}>
          {(titles[registry]?.[sport]?.individual || []).map(it => {
            const checked = selectedInd.includes(it.abbr);
            return (
              <label key={it.abbr} style={{display:"flex",gap:6,alignItems:"center",border:checked?"1px solid #0f172a":"1px solid #e2e8f0",borderRadius:8,padding:"4px 6px"}}>
                <input type="checkbox" checked={checked} onChange={(e)=>{
                  setSelectedInd(prev => e.target.checked ? [...prev, it.abbr] : prev.filter(x => x !== it.abbr));
                }} />
                <span style={{fontFamily:"ui-monospace",fontSize:13}}>{it.abbr}</span>
              </label>
            );
          })}
        </div>
        <div className="row" style={{marginTop:8}}>
          <button className="btn active" onClick={addSelectedTitles}>Add selected</button>
          <button className="btn" onClick={()=>setSelectedInd([])}>Clear</button>
        </div>

        {/* Packs list (if present) */}
        {(titles[registry]?.[sport]?.packs || []).length ? (
          <div style={{border:"1px solid #e2e8f0", borderRadius:10, padding:10, marginTop:8}}>
            <div className="label" style={{marginTop:0}}>BragPacks — {sport}</div>
            {(titles[registry]?.[sport]?.packs || []).map(pk => (
              <div key={pk.name} style={{display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 8px", marginBottom:6}}>
                <div>
                  <div style={{fontWeight:600}}>{pk.name}</div>
                  <div className="muted">{(pk.includes || []).join(", ")}</div>
                </div>
                <button className="btn" onClick={()=>{
                  pk.includes.forEach((abbr, i) => {
                    const id = `p-${abbr}-${Date.now()}-${i}`;
                    setPieces(arr => [...arr, { id, x: 60 + (i % 3) * 200, y: 520 + Math.floor(i/3)*140, title: abbr, connector: selConn }]);
                  });
                }}>Add pack</button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Right panel */}
      <div className="panel">
        <svg ref={svgRef} width={900} height={720} viewBox="0 0 900 720" xmlns="http://www.w3.org/2000/svg">
          <rect x={0} y={0} width={900} height={720} fill="#ffffff" />
          <g opacity={0.15}>
            {Array.from({ length: 90 }).map((_, i) => (<line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={720} stroke="#94a3b8" strokeWidth={0.5} />))}
            {Array.from({ length: 72 }).map((_, i) => (<line key={`h${i}`} x1={0} y1={i * 10} x2={900} y2={i * 10} stroke="#94a3b8" strokeWidth={0.5} />))}
          </g>

          <g transform="translate(100,60)">
            {/* Dog */}
            <g transform={faceTransform}>
              {dogSil ? (
                <g transform={`translate(${dogSil.dx || 0},${dogSil.dy || 0}) scale(${(dogSil.scaleX ?? dogSil.scale ?? 1)}, ${(dogSil.scaleY ?? dogSil.scale ?? 1)})`}>
                  <path d={dogSil.d} fill="#111" />
                </g>
              ) : (
                <path d={FALLBACK_BODY_SHAPES[breed] || FALLBACK_BODY_SHAPES["giant-schnauzer"]} fill="#111" />
              )}
            </g>

            {/* Names */}
            <text x={320} y={110} textAnchor="middle" fontFamily={font} fontSize={28}>{regName}</text>
            <text x={320} y={130} textAnchor="middle" fontFamily={font} fontSize={40} fontWeight={700}>{callName}</text>
          </g>

          {/* Title pieces */}
          {pieces.map((p) => {
            const C = connectors[p.connector];
            const W = (C?.width || 180), H = (C?.height || 120);
            const tx = (C?.textX ?? W/2), ty = (C?.textY ?? H/2);
            return (
              <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                {C?.src ? (
                  <image href={C.src} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid meet" />
                ) : (
                  <rect x="0" y="0" width={W} height={H} fill="#f8fafc" stroke="#0f172a" rx="12" />
                )}
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="20" fontFamily="ui-sans-serif">{p.title}</text>
                {/* Simple dragging */}
                <rect x="0" y="0" width={W} height={H} fill="transparent"
                  onPointerDown={(e)=>{
                    let startX = e.clientX, startY = e.clientY;
                    const move = (ev)=>{ movePiece(p.id, ev.clientX - startX, ev.clientY - startY); startX = ev.clientX; startY = ev.clientY; };
                    const up = ()=>{ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
                  }} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
