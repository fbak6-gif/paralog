import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, LineChart, Line } from "recharts";

const SUPA_URL = "https://pyahxfawnztsaekoqdxx.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5YWh4ZmF3bnp0c2Fla29xZHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODU0MjUsImV4cCI6MjA4ODg2MTQyNX0.EsB-FS5MpTE5hgu2aV5KV2AYnddYNygG5uIT8JTeXE8";
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ── Timezone-safe: NEVER use toISOString() for local date ─────
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const gmk = s => s.slice(0, 7);
const pmk = k => {
  const [y,m] = k.split("-");
  const d = new Date(+y, +m-2, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};
const safeDate = s => new Date(s + "T12:00:00");
const padN = n => String(n).padStart(2, "0");

const C = {
  bg:"#03060f", sidebar:"rgba(0,0,0,0.55)", card:"rgba(255,255,255,0.04)",
  cardHov:"rgba(255,255,255,0.07)", border:"rgba(255,255,255,0.07)",
  cyan:"#00f0ff", purple:"#b94fff", green:"#00e887", pink:"#ff2d78",
  orange:"#ff8800", yellow:"#ffd600", blue:"#3d8bff",
  text:"#eef2ff", sub:"#8899bb", muted:"#3a4a66",
};
const PA  = ["#00f0ff","#ff2d78","#00e887"];
const CAD = "CA$";
const fmt  = v => `${CAD}${Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtS = v => { const a = Math.abs(v); return a>=1000 ? `${CAD}${(a/1000).toFixed(1)}k` : `${CAD}${a.toFixed(0)}`; };
const MO    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MO_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const DN    = ["Alex","Sam","Household"];

const CATS = [
  {id:"food_delivery",icon:"🛵",label:"Food (Delivery)",label_tr:"Yemek (Paket)",color:C.cyan,glow:"0,240,255"},
  {id:"food_dinein",icon:"🍽️",label:"Food (Dine-in)",label_tr:"Yemek (Rest.)",color:C.purple,glow:"185,79,255"},
  {id:"grocery",icon:"🛒",label:"Grocery",label_tr:"Market",color:C.green,glow:"0,232,135"},
  {id:"transport",icon:"🚌",label:"Transport",label_tr:"Ulaşım",color:C.blue,glow:"61,139,255"},
  {id:"shopping",icon:"🛍️",label:"Shopping",label_tr:"Alışveriş",color:C.orange,glow:"255,136,0"},
  {id:"bills",icon:"📱",label:"Bills & Subs",label_tr:"Faturalar",color:C.yellow,glow:"255,214,0"},
  {id:"health",icon:"💊",label:"Health",label_tr:"Sağlık",color:C.green,glow:"0,232,135"},
  {id:"rent",icon:"🏠",label:"Rent",label_tr:"Kira",color:C.orange,glow:"255,136,0"},
  {id:"entertainment",icon:"🎉",label:"Entertainment",label_tr:"Eğlence",color:C.pink,glow:"255,45,120"},
  {id:"gifts",icon:"🎁",label:"Gifts",label_tr:"Hediye",color:C.pink,glow:"255,45,120"},
  {id:"savings",icon:"💸",label:"Savings",label_tr:"Birikim",color:C.cyan,glow:"0,240,255"},
  {id:"canna",icon:"🌿",label:"Canna",label_tr:"Canna",color:C.green,glow:"0,232,135"},
  {id:"vape",icon:"💨",label:"Vape",label_tr:"Vape",color:"#7aaabb",glow:"122,170,187"},
  {id:"sigara",icon:"🚬",label:"Cigarettes",label_tr:"Sigara",color:"#b49070",glow:"180,144,112"},
  {id:"income_gov",icon:"🏛️",label:"Government",label_tr:"Devlet",color:C.green,glow:"0,232,135"},
  {id:"income_salary",icon:"💼",label:"Salary",label_tr:"Maaş",color:C.cyan,glow:"0,240,255"},
  {id:"income_tr",icon:"🇹🇷",label:"TR",label_tr:"TR",color:C.purple,glow:"185,79,255"},
];
const INC_IDS  = ["income_gov","income_salary","income_tr"];
const EXP_CATS = CATS.filter(c => !INC_IDS.includes(c.id));
const INC_CATS = CATS.filter(c => INC_IDS.includes(c.id));
const makeIF   = () => ({ mode:"expense", amount:"", category:"food_delivery", incomeCategory:"income_salary", note:"", date:localToday(), isRecurring:false, person:0, transferFrom:0, transferTo:1 });

const NAV = [
  {id:"overview",icon:"◈",label:"Overview",label_tr:"Özet"},
  {id:"people",icon:"⊕",label:"People",label_tr:"Kişiler"},
  {id:"analytics",icon:"◉",label:"Analytics",label_tr:"Grafik"},
  {id:"budgets",icon:"◎",label:"Budgets",label_tr:"Hedefler"},
  {id:"history",icon:"≡",label:"History",label_tr:"Geçmiş"},
];

function Aurora() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const onR = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    window.addEventListener("resize", onR);
    let t = 0, af;
    const bands = [
      {y:.2,amp:.08,spd:.0006,r:0,g:200,b:255,a:.15},
      {y:.45,amp:.07,spd:.0008,r:140,g:0,b:255,a:.12},
      {y:.65,amp:.10,spd:.0005,r:0,g:255,b:160,a:.09},
      {y:.25,amp:.05,spd:.0011,r:255,g:50,b:160,a:.07},
    ];
    const draw = () => {
      t++; ctx.clearRect(0,0,W,H);
      const base = ctx.createLinearGradient(0,0,0,H);
      base.addColorStop(0,"#03060f"); base.addColorStop(1,"#06091a");
      ctx.fillStyle = base; ctx.fillRect(0,0,W,H);
      for (let i=0;i<100;i++) {
        const sx=(i*137.5+20)%W, sy=(i*89.3+10)%(H*.65);
        ctx.globalAlpha=(0.25+0.6*Math.abs(Math.sin(t*.007+i)))*.55;
        ctx.fillStyle="#fff"; ctx.fillRect(sx,sy,1.3,1.3);
      }
      ctx.globalAlpha=1;
      bands.forEach((b,bi) => {
        const py=b.y*H+Math.sin(t*b.spd+bi*2.3)*b.amp*H, bh=H*.3;
        const g=ctx.createLinearGradient(0,py-bh*.4,0,py+bh);
        g.addColorStop(0,`rgba(${b.r},${b.g},${b.b},0)`);
        g.addColorStop(.4,`rgba(${b.r},${b.g},${b.b},${b.a})`);
        g.addColorStop(.75,`rgba(${b.r},${b.g},${b.b},${b.a*.4})`);
        g.addColorStop(1,`rgba(${b.r},${b.g},${b.b},0)`);
        ctx.beginPath(); ctx.moveTo(0,py);
        for (let x=0;x<=W;x+=16) {
          const wy=Math.sin(x*.0035+t*b.spd*3+bi)*30+Math.sin(x*.008+t*b.spd*5+bi)*14;
          ctx.lineTo(x,py+wy);
        }
        ctx.lineTo(W,py+bh); ctx.lineTo(0,py+bh); ctx.closePath();
        ctx.fillStyle=g; ctx.fill();
      });
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(af); window.removeEventListener("resize",onR); };
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

function Card({children,color,style,onClick,glow}) {
  const [h,setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?C.cardHov:C.card,border:`1px solid ${h&&color?color+"44":C.border}`,borderRadius:16,
        backdropFilter:"blur(20px)",transition:"all .22s",cursor:onClick?"pointer":"default",
        boxShadow:h&&glow?`0 0 28px rgba(${glow},.2),inset 0 0 30px rgba(255,255,255,.015)`:"inset 0 0 30px rgba(255,255,255,.01)",
        ...style}}>
      {children}
    </div>
  );
}
function Avatar({name,color,size=32,ring}) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`${color}1a`,border:`2px solid ${ring?color:color+"44"}`,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,color,
      flexShrink:0,boxShadow:ring?`0 0 12px ${color}55`:"none",transition:"all .2s"}}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}
function Badge({children,color}) {
  return <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:`${color}18`,color,border:`1px solid ${color}33`,letterSpacing:.4,whiteSpace:"nowrap"}}>{children}</span>;
}
function GlowBar({pct,color,h=4,style}) {
  return (
    <div style={{width:"100%",height:h,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",...style}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,borderRadius:99,background:color,boxShadow:`0 0 8px ${color}80`,transition:"width .6s ease"}}/>
    </div>
  );
}
function RingChart({pct,color,size=80,strokeW=8,label,sublabel}) {
  const r=size/2-strokeW/2, circ=2*Math.PI*r, dash=circ*(pct/100), gap=circ-dash;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={strokeW}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 6px ${color}88)`,transition:"stroke-dasharray .6s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {label&&<div style={{fontSize:size*.16,fontWeight:800,color,lineHeight:1}}>{label}</div>}
        {sublabel&&<div style={{fontSize:size*.1,color:C.sub,marginTop:2}}>{sublabel}</div>}
      </div>
    </div>
  );
}
function TTip({active,payload,label}) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(3,6,15,.96)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 14px",fontSize:12,backdropFilter:"blur(20px)"}}>
      <div style={{color:C.sub,marginBottom:6,fontWeight:700}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color||p.fill,marginBottom:2}}>
          {p.name}: <b>{CAD}{p.value?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [txs,setTxs]             = useState([]);
  const [lang,setLang]           = useState("en");
  const [view,setView]           = useState("overview");
  const [showForm,setForm]       = useState(false);
  const [showSet,setSet]         = useState(false);
  const [showReset,setShowReset] = useState(false);
  const [sidebarOpen,setSidebar] = useState(true);
  const [selMo,setSelMo]         = useState(gmk(localToday()));
  const [loaded,setLoaded]       = useState(false);
  const [syncing,setSyncing]     = useState(false);
  const [fCat,setFCat]           = useState("all");
  const [fPer,setFPer]           = useState("all");
  const [fType,setFType]         = useState("all");
  const [histSort,setHistSort]   = useState("date");
  const [toast,setToast]         = useState(null);
  const [budgets,setBudgets]     = useState({});
  const [recurring,setRec]       = useState([]);
  const [editBud,setEditBud]     = useState(null);
  const [budInput,setBudInput]   = useState("");
  const [names,setNames]         = useState(DN);
  const [nameIn,setNameIn]       = useState(DN);
  const [form,setF]              = useState(makeIF());
  const [analyticsTab,setTab]    = useState("monthly");

  const tr = lang==="tr";
  const mo = tr?MO_TR:MO;
  const ml = (k,short=false) => { const [y,m]=k.split("-"); return short?mo[+m-1]:`${mo[+m-1]} ${y}`; };
  const cl = c => tr?c.label_tr:c.label;
  const pn = i => names[i]||DN[i];

  useEffect(() => {
    async function load() {
      setSyncing(true);
      try {
        const {data:td} = await supabase.from("transactions").select("*").order("created_at",{ascending:false});
        if (td) setTxs(td);
        const {data:rd} = await supabase.from("recurring").select("*");
        if (rd) setRec(rd);
        const {data:sd} = await supabase.from("settings").select("*");
        if (sd) {
          const l=sd.find(r=>r.key==="lang"), b=sd.find(r=>r.key==="budgets"), n=sd.find(r=>r.key==="names");
          if (l) setLang(l.value);
          if (b) setBudgets(b.value||{});
          if (n) setNames(n.value||DN);
        }
      } catch(e) { console.error(e); }
      setSyncing(false); setLoaded(true);
    }
    load();
  },[]);

  useEffect(() => {
    if (!loaded||!recurring.length) return;
    const cur = gmk(localToday());
    const seen = new Set(txs.filter(t=>t.rid).map(t=>`${t.rid}-${gmk(t.date)}`));
    const toAdd = recurring.filter(r=>!seen.has(`${r.id}-${cur}`));
    if (!toAdd.length) return;
    const newTxs = toAdd.map(r=>({id:Date.now()+Math.random(),type:"expense",category:r.category,amt:r.amt,note:r.note,date:localToday(),rid:r.id,person:r.person??0}));
    supabase.from("transactions").insert(newTxs).then(({error})=>{ if (!error) setTxs(p=>[...newTxs,...p]); });
  },[loaded,recurring]);

  const pop = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2800); };
  const saveSetting = async (key,value) => { await supabase.from("settings").upsert({key,value},{onConflict:"key"}); };
  const handleSetLang = async l => { setLang(l); await saveSetting("lang",l); };
  const handleSetBudgets = async fn => { setBudgets(prev=>{ const next=typeof fn==="function"?fn(prev):fn; saveSetting("budgets",next); return next; }); };
  const handleSetNames = async n => { setNames(n); await saveSetting("names",n); };

  const mTxs  = useMemo(()=>txs.filter(t=>gmk(t.date)===selMo),[txs,selMo]);
  const pvTxs = useMemo(()=>txs.filter(t=>gmk(t.date)===pmk(selMo)),[txs,selMo]);

  // Household totals: transfers cancel out so exclude from totals
  const S = (arr,pf="all") => {
    const f = pf==="all"?arr:arr.filter(t=>t.person===pf);
    const noTr = f.filter(t=>t.category!=="transfer");
    const inc = noTr.filter(t=>t.type==="income").reduce((s,t)=>s+t.amt,0);
    const exp = noTr.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amt,0);
    return {inc,exp,bal:inc-exp};
  };
  // Per-person: include transfer effect (sender -amt, receiver +amt)
  const Sp = (arr,pi) => {
    const f = arr.filter(t=>t.person===pi);
    const noTr = f.filter(t=>t.category!=="transfer");
    const inc   = noTr.filter(t=>t.type==="income").reduce((s,t)=>s+t.amt,0);
    const exp   = noTr.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amt,0);
    const trOut = f.filter(t=>t.category==="transfer"&&t.type==="expense").reduce((s,t)=>s+t.amt,0);
    const trIn  = f.filter(t=>t.category==="transfer"&&t.type==="income").reduce((s,t)=>s+t.amt,0);
    // inc/exp show real income/expense only; bal includes transfer effect
    return {inc, exp, bal: inc - exp - trOut + trIn};
  };
  const comb = useMemo(()=>S(mTxs),[mTxs]);
  const pS   = useMemo(()=>[0,1,2].map(i=>i===2?S(mTxs):Sp(mTxs,i)),[mTxs]);
  const pvC  = useMemo(()=>S(pvTxs),[pvTxs]);
  const dExp = pvC.exp>0?((comb.exp-pvC.exp)/pvC.exp*100).toFixed(1):null;
  const dInc = pvC.inc>0?((comb.inc-pvC.inc)/pvC.inc*100).toFixed(1):null;

  const todayStr    = localToday();
  const nowD        = new Date();
  const dayOfMonth  = nowD.getDate();
  const daysInMonth = new Date(nowD.getFullYear(),nowD.getMonth()+1,0).getDate();
  const todaySpend  = mTxs.filter(t=>t.date===todayStr&&t.type==="expense"&&t.category!=="transfer").reduce((s,t)=>s+t.amt,0);
  const forecast    = dayOfMonth>0?(comb.exp/dayOfMonth)*daysInMonth:0;

  const catTotals = useMemo(()=>EXP_CATS.map(cat=>({
    ...cat, label:cl(cat),
    total:  mTxs.filter(t=>t.category===cat.id&&t.type==="expense").reduce((s,t)=>s+t.amt,0),
    totals: [0,1,2].map(pi=>mTxs.filter(t=>t.category===cat.id&&t.type==="expense"&&t.person===pi).reduce((s,t)=>s+t.amt,0)),
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total),[mTxs,lang]);
  const maxCat = Math.max(...catTotals.map(c=>c.total),1);

  const allMos = useMemo(()=>{
    const m = [...new Set(txs.map(t=>gmk(t.date)))].sort().reverse();
    if (!m.includes(gmk(localToday()))) m.unshift(gmk(localToday()));
    return m;
  },[txs]);

  const histTxs = useMemo(()=>{
    let arr = mTxs.filter(t=>fCat==="all"||t.category===fCat).filter(t=>fPer==="all"||t.person===fPer).filter(t=>fType==="all"||t.type===fType);
    if (histSort==="added") arr = [...arr].sort((a,b)=>b.id-a.id);
    return arr;
  },[mTxs,fCat,fPer,fType,histSort]);

  const grouped = useMemo(()=>{
    if (histSort==="added") return {"__all__":histTxs};
    return histTxs.reduce((a,t)=>{ (a[t.date]||(a[t.date]=[])).push(t); return a; },{});
  },[histTxs,histSort]);

  const sortedD = useMemo(()=>{
    if (histSort==="added") return ["__all__"];
    return Object.keys(grouped).sort((a,b)=>b.localeCompare(a));
  },[grouped,histSort]);

  const trendData = useMemo(()=>[...allMos].sort().map(mk=>{
    const m = txs.filter(t=>gmk(t.date)===mk&&t.category!=="transfer");
    return {
      name: ml(mk,true),
      [`${pn(0)} ↑`]: +m.filter(t=>t.type==="income"&&t.person===0).reduce((s,t)=>s+t.amt,0).toFixed(2),
      [`${pn(1)} ↑`]: +m.filter(t=>t.type==="income"&&t.person===1).reduce((s,t)=>s+t.amt,0).toFixed(2),
      ["🏠 Gelir"]:   +m.filter(t=>t.type==="income"&&t.person===2).reduce((s,t)=>s+t.amt,0).toFixed(2),
      [`${pn(0)} ↓`]: +m.filter(t=>t.type==="expense"&&t.person===0).reduce((s,t)=>s+t.amt,0).toFixed(2),
      [`${pn(1)} ↓`]: +m.filter(t=>t.type==="expense"&&t.person===1).reduce((s,t)=>s+t.amt,0).toFixed(2),
      ["🏠 Gider"]:   +m.filter(t=>t.type==="expense"&&t.person===2).reduce((s,t)=>s+t.amt,0).toFixed(2),
      bal: +S(m).bal.toFixed(2),
    };
  }),[allMos,txs,lang,names]);

  const weeklyData = useMemo(()=>{
    const weeks = [];
    for (let w=7;w>=0;w--) {
      const endD=new Date(); endD.setDate(endD.getDate()-w*7);
      const startD=new Date(endD); startD.setDate(startD.getDate()-6);
      const es=`${endD.getFullYear()}-${padN(endD.getMonth()+1)}-${padN(endD.getDate())}`;
      const ss=`${startD.getFullYear()}-${padN(startD.getMonth()+1)}-${padN(startD.getDate())}`;
      const label=`${padN(startD.getMonth()+1)}/${padN(startD.getDate())}`;
      const inRange=txs.filter(t=>t.date>=ss&&t.date<=es&&t.category!=="transfer");
      const row={name:label};
      [0,1,2].forEach(pi=>{
        const arr=inRange.filter(t=>t.person===pi);
        const key=pi===2?"🏠":pn(pi);
        row[`${key} ↓`]=+arr.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amt,0).toFixed(2);
        row[`${key} ↑`]=+arr.filter(t=>t.type==="income").reduce((s,t)=>s+t.amt,0).toFixed(2);
      });
      weeks.push(row);
    }
    return weeks;
  },[txs,names]);

  const budgetedCats       = EXP_CATS.filter(c=>budgets[c.id]);
  const totalBudget        = budgetedCats.reduce((s,c)=>s+budgets[c.id],0);
  const totalSpentBudgeted = budgetedCats.reduce((s,c)=>s+mTxs.filter(t=>t.category===c.id&&t.type==="expense").reduce((ss,t)=>ss+t.amt,0),0);
  const budgetPct          = totalBudget>0?(totalSpentBudgeted/totalBudget)*100:0;

  function exportCSV() {
    const rows = [["Date","Type","Category","Amount (CAD)","Note","Person","Transfer"]];
    [...txs].sort((a,b)=>b.date.localeCompare(a.date)).forEach(t=>{
      const cat = CATS.find(c=>c.id===t.category);
      rows.push([t.date,t.type,cat?(tr?cat.label_tr:cat.label):t.category,t.amt.toFixed(2),t.note||"",t.person===2?"Household":pn(t.person??0),t.transfer_id?"Yes":"No"]);
    });
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`paralog_${localToday()}.csv`; a.click();
    URL.revokeObjectURL(url);
    pop(tr?"Export edildi ✓":"Exported ✓");
  }

  async function resetAll() {
    setSyncing(true);
    try {
      await supabase.from("transactions").delete().neq("id",0);
      await supabase.from("recurring").delete().neq("id",0);
      setTxs([]); setRec([]); setBudgets({});
      await saveSetting("budgets",{});
      setShowReset(false); setSet(false);
      pop(tr?"Tüm veriler silindi":"All data cleared","err");
    } catch(e) { pop("Error","err"); }
    setSyncing(false);
  }

  async function submit() {
    const a = parseFloat(form.amount);
    if (!a||a<=0) { pop(tr?"Geçerli tutar girin":"Invalid amount","err"); return; }
    setSyncing(true);
    try {
      if (form.mode==="transfer") {
        const from=form.transferFrom, to=form.transferTo;
        if (from===to) { pop(tr?"Aynı kişi seçili":"Same person selected","err"); setSyncing(false); return; }
        const ts=Date.now(), tid=`tr${ts}`;
        // Sender: expense | Receiver: income
        const txOut = {id:ts,   type:"expense", category:"transfer", amt:a, note:form.note||`→ ${pn(to)}`,   date:form.date, person:from, transfer_id:tid};
        const txIn  = {id:ts+1, type:"income",  category:"transfer", amt:a, note:form.note||`← ${pn(from)}`, date:form.date, person:to,   transfer_id:tid};
        const {error} = await supabase.from("transactions").insert([txOut,txIn]);
        if (!error) { setTxs(p=>[txIn,txOut,...p]); setForm(false); setF(makeIF()); pop(tr?"Transfer eklendi ✓":"Transfer added ✓"); }
        else pop("Error","err");
        setSyncing(false); return;
      }
      const isInc = form.mode==="income";
      const isHou = form.mode==="household";
      const cat   = isInc?form.incomeCategory:form.category;
      const person = isHou?2:form.person;
      const type  = isInc?"income":"expense";
      const txId  = Date.now();
      const tx    = {id:txId,type,category:cat,amt:a,note:form.note,date:form.date,person};
      if (form.isRecurring&&!isInc) {
        const rId=txId+1;
        const r={id:rId,category:cat,amt:a,note:form.note||cl(CATS.find(c=>c.id===cat)),person};
        const {error:re} = await supabase.from("recurring").insert([r]);
        if (!re) { setRec(p=>[...p,r]); tx.rid=rId; }
      }
      const {error:te} = await supabase.from("transactions").insert([tx]);
      if (!te) {
        setTxs(p=>[tx,...p]); setForm(false); setF(makeIF());
        pop(form.isRecurring?(tr?"Sabit eklendi ✓":"Recurring added ✓"):isInc?(tr?"Gelir eklendi ✓":"Income added ✓"):isHou?(tr?"Hane gideri ✓":"Household expense ✓"):(tr?"Harcama eklendi ✓":"Expense added ✓"));
      } else pop("Error","err");
    } catch(e) { pop("Network error","err"); }
    setSyncing(false);
  }

  async function deleteTx(tx) {
    if (tx.transfer_id) {
      await supabase.from("transactions").delete().eq("transfer_id",tx.transfer_id);
      setTxs(p=>p.filter(x=>x.transfer_id!==tx.transfer_id));
    } else {
      await supabase.from("transactions").delete().eq("id",tx.id);
      setTxs(p=>p.filter(x=>x.id!==tx.id));
    }
    pop(tr?"Silindi":"Deleted","err");
  }

  const inp = {width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:C.text,padding:"11px 14px",borderRadius:11,fontSize:14,boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
  const lbl = {fontSize:10,color:C.sub,marginBottom:7,fontWeight:700,textTransform:"uppercase",letterSpacing:1.3,display:"block"};
  const sec = {fontSize:10,color:C.sub,marginBottom:14,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5};

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.cyan,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:10,filter:`drop-shadow(0 0 14px ${C.cyan})`}}>◈</div>
        <div style={{fontSize:14}}>Syncing with Supabase…</div>
      </div>
    </div>
  );

  const SW = sidebarOpen?220:64;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Segoe UI',sans-serif",display:"flex",position:"relative"}}>
      <Aurora/>
      {syncing&&(
        <div style={{position:"fixed",top:16,right:16,zIndex:1000,background:`${C.cyan}18`,border:`1px solid ${C.cyan}44`,borderRadius:10,padding:"6px 14px",fontSize:11,color:C.cyan,fontWeight:700,backdropFilter:"blur(10px)"}}>
          ⟳ Syncing…
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{width:SW,minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,position:"fixed",top:0,left:0,zIndex:10,display:"flex",flexDirection:"column",backdropFilter:"blur(24px)",transition:"width .25s ease",overflow:"hidden"}}>
        <button onClick={()=>setSidebar(o=>!o)} title={sidebarOpen?"Collapse":"Expand"}
          style={{position:"absolute",top:16,right:8,width:28,height:28,borderRadius:8,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.06)",color:C.sub,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,flexShrink:0}}>
          {sidebarOpen?"‹":"›"}
        </button>
        <div style={{padding:sidebarOpen?"26px 20px 18px":"22px 10px 18px",whiteSpace:"nowrap",overflow:"hidden",transition:"padding .25s"}}>
          {sidebarOpen&&<div style={{fontSize:10,letterSpacing:3,color:C.sub,textTransform:"uppercase",marginBottom:5}}>Personal Finance</div>}
          <div style={{fontSize:sidebarOpen?22:16,fontWeight:900,letterSpacing:-1,background:`linear-gradient(135deg,${C.cyan},${C.purple})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",paddingRight:36}}>
            {sidebarOpen?"PARALOG":"P"}
          </div>
        </div>
        <nav style={{padding:"0 8px",flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)} title={tr?n.label_tr:n.label}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:sidebarOpen?"10px 12px":"10px 0",justifyContent:sidebarOpen?"flex-start":"center",borderRadius:12,border:"none",cursor:"pointer",marginBottom:3,transition:"all .18s",background:view===n.id?`linear-gradient(135deg,${C.cyan}18,${C.purple}12)`:"transparent",color:view===n.id?C.cyan:C.sub,boxShadow:view===n.id?`inset 0 0 0 1px ${C.cyan}30`:"none",overflow:"hidden",whiteSpace:"nowrap"}}>
              <span style={{fontSize:15,width:20,textAlign:"center",flexShrink:0}}>{n.icon}</span>
              {sidebarOpen&&<span style={{fontSize:13,fontWeight:700}}>{tr?n.label_tr:n.label}</span>}
              {sidebarOpen&&view===n.id&&<div style={{marginLeft:"auto",width:4,height:4,borderRadius:"50%",background:C.cyan,boxShadow:`0 0 6px ${C.cyan}`}}/>}
            </button>
          ))}
        </nav>
        <div style={{padding:sidebarOpen?"14px 16px":"12px 8px",borderTop:`1px solid ${C.border}`,transition:"padding .25s"}}>
          {sidebarOpen&&<div style={{fontSize:10,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Household</div>}
          <div style={{display:"flex",gap:5,marginBottom:10,flexDirection:"column"}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{background:`${PA[i]}0d`,border:`1px solid ${PA[i]}22`,borderRadius:10,padding:sidebarOpen?"6px 10px":"6px 0",display:"flex",justifyContent:sidebarOpen?"space-between":"center",alignItems:"center",overflow:"hidden"}}>
                {sidebarOpen?(
                  <>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      {i===2?<span style={{fontSize:13}}>🏠</span>:<Avatar name={pn(i)} color={PA[i]} size={18}/>}
                      <span style={{fontSize:11,fontWeight:700,color:PA[i]}}>{i===2?(tr?"Hane":"House"):pn(i)}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:800,color:pS[i].bal>=0?C.green:C.pink}}>{fmtS(pS[i].bal)}</span>
                  </>
                ):(
                  <div style={{width:7,height:7,borderRadius:"50%",background:PA[i]}} title={`${i===2?"House":pn(i)}: ${fmtS(pS[i].bal)}`}/>
                )}
              </div>
            ))}
          </div>
          {sidebarOpen?(
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>{setNameIn([...names]);setShowReset(false);setSet(true);}} style={{flex:1,padding:"7px 0",borderRadius:9,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.03)",color:C.sub,cursor:"pointer",fontSize:12}}>
                ⚙️ {tr?"Ayarlar":"Settings"}
              </button>
              <div style={{display:"flex",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden"}}>
                {["en","tr"].map(l=><button key={l} onClick={()=>handleSetLang(l)} style={{padding:"7px 9px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,background:lang===l?`${C.cyan}25`:"transparent",color:lang===l?C.cyan:C.sub}}>{l.toUpperCase()}</button>)}
              </div>
            </div>
          ):(
            <button onClick={()=>{setNameIn([...names]);setShowReset(false);setSet(true);}} title="Settings" style={{width:"100%",padding:"8px 0",borderRadius:9,border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.03)",color:C.sub,cursor:"pointer",fontSize:14}}>⚙️</button>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{marginLeft:SW,flex:1,display:"flex",minHeight:"100vh",position:"relative",zIndex:1,transition:"margin-left .25s ease"}}>
        <div style={{flex:1,padding:"28px 24px",overflowY:"auto",minWidth:0}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
            <div>
              <div style={{fontSize:22,fontWeight:900,letterSpacing:-.5}}>{tr?NAV.find(n=>n.id===view)?.label_tr:NAV.find(n=>n.id===view)?.label}</div>
              <div style={{fontSize:13,color:C.sub,marginTop:3}}>{ml(selMo)}</div>
            </div>
            <div style={{display:"flex",gap:6,overflowX:"auto",maxWidth:420}}>
              {allMos.slice(0,6).map(m=>(
                <button key={m} onClick={()=>setSelMo(m)} style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontSize:12,fontWeight:700,transition:"all .18s",background:selMo===m?`linear-gradient(135deg,${C.cyan}25,${C.purple}20)`:"rgba(255,255,255,0.04)",color:selMo===m?C.cyan:C.sub,boxShadow:selMo===m?`inset 0 0 0 1px ${C.cyan}40`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                  {ml(m,true)}
                </button>
              ))}
            </div>
          </div>

          {/* OVERVIEW */}
          {view==="overview"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                {[
                  {label:tr?"Toplam Gelir":"Total Income",val:comb.inc,color:C.green,icon:"↑",glow:"0,232,135",diff:dInc,up:true},
                  {label:tr?"Toplam Gider":"Total Expense",val:comb.exp,color:C.pink,icon:"↓",glow:"255,45,120",diff:dExp,up:false},
                  {label:tr?"Net Bakiye":"Net Balance",val:comb.bal,color:comb.bal>=0?C.green:C.pink,icon:"≈",glow:"0,240,255"},
                ].map((s,i)=>(
                  <Card key={i} color={s.color} glow={s.glow} style={{padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{s.label}</div>
                      <span style={{fontSize:18,color:s.color,filter:`drop-shadow(0 0 6px ${s.color}80)`}}>{s.icon}</span>
                    </div>
                    <div style={{fontSize:26,fontWeight:900,letterSpacing:-.5,color:s.color,filter:`drop-shadow(0 0 14px ${s.color}60)`,marginBottom:s.diff!=null?6:0}}>
                      {s.val<0&&s.icon==="≈"?"-":""}{fmt(s.val)}
                    </div>
                    {s.diff!=null&&<div style={{fontSize:11,color:((+s.diff>0)===s.up)?C.green:C.pink,fontWeight:600}}>{+s.diff>0?"+":""}{s.diff}% {tr?"geçen ay":"vs last month"}</div>}
                  </Card>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                <Card color={C.cyan} glow="0,240,255" style={{padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{tr?"Bugünkü Harcama":"Today's Spend"}</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.cyan,marginBottom:8}}>{fmt(todaySpend)}</div>
                  <div style={{fontSize:11,color:C.sub}}>{todayStr} · {new Date().toLocaleDateString(tr?"tr-TR":"en-CA",{weekday:"short"})}</div>
                </Card>
                <Card color={C.orange} glow="255,136,0" style={{padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{tr?"Ay Sonu Tahmini":"Month Forecast"}</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.orange,marginBottom:4}}>{fmt(forecast)}</div>
                  <GlowBar pct={(dayOfMonth/daysInMonth)*100} color={C.orange} h={3}/>
                  <div style={{fontSize:10,color:C.sub,marginTop:4}}>{tr?`${daysInMonth-dayOfMonth} gün kaldı`:`${daysInMonth-dayOfMonth} days left`}</div>
                </Card>
                <Card color={C.purple} glow="185,79,255" style={{padding:"16px 18px",display:"flex",gap:12,alignItems:"center"}}>
                  <RingChart pct={budgetPct} color={budgetPct>100?C.pink:C.purple} size={64} strokeW={7} label={`${Math.round(budgetPct)}%`} sublabel={tr?"bütçe":"budget"}/>
                  <div>
                    <div style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{tr?"Hedef":"Budget"}</div>
                    <div style={{fontSize:13,fontWeight:800,color:budgetPct>100?C.pink:C.purple}}>{fmt(totalSpentBudgeted)}</div>
                    <div style={{fontSize:11,color:C.sub}}>of {fmt(totalBudget)}</div>
                  </div>
                </Card>
                <Card color={C.green} glow="0,232,135" style={{padding:"16px 18px"}}>
                  <div style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{tr?"Hane Dengesi":"Household"}</div>
                  {comb.exp>0?(
                    <>
                      <div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden",gap:1,marginBottom:8}}>
                        {[0,1].map(i=><div key={i} style={{width:`${(pS[i].exp/comb.exp)*100}%`,background:PA[i],boxShadow:`0 0 8px ${PA[i]}90`}}/>)}
                      </div>
                      {[0,1].map(i=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}>
                            <div style={{width:6,height:6,borderRadius:"50%",background:PA[i]}}/>
                            <span style={{fontSize:11,color:PA[i],fontWeight:600}}>{pn(i)}</span>
                          </div>
                          <span style={{fontSize:11,color:PA[i],fontWeight:700}}>{`${((pS[i].exp/comb.exp)*100).toFixed(0)}%`}</span>
                        </div>
                      ))}
                    </>
                  ):<div style={{fontSize:12,color:C.muted}}>{tr?"Veri yok":"No data"}</div>}
                </Card>
              </div>
              {catTotals.length===0?(
                <Card style={{padding:"48px 24px",textAlign:"center"}}>
                  <div style={{fontSize:44,marginBottom:14}}>💸</div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{tr?"Bu ay harcama yok":"No expenses this month"}</div>
                  <div style={{fontSize:13,color:C.sub}}>{tr?"+ butonuna bas":"Press + to add"}</div>
                </Card>
              ):(
                <Card style={{padding:"20px 22px"}}>
                  <div style={sec}>{tr?"Kategori Bazlı Harcama":"Spending by Category"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {catTotals.map(cat=>{
                      const bud=budgets[cat.id], over=bud&&cat.total>bud;
                      const pct=bud?Math.min((cat.total/bud)*100,100):(cat.total/maxCat)*100;
                      return (
                        <div key={cat.id} style={{background:`${cat.color}08`,border:`1px solid ${cat.color}20`,borderRadius:12,padding:"12px 14px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:18}}>{cat.icon}</span>
                              <span style={{fontSize:12,fontWeight:700}}>{cat.label}</span>
                            </div>
                            <span style={{fontSize:13,fontWeight:800,color:over?C.pink:cat.color}}>{fmt(cat.total)}</span>
                          </div>
                          <GlowBar pct={pct} color={over?C.pink:cat.color} h={3} style={{marginBottom:6}}/>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {[0,1,2].map(i=>cat.totals[i]>0?(
                                <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
                                  <div style={{width:5,height:5,borderRadius:"50%",background:PA[i]}}/>
                                  <span style={{fontSize:10,color:PA[i],fontWeight:600}}>{i===2?"🏠":pn(i)} {fmtS(cat.totals[i])}</span>
                                </div>
                              ):null)}
                            </div>
                            <span style={{fontSize:10,color:C.sub}}>{comb.exp>0?`${((cat.total/comb.exp)*100).toFixed(0)}%`:""}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* PEOPLE */}
          {view==="people"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <Card color={C.cyan} glow="0,240,255" style={{gridColumn:"1/-1",padding:"22px 24px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-30,right:-30,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${C.cyan}18,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
                  <div>
                    <div style={{fontSize:11,color:C.sub,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>🏠 {tr?"Hane Toplamı":"Household Total"}</div>
                    <div style={{fontSize:38,fontWeight:900,letterSpacing:-1.5,color:comb.bal>=0?C.green:C.pink,filter:`drop-shadow(0 0 18px ${comb.bal>=0?C.green:C.pink}60)`}}>{comb.bal<0?"-":""}{fmt(comb.bal)}</div>
                  </div>
                  <div style={{display:"flex",gap:20}}>
                    {[{l:tr?"Gelir":"Income",v:comb.inc,c:C.green,i:"↑"},{l:tr?"Gider":"Expense",v:comb.exp,c:C.pink,i:"↓"}].map((s,i)=>(
                      <div key={i} style={{background:`${s.c}0d`,border:`1px solid ${s.c}25`,borderRadius:12,padding:"12px 16px",minWidth:130}}>
                        <div style={{fontSize:10,color:C.sub,marginBottom:4}}><span style={{color:s.c}}>{s.i} </span>{s.l}</div>
                        <div style={{fontSize:18,fontWeight:800,color:s.c}}>{fmt(s.v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              {[0,1,2].map(i=>(
                <Card key={i} color={PA[i]} glow={i===0?"0,240,255":i===1?"255,45,120":"0,232,135"} style={{padding:"20px 22px",...(i===2?{gridColumn:"1/-1"}:{})}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <Avatar name={i===2?"🏠":pn(i)} color={PA[i]} size={46} ring/>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:PA[i]}}>{i===2?(tr?"Hane (Ortak)":"Household (Shared)"):pn(i)}</div>
                      <div style={{fontSize:11,color:C.sub,marginTop:2}}>{ml(selMo)}</div>
                    </div>
                    <div style={{marginLeft:"auto",textAlign:"right"}}>
                      <div style={{fontSize:10,color:C.sub,marginBottom:3}}>{tr?"Bakiye":"Balance"}</div>
                      <div style={{fontSize:22,fontWeight:900,color:pS[i].bal>=0?C.green:C.pink}}>{pS[i].bal<0?"-":""}{fmt(pS[i].bal)}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    {[{l:tr?"Gelir":"Income",v:pS[i].inc,c:C.green,ic:"↑"},{l:tr?"Gider":"Expense",v:pS[i].exp,c:C.pink,ic:"↓"}].map((s,j)=>(
                      <div key={j} style={{background:`${s.c}0d`,border:`1px solid ${s.c}22`,borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:10,color:C.sub,marginBottom:4}}><span style={{color:s.c}}>{s.ic} </span>{s.l}</div>
                        <div style={{fontSize:16,fontWeight:800,color:s.c}}>{fmt(s.v)}</div>
                      </div>
                    ))}
                  </div>
                  {i<2&&comb.exp>0&&(
                    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:10,color:C.sub,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{tr?"Hane Giderine Katkı":"Share of Total Exp."}</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <GlowBar pct={(pS[i].exp/comb.exp)*100} color={PA[i]} style={{flex:1}}/>
                        <span style={{fontSize:13,fontWeight:800,color:PA[i],minWidth:34}}>{((pS[i].exp/comb.exp)*100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* ANALYTICS */}
          {view==="analytics"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:20,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:4,border:`1px solid ${C.border}`,width:"fit-content"}}>
                {[{id:"monthly",label:tr?"Aylık":"Monthly"},{id:"weekly",label:tr?"Haftalık":"Weekly"},{id:"category",label:tr?"Kategori":"Category"}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 18px",borderRadius:11,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,transition:"all .2s",background:analyticsTab===t.id?`linear-gradient(135deg,${C.cyan}22,${C.purple}18)`:"transparent",color:analyticsTab===t.id?C.cyan:C.sub,boxShadow:analyticsTab===t.id?`inset 0 0 0 1px ${C.cyan}40`:"none"}}>
                    {t.label}
                  </button>
                ))}
              </div>
              {analyticsTab==="monthly"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {[0,1].map(pi=>(
                    <Card key={pi} color={PA[pi]} glow={pi===0?"0,240,255":"255,45,120"} style={{padding:"20px 22px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                        <Avatar name={pn(pi)} color={PA[pi]} size={26}/>
                        <div style={sec}>{pn(pi)} — {tr?"Gelir/Gider":"Income/Expense"}</div>
                      </div>
                      <div style={{height:200}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendData} margin={{top:4,right:8,left:0,bottom:0}} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                            <XAxis dataKey="name" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                            <Tooltip content={<TTip/>}/>
                            <Bar dataKey={`${pn(pi)} ↑`} fill={C.green} radius={[3,3,0,0]} opacity={.9}/>
                            <Bar dataKey={`${pn(pi)} ↓`} fill={PA[pi]} radius={[3,3,0,0]} opacity={.7}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  ))}
                  <Card color={C.green} glow="0,232,135" style={{padding:"20px 22px"}}>
                    <div style={{...sec,marginBottom:14}}>🏠 {tr?"Hane — Gelir/Gider":"Household — Income/Expense"}</div>
                    <div style={{height:200}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{top:4,right:8,left:0,bottom:0}} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Bar dataKey="🏠 Gelir" fill={C.green} radius={[3,3,0,0]} opacity={.9}/>
                          <Bar dataKey="🏠 Gider" fill={C.orange} radius={[3,3,0,0]} opacity={.7}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card color={C.cyan} glow="0,240,255" style={{padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Net Bakiye Trendi":"Net Balance Trend"}</div>
                    <div style={{height:200}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{top:4,right:8,left:0,bottom:0}}>
                          <defs>
                            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.cyan} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={C.cyan} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Area type="monotone" dataKey="bal" name={tr?"Bakiye":"Balance"} stroke={C.cyan} strokeWidth={2.5} fill="url(#balGrad)" dot={{fill:C.cyan,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card color={C.purple} glow="185,79,255" style={{gridColumn:"1/-1",padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Kişi Bazlı Karşılaştırma":"Monthly Comparison by Person"}</div>
                    <div style={{height:220}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{top:4,right:8,left:0,bottom:0}} barGap={2} barCategoryGap="28%">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Legend wrapperStyle={{fontSize:11,paddingTop:8}}/>
                          <Bar dataKey={`${pn(0)} ↑`} fill={PA[0]} radius={[3,3,0,0]} opacity={.9}/>
                          <Bar dataKey={`${pn(1)} ↑`} fill={PA[1]} radius={[3,3,0,0]} opacity={.9}/>
                          <Bar dataKey={`${pn(0)} ↓`} fill={PA[0]} radius={[3,3,0,0]} opacity={.35}/>
                          <Bar dataKey={`${pn(1)} ↓`} fill={PA[1]} radius={[3,3,0,0]} opacity={.35}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}
              {analyticsTab==="weekly"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {[0,1].map(pi=>(
                    <Card key={pi} color={PA[pi]} glow={pi===0?"0,240,255":"255,45,120"} style={{padding:"20px 22px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                        <Avatar name={pn(pi)} color={PA[pi]} size={26}/>
                        <div style={sec}>{pn(pi)} — {tr?"Haftalık":"Weekly"}</div>
                      </div>
                      <div style={{height:200}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyData} margin={{top:4,right:8,left:0,bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                            <XAxis dataKey="name" tick={{fill:C.sub,fontSize:9}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                            <Tooltip content={<TTip/>}/>
                            <Bar dataKey={`${pn(pi)} ↑`} fill={C.green} radius={[3,3,0,0]} opacity={.9}/>
                            <Bar dataKey={`${pn(pi)} ↓`} fill={PA[pi]} radius={[3,3,0,0]} opacity={.7}/>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  ))}
                  <Card color={C.green} glow="0,232,135" style={{padding:"20px 22px"}}>
                    <div style={{...sec,marginBottom:14}}>🏠 {tr?"Hane — Haftalık":"Household — Weekly"}</div>
                    <div style={{height:200}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{top:4,right:8,left:0,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:9}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Bar dataKey="🏠 ↑" fill={C.green} radius={[3,3,0,0]} opacity={.9}/>
                          <Bar dataKey="🏠 ↓" fill={C.orange} radius={[3,3,0,0]} opacity={.7}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card color={C.purple} glow="185,79,255" style={{padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Haftalık Gider Karşılaştırma":"Weekly Expense Comparison"}</div>
                    <div style={{height:200}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyData} margin={{top:4,right:8,left:0,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:9}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Legend wrapperStyle={{fontSize:10}}/>
                          <Line type="monotone" dataKey={`${pn(0)} ↓`} stroke={PA[0]} strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
                          <Line type="monotone" dataKey={`${pn(1)} ↓`} stroke={PA[1]} strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
                          <Line type="monotone" dataKey="🏠 ↓" stroke={C.green} strokeWidth={2} dot={{r:3}} activeDot={{r:5}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}
              {analyticsTab==="category"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <Card color={C.cyan} glow="0,240,255" style={{padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Kategori Dağılımı":"Category Breakdown"}</div>
                    {catTotals.length===0?<div style={{textAlign:"center",color:C.sub,padding:"30px 0"}}>{tr?"Veri yok":"No data"}</div>:(
                      <>
                        <div style={{height:220}}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={catTotals.map(c=>({name:c.label,value:+c.total.toFixed(2),color:c.color,icon:c.icon}))}
                                cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" labelLine={false}
                                label={({cx,cy,midAngle,innerRadius,outerRadius,percent,payload})=>{
                                  if (percent<0.07) return null;
                                  const R=Math.PI/180, r=innerRadius+(outerRadius-innerRadius)*.5;
                                  return <text x={cx+r*Math.cos(-midAngle*R)} y={cy+r*Math.sin(-midAngle*R)} textAnchor="middle" dominantBaseline="central" fontSize={14}>{payload.icon}</text>;
                                }}>
                                {catTotals.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                              </Pie>
                              <Tooltip content={<TTip/>}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
                          {catTotals.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:7,height:7,borderRadius:"50%",background:d.color}}/><span style={{color:C.sub}}>{d.label}</span></div>)}
                        </div>
                      </>
                    )}
                  </Card>
                  <Card color={C.purple} glow="185,79,255" style={{padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Kategoride Kişi Katkısı":"Category Split by Person"}</div>
                    {catTotals.length===0?<div style={{textAlign:"center",color:C.sub,padding:"30px 0"}}>{tr?"Veri yok":"No data"}</div>:(
                      <div style={{maxHeight:280,overflowY:"auto"}}>
                        {catTotals.map(cat=>(
                          <div key={cat.id} style={{marginBottom:14}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <span style={{fontSize:12,fontWeight:600}}>{cat.icon} {cat.label}</span>
                              <span style={{fontSize:12,fontWeight:800,color:cat.color}}>{fmt(cat.total)}</span>
                            </div>
                            {[0,1,2].map(i=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <div style={{fontSize:11,color:PA[i],fontWeight:600,width:48,flexShrink:0}}>{i===2?"🏠":pn(i)}</div>
                                <GlowBar pct={cat.total>0?(cat.totals[i]/cat.total)*100:0} color={PA[i]} style={{flex:1}}/>
                                <span style={{fontSize:11,color:PA[i],fontWeight:700,minWidth:60,textAlign:"right"}}>{cat.totals[i]>0?fmt(cat.totals[i]):"—"}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                  <Card color={C.orange} glow="255,136,0" style={{gridColumn:"1/-1",padding:"20px 22px"}}>
                    <div style={sec}>{tr?"Top Kategoriler Aylık Trend":"Top Categories Monthly Trend"}</div>
                    <div style={{height:240}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...allMos].sort().map(mk=>{
                          const m=txs.filter(t=>gmk(t.date)===mk);
                          const row={name:ml(mk,true)};
                          catTotals.slice(0,5).forEach(cat=>{row[cat.label]=+m.filter(t=>t.category===cat.id&&t.type==="expense").reduce((s,t)=>s+t.amt,0).toFixed(2);});
                          return row;
                        })} margin={{top:4,right:8,left:0,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fill:C.sub,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:C.sub,fontSize:10}} tickFormatter={v=>fmtS(v)} axisLine={false} tickLine={false} width={44}/>
                          <Tooltip content={<TTip/>}/>
                          <Legend wrapperStyle={{fontSize:10}}/>
                          {catTotals.slice(0,5).map((cat,i)=><Line key={i} type="monotone" dataKey={cat.label} stroke={cat.color} strokeWidth={2} dot={{r:3,fill:cat.color}} activeDot={{r:5}}/>)}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* BUDGETS */}
          {view==="budgets"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {EXP_CATS.map(cat=>{
                const spent=mTxs.filter(t=>t.category===cat.id&&t.type==="expense").reduce((s,t)=>s+t.amt,0);
                const bud=budgets[cat.id], pct=bud?Math.min((spent/bud)*100,100):0, over=bud&&spent>bud;
                return (
                  <Card key={cat.id} color={over?C.pink:cat.color} glow={over?"255,45,120":cat.glow} style={{padding:"16px 18px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:38,height:38,borderRadius:11,background:`${cat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.icon}</div>
                        <div>
                          <div style={{fontWeight:700,fontSize:13}}>{cl(cat)}</div>
                          {bud&&<div style={{fontSize:11,color:over?C.pink:C.sub,marginTop:2}}>{fmt(spent)} / {fmt(bud)}</div>}
                        </div>
                      </div>
                      <button onClick={()=>{setEditBud(cat.id);setBudInput(bud?bud.toFixed(2):"");}} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${cat.color}40`,background:`${cat.color}10`,color:cat.color,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>{bud?"✏️":"+ Set"}</button>
                    </div>
                    {bud&&(
                      <>
                        <GlowBar pct={pct} color={over?C.pink:cat.color} h={5} style={{marginBottom:6}}/>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:10,color:over?C.pink:C.sub,fontWeight:700}}>{over?`⚠️ ${tr?"AŞILDI":"OVER"}`:""}</span>
                          <span style={{fontSize:10,color:C.sub}}>{pct.toFixed(0)}%</span>
                        </div>
                      </>
                    )}
                    {editBud===cat.id&&(
                      <div style={{marginTop:12,display:"flex",gap:6}}>
                        <input type="number" min="0" step="0.01" value={budInput} onChange={e=>setBudInput(e.target.value)} placeholder={`${CAD}0.00`} style={{...inp,flex:1,padding:"8px 10px",fontSize:13}}/>
                        <button onClick={async()=>{const v=parseFloat(budInput);await handleSetBudgets(b=>{const n={...b};if(!v||v<=0)delete n[cat.id];else n[cat.id]=v;return n;});setEditBud(null);}} style={{padding:"8px 14px",borderRadius:9,border:"none",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>{tr?"Kaydet":"Save"}</button>
                        <button onClick={()=>setEditBud(null)} style={{padding:"8px 10px",borderRadius:9,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,cursor:"pointer"}}>✕</button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* HISTORY */}
          {view==="history"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
                {["all",0,1,2].map(p=>(
                  <button key={p} onClick={()=>setFPer(p)} style={{padding:"6px 12px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,border:"none",display:"flex",alignItems:"center",gap:5,background:fPer===p?(p==="all"?`linear-gradient(135deg,${C.cyan}22,${C.purple}18)`:`${PA[p]}18`):"rgba(255,255,255,0.04)",color:fPer===p?(p==="all"?C.cyan:PA[p]):C.sub,boxShadow:fPer===p?`inset 0 0 0 1px ${p==="all"?C.cyan:PA[p]}40`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                    {p==="all"?(tr?"Tümü":"All"):p===2?"🏠":<><Avatar name={pn(p)} color={PA[p]} size={16}/>{pn(p)}</>}
                  </button>
                ))}
                <div style={{width:1,height:20,background:C.border}}/>
                {[{v:"all",l:tr?"Tümü":"All"},{v:"expense",l:tr?"Gider":"Exp"},{v:"income",l:tr?"Gelir":"Inc"}].map(t=>(
                  <button key={t.v} onClick={()=>setFType(t.v)} style={{padding:"6px 12px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,border:"none",background:fType===t.v?`${C.cyan}18`:"rgba(255,255,255,0.04)",color:fType===t.v?C.cyan:C.sub,boxShadow:fType===t.v?`inset 0 0 0 1px ${C.cyan}40`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                    {t.l}
                  </button>
                ))}
                <div style={{flex:1}}/>
                <div style={{display:"flex",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                  {[{v:"date",l:`📅 ${tr?"Tarih":"Date"}`},{v:"added",l:`🕐 ${tr?"Son Eklenen":"Recent"}`}].map(s=>(
                    <button key={s.v} onClick={()=>setHistSort(s.v)} style={{padding:"7px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",background:histSort===s.v?`${C.cyan}25`:"transparent",color:histSort===s.v?C.cyan:C.sub}}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:14}}>
                <button onClick={()=>setFCat("all")} style={{padding:"5px 10px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,border:"none",whiteSpace:"nowrap",background:fCat==="all"?`${C.cyan}18`:"rgba(255,255,255,0.04)",color:fCat==="all"?C.cyan:C.sub,boxShadow:fCat==="all"?`inset 0 0 0 1px ${C.cyan}40`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>{tr?"Tüm Kategoriler":"All Categories"}</button>
                {CATS.map(cat=><button key={cat.id} onClick={()=>setFCat(cat.id)} style={{padding:"5px 9px",borderRadius:20,cursor:"pointer",fontSize:13,border:"none",background:fCat===cat.id?`${cat.color}18`:"rgba(255,255,255,0.04)",color:fCat===cat.id?cat.color:C.sub,boxShadow:fCat===cat.id?`inset 0 0 0 1px ${cat.color}40`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>{cat.icon}</button>)}
              </div>
              {histTxs.length===0?(
                <Card style={{padding:"48px 24px",textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:12}}>📭</div>
                  <div style={{fontWeight:600,color:C.sub}}>{tr?"İşlem yok":"No transactions"}</div>
                </Card>
              ):sortedD.map(date=>(
                <div key={date} style={{marginBottom:16}}>
                  {date!=="__all__"&&(
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                      <div style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>
                        {safeDate(date).toLocaleDateString(tr?"tr-TR":"en-CA",{weekday:"long",month:"short",day:"numeric"})}
                      </div>
                      <div style={{flex:1,height:1,background:C.border}}/>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {grouped[date].map(tx=>{
                      const isTr = tx.category==="transfer";
                      const cat  = isTr?{icon:"↔️",color:C.yellow,glow:"255,214,0",label:"Transfer"}:(CATS.find(c=>c.id===tx.category)||CATS[0]);
                      const pi   = Math.min(tx.person??0, 2);
                      return (
                        <Card key={tx.id} color={cat.color} glow={cat.glow||"255,214,0"} style={{padding:"14px 16px",display:"flex",gap:12,alignItems:"center"}}>
                          <div style={{width:44,height:44,borderRadius:13,background:`${cat.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{cat.icon}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                              <div style={{fontWeight:700,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.note||(isTr?"Transfer":cl(cat))}</div>
                              {tx.rid&&<Badge color={C.cyan}>🔁</Badge>}
                              {isTr&&<Badge color={C.yellow}>↔️</Badge>}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <div style={{width:6,height:6,borderRadius:"50%",background:PA[pi]}}/>
                              <span style={{fontSize:11,color:PA[pi],fontWeight:600}}>{pi===2?"🏠":pn(pi)}</span>
                              {!isTr&&<span style={{fontSize:11,color:C.sub}}>· {cl(cat)}</span>}
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontWeight:800,fontSize:16,color:tx.type==="income"?C.green:C.pink}}>
                              {tx.type==="income"?"+":"-"}{fmt(tx.amt)}
                            </div>
                            <button onClick={()=>deleteTx(tx)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,marginTop:3}}
                              onMouseEnter={e=>e.currentTarget.style.color=C.pink} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>✕</button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={()=>setForm(true)}
        style={{position:"fixed",bottom:32,right:32,width:58,height:58,borderRadius:"50%",border:"none",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,color:"#fff",fontSize:28,cursor:"pointer",boxShadow:`0 0 28px ${C.cyan}60,0 0 56px ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,transition:"transform .2s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>+</button>

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",zIndex:1000,backdropFilter:"blur(20px)",background:toast.type==="err"?`${C.pink}22`:`${C.green}22`,border:`1px solid ${toast.type==="err"?C.pink:C.green}55`,color:toast.type==="err"?C.pink:C.green,padding:"12px 24px",borderRadius:16,fontWeight:700,fontSize:14,boxShadow:`0 0 24px ${toast.type==="err"?C.pink:C.green}40`,whiteSpace:"nowrap"}}>
          {toast.msg}
        </div>
      )}

      {/* FORM MODAL */}
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20}} onClick={e=>{if(e.target===e.currentTarget){setForm(false);setF(makeIF());}}}>
          <div style={{background:"rgba(6,9,20,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:32,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",backdropFilter:"blur(30px)",boxShadow:`0 0 80px ${C.cyan}15`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontSize:20,fontWeight:800,background:`linear-gradient(135deg,${C.cyan},${C.purple})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{tr?"İşlem Ekle":"Add Transaction"}</div>
              <button onClick={()=>{setForm(false);setF(makeIF());}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:C.sub,fontSize:16,cursor:"pointer",width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>

            {/* Mode */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:22}}>
              {[
                {m:"expense",icon:"↓",label:tr?"Gider":"Expense",color:C.pink},
                {m:"income",icon:"↑",label:tr?"Gelir":"Income",color:C.green},
                {m:"household",icon:"🏠",label:tr?"Hane":"Household",color:C.green},
                {m:"transfer",icon:"↔️",label:tr?"Transfer":"Transfer",color:C.yellow},
              ].map(o=>(
                <button key={o.m} onClick={()=>setF(f=>({...f,mode:o.m}))} style={{padding:"12px 6px",borderRadius:13,border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontWeight:700,fontSize:12,transition:"all .2s",background:form.mode===o.m?`${o.color}20`:"rgba(255,255,255,0.04)",color:form.mode===o.m?o.color:C.sub,boxShadow:form.mode===o.m?`inset 0 0 0 1.5px ${o.color}55,0 0 16px ${o.color}20`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                  <span style={{fontSize:18}}>{o.icon}</span>{o.label}
                </button>
              ))}
            </div>

            {/* TRANSFER */}
            {form.mode==="transfer"&&(
              <>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Gönderen — Expense":"From — Expense"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[0,1].map(i=>(
                      <button key={i} onClick={()=>setF(f=>({...f,transferFrom:i}))} style={{flex:1,padding:"12px",borderRadius:13,cursor:"pointer",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontWeight:700,fontSize:13,transition:"all .2s",background:form.transferFrom===i?`${PA[i]}20`:"rgba(255,255,255,0.04)",color:form.transferFrom===i?PA[i]:C.sub,boxShadow:form.transferFrom===i?`inset 0 0 0 1.5px ${PA[i]}55`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                        <Avatar name={pn(i)} color={PA[i]} size={26} ring={form.transferFrom===i}/>{pn(i)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{textAlign:"center",fontSize:20,color:C.yellow,marginBottom:14}}>↓</div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Alan — Income":"To — Income"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {[0,1].map(i=>(
                      <button key={i} onClick={()=>setF(f=>({...f,transferTo:i}))} style={{flex:1,padding:"12px",borderRadius:13,cursor:"pointer",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontWeight:700,fontSize:13,transition:"all .2s",background:form.transferTo===i?`${PA[i]}20`:"rgba(255,255,255,0.04)",color:form.transferTo===i?PA[i]:C.sub,boxShadow:form.transferTo===i?`inset 0 0 0 1.5px ${PA[i]}55`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                        <Avatar name={pn(i)} color={PA[i]} size={26} ring={form.transferTo===i}/>{pn(i)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Tutar":"Amount"} (CAD)</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.sub,fontSize:17,fontWeight:700}}>{CAD}</span>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setF(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={{...inp,paddingLeft:50,fontSize:22,fontWeight:800,color:C.yellow}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                  <div><label style={lbl}>{tr?"Not":"Note"}</label><input type="text" value={form.note} onChange={e=>setF(f=>({...f,note:e.target.value}))} placeholder={tr?"Opsiyonel...":"Optional..."} style={inp}/></div>
                  <div><label style={lbl}>{tr?"Tarih":"Date"}</label><input type="date" value={form.date} onChange={e=>setF(f=>({...f,date:e.target.value}))} style={inp}/></div>
                </div>
                <div style={{background:`${C.yellow}0d`,border:`1px solid ${C.yellow}30`,borderRadius:14,padding:"12px 16px",marginBottom:20}}>
                  <div style={{color:C.yellow,fontWeight:700,marginBottom:6,fontSize:13}}>↔️ {tr?"Özet":"Preview"}</div>
                  <div style={{fontSize:13,color:C.sub}}>
                    <span style={{color:PA[form.transferFrom],fontWeight:700}}>{pn(form.transferFrom)}</span>
                    {" → "}
                    <span style={{color:PA[form.transferTo],fontWeight:700}}>{pn(form.transferTo)}</span>
                    {" · "}
                    <span style={{color:C.yellow,fontWeight:800}}>{form.amount?fmt(parseFloat(form.amount)||0):`${CAD}0.00`}</span>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:4}}>
                    {pn(form.transferFrom)}: −{form.amount?fmt(parseFloat(form.amount)||0):`${CAD}0.00`} (expense) &nbsp;|&nbsp; {pn(form.transferTo)}: +{form.amount?fmt(parseFloat(form.amount)||0):`${CAD}0.00`} (income)
                  </div>
                </div>
              </>
            )}

            {/* EXPENSE or HOUSEHOLD */}
            {(form.mode==="expense"||form.mode==="household")&&(
              <>
                {form.mode==="household"&&(
                  <div style={{background:`${C.green}0d`,border:`1px solid ${C.green}30`,borderRadius:14,padding:"10px 14px",marginBottom:18,fontSize:12,color:C.green}}>
                    🏠 {tr?"Bu gider hane bütçesinden — kişisel değil":"Shared household expense, not personal"}
                  </div>
                )}
                {form.mode==="expense"&&(
                  <div style={{marginBottom:18}}>
                    <label style={lbl}>{tr?"Kişi":"Person"}</label>
                    <div style={{display:"flex",gap:10}}>
                      {[0,1].map(i=>(
                        <button key={i} onClick={()=>setF(f=>({...f,person:i}))} style={{flex:1,padding:"13px 16px",borderRadius:14,cursor:"pointer",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontWeight:700,fontSize:14,transition:"all .2s",background:form.person===i?`${PA[i]}20`:"rgba(255,255,255,0.04)",color:form.person===i?PA[i]:C.sub,boxShadow:form.person===i?`inset 0 0 0 1px ${PA[i]}55,0 0 18px ${PA[i]}25`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                          <Avatar name={pn(i)} color={PA[i]} size={28} ring={form.person===i}/>{pn(i)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Kategori":"Category"}</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {EXP_CATS.map(cat=>(
                      <button key={cat.id} onClick={()=>setF(f=>({...f,category:cat.id}))} style={{padding:"7px 11px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:form.category===cat.id?700:400,display:"flex",alignItems:"center",gap:5,border:"none",transition:"all .15s",background:form.category===cat.id?`${cat.color}20`:"rgba(255,255,255,0.04)",color:form.category===cat.id?cat.color:C.sub,boxShadow:form.category===cat.id?`inset 0 0 0 1px ${cat.color}55`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                        <span>{cat.icon}</span><span>{cl(cat)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Tutar":"Amount"} (CAD)</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.sub,fontSize:17,fontWeight:700}}>{CAD}</span>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setF(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={{...inp,paddingLeft:50,fontSize:22,fontWeight:800,color:form.mode==="household"?C.green:C.pink}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
                  <div><label style={lbl}>{tr?"Not":"Note"}</label><input type="text" value={form.note} onChange={e=>setF(f=>({...f,note:e.target.value}))} placeholder={tr?"Opsiyonel...":"Optional..."} style={inp}/></div>
                  <div><label style={lbl}>{tr?"Tarih":"Date"}</label><input type="date" value={form.date} onChange={e=>setF(f=>({...f,date:e.target.value}))} style={inp}/></div>
                </div>
                <div onClick={()=>setF(f=>({...f,isRecurring:!f.isRecurring}))} style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,padding:"14px 16px",borderRadius:14,cursor:"pointer",transition:"all .2s",background:form.isRecurring?`${C.cyan}0e`:"rgba(255,255,255,0.03)",border:`1px solid ${form.isRecurring?C.cyan+"44":"rgba(255,255,255,0.08)"}`}}>
                  <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${form.isRecurring?C.cyan:"rgba(255,255,255,0.2)"}`,background:form.isRecurring?`linear-gradient(135deg,${C.cyan},${C.purple})`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                    {form.isRecurring&&<span style={{color:"#fff",fontSize:14,fontWeight:900}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:form.isRecurring?C.cyan:C.text}}>🔁 {tr?"Her ay tekrarlayan":"Recurring monthly"}</div>
                    <div style={{fontSize:11,color:C.sub,marginTop:2}}>{tr?"Her ay otomatik eklenir":"Auto-added every month"}</div>
                  </div>
                </div>
              </>
            )}

            {/* INCOME */}
            {form.mode==="income"&&(
              <>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Kişi":"Person"}</label>
                  <div style={{display:"flex",gap:10}}>
                    {[0,1].map(i=>(
                      <button key={i} onClick={()=>setF(f=>({...f,person:i}))} style={{flex:1,padding:"13px 16px",borderRadius:14,cursor:"pointer",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontWeight:700,fontSize:14,transition:"all .2s",background:form.person===i?`${PA[i]}20`:"rgba(255,255,255,0.04)",color:form.person===i?PA[i]:C.sub,boxShadow:form.person===i?`inset 0 0 0 1px ${PA[i]}55`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                        <Avatar name={pn(i)} color={PA[i]} size={28} ring={form.person===i}/>{pn(i)}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Gelir Kaynağı":"Income Source"}</label>
                  <div style={{display:"flex",gap:8}}>
                    {INC_CATS.map(cat=>(
                      <button key={cat.id} onClick={()=>setF(f=>({...f,incomeCategory:cat.id}))} style={{flex:1,padding:"12px 8px",borderRadius:12,cursor:"pointer",fontSize:13,fontWeight:form.incomeCategory===cat.id?700:400,display:"flex",alignItems:"center",justifyContent:"center",gap:7,border:"none",background:form.incomeCategory===cat.id?`${cat.color}20`:"rgba(255,255,255,0.04)",color:form.incomeCategory===cat.id?cat.color:C.sub,boxShadow:form.incomeCategory===cat.id?`inset 0 0 0 1px ${cat.color}55`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                        <span style={{fontSize:18}}>{cat.icon}</span><span>{cl(cat)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:18}}>
                  <label style={lbl}>{tr?"Tutar":"Amount"} (CAD)</label>
                  <div style={{position:"relative"}}>
                    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.sub,fontSize:17,fontWeight:700}}>{CAD}</span>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setF(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={{...inp,paddingLeft:50,fontSize:22,fontWeight:800,color:C.green}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
                  <div><label style={lbl}>{tr?"Not":"Note"}</label><input type="text" value={form.note} onChange={e=>setF(f=>({...f,note:e.target.value}))} placeholder={tr?"Opsiyonel...":"Optional..."} style={inp}/></div>
                  <div><label style={lbl}>{tr?"Tarih":"Date"}</label><input type="date" value={form.date} onChange={e=>setF(f=>({...f,date:e.target.value}))} style={inp}/></div>
                </div>
              </>
            )}

            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>{setForm(false);setF(makeIF());}} style={{flex:1,padding:"14px 0",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>{tr?"İptal":"Cancel"}</button>
              <button onClick={submit} disabled={syncing} style={{flex:2,padding:"14px 0",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:`0 0 24px ${C.cyan}40`,opacity:syncing?.7:1}}>
                {syncing?(tr?"Kaydediliyor...":"Saving..."):(tr?"Kaydet":"Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSet&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20}} onClick={e=>{if(e.target===e.currentTarget){setSet(false);setShowReset(false);}}}>
          <div style={{background:"rgba(6,9,20,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:32,width:"100%",maxWidth:400,backdropFilter:"blur(30px)"}}>
            <div style={{fontSize:18,fontWeight:800,marginBottom:24,background:`linear-gradient(135deg,${C.cyan},${C.purple})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>⚙️ {tr?"Ayarlar":"Settings"}</div>
            {[0,1].map(i=>(
              <div key={i} style={{marginBottom:16}}>
                <label style={{fontSize:10,color:PA[i],marginBottom:7,fontWeight:700,textTransform:"uppercase",letterSpacing:1.3,display:"block"}}>{tr?"Kişi":"Person"} {i+1}</label>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <Avatar name={nameIn[i]||"?"} color={PA[i]} size={36}/>
                  <input value={nameIn[i]} onChange={e=>{const n=[...nameIn];n[i]=e.target.value;setNameIn(n);}} placeholder={DN[i]} style={{...inp,borderColor:`${PA[i]}33`}}/>
                </div>
              </div>
            ))}
            <div style={{marginBottom:20}}>
              <label style={{fontSize:10,color:C.sub,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:1.3,display:"block"}}>{tr?"Dil":"Language"}</label>
              <div style={{display:"flex",gap:8}}>
                {["en","tr"].map(l=>(
                  <button key={l} onClick={()=>handleSetLang(l)} style={{flex:1,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:lang===l?`${C.cyan}22`:"rgba(255,255,255,0.04)",color:lang===l?C.cyan:C.sub,boxShadow:lang===l?`inset 0 0 0 1px ${C.cyan}44`:"inset 0 0 0 1px rgba(255,255,255,0.08)"}}>
                    {l==="en"?"🇨🇦 English":"🇹🇷 Türkçe"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{height:1,background:C.border,margin:"20px 0"}}/>
            <button onClick={()=>{exportCSV();setSet(false);}} style={{width:"100%",padding:"13px 0",borderRadius:14,border:`1px solid ${C.green}44`,background:`${C.green}0d`,color:C.green,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📊 {tr?"Excel / CSV Export":"Export to Excel / CSV"}
            </button>
            {!showReset?(
              <button onClick={()=>setShowReset(true)} style={{width:"100%",padding:"13px 0",borderRadius:14,border:`1px solid ${C.pink}44`,background:`${C.pink}0d`,color:C.pink,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                🗑️ {tr?"Tüm Veriyi Sıfırla":"Reset All Data"}
              </button>
            ):(
              <div style={{background:`${C.pink}0d`,border:`1px solid ${C.pink}44`,borderRadius:14,padding:"16px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:C.pink,marginBottom:6}}>⚠️ {tr?"Emin misin?":"Are you sure?"}</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:14}}>{tr?"Tüm işlemler kalıcı olarak silinecek.":"All transactions will be permanently deleted."}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setShowReset(false)} style={{flex:1,padding:"10px",borderRadius:11,border:`1px solid ${C.border}`,background:"transparent",color:C.sub,cursor:"pointer",fontWeight:700}}>{tr?"Vazgeç":"Cancel"}</button>
                  <button onClick={resetAll} style={{flex:1,padding:"10px",borderRadius:11,border:"none",background:C.pink,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>{tr?"Evet, Sil":"Yes, Delete"}</button>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setSet(false);setShowReset(false);}} style={{flex:1,padding:"13px 0",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:C.sub,fontSize:14,fontWeight:700,cursor:"pointer"}}>{tr?"İptal":"Cancel"}</button>
              <button onClick={async()=>{await handleSetNames([nameIn[0]||DN[0],nameIn[1]||DN[1],tr?"Hane":"Household"]);setSet(false);setShowReset(false);pop(tr?"Kaydedildi ✓":"Saved ✓");}} style={{flex:2,padding:"13px 0",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.cyan},${C.purple})`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {tr?"Kaydet":"Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`*{-webkit-font-smoothing:antialiased;box-sizing:border-box;}input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.5)brightness(1.5);cursor:pointer;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px;}input::placeholder{color:#3a4a66;}button{font-family:inherit;}`}</style>
    </div>
  );
}
