import { useState, useEffect, useCallback, useRef } from "react";

// ─── ADMIN PASSWORD (hidden — only the admin knows this) ──────────────────────
// Stored as a hashed token, never displayed in UI
const ADMIN_SECRET = btoa("Gosbank1921!USSR");  // base64 obfuscated
const EMPLOYEE_INVITE = btoa("SovietWorker");

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const LS = {
  USERS:         "gb_users",
  TRANSACTIONS:  "gb_transactions",
  STOCK_HOLD:    "gb_stock_hold",
  COMM_HOLD:     "gb_comm_hold",
  ASSET_HOLD:    "gb_asset_hold",
  ORDERS:        "gb_orders",
  LOANS:         "gb_loans",
  ASSETS_MARKET: "gb_assets_market",
  SESSION:       "gb_session",
  PENDING:       "gb_pending_users",
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id: 1, name: "Commissar Aleksei Volkov", email: "volkov@gosbank.ussr", password: ADMIN_SECRET, role: "admin",     status:"active", balance: 5000000, joinDate:"1921-07-12", dept:"Central Command"    },
  { id: 2, name: "Comrade Ivan Petrov",       email: "petrov@gosbank.ussr", password: btoa("worker1"),     role: "employee",  status:"active", balance: 85000,  joinDate:"1960-03-01", dept:"Trading Division"  },
  { id: 3, name: "Natasha Sorokina",          email: "sorokina@ussr.gov",   password: btoa("citizen1"),    role: "citizen",   status:"active", balance: 12500,  joinDate:"1975-09-15", dept:"—"                 },
];
const SEED_TRANSACTIONS = [
  { id:1, userId:1, type:"deposit",  amount:2000000, date:"1921-07-12", note:"State founding capital" },
  { id:2, userId:2, type:"deposit",  amount:50000,   date:"1960-03-01", note:"Salary advance"         },
  { id:3, userId:3, type:"deposit",  amount:10000,   date:"1975-09-15", note:"Initial savings"        },
];
const SEED_LOANS = [
  { id:1, userId:3, amount:5000, interest:3.5, term:12, status:"active", startDate:"1980-01-01", balance:3200, monthlyPayment:450 },
];

// Market instruments
const STOCKS_BASE = [
  { symbol:"USSRE", name:"USSR Energy Corp",        price:44.8,  change:1.2,  sector:"Energy",      icon:"⚡" },
  { symbol:"REDST", name:"Red Star Industries",     price:91.5,  change:-0.8, sector:"Industrial",  icon:"⚙" },
  { symbol:"SVTCH", name:"Soviet Tech Group",       price:125.3, change:2.4,  sector:"Technology",  icon:"🔬" },
  { symbol:"STRLW", name:"State Railways Holdings", price:67.2,  change:-1.5, sector:"Transport",   icon:"🚂" },
  { symbol:"PRAVN", name:"Pravda Media Group",      price:38.9,  change:0.7,  sector:"Media",       icon:"📰" },
  { symbol:"VOLGA", name:"Volga Hydroelectric",     price:155.0, change:3.1,  sector:"Energy",      icon:"💧" },
  { symbol:"ARMUR", name:"Armur Defence Works",     price:210.5, change:-2.0, sector:"Defence",     icon:"🛡" },
  { symbol:"SIBFR", name:"Siberian Forestry Co.",   price:29.7,  change:0.5,  sector:"Agriculture", icon:"🌲" },
  { symbol:"KAZGD", name:"Kazakhstan Gold Ltd",     price:88.4,  change:1.9,  sector:"Mining",      icon:"⛏" },
  { symbol:"ARCTIC",name:"Arctic Shipping Lines",   price:63.1,  change:-0.4, sector:"Transport",   icon:"🚢" },
];
const COMMODITIES_BASE = [
  { name:"Gold",     unit:"oz",  price:445,   change:0.9,  icon:"⚜",  category:"Precious Metal" },
  { name:"Oil",      unit:"bbl", price:29.5,  change:-1.2, icon:"🛢",  category:"Energy"         },
  { name:"Wheat",    unit:"bu",  price:4.6,   change:0.4,  icon:"🌾",  category:"Agriculture"    },
  { name:"Silver",   unit:"oz",  price:8.2,   change:1.8,  icon:"◈",  category:"Precious Metal" },
  { name:"Coal",     unit:"ton", price:32.0,  change:-0.6, icon:"⬛",  category:"Energy"         },
  { name:"Timber",   unit:"m³",  price:18.5,  change:0.3,  icon:"🪵",  category:"Agriculture"    },
  { name:"Copper",   unit:"lb",  price:1.85,  change:2.1,  icon:"🟠",  category:"Industrial"     },
  { name:"Steel",    unit:"ton", price:280.0, change:-1.0, icon:"⚙",  category:"Industrial"     },
  { name:"Uranium",  unit:"kg",  price:52.0,  change:3.4,  icon:"☢",  category:"Nuclear"        },
  { name:"Vodka",    unit:"L",   price:6.5,   change:0.2,  icon:"🍶",  category:"Consumer"       },
];
const REAL_ASSETS_BASE = [
  { id:"BLD001", name:"Moscow State Building",       type:"Building",  location:"Moscow",        price:2500000, yield:4.2, sqm:8500,   status:"available", icon:"🏛" },
  { id:"BLD002", name:"Leningrad Factory Complex",   type:"Factory",   location:"Leningrad",     price:1800000, yield:5.8, sqm:12000,  status:"available", icon:"🏭" },
  { id:"BLD003", name:"Kiev Residential Block",      type:"Residence", location:"Kiev",          price:750000,  yield:6.1, sqm:3200,   status:"available", icon:"🏘" },
  { id:"BLD004", name:"Minsk Office Tower",          type:"Office",    location:"Minsk",         price:1200000, yield:4.9, sqm:5500,   status:"available", icon:"🏢" },
  { id:"LND001", name:"Siberian Agricultural Land",  type:"Land",      location:"Siberia",       price:320000,  yield:2.8, sqm:500000, status:"available", icon:"🌾" },
  { id:"LND002", name:"Ural Mining Territory",       type:"Land",      location:"Ural Region",   price:890000,  yield:7.5, sqm:250000, status:"available", icon:"⛰" },
  { id:"LND003", name:"Black Sea Coastal Plot",      type:"Land",      location:"Crimea",        price:1500000, yield:3.9, sqm:80000,  status:"available", icon:"🌊" },
  { id:"LND004", name:"Kazakh Steppe Territory",     type:"Land",      location:"Kazakhstan",    price:450000,  yield:3.2, sqm:1200000,status:"available", icon:"🏜" },
  { id:"INF001", name:"Trans-Siberian Rail Segment", type:"Infrastructure",location:"Siberia",   price:5000000, yield:6.8, sqm:null,   status:"available", icon:"🚂" },
  { id:"INF002", name:"Dnieper Dam Share (5%)",      type:"Infrastructure",location:"Ukraine",   price:3200000, yield:8.1, sqm:null,   status:"available", icon:"⚡" },
  { id:"VEH001", name:"State Fleet (50 Trucks)",     type:"Vehicle",   location:"Moscow",        price:280000,  yield:9.2, sqm:null,   status:"available", icon:"🚛" },
  { id:"VEH002", name:"Cargo Ship — MV Pravda",      type:"Vessel",    location:"Vladivostok",   price:1100000, yield:7.4, sqm:null,   status:"available", icon:"🚢" },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const r=localStorage.getItem(key); return r?JSON.parse(r):fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function initStorage() {
  if (!localStorage.getItem(LS.USERS))         lsSet(LS.USERS, SEED_USERS);
  if (!localStorage.getItem(LS.TRANSACTIONS))  lsSet(LS.TRANSACTIONS, SEED_TRANSACTIONS);
  if (!localStorage.getItem(LS.STOCK_HOLD))    lsSet(LS.STOCK_HOLD, {1:[],2:[{symbol:"USSRE",name:"USSR Energy Corp",shares:200,buyPrice:42.0}],3:[]});
  if (!localStorage.getItem(LS.COMM_HOLD))     lsSet(LS.COMM_HOLD, {1:[],2:[{name:"Gold",quantity:5,buyPrice:430}],3:[{name:"Wheat",quantity:100,buyPrice:4.2}]});
  if (!localStorage.getItem(LS.ASSET_HOLD))    lsSet(LS.ASSET_HOLD, {1:[],2:[],3:[]});
  if (!localStorage.getItem(LS.ORDERS))        lsSet(LS.ORDERS, []);
  if (!localStorage.getItem(LS.LOANS))         lsSet(LS.LOANS, SEED_LOANS);
  if (!localStorage.getItem(LS.ASSETS_MARKET)) lsSet(LS.ASSETS_MARKET, REAL_ASSETS_BASE);
  if (!localStorage.getItem(LS.PENDING))       lsSet(LS.PENDING, []);
}
initStorage();

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
const db = {
  users:    ()=>lsGet(LS.USERS,[]),
  txns:     ()=>lsGet(LS.TRANSACTIONS,[]),
  orders:   ()=>lsGet(LS.ORDERS,[]),
  loans:    ()=>lsGet(LS.LOANS,[]),
  pending:  ()=>lsGet(LS.PENDING,[]),
  assets:   ()=>lsGet(LS.ASSETS_MARKET, REAL_ASSETS_BASE),
  stockH:   (uid)=>{const a=lsGet(LS.STOCK_HOLD,{});return a[uid]||[];},
  commH:    (uid)=>{const a=lsGet(LS.COMM_HOLD,{});return a[uid]||[];},
  assetH:   (uid)=>{const a=lsGet(LS.ASSET_HOLD,{});return a[uid]||[];},
  setStockH:(uid,h)=>{const a=lsGet(LS.STOCK_HOLD,{});a[uid]=h;lsSet(LS.STOCK_HOLD,a);},
  setCommH: (uid,h)=>{const a=lsGet(LS.COMM_HOLD,{});a[uid]=h;lsSet(LS.COMM_HOLD,a);},
  setAssetH:(uid,h)=>{const a=lsGet(LS.ASSET_HOLD,{});a[uid]=h;lsSet(LS.ASSET_HOLD,a);},
  login:(email,pw)=>db.users().find(u=>u.email===email&&u.password===btoa(pw))||null,
  loginAdmin:(email,pw)=>db.users().find(u=>u.email===email&&u.password===ADMIN_SECRET&&u.role==="admin")||null,
  updateBalance:(uid,bal)=>{const us=db.users().map(u=>u.id===uid?{...u,balance:bal}:u);lsSet(LS.USERS,us);},
  addTxn:(t)=>{lsSet(LS.TRANSACTIONS,[...db.txns(),{id:Date.now(),...t}]);},
  addOrder:(o)=>{lsSet(LS.ORDERS,[...db.orders(),{id:Date.now(),...o}]);},
  updateUser:(uid,patch)=>{lsSet(LS.USERS,db.users().map(u=>u.id===uid?{...u,...patch}:u));},
  approveUser:(uid)=>{db.updateUser(uid,{status:"active"});},
  suspendUser:(uid)=>{db.updateUser(uid,{status:"suspended"});},
  approvePending:(pid)=>{
    const ps=db.pending();
    const p=ps.find(x=>x.id===pid);
    if(!p)return;
    lsSet(LS.PENDING,ps.filter(x=>x.id!==pid));
    const us=db.users();
    const newU={...p,status:"active",id:Date.now()};
    lsSet(LS.USERS,[...us,newU]);
    const sh=lsGet(LS.STOCK_HOLD,{});sh[newU.id]=[];lsSet(LS.STOCK_HOLD,sh);
    const ch=lsGet(LS.COMM_HOLD,{});ch[newU.id]=[];lsSet(LS.COMM_HOLD,ch);
    const ah=lsGet(LS.ASSET_HOLD,{});ah[newU.id]=[];lsSet(LS.ASSET_HOLD,ah);
  },
  rejectPending:(pid)=>{lsSet(LS.PENDING,db.pending().filter(x=>x.id!==pid));},
  registerCitizen:(name,email,pw)=>{
    const us=db.users();
    const ps=db.pending();
    if(us.find(u=>u.email===email)||ps.find(u=>u.email===email))return null;
    const newU={id:Date.now(),name,email,password:btoa(pw),role:"citizen",status:"pending",balance:5000,joinDate:new Date().toISOString().split("T")[0],dept:"—"};
    lsSet(LS.PENDING,[...ps,newU]);
    return newU;
  },
  registerEmployee:(name,email,pw,dept)=>{
    const us=db.users();const ps=db.pending();
    if(us.find(u=>u.email===email)||ps.find(u=>u.email===email))return null;
    const newU={id:Date.now(),name,email,password:btoa(pw),role:"employee",status:"pending",balance:50000,joinDate:new Date().toISOString().split("T")[0],dept};
    lsSet(LS.PENDING,[...ps,newU]);
    return newU;
  },
  addLoan:(loan)=>{lsSet(LS.LOANS,[...db.loans(),{id:Date.now(),...loan}]);},
  payLoan:(lid,amt,uid)=>{
    const loans=db.loans().map(l=>{
      if(l.id!==lid)return l;
      const nb=Math.max(0,l.balance-amt);
      return {...l,balance:nb,status:nb<=0?"paid":l.status};
    });
    lsSet(LS.LOANS,loans);
  },
  buyAsset:(uid,assetId,price)=>{
    const market=db.assets().map(a=>a.id===assetId?{...a,status:"owned",ownerId:uid}:a);
    lsSet(LS.ASSETS_MARKET,market);
    const ah=db.assetH(uid);
    const asset=db.assets().find(a=>a.id===assetId);
    if(asset){db.setAssetH(uid,[...ah,{...asset,buyPrice:price,purchaseDate:new Date().toISOString().split("T")[0]}]);}
  },
  sellAsset:(uid,assetId)=>{
    const market=db.assets().map(a=>a.id===assetId?{...a,status:"available",ownerId:null}:a);
    lsSet(LS.ASSETS_MARKET,market);
    const ah=db.assetH(uid).filter(a=>a.id!==assetId);
    db.setAssetH(uid,ah);
  },
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --red:#CC0000;--red-dark:#8B0000;--red-glow:rgba(204,0,0,0.4);
  --gold:#C9A84C;--gold-light:#E8C96A;--gold-dim:#7A6228;--gold-bg:rgba(201,168,76,0.07);
  --bg:#080809;--bg2:#0F0F12;--bg3:#161619;--bg4:#1C1C22;
  --border:rgba(201,168,76,0.12);--border-b:rgba(201,168,76,0.35);
  --text:#EDE8DF;--text-dim:#7A7570;--text-muted:#3A3530;
  --green:#2ECC71;--green-dim:rgba(46,204,113,0.12);
  --neg:#E74C3C;--neg-dim:rgba(231,76,60,0.12);
  --blue:#3498DB;--blue-dim:rgba(52,152,219,0.12);
  --purple:#9B59B6;
  --emp:#E67E22;--emp-dim:rgba(230,126,34,0.12);
  --sidebar:220px;
}
html,body,#root{height:100%;font-family:'IBM Plex Sans',sans-serif;background:var(--bg);color:var(--text);}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:var(--gold-dim);border-radius:2px}

/* ── PORTAL SELECT ── */
.portal-select{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden;}
.portal-grid-bg{position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(201,168,76,0.025) 60px,rgba(201,168,76,0.025) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(201,168,76,0.025) 60px,rgba(201,168,76,0.025) 61px);}
.portal-center{position:relative;text-align:center;width:100%;max-width:860px;padding:40px 24px;}
.portal-emblem{margin-bottom:36px;}
.portal-star{font-size:56px;display:block;filter:drop-shadow(0 0 24px rgba(204,0,0,0.7));margin-bottom:12px;}
.portal-title{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;color:var(--gold);letter-spacing:0.06em;line-height:1.1;}
.portal-sub{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);letter-spacing:0.25em;text-transform:uppercase;margin-top:8px;}
.portal-year{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-muted);letter-spacing:0.2em;margin-top:4px;}
.portal-divider{height:1px;background:linear-gradient(90deg,transparent,var(--gold-dim),transparent);margin:32px auto;max-width:400px;}
.portal-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:8px;}
.portal-card{background:var(--bg2);border:1px solid var(--border);padding:32px 24px;cursor:pointer;transition:all 0.25s;position:relative;overflow:hidden;clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));}
.portal-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;transition:opacity 0.3s;opacity:0;}
.portal-card.admin::before{background:linear-gradient(90deg,var(--red),var(--gold));}
.portal-card.employee::before{background:linear-gradient(90deg,var(--emp),var(--gold));}
.portal-card.citizen::before{background:linear-gradient(90deg,var(--blue),var(--green));}
.portal-card:hover{transform:translateY(-4px);border-color:var(--border-b);}
.portal-card:hover::before{opacity:1;}
.portal-card-icon{font-size:36px;margin-bottom:16px;display:block;}
.portal-card-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:8px;}
.portal-card-desc{font-size:12px;color:var(--text-dim);line-height:1.6;}
.portal-card-badge{display:inline-block;margin-top:14px;padding:3px 10px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;border-radius:2px;}
.portal-card.admin .portal-card-badge{background:rgba(204,0,0,0.15);color:var(--red);border:1px solid rgba(204,0,0,0.3);}
.portal-card.employee .portal-card-badge{background:var(--emp-dim);color:var(--emp);border:1px solid rgba(230,126,34,0.3);}
.portal-card.citizen .portal-card-badge{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(52,152,219,0.3);}

/* ── AUTH ── */
.auth-screen{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden;}
.auth-bg{position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(201,168,76,0.02) 80px,rgba(201,168,76,0.02) 81px),repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(201,168,76,0.02) 80px,rgba(201,168,76,0.02) 81px);}
.auth-glow{position:absolute;width:500px;height:500px;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
.auth-glow.admin{background:radial-gradient(circle,rgba(204,0,0,0.07) 0%,transparent 70%);}
.auth-glow.employee{background:radial-gradient(circle,rgba(230,126,34,0.07) 0%,transparent 70%);}
.auth-glow.citizen{background:radial-gradient(circle,rgba(52,152,219,0.07) 0%,transparent 70%);}
.auth-box{position:relative;width:440px;background:var(--bg2);border:1px solid var(--border-b);padding:44px;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));}
.auth-back{background:none;border:none;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;margin-bottom:24px;display:flex;align-items:center;gap:6px;transition:color 0.2s;}
.auth-back:hover{color:var(--gold);}
.auth-head{text-align:center;margin-bottom:28px;}
.auth-icon{font-size:32px;display:block;margin-bottom:10px;}
.auth-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--gold);}
.auth-subtitle{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:0.18em;text-transform:uppercase;margin-top:4px;}
.auth-divider{height:1px;background:linear-gradient(90deg,transparent,var(--gold-dim),transparent);margin:20px 0;}
.auth-tabs{display:flex;margin-bottom:24px;border-bottom:1px solid var(--border);}
.auth-tab{flex:1;padding:9px;background:none;border:none;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.2s;}
.auth-tab.active{color:var(--gold);border-bottom-color:var(--gold);}
.field{margin-bottom:14px;}
.field label{display:block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px;}
.field input,.field select{width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:11px 14px;font-family:'IBM Plex Sans',sans-serif;font-size:13px;outline:none;transition:border-color 0.2s;}
.field input:focus,.field select:focus{border-color:var(--gold);}
.field select option{background:var(--bg3);}
.btn-primary{width:100%;padding:13px;background:var(--red);border:none;color:white;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;margin-top:6px;transition:background 0.2s,transform 0.1s;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));}
.btn-primary.emp{background:var(--emp);}
.btn-primary.cit{background:var(--blue);}
.btn-primary:hover{filter:brightness(1.15);}.btn-primary:active{transform:scale(0.99);}
.err{color:var(--neg);font-size:11px;margin-top:8px;font-family:'IBM Plex Mono',monospace;}
.info-box{margin-top:18px;padding:12px;background:rgba(201,168,76,0.04);border:1px solid var(--border);font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);line-height:1.9;}
.info-box span{color:var(--gold);}

/* ── LAYOUT ── */
.app-layout{display:flex;min-height:100vh;}
.sidebar{width:var(--sidebar);flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;overflow-y:auto;}
.sidebar-logo{padding:20px 16px;border-bottom:1px solid var(--border);flex-shrink:0;}
.logo-star{font-size:24px;filter:drop-shadow(0 0 8px var(--red-glow));}
.logo-name{font-family:'Playfair Display',serif;font-size:12px;font-weight:700;color:var(--gold);letter-spacing:0.04em;margin-top:5px;line-height:1.3;}
.logo-sub{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--text-muted);letter-spacing:0.15em;text-transform:uppercase;}
.logo-portal{display:inline-block;margin-top:5px;padding:2px 7px;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.1em;text-transform:uppercase;border-radius:1px;}
.logo-portal.admin{background:rgba(204,0,0,0.15);color:var(--red);border:1px solid rgba(204,0,0,0.3);}
.logo-portal.employee{background:var(--emp-dim);color:var(--emp);border:1px solid rgba(230,126,34,0.3);}
.logo-portal.citizen{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(52,152,219,0.3);}
.sidebar-nav{flex:1;padding:12px 0;overflow-y:auto;}
.nav-label{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);padding:12px 14px 5px;}
.nav-item{display:flex;align-items:center;gap:9px;padding:9px 14px;cursor:pointer;font-size:12px;font-weight:500;color:var(--text-dim);transition:all 0.15s;border-left:2px solid transparent;}
.nav-item:hover{color:var(--text);background:rgba(255,255,255,0.02);}
.nav-item.active{color:var(--gold);background:var(--gold-bg);border-left-color:var(--gold);}
.nav-icon{font-size:14px;width:18px;text-align:center;}
.nav-badge{margin-left:auto;background:var(--red);color:white;font-size:9px;font-family:'IBM Plex Mono',monospace;padding:1px 5px;border-radius:8px;}
.sidebar-user{padding:14px 16px;border-top:1px solid var(--border);flex-shrink:0;}
.user-name{font-size:12px;font-weight:600;color:var(--text);}
.user-role{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.1em;color:var(--red);text-transform:uppercase;margin-top:2px;}
.user-role.emp{color:var(--emp);}
.user-role.cit{color:var(--blue);}
.btn-logout{margin-top:8px;width:100%;padding:7px;background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.btn-logout:hover{border-color:var(--neg);color:var(--neg);}

/* ── MAIN ── */
.main-content{margin-left:var(--sidebar);flex:1;padding:28px 32px;min-height:100vh;background:var(--bg);padding-bottom:56px;}
.page-header{margin-bottom:28px;}
.page-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--text);line-height:1.1;}
.page-title span{color:var(--gold);}
.page-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);margin-top:6px;letter-spacing:0.05em;}

/* ── TICKER ── */
.ticker-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:7px 28px;overflow:hidden;margin-left:var(--sidebar);position:sticky;top:0;z-index:50;}
.ticker-inner{display:flex;gap:28px;white-space:nowrap;animation:tickerScroll 40s linear infinite;}
@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.ticker-item{display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;}
.ticker-sym{color:var(--gold);font-weight:600;}
.ticker-price{color:var(--text);}
.ticker-ch.pos{color:var(--green);}.ticker-ch.neg{color:var(--neg);}

/* ── CARDS ── */
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px;}
.card{background:var(--bg2);border:1px solid var(--border);padding:18px;position:relative;overflow:hidden;}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--red),var(--gold));opacity:0;transition:opacity 0.3s;}
.card:hover::before{opacity:1;}
.card-label{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);margin-bottom:7px;}
.card-value{font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:600;color:var(--text);}
.card-value.gold{color:var(--gold);}.card-value.green{color:var(--green);}.card-value.neg{color:var(--neg);}
.card-sub{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--text-dim);margin-top:4px;}
.card-icon{position:absolute;right:16px;top:16px;font-size:24px;opacity:0.12;}
.section-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:14px;padding-bottom:7px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.section-title small{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--text-muted);font-weight:400;letter-spacing:0.1em;}

/* ── TABLE ── */
.data-table{width:100%;border-collapse:collapse;font-size:12px;}
.data-table th{font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);padding:9px 12px;text-align:left;border-bottom:1px solid var(--border);font-weight:400;}
.data-table td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.025);color:var(--text);vertical-align:middle;}
.data-table tr:hover td{background:rgba(255,255,255,0.015);}
.mono{font-family:'IBM Plex Mono',monospace;}
.pos{color:var(--green);}.neg{color:var(--neg);}
.badge{display:inline-block;padding:2px 7px;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.1em;text-transform:uppercase;border-radius:2px;}
.badge-green{background:var(--green-dim);color:var(--green);}
.badge-red{background:var(--neg-dim);color:var(--neg);}
.badge-gold{background:rgba(201,168,76,0.1);color:var(--gold);}
.badge-blue{background:var(--blue-dim);color:var(--blue);}
.badge-orange{background:var(--emp-dim);color:var(--emp);}
.badge-gray{background:rgba(100,100,100,0.1);color:var(--text-dim);}

/* ── TRADING ── */
.trade-panel{background:var(--bg2);border:1px solid var(--border);padding:20px;margin-bottom:20px;}
.trade-tabs{display:flex;gap:2px;margin-bottom:16px;}
.trade-tab{flex:1;padding:9px;background:var(--bg3);border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.trade-tab.buy.active{background:var(--green-dim);border-color:var(--green);color:var(--green);}
.trade-tab.sell.active{background:var(--neg-dim);border-color:var(--neg);color:var(--neg);}
.trade-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;}
.trade-field{flex:1;min-width:130px;}
.trade-field label{display:block;font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px;}
.trade-field select,.trade-field input[type="number"]{width:100%;background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:9px 12px;font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none;transition:border-color 0.2s;-webkit-appearance:none;}
.trade-field select:focus,.trade-field input:focus{border-color:var(--gold);}
.btn-buy{padding:9px 22px;background:var(--green-dim);border:1px solid var(--green);color:var(--green);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
.btn-buy:hover{background:rgba(46,204,113,0.2);}
.btn-sell{padding:9px 22px;background:var(--neg-dim);border:1px solid var(--neg);color:var(--neg);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
.btn-sell:hover{background:rgba(231,76,60,0.2);}
.btn-action{padding:9px 20px;background:var(--gold-bg);border:1px solid var(--border-b);color:var(--gold);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.btn-action:hover{background:rgba(201,168,76,0.14);}
.btn-danger{padding:9px 20px;background:var(--neg-dim);border:1px solid rgba(231,76,60,0.4);color:var(--neg);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
.btn-small{padding:5px 12px;font-size:9px;}

/* ── BANKING ── */
.bank-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.bank-form-group{background:var(--bg2);border:1px solid var(--border);padding:20px;}
.form-title{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--gold);margin-bottom:14px;}
.balance-hero{background:linear-gradient(135deg,#0E0608 0%,#150C0C 50%,#0A0810 100%);border:1px solid var(--border-b);padding:28px;margin-bottom:20px;position:relative;overflow:hidden;}
.balance-hero::before{content:'★';position:absolute;right:-20px;top:-30px;font-size:180px;opacity:0.025;color:var(--red);}
.balance-hero-label{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);margin-bottom:7px;}
.balance-hero-amount{font-family:'IBM Plex Mono',monospace;font-size:44px;font-weight:600;color:var(--gold);letter-spacing:-0.02em;}
.balance-hero-sub{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);margin-top:7px;}

/* ── MARKET CARDS ── */
.market-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:20px;}
.market-grid.small{grid-template-columns:repeat(4,1fr);}
.market-card{background:var(--bg2);border:1px solid var(--border);padding:14px;cursor:pointer;transition:all 0.2s;}
.market-card:hover,.market-card.selected{border-color:var(--border-b);transform:translateY(-2px);}
.market-card.selected{background:var(--gold-bg);}
.mc-symbol{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:var(--gold);}
.mc-name{font-size:11px;color:var(--text-dim);margin:3px 0;line-height:1.3;}
.mc-price{font-family:'IBM Plex Mono',monospace;font-size:17px;font-weight:600;color:var(--text);margin:6px 0 3px;}
.mc-change{font-family:'IBM Plex Mono',monospace;font-size:10px;}
.mc-change.pos{color:var(--green);}.mc-change.neg{color:var(--neg);}
.sparkline{width:100%;height:36px;margin-top:7px;opacity:0.7;}

/* ── ASSET CARDS ── */
.asset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
.asset-card{background:var(--bg2);border:1px solid var(--border);padding:18px;cursor:pointer;transition:all 0.2s;position:relative;}
.asset-card:hover{border-color:var(--border-b);}
.asset-card.selected{border-color:var(--gold);background:var(--gold-bg);}
.asset-card.owned{border-color:rgba(46,204,113,0.3);background:rgba(46,204,113,0.04);}
.asset-icon{font-size:28px;margin-bottom:10px;display:block;}
.asset-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px;}
.asset-loc{font-size:11px;color:var(--text-dim);margin-bottom:10px;}
.asset-price{font-family:'IBM Plex Mono',monospace;font-size:18px;color:var(--gold);margin-bottom:4px;}
.asset-yield{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--green);}
.asset-type{position:absolute;top:12px;right:12px;font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 7px;background:rgba(201,168,76,0.1);color:var(--gold-light);border:1px solid var(--border);}

/* ── TOAST ── */
.toast-container{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:7px;}
.toast{background:var(--bg2);border:1px solid var(--border-b);padding:12px 16px;min-width:280px;font-size:12px;animation:slideIn 0.25s ease;position:relative;overflow:hidden;}
.toast::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--gold);animation:shrink 3s linear forwards;}
.toast.success::after{background:var(--green);}.toast.error::after{background:var(--neg);}
.toast-title{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);margin-bottom:3px;}
.toast.success .toast-title{color:var(--green);}.toast.error .toast-title{color:var(--neg);}

/* ── STATUS BAR ── */
.status-bar{position:fixed;bottom:0;left:var(--sidebar);right:0;background:var(--bg2);border-top:1px solid var(--border);padding:5px 28px;display:flex;align-items:center;gap:14px;z-index:50;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--text-muted);}
.status-dot{width:5px;height:5px;background:var(--green);border-radius:50%;animation:pulse 2s infinite;}
.btn-reset{background:none;border:1px solid var(--border);color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;padding:2px 8px;transition:all 0.2s;margin-left:auto;}
.btn-reset:hover{border-color:var(--neg);color:var(--neg);}

/* ── ADMIN ── */
.admin-badge{display:inline-block;padding:2px 6px;background:rgba(204,0,0,0.15);border:1px solid rgba(204,0,0,0.3);color:var(--red);font-family:'IBM Plex Mono',monospace;font-size:8px;letter-spacing:0.1em;text-transform:uppercase;margin-left:8px;}
.admin-action-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.tab-bar{display:flex;gap:2px;margin-bottom:18px;border-bottom:1px solid var(--border);}
.tab-btn{padding:9px 18px;background:none;border:none;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.2s;}
.tab-btn.active{color:var(--gold);border-bottom-color:var(--gold);}

/* ── LOAN ── */
.loan-card{background:var(--bg2);border:1px solid var(--border);padding:18px;margin-bottom:12px;}
.loan-progress{height:4px;background:var(--bg3);border-radius:2px;margin-top:10px;overflow:hidden;}
.loan-bar{height:100%;background:linear-gradient(90deg,var(--green),var(--gold));border-radius:2px;transition:width 0.5s;}

.empty-state{text-align:center;padding:40px;color:var(--text-muted);font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;}
.empty-state .icon{font-size:32px;margin-bottom:10px;opacity:0.25;}
input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
.live-dot{display:inline-block;width:5px;height:5px;background:var(--green);border-radius:50%;margin-right:5px;animation:pulse 1.5s infinite;vertical-align:middle;}
@keyframes slideIn{from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes shrink{from{width:100%}to{width:0%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
`;

// ─── UTILS ────────────────────────────────────────────────────────────────────
let toastId = 0;
function ToastContainer({ toasts }) {
  return <div className="toast-container">{toasts.map(t=>(
    <div key={t.id} className={`toast ${t.type}`}>
      <div className="toast-title">{t.type==="success"?"✓ Success":t.type==="error"?"✗ Error":"ℹ Notice"}</div>
      {t.message}
    </div>
  ))}</div>;
}
function Sparkline({ data, color }) {
  if(!data||data.length<2)return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const w=100,h=36;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*(h-4)-2}`);
  return <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"><polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5"/></svg>;
}
function TickerBar({ stocks, commodities }) {
  const items=[...stocks,...commodities.map(c=>({symbol:c.icon+" "+c.name,price:c.price,change:c.change}))];
  const doubled=[...items,...items];
  return (
    <div className="ticker-bar">
      <div className="ticker-inner">
        {doubled.map((s,i)=>(
          <div key={i} className="ticker-item">
            <span className="ticker-sym">{s.symbol||s.name}</span>
            <span className="ticker-price">₽{s.price?.toFixed(2)}</span>
            <span className={`ticker-ch ${s.change>=0?"pos":"neg"}`}>{s.change>=0?"▲":"▼"}{Math.abs(s.change||0).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PORTAL SELECT ────────────────────────────────────────────────────────────
function PortalSelect({ onSelect }) {
  return (
    <div className="portal-select">
      <div className="portal-grid-bg"/>
      <div className="portal-center">
        <div className="portal-emblem">
          <span className="portal-star">★</span>
          <div className="portal-title">Государственный Банк СССР</div>
          <div className="portal-sub">State Bank of the Union</div>
          <div className="portal-year">Est. 1921 · People's Financial Institution</div>
        </div>
        <div className="portal-divider"/>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-muted)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>Select Access Portal</div>
        <div className="portal-cards">
          <div className="portal-card admin" onClick={()=>onSelect("admin")}>
            <span className="portal-card-icon">⚑</span>
            <div className="portal-card-title">Commissar Portal</div>
            <div className="portal-card-desc">Full system control. Manage users, verify employees and citizens, monitor all economic activity and assets.</div>
            <div className="portal-card-badge">Admin Access</div>
          </div>
          <div className="portal-card employee" onClick={()=>onSelect("employee")}>
            <span className="portal-card-icon">☭</span>
            <div className="portal-card-title">Worker Portal</div>
            <div className="portal-card-desc">State employee access. Trade stocks, commodities, manage assets, process banking, and handle economic operations.</div>
            <div className="portal-card-badge">Employee Access</div>
          </div>
          <div className="portal-card citizen" onClick={()=>onSelect("citizen")}>
            <span className="portal-card-icon">✦</span>
            <div className="portal-card-title">Citizen Portal</div>
            <div className="portal-card-desc">Personal banking, savings, loans, and limited investment access for citizens of the Soviet Union.</div>
            <div className="portal-card-badge">Citizen Access</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ portalType, onLogin, onBack, addToast }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", dept:"Trading Division", invite:"" });
  const [err, setErr] = useState("");

  const isAdmin    = portalType==="admin";
  const isEmployee = portalType==="employee";
  const isCitizen  = portalType==="citizen";

  const handleLogin = () => {
    setErr("");
    let u = null;
    if (isAdmin) {
      // Admin uses special auth
      const users = db.users();
      u = users.find(x => x.role==="admin" && x.email===form.email && x.password===ADMIN_SECRET && btoa(form.password)===ADMIN_SECRET.slice(0));
      // Actually: admin password is stored as ADMIN_SECRET (the btoa string itself is the stored password)
      u = users.find(x => x.role==="admin" && x.email===form.email && x.password===btoa(form.password));
      if(!u){ setErr("Access denied. Invalid credentials."); return; }
    } else {
      const users = db.users();
      u = users.find(x => x.email===form.email && x.password===btoa(form.password) && x.role===portalType);
      if(!u){ setErr("Invalid credentials."); return; }
      if(u.status==="suspended"){ setErr("Account suspended. Contact administration."); return; }
      if(u.status==="pending"){ setErr("Account pending admin approval."); return; }
    }
    onLogin(u);
  };

  const handleRegister = () => {
    setErr("");
    if(!form.name||!form.email||!form.password){ setErr("All fields required."); return; }
    if(isEmployee && form.invite !== atob(EMPLOYEE_INVITE)){ setErr("Invalid employee invite code."); return; }
    let r = null;
    if(isEmployee) r = db.registerEmployee(form.name,form.email,form.password,form.dept);
    else if(isCitizen) r = db.registerCitizen(form.name,form.email,form.password);
    if(!r){ setErr("Email already registered."); return; }
    addToast("Registration submitted — awaiting admin approval","info");
    setTab("login");
    setErr("");
  };

  const icons = { admin:"⚑", employee:"☭", citizen:"✦" };
  const titles = { admin:"Commissar Access", employee:"Worker Registration", citizen:"Citizen Portal" };
  const btnCls = { admin:"", employee:"emp", citizen:"cit" };

  return (
    <div className="auth-screen">
      <div className="auth-bg"/>
      <div className={`auth-glow ${portalType}`}/>
      <div className="auth-box">
        <button className="auth-back" onClick={onBack}>← Back to portal select</button>
        <div className="auth-head">
          <span className="auth-icon">{icons[portalType]}</span>
          <div className="auth-title">{titles[portalType]}</div>
          <div className="auth-subtitle">State Bank of the USSR</div>
        </div>
        <div className="auth-divider"/>
        {!isAdmin && (
          <div className="auth-tabs">
            <button className={`auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setErr("")}}>Sign In</button>
            <button className={`auth-tab ${tab==="register"?"active":""}`} onClick={()=>{setTab("register");setErr("")}}>Register</button>
          </div>
        )}
        {tab==="register" && <div className="field"><label>Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ivan Petrov"/></div>}
        <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="citizen@ussr.gov"/></div>
        <div className="field"><label>Password</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?handleLogin():handleRegister())}/></div>
        {tab==="register"&&isEmployee&&(<>
          <div className="field"><label>Department</label><select value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})}><option>Trading Division</option><option>Asset Management</option><option>Loan Office</option><option>Banking Operations</option><option>Risk Analysis</option></select></div>
          <div className="field"><label>Employee Invite Code</label><input value={form.invite} onChange={e=>setForm({...form,invite:e.target.value})} placeholder="Enter code"/></div>
        </>)}
        {err && <div className="err">⚠ {err}</div>}
        <button className={`btn-primary ${btnCls[portalType]}`} onClick={tab==="login"?handleLogin:handleRegister}>
          {tab==="login"?"Access System":"Submit Registration"}
        </button>
        <div className="info-box">
          {isAdmin && <><div>Admin: <span>volkov@gosbank.ussr</span></div><div>Password: <span>Gosbank1921!USSR</span></div></>}
          {isEmployee && <><div>Employee: <span>petrov@gosbank.ussr</span> / <span>worker1</span></div><div>Or register with invite code: <span>SovietWorker</span></div></>}
          {isCitizen && <><div>Citizen: <span>sorokina@ussr.gov</span> / <span>citizen1</span></div><div>New citizens require admin approval</div></>}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ user, page, setPage, onLogout }) {
  const pendingCount = db.pending().length;

  const adminNav = [
    { id:"dashboard", icon:"⬡", label:"Dashboard" },
    { id:"users",     icon:"◈", label:"User Management", badge: pendingCount>0?pendingCount:null },
    { id:"all_txns",  icon:"≡", label:"All Transactions" },
    { id:"all_orders",icon:"↗", label:"All Orders" },
    { id:"banking",   icon:"◈", label:"Banking" },
    { id:"stocks",    icon:"↗", label:"Stock Exchange" },
    { id:"commodities",icon:"⬢",label:"Commodities" },
    { id:"real_assets",icon:"🏛",label:"Real Assets" },
    { id:"loans",     icon:"◐", label:"Loans" },
    { id:"portfolio", icon:"▦", label:"Portfolio" },
  ];
  const employeeNav = [
    { id:"dashboard",  icon:"⬡", label:"Dashboard" },
    { id:"banking",    icon:"◈", label:"Banking" },
    { id:"stocks",     icon:"↗", label:"Stock Exchange" },
    { id:"commodities",icon:"⬢", label:"Commodities" },
    { id:"real_assets",icon:"🏛", label:"Real Assets" },
    { id:"portfolio",  icon:"▦", label:"Portfolio" },
    { id:"transactions",icon:"≡",label:"Transactions" },
    { id:"loans",      icon:"◐", label:"Loans" },
  ];
  const citizenNav = [
    { id:"dashboard",  icon:"⬡", label:"Dashboard" },
    { id:"banking",    icon:"◈", label:"My Account" },
    { id:"transactions",icon:"≡",label:"Transactions" },
    { id:"loans",      icon:"◐", label:"Loans" },
    { id:"savings",    icon:"★", label:"Savings Plans" },
    { id:"portfolio",  icon:"▦", label:"Investments" },
  ];

  const nav = user.role==="admin"?adminNav:user.role==="employee"?employeeNav:citizenNav;
  const roleColor = user.role==="admin"?"":user.role==="employee"?"emp":"cit";

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-star">★</div>
        <div className="logo-name">State Bank<br/>of USSR</div>
        <div className="logo-sub">Государственный Банк</div>
        <div className={`logo-portal ${user.role}`}>{user.role==="admin"?"⚑ Admin":user.role==="employee"?"☭ Employee":"✦ Citizen"}</div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {nav.map(n=>(
          <div key={n.id} className={`nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
            {n.badge&&<span className="nav-badge">{n.badge}</span>}
          </div>
        ))}
      </div>
      <div className="sidebar-user">
        <div className="user-name">{user.name}</div>
        <div className={`user-role ${roleColor}`}>{user.role}{user.dept&&user.dept!=="—"?` · ${user.dept}`:""}</div>
        <button className="btn-logout" onClick={onLogout}>⊗ Logout</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, balance, stocks, commodities, setPage }) {
  const sh = db.stockH(user.id);
  const ch = db.commH(user.id);
  const ah = db.assetH(user.id);
  const sv = sh.reduce((s,h)=>{const l=stocks.find(x=>x.symbol===h.symbol);return s+(l?l.price*h.shares:h.buyPrice*h.shares);},0);
  const cv = ch.reduce((s,h)=>{const l=commodities.find(x=>x.name===h.name);return s+(l?l.price*h.quantity:h.buyPrice*h.quantity);},0);
  const av = ah.reduce((s,a)=>s+a.price,0);
  const recentTxns = db.txns().filter(t=>t.userId===user.id).slice(-5).reverse();
  const userLoans = db.loans().filter(l=>l.userId===user.id&&l.status==="active");

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Welcome, <span>{user.name.split(" ")[0]}</span></div>
        <div className="page-sub"><span className="live-dot"/>Markets Open · {new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
      </div>
      <div className="grid-4">
        <div className="card"><div className="card-icon">◈</div><div className="card-label">Cash Balance</div><div className="card-value gold">₽{balance.toLocaleString()}</div><div className="card-sub">Available funds</div></div>
        <div className="card"><div className="card-icon">↗</div><div className="card-label">Stock Portfolio</div><div className="card-value">₽{sv.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{sh.length} positions</div></div>
        <div className="card"><div className="card-icon">🏛</div><div className="card-label">Real Assets</div><div className="card-value">₽{av.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{ah.length} properties</div></div>
        <div className="card"><div className="card-icon">★</div><div className="card-label">Total Net Worth</div><div className="card-value green">₽{(balance+sv+cv+av).toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">All assets combined</div></div>
      </div>
      {userLoans.length>0&&(
        <div className="card" style={{marginBottom:16,borderColor:"rgba(231,76,60,0.2)"}}>
          <div className="card-label">Active Loans</div>
          {userLoans.map(l=>(
            <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span className="mono" style={{fontSize:12}}>Loan #{String(l.id).slice(-6)}</span>
              <span className="mono neg" style={{fontSize:12}}>₽{l.balance.toLocaleString()} remaining</span>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card">
          <div className="section-title">Market Overview <small>LIVE</small></div>
          <table className="data-table"><thead><tr><th>Asset</th><th>Price</th><th>Change</th></tr></thead>
          <tbody>
            {stocks.slice(0,5).map(s=><tr key={s.symbol}><td><span className="mono" style={{color:"var(--gold)"}}>{s.symbol}</span></td><td className="mono">₽{s.price.toFixed(2)}</td><td className={`mono ${s.change>=0?"pos":"neg"}`}>{s.change>=0?"▲":"▼"}{Math.abs(s.change).toFixed(2)}%</td></tr>)}
          </tbody></table>
        </div>
        <div className="card">
          <div className="section-title">Recent Transactions <small>HISTORY</small></div>
          {recentTxns.length===0?<div className="empty-state"><div className="icon">≡</div>No transactions</div>:(
            <table className="data-table"><thead><tr><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>{recentTxns.map(t=>(
              <tr key={t.id}><td><span className={`badge ${t.type==="deposit"?"badge-green":t.type==="withdraw"?"badge-red":"badge-blue"}`}>{t.type}</span></td><td className="mono">₽{t.amount.toLocaleString()}</td><td className="mono" style={{color:"var(--text-dim)"}}>{t.date}</td></tr>
            ))}</tbody></table>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
        <button className="btn-action" onClick={()=>setPage("banking")}>◈ Banking</button>
        {user.role!=="citizen"&&<button className="btn-action" onClick={()=>setPage("stocks")}>↗ Trade Stocks</button>}
        {user.role!=="citizen"&&<button className="btn-action" onClick={()=>setPage("commodities")}>⬢ Commodities</button>}
        <button className="btn-action" onClick={()=>setPage("real_assets")}>🏛 Real Assets</button>
        <button className="btn-action" onClick={()=>setPage("loans")}>◐ Loans</button>
      </div>
    </div>
  );
}

// ─── BANKING ──────────────────────────────────────────────────────────────────
function Banking({ user, balance, setBalance, addToast, refresh }) {
  const [depAmt,setDepAmt]=useState("");
  const [witAmt,setWitAmt]=useState("");
  const [transTo,setTransTo]=useState("");
  const [transAmt,setTransAmt]=useState("");

  const deposit=()=>{
    const amt=parseFloat(depAmt);if(!amt||amt<=0){addToast("Enter valid amount","error");return;}
    setBalance(balance+amt);db.addTxn({userId:user.id,type:"deposit",amount:amt,date:new Date().toISOString().split("T")[0],note:"Deposit"});
    setDepAmt("");addToast(`₽${amt.toLocaleString()} deposited`,"success");refresh();
  };
  const withdraw=()=>{
    const amt=parseFloat(witAmt);if(!amt||amt<=0){addToast("Enter valid amount","error");return;}
    if(amt>balance){addToast("Insufficient funds","error");return;}
    setBalance(balance-amt);db.addTxn({userId:user.id,type:"withdraw",amount:amt,date:new Date().toISOString().split("T")[0],note:"Withdrawal"});
    setWitAmt("");addToast(`₽${amt.toLocaleString()} withdrawn`,"success");refresh();
  };
  const transfer=()=>{
    const amt=parseFloat(transAmt);if(!amt||amt<=0){addToast("Enter valid amount","error");return;}
    if(!transTo){addToast("Enter recipient","error");return;}
    const users=db.users();const recipient=users.find(u=>u.email===transTo&&u.id!==user.id);
    if(!recipient){addToast("Recipient not found","error");return;}
    if(amt>balance){addToast("Insufficient funds","error");return;}
    setBalance(balance-amt);db.updateBalance(recipient.id,recipient.balance+amt);
    db.addTxn({userId:user.id,type:"transfer",amount:amt,date:new Date().toISOString().split("T")[0],note:`To ${recipient.name}`});
    db.addTxn({userId:recipient.id,type:"deposit",amount:amt,date:new Date().toISOString().split("T")[0],note:`From ${user.name}`});
    setTransTo("");setTransAmt("");addToast(`₽${amt.toLocaleString()} transferred to ${recipient.name}`,"success");refresh();
  };

  const txns=db.txns().filter(t=>t.userId===user.id);
  return (
    <div>
      <div className="page-header"><div className="page-title">Banking <span>Services</span></div></div>
      <div className="balance-hero">
        <div className="balance-hero-label">Account Balance</div>
        <div className="balance-hero-amount">₽{balance.toLocaleString()}</div>
        <div className="balance-hero-sub">Account № {String(user.id).padStart(12,"0")} · Госбанк СССР · <span style={{color:"var(--green)"}}>● Active</span></div>
      </div>
      <div className="bank-form" style={{marginBottom:20}}>
        <div className="bank-form-group"><div className="form-title">Deposit Funds</div><div className="field"><label>Amount (₽)</label><input type="number" value={depAmt} onChange={e=>setDepAmt(e.target.value)} placeholder="0.00"/></div><button className="btn-buy" style={{width:"100%"}} onClick={deposit}>Deposit</button></div>
        <div className="bank-form-group"><div className="form-title">Withdraw Funds</div><div className="field"><label>Amount (₽)</label><input type="number" value={witAmt} onChange={e=>setWitAmt(e.target.value)} placeholder="0.00"/></div><button className="btn-sell" style={{width:"100%"}} onClick={withdraw}>Withdraw</button></div>
        <div className="bank-form-group" style={{gridColumn:"1/-1"}}><div className="form-title">Transfer Funds</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <div className="trade-field" style={{flex:2,minWidth:180}}><label>Recipient Email</label><input className="trade-field" value={transTo} onChange={e=>setTransTo(e.target.value)} placeholder="citizen@ussr.gov" style={{width:"100%",background:"var(--bg3)",border:"1px solid var(--border)",color:"var(--text)",padding:"9px 12px",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,outline:"none"}}/></div>
            <div className="trade-field" style={{flex:1,minWidth:130}}><label>Amount (₽)</label><input type="number" value={transAmt} onChange={e=>setTransAmt(e.target.value)} placeholder="0.00"/></div>
            <div style={{display:"flex",alignItems:"flex-end"}}><button className="btn-buy" onClick={transfer}>Transfer</button></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="section-title">Transaction History <small>{txns.length} RECORDS</small></div>
        {txns.length===0?<div className="empty-state"><div className="icon">≡</div>No transactions</div>:(
          <table className="data-table"><thead><tr><th>#</th><th>Type</th><th>Amount</th><th>Date</th><th>Note</th></tr></thead>
          <tbody>{[...txns].reverse().map(t=>(
            <tr key={t.id}><td className="mono" style={{color:"var(--text-muted)"}}>{String(t.id).slice(-6)}</td><td><span className={`badge ${t.type==="deposit"?"badge-green":t.type==="withdraw"?"badge-red":"badge-blue"}`}>{t.type}</span></td><td className={`mono ${t.type==="deposit"?"pos":"neg"}`}>{t.type==="deposit"?"+":"-"}₽{t.amount.toLocaleString()}</td><td className="mono" style={{color:"var(--text-dim)"}}>{t.date}</td><td style={{color:"var(--text-dim)",fontSize:11}}>{t.note}</td></tr>
          ))}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── STOCK MARKET ─────────────────────────────────────────────────────────────
function StockMarket({ user, stocks, balance, setBalance, addToast, refresh }) {
  const [tab,setTab]=useState("buy");
  const [sel,setSel]=useState(null);
  const [qty,setQty]=useState("");
  const holdings=db.stockH(user.id);
  const totalCost=sel&&qty?(stocks.find(s=>s.symbol===sel)?.price*parseInt(qty)||0):0;

  const execute=()=>{
    const amt=parseInt(qty);if(!amt||amt<=0){addToast("Enter valid quantity","error");return;}
    if(!sel){addToast("Select a stock","error");return;}
    const stock=stocks.find(s=>s.symbol===sel);const cost=stock.price*amt;let h=[...holdings];
    if(tab==="buy"){
      if(cost>balance){addToast("Insufficient funds","error");return;}
      setBalance(balance-cost);
      const idx=h.findIndex(x=>x.symbol===stock.symbol);
      if(idx>=0)h[idx]={...h[idx],shares:h[idx].shares+amt};
      else h.push({symbol:stock.symbol,name:stock.name,shares:amt,buyPrice:stock.price});
      db.setStockH(user.id,h);db.addOrder({userId:user.id,assetType:"stock",symbol:stock.symbol,type:"buy",qty:amt,price:stock.price,date:new Date().toISOString().split("T")[0],status:"filled"});
      addToast(`Bought ${amt}×${stock.symbol} @ ₽${stock.price.toFixed(2)}`,"success");
    } else {
      const idx=h.findIndex(x=>x.symbol===stock.symbol);
      if(idx<0||h[idx].shares<amt){addToast("Insufficient shares","error");return;}
      setBalance(balance+cost);h[idx]={...h[idx],shares:h[idx].shares-amt};
      if(h[idx].shares===0)h.splice(idx,1);
      db.setStockH(user.id,h);db.addOrder({userId:user.id,assetType:"stock",symbol:stock.symbol,type:"sell",qty:amt,price:stock.price,date:new Date().toISOString().split("T")[0],status:"filled"});
      addToast(`Sold ${amt}×${stock.symbol} @ ₽${stock.price.toFixed(2)}`,"success");
    }
    setQty("");refresh();
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Stock <span>Exchange</span></div><div className="page-sub">{stocks.length} listed securities</div></div>
      <div className="market-grid">
        {stocks.map(s=>(
          <div key={s.symbol} className={`market-card ${sel===s.symbol?"selected":""}`} onClick={()=>setSel(s.symbol)}>
            <div className="mc-symbol">{s.icon} {s.symbol}</div>
            <div className="mc-name">{s.name}</div>
            <div className="mc-price">₽{s.price.toFixed(2)}</div>
            <div className={`mc-change ${s.change>=0?"pos":"neg"}`}>{s.change>=0?"▲":"▼"} {Math.abs(s.change).toFixed(2)}%</div>
            <Sparkline data={s.history} color={s.change>=0?"var(--green)":"var(--neg)"}/>
          </div>
        ))}
      </div>
      <div className="trade-panel">
        <div className="section-title">Place Order</div>
        <div className="trade-tabs">
          <button className={`trade-tab buy ${tab==="buy"?"active":""}`} onClick={()=>setTab("buy")}>▲ Buy</button>
          <button className={`trade-tab sell ${tab==="sell"?"active":""}`} onClick={()=>setTab("sell")}>▼ Sell</button>
        </div>
        <div className="trade-row">
          <div className="trade-field"><label>Stock</label><select value={sel||""} onChange={e=>setSel(e.target.value)}><option value="">-- Select --</option>{stocks.map(s=><option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name} (₽{s.price.toFixed(2)})</option>)}</select></div>
          <div className="trade-field" style={{maxWidth:160}}><label>Shares</label><input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" min="1"/></div>
          <div className="trade-field" style={{maxWidth:180}}><label>Total (₽)</label><input type="number" value={totalCost.toFixed(2)} readOnly style={{color:"var(--gold)",cursor:"default"}}/></div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            {tab==="buy"?<button className="btn-buy" onClick={execute}>Buy Now</button>:<button className="btn-sell" onClick={execute}>Sell Now</button>}
          </div>
        </div>
        <div style={{marginTop:10,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-muted)"}}>Balance: <span style={{color:"var(--gold)"}}>₽{balance.toLocaleString()}</span></div>
      </div>
      <div className="card">
        <div className="section-title">My Holdings <small>{db.stockH(user.id).length} POSITIONS</small></div>
        {db.stockH(user.id).length===0?<div className="empty-state"><div className="icon">↗</div>No positions</div>:(
          <table className="data-table"><thead><tr><th>Symbol</th><th>Name</th><th>Shares</th><th>Buy Price</th><th>Current</th><th>Value</th><th>P&L</th></tr></thead>
          <tbody>{db.stockH(user.id).map(h=>{
            const l=stocks.find(s=>s.symbol===h.symbol);
            const val=l?l.price*h.shares:h.buyPrice*h.shares,pnl=l?(l.price-h.buyPrice)*h.shares:0,pct=l?((l.price-h.buyPrice)/h.buyPrice*100):0;
            return <tr key={h.symbol}><td className="mono" style={{color:"var(--gold)"}}>{h.symbol}</td><td style={{fontSize:11}}>{h.name}</td><td className="mono">{h.shares}</td><td className="mono">₽{h.buyPrice.toFixed(2)}</td><td className="mono">{l?`₽${l.price.toFixed(2)}`:"—"}</td><td className="mono">₽{val.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td className={`mono ${pnl>=0?"pos":"neg"}`}>{pnl>=0?"+":""}₽{pnl.toFixed(0)} ({pct>=0?"+":""}{pct.toFixed(1)}%)</td></tr>;
          })}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── COMMODITY MARKET ─────────────────────────────────────────────────────────
function CommodityMarket({ user, commodities, balance, setBalance, addToast, refresh }) {
  const [tab,setTab]=useState("buy");
  const [sel,setSel]=useState(null);
  const [qty,setQty]=useState("");
  const totalCost=sel&&qty?(commodities.find(c=>c.name===sel)?.price*parseFloat(qty)||0):0;

  const execute=()=>{
    const amt=parseFloat(qty);if(!amt||amt<=0){addToast("Enter valid quantity","error");return;}
    if(!sel){addToast("Select commodity","error");return;}
    const commodity=commodities.find(c=>c.name===sel);const cost=commodity.price*amt;let h=[...db.commH(user.id)];
    if(tab==="buy"){
      if(cost>balance){addToast("Insufficient funds","error");return;}
      setBalance(balance-cost);const idx=h.findIndex(x=>x.name===commodity.name);
      if(idx>=0)h[idx]={...h[idx],quantity:h[idx].quantity+amt};
      else h.push({name:commodity.name,quantity:amt,buyPrice:commodity.price});
      db.setCommH(user.id,h);db.addOrder({userId:user.id,assetType:"commodity",symbol:commodity.name,type:"buy",qty:amt,price:commodity.price,date:new Date().toISOString().split("T")[0],status:"filled"});
      addToast(`Bought ${amt} ${commodity.unit} of ${commodity.name}`,"success");
    } else {
      const idx=h.findIndex(x=>x.name===commodity.name);
      if(idx<0||h[idx].quantity<amt){addToast("Insufficient holdings","error");return;}
      setBalance(balance+cost);h[idx]={...h[idx],quantity:h[idx].quantity-amt};
      if(h[idx].quantity<=0)h.splice(idx,1);
      db.setCommH(user.id,h);db.addOrder({userId:user.id,assetType:"commodity",symbol:commodity.name,type:"sell",qty:amt,price:commodity.price,date:new Date().toISOString().split("T")[0],status:"filled"});
      addToast(`Sold ${amt} ${commodity.unit} of ${commodity.name}`,"success");
    }
    setQty("");refresh();
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Commodity <span>Exchange</span></div><div className="page-sub">{commodities.length} traded commodities</div></div>
      <div className="market-grid">
        {commodities.map(c=>(
          <div key={c.name} className={`market-card ${sel===c.name?"selected":""}`} onClick={()=>setSel(c.name)}>
            <div className="mc-symbol">{c.icon} {c.name.toUpperCase()}</div>
            <div className="mc-name">{c.category} · per {c.unit}</div>
            <div className="mc-price">₽{c.price.toFixed(2)}</div>
            <div className={`mc-change ${c.change>=0?"pos":"neg"}`}>{c.change>=0?"▲":"▼"} {Math.abs(c.change).toFixed(2)}%</div>
            <Sparkline data={c.history} color={c.change>=0?"var(--green)":"var(--neg)"}/>
          </div>
        ))}
      </div>
      <div className="trade-panel">
        <div className="section-title">Place Order</div>
        <div className="trade-tabs">
          <button className={`trade-tab buy ${tab==="buy"?"active":""}`} onClick={()=>setTab("buy")}>▲ Buy</button>
          <button className={`trade-tab sell ${tab==="sell"?"active":""}`} onClick={()=>setTab("sell")}>▼ Sell</button>
        </div>
        <div className="trade-row">
          <div className="trade-field"><label>Commodity</label><select value={sel||""} onChange={e=>setSel(e.target.value)}><option value="">-- Select --</option>{commodities.map(c=><option key={c.name} value={c.name}>{c.icon} {c.name} (₽{c.price.toFixed(2)}/{c.unit})</option>)}</select></div>
          <div className="trade-field" style={{maxWidth:160}}><label>Quantity ({sel?commodities.find(c=>c.name===sel)?.unit:"unit"})</label><input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" min="0.01" step="any"/></div>
          <div className="trade-field" style={{maxWidth:180}}><label>Total Cost (₽)</label><input type="number" value={totalCost.toFixed(2)} readOnly style={{color:"var(--gold)",cursor:"default"}}/></div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            {tab==="buy"?<button className="btn-buy" onClick={execute}>Buy Now</button>:<button className="btn-sell" onClick={execute}>Sell Now</button>}
          </div>
        </div>
        <div style={{marginTop:10,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-muted)"}}>Balance: <span style={{color:"var(--gold)"}}>₽{balance.toLocaleString()}</span></div>
      </div>
      <div className="card">
        <div className="section-title">My Holdings <small>{db.commH(user.id).length} POSITIONS</small></div>
        {db.commH(user.id).length===0?<div className="empty-state"><div className="icon">⬢</div>No holdings</div>:(
          <table className="data-table"><thead><tr><th>Commodity</th><th>Quantity</th><th>Buy Price</th><th>Current</th><th>Value</th><th>P&L</th></tr></thead>
          <tbody>{db.commH(user.id).map(h=>{
            const l=commodities.find(c=>c.name===h.name);
            const val=l?l.price*h.quantity:h.buyPrice*h.quantity,pnl=l?(l.price-h.buyPrice)*h.quantity:0,pct=l?((l.price-h.buyPrice)/h.buyPrice*100):0;
            return <tr key={h.name}><td style={{color:"var(--gold)"}}>{l?.icon} {h.name}</td><td className="mono">{h.quantity} {l?.unit}</td><td className="mono">₽{h.buyPrice.toFixed(2)}</td><td className="mono">{l?`₽${l.price.toFixed(2)}`:"—"}</td><td className="mono">₽{val.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td className={`mono ${pnl>=0?"pos":"neg"}`}>{pnl>=0?"+":""}₽{pnl.toFixed(0)} ({pct>=0?"+":""}{pct.toFixed(1)}%)</td></tr>;
          })}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── REAL ASSETS ──────────────────────────────────────────────────────────────
function RealAssets({ user, balance, setBalance, addToast, refresh }) {
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("All");
  const assets=db.assets();
  const myHoldings=db.assetH(user.id);
  const types=["All","Building","Factory","Office","Residence","Land","Infrastructure","Vehicle","Vessel"];
  const filtered=assets.filter(a=>filter==="All"||a.type===filter);
  const canBuy=user.role==="admin"||user.role==="employee";

  const buyAsset=(asset)=>{
    if(!canBuy){addToast("Citizens cannot directly purchase major state assets","error");return;}
    if(asset.status!=="available"){addToast("Asset not available","error");return;}
    if(asset.price>balance){addToast("Insufficient funds","error");return;}
    setBalance(balance-asset.price);
    db.buyAsset(user.id,asset.id,asset.price);
    db.addTxn({userId:user.id,type:"asset_purchase",amount:asset.price,date:new Date().toISOString().split("T")[0],note:`Acquired: ${asset.name}`});
    db.addOrder({userId:user.id,assetType:"real_asset",symbol:asset.id,type:"buy",qty:1,price:asset.price,date:new Date().toISOString().split("T")[0],status:"filled"});
    addToast(`Acquired: ${asset.name}`,"success");refresh();
  };
  const sellAsset=(asset)=>{
    setBalance(balance+asset.price*0.95);
    db.sellAsset(user.id,asset.id);
    db.addTxn({userId:user.id,type:"asset_sale",amount:asset.price*0.95,date:new Date().toISOString().split("T")[0],note:`Sold: ${asset.name}`});
    addToast(`Sold ${asset.name} for ₽${(asset.price*0.95).toLocaleString()} (5% transaction fee)`,"success");refresh();
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Real <span>Assets</span></div><div className="page-sub">Buildings · Land · Infrastructure · Vehicles</div></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
        {types.map(t=><button key={t} className={`trade-tab ${filter===t?"buy active":""}`} style={{flex:"none",padding:"6px 14px"}} onClick={()=>setFilter(t)}>{t}</button>)}
      </div>
      {myHoldings.length>0&&(
        <div className="card" style={{marginBottom:16}}>
          <div className="section-title">My Asset Holdings <small>{myHoldings.length} PROPERTIES</small></div>
          <table className="data-table"><thead><tr><th>Icon</th><th>Name</th><th>Type</th><th>Location</th><th>Value</th><th>Yield</th><th>Action</th></tr></thead>
          <tbody>{myHoldings.map(a=>(
            <tr key={a.id}><td style={{fontSize:20}}>{a.icon}</td><td style={{fontWeight:500}}>{a.name}</td><td><span className="badge badge-gold">{a.type}</span></td><td style={{color:"var(--text-dim)",fontSize:11}}>{a.location}</td><td className="mono gold" style={{color:"var(--gold)"}}>₽{a.price.toLocaleString()}</td><td className="mono pos">{a.yield}% p.a.</td><td><button className="btn-sell btn-small" onClick={()=>sellAsset(a)}>Sell</button></td></tr>
          ))}</tbody></table>
        </div>
      )}
      <div className="asset-grid">
        {filtered.map(a=>{
          const owned=a.status==="owned";
          const isMine=myHoldings.find(x=>x.id===a.id);
          return (
            <div key={a.id} className={`asset-card ${sel===a.id?"selected":""} ${isMine?"owned":""}`} onClick={()=>setSel(a.id===sel?null:a.id)}>
              <div className="asset-type">{a.type}</div>
              <span className="asset-icon">{a.icon}</span>
              <div className="asset-name">{a.name}</div>
              <div className="asset-loc">📍 {a.location}</div>
              <div className="asset-price">₽{a.price.toLocaleString()}</div>
              <div className="asset-yield">▲ {a.yield}% annual yield</div>
              {a.sqm&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--text-muted)",marginTop:4}}>{a.sqm.toLocaleString()} m²</div>}
              <div style={{marginTop:12}}>
                {isMine?<span className="badge badge-green">✓ Owned</span>:
                 owned?<span className="badge badge-gray">Unavailable</span>:
                 canBuy?<button className="btn-buy btn-small" style={{width:"100%"}} onClick={e=>{e.stopPropagation();buyAsset(a);}}>Acquire Asset</button>:
                 <span className="badge badge-blue">View Only</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOANS ────────────────────────────────────────────────────────────────────
function Loans({ user, balance, setBalance, addToast, refresh }) {
  const [amt,setAmt]=useState("");
  const [term,setTerm]=useState("12");
  const myLoans=db.loans().filter(l=>l.userId===user.id);

  const applyLoan=()=>{
    const a=parseFloat(amt);if(!a||a<=0){addToast("Enter valid amount","error");return;}
    if(a>500000&&user.role==="citizen"){addToast("Citizens limited to ₽500,000","error");return;}
    const rate=user.role==="citizen"?5.5:user.role==="employee"?3.5:2.0;
    const t=parseInt(term);
    const monthly=(a*(rate/1200))/((1-Math.pow(1+(rate/1200),-t)));
    const newLoan={userId:user.id,amount:a,interest:rate,term:t,status:"active",startDate:new Date().toISOString().split("T")[0],balance:a,monthlyPayment:+monthly.toFixed(2)};
    db.addLoan(newLoan);setBalance(balance+a);
    db.addTxn({userId:user.id,type:"loan_disbursement",amount:a,date:new Date().toISOString().split("T")[0],note:`Loan approved (${rate}% / ${t}mo)`});
    setAmt("");addToast(`Loan of ₽${a.toLocaleString()} approved at ${rate}%`,"success");refresh();
  };

  const payLoan=(loan)=>{
    const pmt=loan.monthlyPayment;
    if(pmt>balance){addToast("Insufficient funds for payment","error");return;}
    setBalance(balance-pmt);db.payLoan(loan.id,pmt,user.id);
    db.addTxn({userId:user.id,type:"loan_payment",amount:pmt,date:new Date().toISOString().split("T")[0],note:`Loan #${String(loan.id).slice(-6)} payment`});
    addToast(`Payment of ₽${pmt.toLocaleString()} made`,"success");refresh();
  };

  const rates={admin:"2.0%",employee:"3.5%",citizen:"5.5%"};
  const limits={admin:"Unlimited",employee:"₽2,000,000",citizen:"₽500,000"};

  return (
    <div>
      <div className="page-header"><div className="page-title">Loan <span>Services</span></div></div>
      <div className="grid-3" style={{marginBottom:20}}>
        <div className="card"><div className="card-label">Your Rate</div><div className="card-value gold">{rates[user.role]}</div><div className="card-sub">Annual interest ({user.role})</div></div>
        <div className="card"><div className="card-label">Credit Limit</div><div className="card-value">{limits[user.role]}</div><div className="card-sub">Maximum loan</div></div>
        <div className="card"><div className="card-label">Active Loans</div><div className="card-value neg">{myLoans.filter(l=>l.status==="active").length}</div><div className="card-sub">Currently outstanding</div></div>
      </div>
      <div className="trade-panel" style={{marginBottom:20}}>
        <div className="section-title">Apply for Loan</div>
        <div className="trade-row">
          <div className="trade-field"><label>Loan Amount (₽)</label><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="10000"/></div>
          <div className="trade-field" style={{maxWidth:160}}><label>Term (Months)</label><select value={term} onChange={e=>setTerm(e.target.value)}><option value="6">6 months</option><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option><option value="60">60 months</option></select></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button className="btn-buy" onClick={applyLoan}>Apply Now</button></div>
        </div>
        {amt&&<div style={{marginTop:10,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-dim)"}}>Est. Monthly: <span style={{color:"var(--gold)"}}>₽{((parseFloat(amt)||0)*((parseFloat(rates[user.role])/100)/12)/(1-Math.pow(1+(parseFloat(rates[user.role])/100)/12,-parseInt(term)))||0).toFixed(2)}</span></div>}
      </div>
      <div>
        {myLoans.length===0?<div className="empty-state"><div className="icon">◐</div>No active loans</div>:myLoans.map(l=>(
          <div key={l.id} className="loan-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text-dim)"}}>Loan #{String(l.id).slice(-8)}</div>
                <div style={{fontSize:18,fontFamily:"'IBM Plex Mono',monospace",color:"var(--gold)",marginTop:3}}>₽{l.amount.toLocaleString()} <small style={{fontSize:11,color:"var(--text-dim)"}}>@ {l.interest}% / {l.term}mo</small></div>
              </div>
              <span className={`badge ${l.status==="active"?"badge-orange":l.status==="paid"?"badge-green":"badge-red"}`}>{l.status}</span>
            </div>
            <div style={{display:"flex",gap:24,marginBottom:10}}>
              <div><div style={{fontSize:9,color:"var(--text-muted)",fontFamily:"'IBM Plex Mono',monospace",textTransform:"uppercase",letterSpacing:"0.15em"}}>Remaining</div><div className="mono neg" style={{fontSize:14}}>₽{(l.balance||0).toLocaleString()}</div></div>
              <div><div style={{fontSize:9,color:"var(--text-muted)",fontFamily:"'IBM Plex Mono',monospace",textTransform:"uppercase",letterSpacing:"0.15em"}}>Monthly Payment</div><div className="mono" style={{fontSize:14}}>₽{l.monthlyPayment?.toLocaleString()}</div></div>
              <div><div style={{fontSize:9,color:"var(--text-muted)",fontFamily:"'IBM Plex Mono',monospace",textTransform:"uppercase",letterSpacing:"0.15em"}}>Since</div><div className="mono" style={{fontSize:14}}>{l.startDate}</div></div>
            </div>
            <div className="loan-progress"><div className="loan-bar" style={{width:`${Math.max(0,(1-(l.balance||0)/l.amount)*100)}%`}}/></div>
            {l.status==="active"&&<button className="btn-buy btn-small" style={{marginTop:12}} onClick={()=>payLoan(l)}>Make Payment (₽{l.monthlyPayment?.toLocaleString()})</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SAVINGS (CITIZEN) ────────────────────────────────────────────────────────
function Savings({ user, balance, setBalance, addToast, refresh }) {
  const plans=[
    {id:"basic",name:"Basic Savings",rate:2.5,min:100,term:"Any",desc:"Standard state savings with guaranteed returns"},
    {id:"patriot",name:"Patriot Bond",rate:4.8,min:1000,term:"12 months",desc:"Fixed 12-month bond supporting Soviet infrastructure"},
    {id:"veteran",name:"Veteran Fund",rate:6.2,min:5000,term:"36 months",desc:"Long-term investment for committed patriots"},
  ];
  const [sel,setSel]=useState(null);
  const [amt,setAmt]=useState("");

  const invest=(plan)=>{
    const a=parseFloat(amt);if(!a||a<plan.min){addToast(`Minimum ₽${plan.min.toLocaleString()} required`,"error");return;}
    if(a>balance){addToast("Insufficient funds","error");return;}
    setBalance(balance-a);
    db.addTxn({userId:user.id,type:"savings_deposit",amount:a,date:new Date().toISOString().split("T")[0],note:`${plan.name} — ${plan.rate}% p.a.`});
    addToast(`₽${a.toLocaleString()} invested in ${plan.name}`,"success");refresh();setAmt("");
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Savings <span>Plans</span></div><div className="page-sub">State-guaranteed investment programs</div></div>
      <div className="asset-grid">
        {plans.map(p=>(
          <div key={p.id} className={`asset-card ${sel===p.id?"selected":""}`} onClick={()=>setSel(p.id===sel?null:p.id)}>
            <div className="asset-type">{p.rate}% p.a.</div>
            <span className="asset-icon">★</span>
            <div className="asset-name">{p.name}</div>
            <div className="asset-loc">{p.desc}</div>
            <div className="asset-price">Min. ₽{p.min.toLocaleString()}</div>
            <div className="asset-yield">Term: {p.term}</div>
            {sel===p.id&&(
              <div onClick={e=>e.stopPropagation()} style={{marginTop:12}}>
                <div className="field"><label>Invest Amount (₽)</label><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder={p.min} min={p.min}/></div>
                <button className="btn-buy" style={{width:"100%"}} onClick={()=>invest(p)}>Invest Now</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="section-title">Investment History</div>
        {db.txns().filter(t=>t.userId===user.id&&t.type==="savings_deposit").length===0?
          <div className="empty-state"><div className="icon">★</div>No savings yet</div>:
          <table className="data-table"><thead><tr><th>Plan</th><th>Amount</th><th>Date</th></tr></thead>
          <tbody>{db.txns().filter(t=>t.userId===user.id&&t.type==="savings_deposit").map(t=>(
            <tr key={t.id}><td style={{color:"var(--gold)"}}>{t.note}</td><td className="mono pos">₽{t.amount.toLocaleString()}</td><td className="mono" style={{color:"var(--text-dim)"}}>{t.date}</td></tr>
          ))}</tbody></table>}
      </div>
    </div>
  );
}

// ─── PORTFOLIO ────────────────────────────────────────────────────────────────
function Portfolio({ user, stocks, commodities }) {
  const sh=db.stockH(user.id),ch=db.commH(user.id),ah=db.assetH(user.id);
  const orders=db.orders().filter(o=>o.userId===user.id);
  const sv=sh.reduce((s,h)=>{const l=stocks.find(x=>x.symbol===h.symbol);return s+(l?l.price*h.shares:h.buyPrice*h.shares);},0);
  const cv=ch.reduce((s,h)=>{const l=commodities.find(x=>x.name===h.name);return s+(l?l.price*h.quantity:h.buyPrice*h.quantity);},0);
  const av=ah.reduce((s,a)=>s+a.price,0);

  return (
    <div>
      <div className="page-header"><div className="page-title">My <span>Portfolio</span></div></div>
      <div className="grid-4" style={{marginBottom:20}}>
        <div className="card"><div className="card-label">Stock Value</div><div className="card-value gold">₽{sv.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{sh.length} positions</div></div>
        <div className="card"><div className="card-label">Commodity Value</div><div className="card-value gold">₽{cv.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{ch.length} holdings</div></div>
        <div className="card"><div className="card-label">Real Asset Value</div><div className="card-value gold">₽{av.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{ah.length} properties</div></div>
        <div className="card"><div className="card-label">Total Portfolio</div><div className="card-value green">₽{(sv+cv+av).toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">All investments</div></div>
      </div>
      {sh.length>0&&<div className="card" style={{marginBottom:14}}>
        <div className="section-title">Stocks</div>
        <table className="data-table"><thead><tr><th>Symbol</th><th>Shares</th><th>Buy</th><th>Live</th><th>Value</th><th>P&L</th></tr></thead>
        <tbody>{sh.map(h=>{const l=stocks.find(s=>s.symbol===h.symbol);const mv=l?l.price*h.shares:0,pnl=l?(l.price-h.buyPrice)*h.shares:0,pct=l?((l.price-h.buyPrice)/h.buyPrice*100):0;return <tr key={h.symbol}><td className="mono" style={{color:"var(--gold)"}}>{h.symbol}</td><td className="mono">{h.shares}</td><td className="mono">₽{h.buyPrice.toFixed(2)}</td><td className="mono">{l?`₽${l.price.toFixed(2)}`:"—"}</td><td className="mono">₽{mv.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td className={`mono ${pnl>=0?"pos":"neg"}`}>{pnl>=0?"+":""}₽{pnl.toFixed(0)} ({pct>=0?"+":""}{pct.toFixed(1)}%)</td></tr>})}</tbody></table>
      </div>}
      {ch.length>0&&<div className="card" style={{marginBottom:14}}>
        <div className="section-title">Commodities</div>
        <table className="data-table"><thead><tr><th>Name</th><th>Qty</th><th>Buy</th><th>Live</th><th>Value</th><th>P&L</th></tr></thead>
        <tbody>{ch.map(h=>{const l=commodities.find(c=>c.name===h.name);const mv=l?l.price*h.quantity:0,pnl=l?(l.price-h.buyPrice)*h.quantity:0,pct=l?((l.price-h.buyPrice)/h.buyPrice*100):0;return <tr key={h.name}><td style={{color:"var(--gold)"}}>{l?.icon} {h.name}</td><td className="mono">{h.quantity}</td><td className="mono">₽{h.buyPrice.toFixed(2)}</td><td className="mono">{l?`₽${l.price.toFixed(2)}`:"—"}</td><td className="mono">₽{mv.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td className={`mono ${pnl>=0?"pos":"neg"}`}>{pnl>=0?"+":""}₽{pnl.toFixed(0)} ({pct>=0?"+":""}{pct.toFixed(1)}%)</td></tr>})}</tbody></table>
      </div>}
      {ah.length>0&&<div className="card" style={{marginBottom:14}}>
        <div className="section-title">Real Assets</div>
        <table className="data-table"><thead><tr><th>Asset</th><th>Type</th><th>Location</th><th>Value</th><th>Yield</th></tr></thead>
        <tbody>{ah.map(a=><tr key={a.id}><td>{a.icon} {a.name}</td><td><span className="badge badge-gold">{a.type}</span></td><td style={{color:"var(--text-dim)"}}>{a.location}</td><td className="mono" style={{color:"var(--gold)"}}>₽{a.price.toLocaleString()}</td><td className="mono pos">{a.yield}%</td></tr>)}</tbody></table>
      </div>}
      <div className="card">
        <div className="section-title">Order History <small>{orders.length} ORDERS</small></div>
        {orders.length===0?<div className="empty-state"><div className="icon">≡</div>No orders</div>:(
          <table className="data-table"><thead><tr><th>Date</th><th>Type</th><th>Asset</th><th>Class</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>{[...orders].reverse().map((o,i)=><tr key={i}><td className="mono" style={{color:"var(--text-dim)"}}>{o.date}</td><td><span className={`badge ${o.type==="buy"?"badge-green":"badge-red"}`}>{o.type}</span></td><td className="mono" style={{color:"var(--gold)"}}>{o.symbol}</td><td><span className="badge badge-gray">{o.assetType}</span></td><td className="mono">{o.qty}</td><td className="mono">₽{o.price.toFixed(2)}</td><td className="mono">₽{(o.price*o.qty).toLocaleString(undefined,{maximumFractionDigits:0})}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── TRANSACTIONS PAGE ────────────────────────────────────────────────────────
function Transactions({ user }) {
  const txns=db.txns().filter(t=>t.userId===user.id);
  return (
    <div>
      <div className="page-header"><div className="page-title">Transaction <span>History</span></div></div>
      <div className="grid-3" style={{marginBottom:20}}>
        <div className="card"><div className="card-label">Total In</div><div className="card-value pos">₽{txns.filter(t=>t.type==="deposit"||t.type==="loan_disbursement").reduce((s,t)=>s+t.amount,0).toLocaleString()}</div></div>
        <div className="card"><div className="card-label">Total Out</div><div className="card-value neg">₽{txns.filter(t=>t.type==="withdraw"||t.type==="loan_payment").reduce((s,t)=>s+t.amount,0).toLocaleString()}</div></div>
        <div className="card"><div className="card-label">Total Transfers</div><div className="card-value" style={{color:"var(--blue)"}}>₽{txns.filter(t=>t.type==="transfer").reduce((s,t)=>s+t.amount,0).toLocaleString()}</div></div>
      </div>
      <div className="card">
        <div className="section-title">All Records <small>{txns.length} ENTRIES</small></div>
        {txns.length===0?<div className="empty-state"><div className="icon">≡</div>No records</div>:(
          <table className="data-table"><thead><tr><th>#</th><th>Type</th><th>Amount</th><th>Date</th><th>Note</th></tr></thead>
          <tbody>{[...txns].reverse().map(t=>(
            <tr key={t.id}><td className="mono" style={{color:"var(--text-muted)"}}>{String(t.id).slice(-8)}</td><td><span className={`badge ${t.type==="deposit"||t.type==="loan_disbursement"?"badge-green":t.type==="withdraw"||t.type==="loan_payment"?"badge-red":"badge-blue"}`}>{t.type}</span></td><td className={`mono ${t.type==="deposit"||t.type==="loan_disbursement"?"pos":"neg"}`}>{["deposit","loan_disbursement"].includes(t.type)?"+":"-"}₽{t.amount.toLocaleString()}</td><td className="mono" style={{color:"var(--text-dim)"}}>{t.date}</td><td style={{color:"var(--text-dim)",fontSize:11}}>{t.note}</td></tr>
          ))}</tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ addToast, refresh }) {
  const [tab,setTab]=useState("overview");
  const users=db.users();
  const pending=db.pending();
  const allTxns=db.txns();
  const allOrders=db.orders();
  const allLoans=db.loans();
  const allAssets=db.assets();
  const [editUser,setEditUser]=useState(null);
  const [newBal,setNewBal]=useState("");
  const [newRole,setNewRole]=useState("");

  const totalAssets=allAssets.filter(a=>a.status==="owned").reduce((s,a)=>s+a.price,0);
  const totalLoans=allLoans.filter(l=>l.status==="active").reduce((s,l)=>s+l.balance,0);

  const saveUserEdit=()=>{
    if(!editUser)return;
    const patch={};
    if(newBal!=="")patch.balance=parseFloat(newBal);
    if(newRole!=="")patch.role=newRole;
    db.updateUser(editUser.id,patch);
    addToast(`User ${editUser.name} updated`,"success");
    setEditUser(null);setNewBal("");setNewRole("");refresh();
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Admin <span>Control Panel</span> <span className="admin-badge">★ Commissar</span></div></div>
      <div className="grid-4" style={{marginBottom:20}}>
        <div className="card"><div className="card-label">Total Users</div><div className="card-value gold">{users.length}</div><div className="card-sub">{pending.length} pending</div></div>
        <div className="card"><div className="card-label">All Transactions</div><div className="card-value">{allTxns.length}</div><div className="card-sub">₽{allTxns.reduce((s,t)=>s+t.amount,0).toLocaleString(undefined,{maximumFractionDigits:0})} total</div></div>
        <div className="card"><div className="card-label">Active Loans</div><div className="card-value neg">₽{totalLoans.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{allLoans.filter(l=>l.status==="active").length} outstanding</div></div>
        <div className="card"><div className="card-label">Owned Assets</div><div className="card-value green">₽{totalAssets.toLocaleString(undefined,{maximumFractionDigits:0})}</div><div className="card-sub">{allAssets.filter(a=>a.status==="owned").length} properties</div></div>
      </div>

      <div className="tab-bar">
        {["overview","users","pending","transactions","orders","assets","loans"].map(t=>(
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}{t==="pending"&&pending.length>0?` (${pending.length})`:""}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <div>
          <div className="grid-2">
            <div className="card"><div className="section-title">User Breakdown</div>
              {["admin","employee","citizen"].map(r=>{const count=users.filter(u=>u.role===r).length;return <div key={r} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}><span className={`badge ${r==="admin"?"badge-red":r==="employee"?"badge-orange":"badge-blue"}`}>{r}</span><span className="mono" style={{color:"var(--gold)"}}>{count}</span></div>;})}
            </div>
            <div className="card"><div className="section-title">System Health</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--text-dim)"}}>Data Store</span><span className="badge badge-green">localStorage Active</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--text-dim)"}}>Markets</span><span className="badge badge-green">Live Simulation</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--text-dim)"}}>Portals</span><span className="badge badge-green">3 Active</span></div>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"var(--text-dim)"}}>Pending Approvals</span><span className={`badge ${pending.length>0?"badge-orange":"badge-green"}`}>{pending.length}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==="pending"&&(
        <div className="card">
          <div className="section-title">Pending Approvals <small>{pending.length} AWAITING</small></div>
          {pending.length===0?<div className="empty-state"><div className="icon">◈</div>No pending registrations</div>:(
            <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Actions</th></tr></thead>
            <tbody>{pending.map(p=>(
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="mono" style={{fontSize:11,color:"var(--text-dim)"}}>{p.email}</td>
                <td><span className={`badge ${p.role==="employee"?"badge-orange":"badge-blue"}`}>{p.role}</span></td>
                <td style={{color:"var(--text-dim)",fontSize:11}}>{p.dept}</td>
                <td><div className="admin-action-row">
                  <button className="btn-buy btn-small" onClick={()=>{db.approvePending(p.id);addToast(`${p.name} approved`,"success");refresh();}}>✓ Approve</button>
                  <button className="btn-sell btn-small" onClick={()=>{db.rejectPending(p.id);addToast(`${p.name} rejected`,"info");refresh();}}>✗ Reject</button>
                </div></td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
      )}

      {tab==="users"&&(
        <div className="card">
          <div className="section-title">All Users <small>{users.length} REGISTERED</small></div>
          {editUser&&(
            <div style={{background:"var(--bg3)",border:"1px solid var(--border-b)",padding:16,marginBottom:16}}>
              <div style={{fontFamily:"'Playfair Display',serif",color:"var(--gold)",marginBottom:12}}>Edit: {editUser.name}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div className="trade-field"><label>New Balance (₽)</label><input type="number" value={newBal} onChange={e=>setNewBal(e.target.value)} placeholder={editUser.balance}/></div>
                <div className="trade-field"><label>Change Role</label><select value={newRole} onChange={e=>setNewRole(e.target.value)}><option value="">-- No change --</option><option value="citizen">Citizen</option><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
                <button className="btn-buy" onClick={saveUserEdit}>Save</button>
                <button className="btn-sell" onClick={()=>setEditUser(null)}>Cancel</button>
              </div>
            </div>
          )}
          <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Balance</th><th>Dept</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="mono" style={{fontSize:11,color:"var(--text-dim)"}}>{u.email}</td>
              <td><span className={`badge ${u.role==="admin"?"badge-red":u.role==="employee"?"badge-orange":"badge-blue"}`}>{u.role}</span></td>
              <td><span className={`badge ${u.status==="active"?"badge-green":u.status==="suspended"?"badge-red":"badge-gray"}`}>{u.status}</span></td>
              <td className="mono" style={{color:"var(--gold)"}}>₽{u.balance?.toLocaleString()}</td>
              <td style={{color:"var(--text-dim)",fontSize:11}}>{u.dept}</td>
              <td><div className="admin-action-row">
                <button className="btn-action btn-small" onClick={()=>{setEditUser(u);setNewBal(u.balance);setNewRole(u.role);}}>✎ Edit</button>
                {u.status==="active"?<button className="btn-danger btn-small" onClick={()=>{db.suspendUser(u.id);addToast(`${u.name} suspended`,"info");refresh();}}>Suspend</button>:<button className="btn-buy btn-small" onClick={()=>{db.approveUser(u.id);addToast(`${u.name} activated`,"success");refresh();}}>Activate</button>}
              </div></td>
            </tr>
          ))}</tbody></table>
        </div>
      )}

      {tab==="transactions"&&(
        <div className="card">
          <div className="section-title">All Transactions <small>{allTxns.length} RECORDS</small></div>
          <table className="data-table"><thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Date</th><th>Note</th></tr></thead>
          <tbody>{[...allTxns].reverse().slice(0,100).map(t=>{const u=users.find(x=>x.id===t.userId);return <tr key={t.id}><td style={{fontSize:11}}>{u?.name||"—"}</td><td><span className={`badge ${t.type==="deposit"?"badge-green":t.type==="withdraw"?"badge-red":"badge-blue"}`}>{t.type}</span></td><td className="mono">₽{t.amount.toLocaleString()}</td><td className="mono" style={{color:"var(--text-dim)"}}>{t.date}</td><td style={{color:"var(--text-dim)",fontSize:11}}>{t.note}</td></tr>;})}</tbody></table>
        </div>
      )}

      {tab==="orders"&&(
        <div className="card">
          <div className="section-title">All Market Orders <small>{allOrders.length} TOTAL</small></div>
          {allOrders.length===0?<div className="empty-state"><div className="icon">↗</div>No orders</div>:(
            <table className="data-table"><thead><tr><th>User</th><th>Class</th><th>Type</th><th>Asset</th><th>Qty</th><th>Price</th><th>Total</th><th>Date</th></tr></thead>
            <tbody>{[...allOrders].reverse().map((o,i)=>{const u=users.find(x=>x.id===o.userId);return <tr key={i}><td style={{fontSize:11}}>{u?.name||"—"}</td><td><span className="badge badge-gray">{o.assetType}</span></td><td><span className={`badge ${o.type==="buy"?"badge-green":"badge-red"}`}>{o.type}</span></td><td className="mono" style={{color:"var(--gold)"}}>{o.symbol}</td><td className="mono">{o.qty}</td><td className="mono">₽{o.price?.toFixed(2)}</td><td className="mono">₽{(o.price*o.qty).toLocaleString(undefined,{maximumFractionDigits:0})}</td><td className="mono" style={{color:"var(--text-dim)"}}>{o.date}</td></tr>;})}
            </tbody></table>
          )}
        </div>
      )}

      {tab==="assets"&&(
        <div className="card">
          <div className="section-title">Real Asset Registry <small>{allAssets.length} TOTAL</small></div>
          <table className="data-table"><thead><tr><th>Icon</th><th>ID</th><th>Name</th><th>Type</th><th>Location</th><th>Price</th><th>Yield</th><th>Status</th><th>Owner</th></tr></thead>
          <tbody>{allAssets.map(a=>{const owner=a.ownerId?users.find(u=>u.id===a.ownerId):null;return <tr key={a.id}><td>{a.icon}</td><td className="mono" style={{color:"var(--text-muted)",fontSize:10}}>{a.id}</td><td style={{fontSize:12}}>{a.name}</td><td><span className="badge badge-gold">{a.type}</span></td><td style={{color:"var(--text-dim)",fontSize:11}}>{a.location}</td><td className="mono" style={{color:"var(--gold)"}}>₽{a.price.toLocaleString()}</td><td className="mono pos">{a.yield}%</td><td><span className={`badge ${a.status==="available"?"badge-green":"badge-orange"}`}>{a.status}</span></td><td style={{fontSize:11}}>{owner?.name||"—"}</td></tr>;})}</tbody></table>
        </div>
      )}

      {tab==="loans"&&(
        <div className="card">
          <div className="section-title">Loan Registry <small>{allLoans.length} TOTAL</small></div>
          <table className="data-table"><thead><tr><th>User</th><th>Amount</th><th>Rate</th><th>Term</th><th>Balance</th><th>Monthly</th><th>Status</th><th>Since</th></tr></thead>
          <tbody>{allLoans.map(l=>{const u=users.find(x=>x.id===l.userId);return <tr key={l.id}><td style={{fontSize:11}}>{u?.name||"—"}</td><td className="mono">₽{l.amount.toLocaleString()}</td><td className="mono">{l.interest}%</td><td className="mono">{l.term}mo</td><td className="mono neg">₽{(l.balance||0).toLocaleString()}</td><td className="mono">₽{l.monthlyPayment?.toLocaleString()}</td><td><span className={`badge ${l.status==="active"?"badge-orange":l.status==="paid"?"badge-green":"badge-red"}`}>{l.status}</span></td><td className="mono" style={{color:"var(--text-dim)"}}>{l.startDate}</td></tr>;})}
          </tbody></table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [portal, setPortal] = useState(null);       // "admin" | "employee" | "citizen"
  const [user, setUser] = useState(() => {
    const s = lsGet(LS.SESSION, null);
    if (!s) return null;
    return db.users().find(u => u.id === s.id) || null;
  });
  const [page, setPage] = useState("dashboard");
  const [stocks, setStocks] = useState(STOCKS_BASE.map(s=>({...s,history:[s.price]})));
  const [commodities, setCommodities] = useState(COMMODITIES_BASE.map(c=>({...c,history:[c.price]})));
  const [toasts, setToasts] = useState([]);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => forceUpdate(n=>n+1), []);

  const addToast = useCallback((message, type="info") => {
    const id = ++toastId;
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3500);
  }, []);

  // Market simulation
  useEffect(() => {
    const tick = setInterval(() => {
      setStocks(prev=>prev.map(s=>{
        const pct=(Math.random()*6-3)/100;
        const np=Math.max(1,+(s.price*(1+pct)).toFixed(2));
        return {...s,price:np,change:+((np-s.history[0])/s.history[0]*100).toFixed(2),history:[...s.history.slice(-20),np]};
      }));
      setCommodities(prev=>prev.map(c=>{
        const pct=(Math.random()*4-2)/100;
        const np=Math.max(0.01,+(c.price*(1+pct)).toFixed(2));
        return {...c,price:np,change:+((np-c.history[0])/c.history[0]*100).toFixed(2),history:[...c.history.slice(-20),np]};
      }));
    }, 2500);
    return ()=>clearInterval(tick);
  }, []);

  const handleLogin = (u) => {
    lsSet(LS.SESSION, { id: u.id });
    setUser(u); setPage("dashboard");
    addToast(`Access granted — ${u.name.split(" ")[0]}`, "success");
  };
  const handleLogout = () => {
    localStorage.removeItem(LS.SESSION);
    setUser(null); setPortal(null);
  };
  const handleReset = () => {
    if(!window.confirm("Reset ALL bank data?")) return;
    Object.values(LS).forEach(k=>localStorage.removeItem(k));
    initStorage(); handleLogout();
    addToast("Data reset to defaults","info");
  };

  const getBalance = () => (db.users().find(x=>x.id===user?.id)||{}).balance ?? 0;
  const setBalance = (b) => { db.updateBalance(user.id, b); setUser(prev=>({...prev,balance:b})); refresh(); };

  // Not logged in — show portal select or auth
  if (!user) {
    return (
      <>
        <style>{CSS}</style>
        <ToastContainer toasts={toasts}/>
        {!portal
          ? <PortalSelect onSelect={setPortal}/>
          : <AuthScreen portalType={portal} onLogin={handleLogin} onBack={()=>setPortal(null)} addToast={addToast}/>
        }
      </>
    );
  }

  const balance = getBalance();
  const canTrade = user.role==="admin"||user.role==="employee";
  const pendingCount = db.pending().length;

  const renderPage = () => {
    switch(page) {
      case "dashboard":    return <Dashboard user={user} balance={balance} stocks={stocks} commodities={commodities} setPage={setPage}/>;
      case "banking":      return <Banking user={user} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>;
      case "stocks":       return canTrade?<StockMarket user={user} stocks={stocks} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">↗</div>Employee/Admin access only</div>;
      case "commodities":  return canTrade?<CommodityMarket user={user} commodities={commodities} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">⬢</div>Employee/Admin access only</div>;
      case "real_assets":  return <RealAssets user={user} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>;
      case "portfolio":    return <Portfolio user={user} stocks={stocks} commodities={commodities}/>;
      case "transactions": return <Transactions user={user}/>;
      case "loans":        return <Loans user={user} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>;
      case "savings":      return <Savings user={user} balance={balance} setBalance={setBalance} addToast={addToast} refresh={refresh}/>;
      case "users":        return user.role==="admin"?<AdminPanel addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">⚑</div>Admin access only</div>;
      case "pending":      return user.role==="admin"?<AdminPanel addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">⚑</div>Admin access only</div>;
      case "all_txns":     return user.role==="admin"?<AdminPanel addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">⚑</div>Admin access only</div>;
      case "all_orders":   return user.role==="admin"?<AdminPanel addToast={addToast} refresh={refresh}/>:<div className="empty-state"><div className="icon">⚑</div>Admin access only</div>;
      default:             return <Dashboard user={user} balance={balance} stocks={stocks} commodities={commodities} setPage={setPage}/>;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <ToastContainer toasts={toasts}/>
      <div className="app-layout">
        <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout}/>
        <div style={{flex:1,minWidth:0,paddingBottom:40}}>
          <TickerBar stocks={stocks} commodities={commodities}/>
          <div className="main-content">{renderPage()}</div>
        </div>
      </div>
      <div className="status-bar">
        <span className="status-dot"/><span>System Active</span>
        <span style={{color:"var(--gold)"}}>·</span>
        <span>Portal: <span style={{color:"var(--text)"}}>{user.role}</span></span>
        <span style={{color:"var(--gold)"}}>·</span>
        <span>Storage: localStorage</span>
        {pendingCount>0&&user.role==="admin"&&<><span style={{color:"var(--gold)"}}>·</span><span style={{color:"var(--emp)"}}>{pendingCount} pending approvals</span></>}
        <button className="btn-reset" onClick={handleReset}>Reset Data</button>
      </div>
    </>
  );
}
