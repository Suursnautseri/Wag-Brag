const { useState, useEffect, useRef } = React;
const FALLBACK_BODY_SHAPES = {
  "giant-schnauzer": "M 80 220 C 90 160 150 140 210 140 L 400 140 C 450 140 520 160 540 210 L 560 260 L 600 260 C 620 260 630 280 630 300 L 630 320 C 630 340 620 350 600 350 L 540 350 L 520 420 L 480 420 L 460 350 L 240 350 L 220 420 L 180 420 L 160 350 L 120 350 C 100 350 90 340 90 320 L 90 300 C 90 280 100 260 120 260 L 160 260 Z",
};
function App() {
  const [breedMeta, setBreedMeta] = useState({});
  const [silhouettes, setSilhouettes] = useState({});
  const [titles, setTitles] = useState({ AKC: {}, UKC: {} });
  const [connectors, setConnectors] = useState({});
  const [breed, setBreed] = useState("giant-schnauzer");
  const [ears, setEars] = useState("natural");
  const [tail, setTail] = useState("natural");
  const [facing, setFacing] = useState("right");
  const [regName, setRegName] = useState("Kennel Name’s Leading by Example");
  const [callName, setCallName] = useState("Call Name: Demo");
  const [registry, setRegistry] = useState("AKC");
  const [sport, setSport] = useState("");
  const [selConn, setSelConn] = useState("hearts");
  const [selectedInd, setSelectedInd] = useState([]);
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    fetch("breed_options.json").then(r=>r.json()).then((data)=>{
      setBreedMeta(data); const first = Object.keys(data)[0]; if(first){ setBreed(first); }
    });
    fetch("silhouettes.json").then(r=>r.json()).then(setSilhouettes).catch(()=>{});
    Promise.all([
      fetch("titles_akc.json").then(r=>r.json()).catch(()=>({})),
      fetch("titles_ukc.json").then(r=>r.json()).catch(()=>({})),
      fetch("connectors.json").then(r=>r.json()).catch(()=>({}))
    ]).then(([akc,ukc,conns])=>{
      setTitles({AKC:akc||{}, UKC:ukc||{}});
      setConnectors(conns||{});
      const firstSport = Object.keys(akc||{})[0] || Object.keys(ukc||{})[0] || "";
      setSport(firstSport);
    });
  }, []);
  const dogSil = silhouettes[breed];
  const centerX = 320;
  const faceTransform = facing === "left" ? `translate(${centerX},0) scale(-1,1) translate(${-centerX},0)` : "";
  function addSelectedTitles(){
    const list = (titles[registry]?.[sport]?.individual || []).filter(it=>selectedInd.includes(it.abbr));
    list.forEach((it,i)=>{ const id=`t-${it.abbr}-${Date.now()}-${i}`; setPieces(arr=>[...arr,{id,x:60+(i%3)*200,y:520+Math.floor(i/3)*140,title:it.abbr,connector:selConn}]); });
    setSelectedInd([]);
  }
  return (<div style={{maxWidth:1200,margin:"0 auto",padding:16,display:"grid",gridTemplateColumns:"360px 1fr",gap:16}}>
    <div className="panel" style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 8px rgba(0,0,0,.06)",padding:16}}>
      <h1 style={{fontSize:22,fontWeight:700,margin:"2px 0 14px"}}>Wag & Brag — Builder</h1>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>Breed</div>
      <select value={breed} onChange={(e)=>setBreed(e.target.value)} style={{width:"100%",border:"1px solid #cbd5e1",borderRadius:10,padding:"8px 10px"}}>
        {Object.entries(breedMeta).map(([id,b])=>(<option key={id} value={id}>{b.label}</option>))}
      </select>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>Orientation</div>
      <div className="row" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button className={"btn "+(facing==="right"?"active":"")} onClick={()=>setFacing("right")} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #cbd5e1"}}>Rotate Right →</button>
        <button className={"btn "+(facing==="left"?"active":"")} onClick={()=>setFacing("left")} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #cbd5e1"}}>← Rotate Left</button>
      </div>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>Enter Your Dog's Registered name (no titles)</div>
      <input value={regName} placeholder="Kennel Name’s Leading by Example" onChange={(e)=>setRegName(e.target.value)} style={{width:"100%",border:"1px solid #cbd5e1",borderRadius:10,padding:"8px 10px"}}/>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>Call Name (optional)</div>
      <input value={callName} placeholder="Call Name: Demo" onChange={(e)=>setCallName(e.target.value)} style={{width:"100%",border:"1px solid #cbd5e1",borderRadius:10,padding:"8px 10px"}}/>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>Connector style</div>
      <div className="row" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.entries(connectors).map(([key,c])=>(<button key={key} className={"btn "+(key===selConn?"active":"")} onClick={()=>setSelConn(key)} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #cbd5e1"}}>{c.label||key}</button>))}
      </div>
      <div className="label" style={{fontWeight:700,margin:"10px 0 6px"}}>AKC & UKC Titles</div>
      <div className="row" style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
        {["AKC","UKC"].map(r=>(<button key={r} className={"btn "+(r===registry?"active":"")} onClick={()=>{setRegistry(r); const first=Object.keys(titles[r]||{})[0]||""; setSport(first); setSelectedInd([]);}} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #cbd5e1"}}>{r}</button>))}
      </div>
      <select value={sport} onChange={(e)=>{setSport(e.target.value); setSelectedInd([]);}} style={{width:"100%",border:"1px solid #cbd5e1",borderRadius:10,padding:"8px 10px"}}>
        {Object.keys(titles[registry]||{}).map(sp=>(<option key={sp} value={sp}>{sp}</option>))}
      </select>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:6}}>
        {(titles[registry]?.[sport]?.individual||[]).map(it=>{
          const checked = selectedInd.includes(it.abbr);
          return (<label key={it.abbr} style={{display:"flex",gap:6,alignItems:"center",border:checked?"1px solid #0f172a":"1px solid #e2e8f0",borderRadius:8,padding:"4px 6px"}}>
            <input type="checkbox" checked={checked} onChange={(e)=>{ setSelectedInd(prev=> e.target.checked ? [...prev, it.abbr] : prev.filter(x=>x!==it.abbr)); }} />
            <span style={{fontFamily:"ui-monospace",fontSize:13}}>{it.abbr}</span>
          </label>);
        })}
      </div>
      <div className="row" style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
        <button className="btn" onClick={addSelectedTitles} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #0f172a",background:"#0f172a",color:"#fff"}}>Add selected</button>
        <button className="btn" onClick={()=>setSelectedInd([])} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #cbd5e1"}}>Clear</button>
      </div>
    </div>
    <div className="panel" style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 8px rgba(0,0,0,.06)",padding:16}}>
      <svg width={900} height={720} viewBox="0 0 900 720" xmlns="http://www.w3.org/2000/svg">
        <rect x={0} y={0} width={900} height={720} fill="#ffffff" />
        <g opacity={0.15}>{Array.from({length:90}).map((_,i)=>(<line key={"v"+i} x1={i*10} y1={0} x2={i*10} y2={720} stroke="#94a3b8" strokeWidth={0.5}/>))}</g>
        <g opacity={0.15}>{Array.from({length:72}).map((_,i)=>(<line key={"h"+i} x1={0} y1={i*10} x2={900} y2={i*10} stroke="#94a3b8" strokeWidth={0.5}/>))}</g>
        <g transform="translate(100,60)">
          <g transform={faceTransform}>
            <path d={FALLBACK_BODY_SHAPES["giant-schnauzer"]} fill="#111" />
          </g>
          <text x={320} y={110} textAnchor="middle" fontFamily="ui-sans-serif" fontSize={28}>{regName}</text>
          <text x={320} y={130} textAnchor="middle" fontFamily="ui-sans-serif" fontSize={40} fontWeight={700}>{callName}</text>
        </g>
        {pieces.map((p)=>{
          const C = connectors[p.connector] || {};
          const W = C.width||180, H=C.height||120;
          const tx = (C.textX ?? W/2), ty = (C.textY ?? H/2);
          return (<g key={p.id} transform={`translate(${p.x},${p.y})`}>
            {C.src ? <image href={C.src} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid meet"/> : <rect x="0" y="0" width={W} height={H} fill="#f8fafc" stroke="#0f172a" rx="12"/>}
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="20" fontFamily="ui-sans-serif">{p.title}</text>
          </g>);
        })}
      </svg>
    </div>
  </div>);
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);