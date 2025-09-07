
const { useState, useMemo, useEffect, useRef } = React;

/** External silhouettes
 * We load /silhouettes.json (mapping breed slug -> { d, scale, dx, dy })
 * and use it to draw the breed silhouette. If missing, we fall back to
 * the built-in placeholder shapes below.
 */
const FALLBACK_BODY_SHAPES = {
  "giant-schnauzer": "M 80 220 C 90 160 150 140 210 140 L 400 140 C 450 140 520 160 540 210 L 560 260 L 600 260 C 620 260 630 280 630 300 L 630 320 C 630 340 620 350 600 350 L 540 350 L 520 420 L 480 420 L 460 350 L 240 350 L 220 420 L 180 420 L 160 350 L 120 350 C 100 350 90 340 90 320 L 90 300 C 90 280 100 260 120 260 L 160 260 Z",
  "golden-retriever": "M 70 230 C 90 170 160 150 230 145 L 420 145 C 470 145 520 165 545 210 L 565 255 L 605 260 C 625 262 635 282 635 300 L 636 322 C 636 340 625 352 605 352 L 545 352 L 525 420 L 485 420 L 465 352 L 245 352 L 225 420 L 185 420 L 165 352 L 120 352 C 100 352 88 340 88 322 L 88 302 C 88 280 101 265 122 262 L 165 258 Z",
  "german-shepherd": "M 60 235 C 85 170 160 150 235 148 L 420 148 C 485 148 540 170 560 210 L 578 252 L 620 258 C 640 260 650 280 650 298 L 650 318 C 650 340 640 352 620 352 L 560 352 L 540 420 L 500 420 L 480 352 L 255 352 L 230 415 L 190 415 L 170 352 L 120 352 C 100 352 88 340 88 320 L 88 300 C 88 280 100 265 120 262 L 165 258 Z",
};

const DEFAULT_BREED_META = {
  "giant-schnauzer": { label: "Giant Schnauzer", allowedEars: ["natural","cropped"], allowedTails: ["natural","docked"], defaultEar: "natural", defaultTail: "natural" },
  "golden-retriever": { label: "Golden Retriever", allowedEars: ["natural"], allowedTails: ["natural"], defaultEar: "natural", defaultTail: "natural" },
  "german-shepherd": { label: "German Shepherd", allowedEars: ["natural"], allowedTails: ["natural"], defaultEar: "natural", defaultTail: "natural" },
};

function download(filename, text) {
  const a = document.createElement("a");
  a.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
  a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}
function svgToPng(svgEl, scale = 3) {
  return new Promise((resolve, reject) => {
    const xml = new XMLSerializer().serializeToString(svgEl);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = svgEl.viewBox.baseVal.width * scale;
      c.height = svgEl.viewBox.baseVal.height * scale;
      const ctx = c.getContext("2d");
      if (!ctx) return reject("No 2D context");
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml;base64," + svg64;
  });
}

function edgePath(w, h, edge, kind, style) {
  const neck = style === "angular" ? 0 : 10;
  const bulge = style === "angular" ? 0 : 8;
  const knob = () => {
    const mid = w / 2; const up = kind === "tab" ? -1 : 1;
    return [
      `C ${mid - 30} 0, ${mid - 20} ${up*(neck+bulge)}, ${mid - 2} ${up*(neck+bulge)}`,
      `C ${mid + 20} ${up*(neck+bulge)}, ${mid + 30} 0, ${w} 0`
    ].join(" ");
  };
  const flat = `L ${w} 0`;
  let d = "M 0 0 "; d += kind === "flat" ? flat : knob();
  const transform = edge === "top" ? "" : edge === "right" ? `translate(${w},0) rotate(90)` : edge === "bottom" ? `translate(${w},${h}) rotate(180)` : `translate(0,${h}) rotate(270)`;
  return { d, transform };
}
function piecePath(w, h, edges, style) {
  const top = edgePath(w, h, "top", edges.top, style);
  const right = edgePath(h, w, "right", edges.right, style);
  const bottom = edgePath(w, h, "bottom", edges.bottom, style);
  const left = edgePath(h, w, "left", edges.left, style);
  return { top, right, bottom, left };
}

function DraggablePiece({ x, y, setPos, title, connector, edges }) {
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);
  const W = 180, H = 120;
  const parts = useMemo(() => piecePath(W, H, edges, connector), [W, H, edges, connector]);
  useEffect(() => {
    function onMove(e) {
      if (!dragging || !start) return;
      const nx = Math.round(((x + (e.clientX - start.x)) / 10)) * 10;
      const ny = Math.round(((y + (e.clientY - start.y)) / 10)) * 10;
      setPos(nx, ny);
    }
    function onUp() { setDragging(false); setStart(null); }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [dragging, start, x, y, setPos]);

  return (
    <g transform={`translate(${x}, ${y})`} style={{ cursor: dragging ? "grabbing" : "grab" }}
       onPointerDown={(e) => { e.target.setPointerCapture?.(e.pointerId); setDragging(true); setStart({ x: e.clientX, y: e.clientY }); }}>
      <g fill="#f8fafc" stroke="#0f172a" strokeWidth={2}>
        <g transform="translate(0,0)"><path d={parts.top.d} /></g>
        <g transform={parts.right.transform}><path d={edgePath(H, W, "top", edges.right, connector).d} /></g>
        <g transform={parts.bottom.transform}><path d={edgePath(W, H, "top", edges.bottom, connector).d} /></g>
        <g transform={parts.left.transform}><path d={edgePath(H, W, "top", edges.left, connector).d} /></g>
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
      </g>
      <text x={W/2} y={H/2} textAnchor="middle" dominantBaseline="middle" fontSize={20} fontFamily="ui-sans-serif">{title || "TITLE"}</text>
    </g>
  );
}

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
  const [breedMeta, setBreedMeta] = useState(DEFAULT_BREED_META);
  const [silhouettes, setSilhouettes] = useState({}); // { slug: { d, scale, dx, dy } }
  const firstBreed = Object.keys(breedMeta)[0] || "giant-schnauzer";

  const [breed, setBreed] = useState(firstBreed);
  const [ears, setEars] = useState(breedMeta[firstBreed]?.defaultEar || "natural");
  const [tail, setTail] = useState(breedMeta[firstBreed]?.defaultTail || "natural");
  const [connector, setConnector] = useState("classic");
  const [callName, setCallName] = useState("Sunny");
  const [regName, setRegName] = useState("Gloris Caramel RN BCAT CGCU TKA ATT");
  const [font, setFont] = useState("ui-sans-serif");

  const [titlesData, setTitlesData] = useState({});
  const [registry, setRegistry] = useState("AKC");
  const [sport, setSport] = useState("Rally");
  const [selectedInd, setSelectedInd] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);

  const [customText, setCustomText] = useState("");
  const [customPieces, setCustomPieces] = useState([]);
  const svgRef = useRef(null);

  useEffect(() => {
    // Load breeds
    fetch("breed_options.json").then(r => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      if (!data || typeof data !== "object") return;
      setBreedMeta(data);
      const first = Object.keys(data)[0];
      if (first) { setBreed(first); setEars(data[first].defaultEar); setTail(data[first].defaultTail); }
    }).catch(() => {});

    // Load silhouettes (optional)
    fetch("silhouettes.json").then(r => r.ok ? r.json() : {}).then(setSilhouettes).catch(()=>{});

    // Titles
    Promise.all([
      fetch("titles_akc.json").then(r => r.ok ? r.json() : {}),
      fetch("titles_ukc.json").then(r => r.ok ? r.json() : {}),
    ]).then(([akc, ukc]) => {
      const merged = {};
      if (akc && Object.keys(akc).length) merged["AKC"] = akc;
      if (ukc && Object.keys(ukc).length) merged["UKC"] = ukc;
      setTitlesData(merged);
      const firstSport = merged["AKC"] ? Object.keys(merged["AKC"])[0] : (merged["UKC"] ? Object.keys(merged["UKC"])[0] : undefined);
      if (firstSport) setSport(firstSport);
    });
  }, []);

  useEffect(() => {
    const meta = breedMeta[breed];
    if (!meta) return;
    if (!meta.allowedEars?.includes(ears)) setEars(meta.defaultEar);
    if (!meta.allowedTails?.includes(tail)) setTail(meta.defaultTail);
  }, [breed, breedMeta]);

  function sanitizeTitle(s) {
    return (s || "").toUpperCase().replace(/[^A-Z0-9 .&+\-\/]/g,"").slice(0,14);
  }
  function addCustomPiece() {
    const t = sanitizeTitle(customText.trim()); if (!t) return;
    const id = `c${Date.now()}`;
    setCustomPieces(arr => [...arr, { id, x: 680, y: 540, title: t }]);
    setCustomText("");
  }
  async function handleDownloadSVG() {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
    const xml = new XMLSerializer().serializeToString(clone);
    download("wag-and-brag-board.svg", xml);
  }
  async function handleDownloadPNG() {
    if (!svgRef.current) return;
    const dataUrl = await svgToPng(svgRef.current, 3);
    const a = document.createElement("a"); a.href = dataUrl; a.download = "wag-and-brag-board.png"; document.body.appendChild(a); a.click(); a.remove();
  }

  const meta = breedMeta[breed] || {};
  const allowedEars = meta.allowedEars || ["natural"];
  const allowedTails = meta.allowedTails || ["natural"];

  const sil = silhouettes[breed]; // { d, scale, dx, dy } if provided

  return (
    <div className="container">
      <div className="panel">
        <h1 style={{fontSize:22, fontWeight:700, margin:"2px 0 14px"}}>Wag &amp; Brag — Builder</h1>

        <div className="section">
          <span className="label">Breed</span>
          <select value={breed} onChange={(e)=>setBreed(e.target.value)}>
            {Object.entries(breedMeta).map(([id, b]) => (<option key={id} value={id}>{b.label}</option>))}
          </select>
          <div className="muted" style={{marginTop:6}}>Silhouette source: {sil ? "custom (silhouettes.json)" : (FALLBACK_BODY_SHAPES[breed] ? "fallback" : "none")}</div>
        </div>

        <div className="section">
          <span className="label">Ears</span>
          <div className="row" style={{flexWrap:"wrap"}}>
            {allowedEars.map(opt => (
              <button key={opt} className={"btn " + (ears===opt? "active":"")} onClick={()=>setEars(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <span className="label">Tail</span>
          <div className="row" style={{flexWrap:"wrap"}}>
            {allowedTails.map(opt => (
              <button key={opt} className={"btn " + (tail===opt? "active":"")} onClick={()=>setTail(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <span className="label">Connector style</span>
          <div className="row" style={{flexWrap:"wrap"}}>
            {["classic","rounded","angular"].map(c => (
              <button key={c} className={"btn " + (connector===c? "active":"")} onClick={()=>setConnector(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <span className="label">Call name</span>
          <input value={callName} onChange={(e)=>setCallName(e.target.value)} />
        </div>
        <div className="section">
          <span className="label">Registered name</span>
          <input value={regName} onChange={(e)=>setRegName(e.target.value)} />
        </div>

        <div className="section">
          <span className="label">Titles &amp; BragPacks</span>
          <div className="row" style={{marginBottom:8}}>
            {["AKC","UKC"].map(r => (
              <button key={r} className={"btn " + (registry===r? "active":"")} onClick={()=>{
                setRegistry(r);
                const first = (titlesData[r] && Object.keys(titlesData[r])[0]) || sport;
                if (first) setSport(first);
                setSelectedInd([]); setSelectedPack(null);
              }}>{r}</button>
            ))}
          </div>

          <select value={sport} onChange={(e)=>{ setSport(e.target.value); setSelectedInd([]); setSelectedPack(null); }}>
            {Object.keys(titlesData[registry] || {}).map(sp => (<option key={sp} value={sp}>{sp}</option>))}
          </select>

          <div style={{border:"1px solid #e2e8f0", borderRadius:10, padding:10, marginTop:8, marginBottom:8}}>
            <div className="muted" style={{marginBottom:6}}>Individual titles</div>
            <div className="grid-3">
              {(titlesData[registry]?.[sport]?.individual || []).map(it => {
                const checked = selectedInd.includes(it.abbr);
                return (
                  <label key={it.abbr} style={{display:"flex",alignItems:"center",gap:6, border: checked? "1px solid #0f172a":"1px solid #e2e8f0", borderRadius:8, padding:"4px 6px"}}>
                    <input type="checkbox" checked={checked} onChange={(e)=>{
                      setSelectedInd(prev => e.target.checked ? [...prev, it.abbr] : prev.filter(x => x !== it.abbr));
                    }} />
                    <span style={{fontFamily:"ui-monospace", fontSize:13}}>{it.abbr}</span>
                  </label>
                );
              })}
            </div>
            <div className="row" style={{marginTop:8}}>
              <button className="btn active" onClick={()=>{
                selectedInd.forEach((abbr, i) => {
                  const id = `t-${abbr}-${Date.now()}-${i}`;
                  setCustomPieces(arr => [...arr, { id, x: 60 + i*200, y: 540, title: abbr }]);
                });
                setSelectedInd([]);
              }}>Add selected</button>
              <button className="btn" onClick={()=>setSelectedInd([])}>Clear</button>
            </div>
          </div>

          <div style={{border:"1px solid #e2e8f0", borderRadius:10, padding:10}}>
            <div className="muted" style={{marginBottom:6}}>BragPacks</div>
            <div>
              {(titlesData[registry]?.[sport]?.packs || []).map(pk => {
                const isSel = selectedPack === pk.name;
                return (
                  <label key={pk.name} style={{display:"flex",alignItems:"center",gap:8, border: isSel? "1px solid #0f172a":"1px solid #e2e8f0", borderRadius:8, padding:"6px 8px", marginBottom:6}}>
                    <input type="radio" name="pack" checked={isSel} onChange={()=>setSelectedPack(pk.name)} />
                    <div>
                      <div style={{fontWeight:600}}>{pk.name}</div>
                      <div className="muted">{(pk.includes || []).join(", ")}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="row" style={{marginTop:8}}>
              <button className="btn active" onClick={()=>{
                const pk = (titlesData[registry]?.[sport]?.packs || []).find(p => p.name === selectedPack);
                if (!pk) return;
                pk.includes.forEach((abbr, i) => {
                  const id = `p-${abbr}-${Date.now()}-${i}`;
                  setCustomPieces(arr => [...arr, { id, x: 60 + i*200, y: 580, title: abbr }]);
                });
                setSelectedPack(null);
              }}>Add pack</button>
              <button className="btn" onClick={()=>setSelectedPack(null)}>Clear</button>
            </div>
          </div>
        </div>

        <div className="section">
          <span className="label">Custom titles</span>
          <div className="row">
            <input placeholder="Enter title (e.g., THDN, BH-VT, RESCUE)" value={customText} onChange={(e)=>setCustomText(e.target.value)} />
            <button className="btn active" onClick={addCustomPiece}>Add</button>
          </div>
          <div className="muted" style={{marginTop:6}}>Auto-uppercase • ~14 chars • allowed: A–Z, 0–9, space, . & + - /</div>
        </div>

        <div className="row" style={{flexWrap:"wrap"}}>
          <button className="btn active" onClick={handleDownloadSVG}>Download SVG</button>
          <button className="btn" onClick={handleDownloadPNG}>Download PNG</button>
        </div>
      </div>

      <div className="panel">
        <svg ref={svgRef} width={900} height={720} viewBox="0 0 900 720" xmlns="http://www.w3.org/2000/svg">
          <rect x={0} y={0} width={900} height={720} fill="#ffffff" />
          <g opacity={0.15}>
            {Array.from({ length: 90 }).map((_, i) => (<line key={`v${i}`} x1={i * 10} y1={0} x2={i * 10} y2={720} stroke="#94a3b8" strokeWidth={0.5} />))}
            {Array.from({ length: 72 }).map((_, i) => (<line key={`h${i}`} x1={0} y1={i * 10} x2={900} y2={i * 10} stroke="#94a3b8" strokeWidth={0.5} />))}
          </g>

          <g transform="translate(100,60)">
            {/* Silhouette layer */}
            {sil ? (
              <g transform={`translate(${sil.dx || 0},${sil.dy || 0}) scale(${sil.scale || 1})`}>
                <path d={sil.d} fill="#111" />
              </g>
            ) : (
              <path d={FALLBACK_BODY_SHAPES[breed] || FALLBACK_BODY_SHAPES["giant-schnauzer"]} fill="#111" />
            )}

            {/* Overlays */}
            <EarsOverlay option={ears} />
            <TailOverlay option={tail} />

            <text x={320} y={110} textAnchor="middle" fontFamily={font} fontSize={28}>{regName}</text>
            <text x={320} y={130} textAnchor="middle" fontFamily={font} fontSize={40} fontWeight={700}>{callName}</text>
          </g>

          {/* Render custom/sourced title pieces */}
          {customPieces.map((p) => (
            <DraggablePiece key={p.id} x={p.x} y={p.y} setPos={(x,y)=>setCustomPieces(arr => arr.map(it => it.id === p.id ? ({...it, x, y}) : it))}
              title={p.title} connector={connector} edges={{ top: "tab", right: "flat", bottom: "blank", left: "flat" }} />
          ))}
        </svg>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
