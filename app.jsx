
const { useState, useEffect } = React;

const FALLBACK_BODY_SHAPES = {
  "default": "M 80 220 C 90 160 150 140 210 140 L 400 140 C 450 140 520 160 540 210 L 560 260 L 600 260 C 620 260 630 280 630 300 L 630 320 C 630 340 620 350 600 350 L 540 350 L 520 420 L 480 420 L 460 350 L 240 350 L 220 420 L 180 420 L 160 350 L 120 350 C 100 350 90 340 90 320 L 90 300 C 90 280 100 260 120 260 L 160 260 Z"
};

const FONT_CHOICES = [
  { id: "system-sans", label: "System Sans", css: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  { id: "system-serif", label: "System Serif", css: "ui-serif, Georgia, 'Times New Roman', Times, serif" },
  { id: "montserrat", label: "Montserrat (clean sans)", css: "'Montserrat', ui-sans-serif, system-ui, Arial, sans-serif" },
  { id: "poppins", label: "Poppins (modern sans)", css: "'Poppins', ui-sans-serif, system-ui, Arial, sans-serif" },
  { id: "merriweather", label: "Merriweather (serif)", css: "'Merriweather', ui-serif, Georgia, serif" },
  { id: "playfair", label: "Playfair Display (serif)", css: "'Playfair Display', ui-serif, Georgia, serif" },
  { id: "lora", label: "Lora (serif)", css: "'Lora', ui-serif, Georgia, serif" },
  { id: "roboto-slab", label: "Roboto Slab (serif)", css: "'Roboto Slab', ui-serif, Georgia, serif" }
];

// dark yellow used on all connector "sign" text
const SIGN_TEXT_COLOR = "#B8860B"; // DarkGoldenRod; tweakable

function App() {
  const [breedMeta, setBreedMeta] = useState({});
  const [silhouettes, setSilhouettes] = useState({});
  const [titles, setTitles] = useState({ AKC: {}, UKC: {} });
  const [connectors, setConnectors] = useState({});

  const [breed, setBreed] = useState("");
  const [ears, setEars] = useState("natural");
  const [tail, setTail] = useState("natural");
  const [facing, setFacing] = useState("right");

  const [regName, setRegName] = useState("Kennel Name’s Leading by Example");
  const [callName, setCallName] = useState("Call Name: Demo");

  const [regFont, setRegFont] = useState("montserrat");
  const [callFont, setCallFont] = useState("playfair");
  const [titleFont, setTitleFont] = useState("system-sans");

  const [registry, setRegistry] = useState("AKC");
  const [sport, setSport] = useState("");
  const [selConn, setSelConn] = useState("hearts");

  const [selectedInd, setSelectedInd] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("breed_options.json").then(r => r.json()).then((data) => {
      setBreedMeta(data || {});
      const first = Object.keys(data || {})[0];
      if (first) {
        setBreed(first);
        setEars(data[first]?.defaultEar || "natural");
        setTail(data[first]?.defaultTail || "natural");
      }
    });
    fetch("silhouettes.json").then(r => r.json()).then(setSilhouettes).catch(()=>{});
    Promise.all([
      fetch("titles_akc.json").then(r => r.json()).catch(()=>({})),
      fetch("titles_ukc.json").then(r => r.json()).catch(()=>({})),
      fetch("connectors.json").then(r => r.json()).catch(()=>({}))
    ]).then(([akc, ukc, conns]) => {
      setTitles({ AKC: akc || {}, UKC: ukc || {} });
      setConnectors(conns || {});
      const firstSport = Object.keys(akc || {})[0] || Object.keys(ukc || {})[0] || "";
      setSport(firstSport);
      if (conns && Object.keys(conns).length) setSelConn(Object.keys(conns)[0]);
      try { const saved = JSON.parse(localStorage.getItem("wagbrag-cart") || "[]"); if (Array.isArray(saved)) setCart(saved); } catch {}
    });
  }, []);

  useEffect(() => { try { localStorage.setItem("wagbrag-cart", JSON.stringify(cart)); } catch {} }, [cart]);

  const meta = breedMeta[breed] || {};
  const allowedEars = meta.allowedEars || ["natural"];
  const allowedTails = meta.allowedTails || ["natural"];
  const dogSil = silhouettes[breed];
  const centerX = 320;

  function addSelectedToCart() {
    const list = (titles[registry]?.[sport]?.individual || [])
      .filter(it => selectedInd.includes(it.abbr));

    setCart(prev => {
      const next = [...prev];
      for (const it of list) {
        const key = `${registry}:${sport}:${it.abbr}`;
        if (!next.some(x => x.key === key)) {
          next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, key, abbr: it.abbr, name: it.name, registry, sport, connector: selConn });
        }
      }
      return next;
    });
    setSelectedInd([]);
  }

  function addCustomTitle() {
    const val = prompt("Enter a custom title to add:");
    if (!val) return;
    const abbr = val.trim();
    const key = `CUSTOM:${abbr}`;
    setCart(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, key, abbr, name: abbr, registry, sport: "Custom", connector: selConn }]);
  }

  function removeFromCart(id) { setCart(prev => prev.filter(x => x.id !== id)); }
  function clearCart() { if (confirm("Clear all selected titles?")) setCart([]); }
  function downloadCart() {
    const blob = new Blob([JSON.stringify({ items: cart }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "wagbrag_selection.json"; a.click(); URL.revokeObjectURL(url);
  }

  function fontCSS(id) { return (FONT_CHOICES.find(f => f.id === id) || FONT_CHOICES[0]).css; }

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
        .cartRow{display:flex;gap:8px;align-items:center;justify-content:space-between;border:1px solid #e2e8f0;border-radius:10px;padding:6px 8px}
      `}</style>

      {/* Left controls */}
      <div className="panel">
        <h1 style={{fontSize:22,fontWeight:700,margin:"2px 0 14px"}}>Wag &amp; Brag — Builder</h1>

        <div className="label">Breed</div>
        <select value={breed} onChange={(e)=>setBreed(e.target.value)}>
          {Object.entries(breedMeta).map(([id, b]) => (<option key={id} value={id}>{b.label}</option>))}
        </select>

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

        {/* Font pickers */}
        <div className="label">Registered Name Font</div>
        <select value={regFont} onChange={(e)=>setRegFont(e.target.value)}>
          {FONT_CHOICES.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}
        </select>

        <div className="label">Call Name Font</div>
        <select value={callFont} onChange={(e)=>setCallFont(e.target.value)}>
          {FONT_CHOICES.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}
        </select>

        <div className="label">Title Pieces Font</div>
        <select value={titleFont} onChange={(e)=>setTitleFont(e.target.value)}>
          {FONT_CHOICES.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}
        </select>

        <div className="label" style={{marginTop:10}}>Registry</div>
        <div className="row">
          {["AKC","UKC"].map(r => (
            <button key={r} className={"btn " + (registry===r? "active":"")} onClick={()=>{ setRegistry(r); const first = Object.keys(titles[r] || {})[0] || ""; setSport(first); setSelectedInd([]); }}>{r}</button>
          ))}
        </div>

        <div className="label">Sport / Event</div>
        <select value={sport} onChange={(e)=>{ setSport(e.target.value); setSelectedInd([]); }}>
          {Object.keys(titles[registry] || {}).map(sp => (<option key={sp} value={sp}>{sp}</option>))}
        </select>

        <div className="label">Titles — {registry} / {sport || "None"}</div>
        <div className="grid">
          {(titles[registry]?.[sport]?.individual || []).map(it => {
            const checked = selectedInd.includes(it.abbr);
            return (
              <label key={it.abbr} style={{display:"flex",gap:6,alignItems:"center",border:checked?"1px solid #0f172a":"1px solid #e2e8f0",borderRadius:8,padding:"4px 6px"}}>
                <input type="checkbox" checked={checked} onChange={(e)=>{
                  setSelectedInd(prev => e.target.checked ? [...prev, it.abbr] : prev.filter(x => x !== it.abbr));
                }} />
                <span style={{fontFamily: fontCSS(titleFont), fontSize:13}} title={it.name || it.abbr}>{it.abbr}</span>
              </label>
            );
          })}
        </div>

        <div className="row" style={{marginTop:8}}>
          <button className="btn active" onClick={addSelectedToCart}>Add selected</button>
          <button className="btn" onClick={()=>setSelectedInd([])}>Clear boxes</button>
          <button className="btn" onClick={addCustomTitle}>+ Custom title</button>
        </div>
      </div>

      {/* Right: preview + cart */}
      <div className="panel">
        <svg width={900} height={520} viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg">
          <rect x={0} y={0} width={900} height={520} fill="#ffffff" />
          <g opacity={0.15}>
            {Array.from({ length: 90 }).map((_, i) => (<line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={520} stroke="#94a3b8" strokeWidth={0.5} />))}
            {Array.from({ length: 52 }).map((_, i) => (<line key={`h${i}`} x1={0} y1={i * 10} x2={900} y2={i * 10} stroke="#94a3b8" strokeWidth={0.5} />))}
          </g>
          <g transform="translate(100,40)">
            <g transform={facing === "left" ? `translate(${320},0) scale(-1,1) translate(${-320},0)` : ""}>
              {silhouettes[breed] ? (
                <g transform={`translate(${silhouettes[breed].dx || 0},${silhouettes[breed].dy || 0}) scale(${(silhouettes[breed].scaleX ?? silhouettes[breed].scale ?? 1)}, ${(silhouettes[breed].scaleY ?? silhouettes[breed].scale ?? 1)})`}>
                  <path d={silhouettes[breed].d} fill="#111" />
                </g>
              ) : (
                <path d={FALLBACK_BODY_SHAPES["default"]} fill="#111" />
              )}
            </g>
            <text x={320} y={110} textAnchor="middle" fontFamily={fontCSS(regFont)} fontSize={28}>{regName}</text>
            <text x={320} y={130} textAnchor="middle" fontFamily={fontCSS(callFont)} fontSize={40} fontWeight={700}>{callName}</text>
          </g>

          {cart.map((p, idx) => {
            const C = connectors[p.connector] || {};
            const W = (C.width || 180), H = (C.height || 120);
            const tx = (C.textX ?? W/2), ty = (C.textY ?? H/2);
            const perRow = Math.max(1, Math.floor(760 / (W + 20)));
            const x = 60 + (idx % perRow) * (W + 20);
            const y = 340 + Math.floor(idx / perRow) * (H + 20);
            const color = C.textColor || SIGN_TEXT_COLOR;
            return (
              <g key={p.id} transform={`translate(${x}, ${y})`}>
                {C.src ? <image href={C.src} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid meet" /> : <rect x="0" y="0" width={W} height={H} fill="#f8fafc" stroke="#0f172a" rx="12" />}
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="20" fontFamily={fontCSS(titleFont)} fill={color}>{p.abbr}</text>
              </g>
            );
          })}
        </svg>

        <div style={{marginTop:12}}>
          <div className="label" style={{marginTop:0}}>Selected Titles ({cart.length})</div>
          <div className="row" style={{marginBottom:8}}>
            <button className="btn" onClick={()=>{ try { localStorage.setItem("wagbrag-cart", JSON.stringify(cart)); alert("Saved!"); } catch(e) { alert("Could not save."); } }}>Save</button>
            <button className="btn" onClick={()=>{ try { const saved = JSON.parse(localStorage.getItem("wagbrag-cart")||"[]"); setCart(Array.isArray(saved)?saved:[]); } catch{} }}>Load</button>
            <button className="btn" onClick={downloadCart}>Download selection</button>
            <button className="btn" onClick={clearCart}>Clear all</button>
          </div>
          <div className="grid" style={{gridTemplateColumns:"1fr",maxHeight:220,overflow:"auto"}}>
            {cart.map(item => (
              <div key={item.id} className="cartRow">
                <div>
                  <div style={{fontFamily: fontCSS(titleFont), fontSize:13, color: SIGN_TEXT_COLOR}}>{item.abbr}</div>
                  <div className="muted">{item.registry} • {item.sport}</div>
                </div>
                <button className="btn" onClick={()=>removeFromCart(item.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="muted" style={{marginTop:6}}>All connector sign text is rendered in dark yellow for preview.</div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
