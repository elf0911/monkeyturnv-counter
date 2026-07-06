const VERSION="v0.51";
const STORAGE_KEY="monkeyturnv-counter-v051";
const SETS=[1,2,4,5,6];

const DISPLAY=[
 ["games","総ゲーム数",false],["normalGames","通常ゲーム数",false],["atGames","ATゲーム数",false],["atHit","AT初当たり",false],
 ["fiveCoin","5枚役",false],["rare","レア小役",false],["direct","AT直撃",false],["rival","ライバルモード",false],
 ["chargeItem","激走チャージ中",false],["chargeVoice","激走チャージ終了時セリフ",false],["endingVoice","エンディング中サブ液晶",false],
 ["medal","SGメダル",false],["trophy","トロフィー",false],["ticket","舟券",false]
];
const SINGLE={
 games:{label:"総ゲーム数",unit:"G",game:true},normalGames:{label:"通常ゲーム数",unit:"G",game:true},atGames:{label:"ATゲーム数",unit:"G",game:true},
 atHit:{label:"AT初当たり",unit:"回",denom:"normalGames"},fiveCoin:{label:"5枚役",unit:"回",denom:"normalGames"}
};
const GROUPS=["rare","direct","rival","chargeItem","chargeVoice","endingVoice","medal","trophy","ticket"];
const GDEF={
 rare:{label:"レア小役",children:[["weakCherry","弱チェリー"],["strongCherry","強チェリー"],["weakChance","弱チャンス目"],["strongChance","強チャンス目"],["boat","ボート"]],rate:"normalGames"},
 direct:{label:"AT直撃",children:[["directWeak","弱チェ・ボート"],["directWeakChance","弱チャンス目"],["directStrong","強チェ・強チャンス目"],["directUnknown","契機不明"]]},
 rival:{label:"ライバルモード",children:[["rivalEnoki","榎木"],["rivalGamo","蒲生"],["rivalHamaoka","浜岡"]],percent:"atHit"},
 chargeItem:{label:"激走チャージ中",paired:true,children:[["chargeWeakCherry","弱チェリー"],["chargeStrongCherry","強チェリー"],["chargeWeakChance","弱チャンス目"],["chargeStrongChance","強チャンス目"],["chargeBoat","ボート"]]},
 chargeVoice:{label:"激走チャージ終了時セリフ",children:[["voiceCalm","落ち着くんだ"],["voiceSign","この気配は"],["voiceOtsukare","おつかれ"],["voiceTeio","これが艇王と…"]]},
 endingVoice:{label:"エンディング中サブ液晶",children:[["endIkeryze","波多野　いけるぜ",""],["endIkuyo","青島　いっくよ","blue"],["endIiKanji","波多野　いい感じ","blue"],["endYarujanai","アリサ　やるじゃない","green"],["endOtsukare","榎木　おつかれ","red"],["endTeio","榎木　これが艇王と…","red"],["endKitakita","青島　きたきたきた","red"],["endOmedeto","澄　おめでとう","red"]]},
 medal:{label:"SGメダル",children:[["medalBlack","黒"],["medalBlue","青"],["medalYellow","黄"],["medalRed","赤"],["medalRainbow","虹"]]},
 trophy:{label:"トロフィー",children:[["trophyBronze","銅"],["trophySilver","銀"],["trophyGold","金"],["trophyKerot","ケロット柄"],["trophyRainbow","虹"]]},
 ticket:{label:"舟券",children:[["ticketDefault","通常"],["ticketHigh","高設定示唆"],["ticketOver4","設定4以上"],["ticketOver5","設定5以上"],["ticketSix","設定6"]]}
};
const PUB={atHit:{label:"AT初当たり",values:{1:299.8,2:295.5,4:258.8,5:235.7,6:222.9}},fiveCoin:{label:"5枚役",values:{1:38.15,2:36.86,4:30.27,5:24.51,6:22.53}}};

const DEF={data:{games:0,normalGames:0,atGames:0,atHit:0,fiveCoin:0},visible:{},judgeUse:{},showImpact:false,step:{plus:500,minus:100},open:{},lastGames:["games","normalGames"]};
for(const [k,,fixed] of DISPLAY){DEF.visible[k]=!!fixed; DEF.judgeUse[k]=k==="atHit"||k==="fiveCoin";}
for(const [g,d] of Object.entries(GDEF)){if(d.paired){for(const [k] of d.children){DEF.data[k+"Hit"]=0;DEF.data[k+"Item"]=0}}else{for(const [k] of d.children)DEF.data[k]=0}}
let S=load(); let hold=null; let lastTouch=0;
document.addEventListener("touchend",e=>{let n=Date.now(); if(n-lastTouch<300)e.preventDefault(); lastTouch=n},{passive:false});
document.addEventListener("DOMContentLoaded",()=>{bind();S.open={};save();render()});
function $(id){return document.getElementById(id)}
function load(){try{return merge(structuredClone(DEF),JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}catch{return structuredClone(DEF)}}
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==="object")merge(a[k],b[k]);else a[k]=b[k]}return a}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(S))}
function bind(){
 $("settingsBtn").onclick=()=>screen("settings"); $("judgeBtn").onclick=()=>screen("judge");
 document.querySelectorAll(".back").forEach(b=>b.onclick=()=>screen(b.dataset.to));
 $("resetBtn").onclick=reset; $("useAll").onclick=()=>{for(const k in S.judgeUse)if(S.visible[k])S.judgeUse[k]=true;save();render()};
 $("useNone").onclick=()=>{for(const k in S.judgeUse)S.judgeUse[k]=false;save();render()};
 $("impactToggle").onchange=e=>{S.showImpact=e.target.checked;save();render()};
 $("plusStep").onchange=e=>{S.step.plus=+e.target.value;save();render()};
 $("minusStep").onchange=e=>{S.step.minus=+e.target.value;save();render()};
}
function screen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");render()}
function render(){home();settings();judge()}
function home(){let h="";["games","normalGames","atGames","atHit","fiveCoin"].forEach(k=>{if(S.visible[k])h+=row(k,SINGLE[k])});GROUPS.forEach(g=>{if(S.visible[g])h+=group(g)});$("homeList").innerHTML=h;dyn($("homeList"))}
function row(k,it,sub=false){let v=S.data[k]||0, r=it.denom?rate(v,S.data[it.denom]):"", cls=sub?"subrow":"row";let btn=it.game?`<button class="btn gamebtn" data-c="${k}" data-d="${S.step.plus}">＋${S.step.plus}</button><button class="btn gamebtn" data-c="${k}" data-d="-${S.step.minus}">－${S.step.minus}</button>`:`<button class="btn" data-c="${k}" data-d="1">＋</button><button class="btn" data-c="${k}" data-d="-1">－</button>`;return `<div class="${cls}" data-hold="${k}"><div class="top"><div class="name">${it.label}</div><div class="value">${v}${it.unit||"回"}</div>${btn}</div>${r?`<div class="rate">${r}</div>`:""}</div>`}
function group(g){let d=GDEF[g], open=S.open[g]?"open":"", total=gtotal(g), body=""; if(d.paired){body=d.children.map(([k,l])=>paired(k,l)).join("")}else{body=d.children.map(([k,l,c])=>{let sub=info(g,k), cc=c?` ${c}`:"";return `<div class="subrow" data-hold="${k}"><div class="top"><div class="name${cc}">${l}</div><div class="value">${S.data[k]||0}回</div><button class="btn" data-c="${k}" data-d="1">＋</button><button class="btn" data-c="${k}" data-d="-1">－</button></div>${sub?`<div class="subnote">${sub}</div>`:""}</div>`}).join("")}return `<div class="group ${open}"><button class="ghead" data-t="${g}"><span class="chev">${S.open[g]?"▼":"▶"}</span><span class="groupTitle">${d.label}</span><span class="gtotal">${total?total+"回":""}</span></button><div class="gbody">${body}</div></div>`}
function paired(k,l){let h=S.data[k+"Hit"]||0,i=S.data[k+"Item"]||0,p=h?trim(i/h*100,1)+"%":"-";return `<div class="subrow"><div class="name">${l}</div><div class="top" data-hold="${k}Hit"><div class="name subnote">成立</div><div class="value">${h}回</div><button class="btn" data-c="${k}Hit" data-d="1">＋</button><button class="btn" data-c="${k}Hit" data-d="-1">－</button></div><div class="top" data-hold="${k}Item"><div class="name subnote">獲得</div><div class="value">${i}回</div><button class="btn" data-c="${k}Item" data-d="1">＋</button><button class="btn" data-c="${k}Item" data-d="-1">－</button></div><div class="subnote">${p}</div></div>`}
function info(g,k){if(g==="rare")return rate(S.data[k]||0,S.data.normalGames);if(g==="rival")return pct(S.data[k]||0,S.data.atHit);if(g==="chargeVoice"&&(k==="voiceCalm"||k==="voiceSign")){let t=(S.data.voiceCalm||0)+(S.data.voiceSign||0);return t?trim((S.data[k]||0)/t*100,1)+"%":"-"}return ""}
function dyn(root){root.querySelectorAll("[data-c]").forEach(b=>b.onclick=e=>{e.stopPropagation();chg(b.dataset.c,+b.dataset.d)});root.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{S.open[b.dataset.t]=!S.open[b.dataset.t];save();render()});root.querySelectorAll("[data-hold]").forEach(el=>{["touchend","touchcancel","mouseup","mouseleave"].forEach(ev=>el.addEventListener(ev,cancel));el.addEventListener("touchstart",e=>{if(e.target.tagName==="BUTTON")return;start(el.dataset.hold)},{passive:true});el.addEventListener("mousedown",e=>{if(e.target.tagName==="BUTTON")return;start(el.dataset.hold)});el.addEventListener("contextmenu",e=>e.preventDefault())})}
function chg(k,d){S.data[k]=Math.max(0,(S.data[k]||0)+d);gameRel(k);save();render()}
function start(k){cancel();hold=setTimeout(()=>promptVal(k),550)}
function cancel(){if(hold)clearTimeout(hold);hold=null}
function promptVal(k){let v=prompt(`${label(k)}を入力`,String(S.data[k]||0));if(v===null)return;let n=Math.max(0,Math.floor(+v));if(Number.isFinite(n)){S.data[k]=n;gameRel(k);save();render()}}
function label(k){if(SINGLE[k])return SINGLE[k].label;for(const d of Object.values(GDEF)){if(d.paired){for(const [b,l] of d.children){if(k===b+"Hit")return l+" 成立";if(k===b+"Item")return l+" 獲得"}}else for(const [x,l] of d.children)if(x===k)return l}return k}
function gameRel(k){if(!["games","normalGames","atGames"].includes(k))return;S.lastGames=S.lastGames.filter(x=>x!==k);S.lastGames.push(k);if(S.lastGames.length>2)S.lastGames.shift();let [a,b]=S.lastGames,g=S.data.games||0,n=S.data.normalGames||0,at=S.data.atGames||0;if(!a||!b)return;if(a!=="games"&&b!=="games")S.data.games=n+at;if(a!=="normalGames"&&b!=="normalGames")S.data.normalGames=Math.max(0,g-at);if(a!=="atGames"&&b!=="atGames")S.data.atGames=Math.max(0,g-n)}
function settings(){let h=DISPLAY.map(([k,l,f])=>`<label class="setrow"><span>${l}</span><input type="checkbox" data-v="${k}" ${S.visible[k]?"checked":""} ${f?"disabled":""}></label>`).join("");$("settingList").innerHTML=h;$("settingList").querySelectorAll("[data-v]").forEach(c=>c.onchange=()=>{let k=c.dataset.v;S.visible[k]=c.checked;if(!c.checked)S.judgeUse[k]=false;save();render()});let opts=[50,100,150,200,250,300,500,1000].map(n=>`<option value="${n}">${n}</option>`).join("");$("plusStep").innerHTML=opts;$("minusStep").innerHTML=opts;$("plusStep").value=S.step.plus;$("minusStep").value=S.step.minus}
function judge(){$("impactToggle").checked=!!S.showImpact;bars();signals();jitems()}
function probs(){
let sc=Object.fromEntries(SETS.map(s=>[s,1]));
if(S.visible.atHit&&S.judgeUse.atHit)pois(sc,S.data.atHit||0,S.data.normalGames||0,PUB.atHit.values,.45);
if(S.visible.fiveCoin&&S.judgeUse.fiveCoin)pois(sc,S.data.fiveCoin||0,S.data.normalGames||0,PUB.fiveCoin.values,.55);
if(S.visible.direct&&S.judgeUse.direct)applyDirect(sc);
let allow=allowed();let hasRestrict=allow.length<SETS.length;
SETS.forEach(s=>{if(!allow.includes(s))sc[s]=0});
let sum=Object.values(sc).reduce((a,b)=>a+b,0)||1;
let raw=Object.fromEntries(SETS.map(s=>[s,sc[s]/sum*100]));
return hasRestrict?round(raw):floorRound(raw,1);
}

function applyDirect(sc){
  const strong=S.data.directStrong||0, weakChance=S.data.directWeakChance||0, weak=S.data.directWeak||0, unknown=S.data.directUnknown||0;
  const strongRate={1:.4,2:1.2,4:2.0,5:3.9,6:6.3};
  const weakChanceRate={1:.01,2:.01,4:.8,5:2.0,6:3.1};
  const weakRate={1:.01,2:.01,4:.4,5:.4,6:.4};
  const unknownRate={1:.4,2:1.0,4:1.8,5:2.8,6:3.8};
  for(const s of SETS){
    if(strong) sc[s]*=Math.pow(strongRate[s], strong*1.35);
    if(weakChance) sc[s]*=Math.pow(weakChanceRate[s], weakChance*1.6);
    if(weak) sc[s]*=Math.pow(weakRate[s], weak*1.4);
    if(unknown) sc[s]*=Math.pow(unknownRate[s], unknown*.45);
  }
}
function floorRound(raw,floorPct){
  const keys=Object.keys(raw);let out={};let fixed=0;let flex=[];
  for(const k of keys){if(raw[k]<=0){out[k]=0}else{out[k]=floorPct;fixed+=floorPct;flex.push(k)}}
  const remain=Math.max(0,100-fixed);const rawSum=flex.reduce((a,k)=>a+raw[k],0)||1;
  flex.forEach(k=>out[k]+=raw[k]/rawSum*remain);
  return round(out);
}

function pois(sc,c,den,r,w){if(!den)return;SETS.forEach(s=>{let lam=Math.max(den/r[s],1e-9);sc[s]*=Math.exp((c*Math.log(lam)-lam)*w)})}
function allowed(){let a=[1,2,4,5,6];
let o4=(S.data.medalRed||0)+(S.data.trophyGold||0)+(S.data.ticketOver4||0)+(S.data.directWeak||0)+(S.data.directWeakChance||0);
let o5=(S.data.ticketOver5||0);
let six=(S.data.medalRainbow||0)+(S.data.trophyRainbow||0)+(S.data.ticketSix||0)+(S.data.endOmedeto||0);
if(o4)a=a.filter(x=>x>=4);if(o5)a=a.filter(x=>x>=5);if(six)a=[6];return a}
function round(raw){let e=Object.entries(raw).map(([k,v])=>({k,f:Math.floor(v),r:v-Math.floor(v)}));let s=e.reduce((a,x)=>a+x.f,0);e.sort((a,b)=>b.r-a.r);for(let i=0;s<100&&i<e.length;i++,s++)e[i].f++;e.sort((a,b)=>+a.k-+b.k);return Object.fromEntries(e.map(x=>[x.k,x.f]))}
function bars(){let p=probs(),v=Object.values(p),mx=Math.max(...v),mn=Math.min(...v);$("bars").innerHTML=Object.entries(p).map(([s,x])=>`<div class="bar"><div>設定${s}</div><div class="track"><div class="fill ${x===mx?"max":x===mn?"min":""}" style="width:${Math.max(1,x)}%"></div></div><div>${x}%</div></div>`).join("")}
function signals(){let l=[];if((S.data.medalRainbow||0)+(S.data.trophyRainbow||0)+(S.data.ticketSix||0)+(S.data.endOmedeto||0))l.push("設定6確定");if((S.data.ticketOver5||0))l.push("設定5以上");if((S.data.medalRed||0)+(S.data.trophyGold||0)+(S.data.ticketOver4||0))l.push("設定4以上");if((S.data.voiceOtsukare||0)+(S.data.voiceTeio||0)+(S.data.endOtsukare||0)+(S.data.endTeio||0)+(S.data.endKitakita||0))l.push("強示唆入力あり");$("signals").classList.toggle("on",l.length>0);$("signals").innerHTML=l.length?`<div class="blockTitle">確定・示唆</div>${l.map(x=>`<div class="signal">${x}</div>`).join("")}`:""}
function jitems(){let keys=["atHit","fiveCoin",...GROUPS].filter(k=>S.visible[k]);$("judgeItems").innerHTML=keys.map(jitem).join("");$("judgeItems").querySelectorAll("[data-use]").forEach(c=>c.onchange=()=>{S.judgeUse[c.dataset.use]=c.checked;save();render()});$("judgeItems").querySelectorAll("[data-open]").forEach(el=>el.onclick=e=>{if(e.target.tagName==="INPUT")return;el.parentElement.classList.toggle("open")})}
function jitem(k){let checked=S.judgeUse[k]?"checked":"",title,main="-",near="",pub="";if(k==="atHit"||k==="fiveCoin"){let inf=PUB[k],c=S.data[k]||0,den=S.data.normalGames||0,rn=c&&den?den/c:null;title=inf.label;main=rn?`1/${trim(rn,1)}`:"-";near=rn?`（${nearest(rn,inf.values)}）`:"（-）";pub=Object.entries(inf.values).map(([s,v])=>`設定${s}　1/${v}`).join("<br>")}else{title=GDEF[k].label;main=gtotal(k)?`${gtotal(k)}回`:"-";pub=gtext(k)}let imp=S.showImpact?`<div class="starImpact">影響度 ${impactStars(k)}</div>`:"";return `<div class="jitem"><div class="jsum" data-open="${k}"><input type="checkbox" data-use="${k}" ${checked}><div><div class="jtitle">${title}</div><div class="jrate">${main}</div><div class="near">${near}</div>${imp}</div><div class="chev">▼</div></div><div class="pub">${pub}</div></div>`}
function gtext(g){let d=GDEF[g];if(d.paired)return d.children.map(([b,l])=>`${l}　${S.data[b+"Item"]||0}/${S.data[b+"Hit"]||0}　${S.data[b+"Hit"]?trim((S.data[b+"Item"]||0)/(S.data[b+"Hit"]||1)*100,1)+"%":"-"}`).join("<br>");return d.children.map(([k,l])=>`${l}　${S.data[k]||0}回`).join("<br>")}
function impactStars(k){const m={direct:5,fiveCoin:3,atHit:3,rival:2,chargeVoice:2,chargeItem:3,rare:1,endingVoice:3,medal:4,trophy:4,ticket:4};let n=m[k]||2;return "★★★★★".slice(0,n)+"☆☆☆☆☆".slice(0,5-n)}
function nearest(r,vals){let b=null,d=1e9;for(const [s,v] of Object.entries(vals)){let x=Math.abs(r-v);if(x<d){d=x;b=s}}return b?`設定${b}近似値`:"-"}
function gtotal(g){let d=GDEF[g];if(d.paired)return d.children.reduce((a,[k])=>a+(S.data[k+"Hit"]||0)+(S.data[k+"Item"]||0),0);return d.children.reduce((a,[k])=>a+(S.data[k]||0),0)}
function rate(c,d){return c&&d?`1/${trim(d/c,1)}`:"-"}function pct(c,d){return c&&d?`${trim(c/d*100,1)}%`:"-"}function trim(v,n){return Number(v.toFixed(n)).toString()}
function reset(){if(!confirm("現在の実戦データをリセットしますか？"))return;let keep={visible:structuredClone(S.visible),judgeUse:structuredClone(S.judgeUse),step:structuredClone(S.step),showImpact:S.showImpact};S=structuredClone(DEF);Object.assign(S,keep);save();render()}
if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker-v051.js").catch(()=>{});
