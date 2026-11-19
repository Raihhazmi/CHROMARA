
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const MIN=2,MAX=16;
function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();}
function mix(h1,h2,t){const a=hexToRgb(h1),b=hexToRgb(h2);return rgbToHex(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);}
function lum(h){const c=hexToRgb(h).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function hexToHsl(hex){const c=hexToRgb(hex).map(v=>v/255),r=c[0],g=c[1],b=c[2];
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;let h=0,s=0;
  if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);
    if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}
  return [h,s*100,l*100];}
function hslToHex(h,s,l){h=((h%360)+360)%360;s=clamp(s,0,100)/100;l=clamp(l,0,100)/100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return rgbToHex((r+m)*255,(g+m)*255,(b+m)*255);}
function forceLum(hex,target,dir){const hs=hexToHsl(hex);let l=hs[2];
  for(let i=0;i<90;i++){const c=hslToHex(hs[0],hs[1],l);const L=lum(c);
    if(dir==='down'?L<=target:L>=target)return c;
    l+=dir==='down'?-1.2:1.2;if(l<0||l>100)break;}
  return hslToHex(hs[0],hs[1],dir==='down'?0:100);}
const INK='#07131F';
const bestText=bg=>contrast(bg,'#FFFFFF')>=contrast(bg,INK)?'#FFFFFF':INK;
function readable(c,bg,target){if(contrast(c,bg)>=target)return c;
  const dir=contrast('#FFFFFF',bg)>=contrast(INK,bg)?'#FFFFFF':INK;let cur=c;
  for(let i=0;i<26&&contrast(cur,bg)<target;i++)cur=mix(cur,dir,.12);
  if(contrast(cur,bg)>=target)return cur;
  return contrast('#FFFFFF',bg)>=contrast(INK,bg)?'#FFFFFF':INK;}
const fmtR=r=>(Math.round(r*100)/100).toFixed(2);
const validHex=h=>/^#[0-9A-F]{6}$/i.test(h);
function normHex(v){v=String(v).trim();if(v[0]!=='#')v='#'+v;if(/^#[0-9A-F]{3}$/i.test(v))v='#'+v.slice(1).split('').map(c=>c+c).join('');return v.toUpperCase();}
function allocRound(w,total){const sum=w.reduce((a,b)=>a+b,0);const raw=sum>0?w.map(x=>x/sum*total):w.map(()=>total/w.length);
  const fl=raw.map(Math.floor);let rem=total-fl.reduce((a,b)=>a+b,0);
  const ord=raw.map((r,i)=>({i,f:r-fl[i]})).sort((a,b)=>b.f-a.f);
  for(let k=0;k<rem;k++)fl[ord[k%ord.length].i]++;return fl;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function parseColors(text){const out=[];let m;
  const h1=/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,h2=/\b([0-9a-fA-F]{6})\b/g,
        rg=/rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/g,
        hs=/hsla?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})%?\s*[, ]\s*(\d{1,3})%?/g;
  while((m=h1.exec(text)))out.push({i:m.index,v:normHex('#'+m[1])});
  if(!out.length)while((m=h2.exec(text)))out.push({i:m.index,v:normHex('#'+m[1])});
  while((m=rg.exec(text)))out.push({i:m.index,v:rgbToHex(+m[1],+m[2],+m[3])});
  while((m=hs.exec(text)))out.push({i:m.index,v:hslToHex(+m[1],+m[2],+m[3])});
  out.sort((a,b)=>a.i-b.i);return out.map(o=>o.v);}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'warna';
let uidN=0;const uid=()=>'c'+(++uidN)+Date.now().toString(36);

const LIB=[
{id:'chromara',c:'laut',n:'CHROMARA Ocean',h:['#1B365D','#005A9C','#60C1E5','#A0E0EF']},
{id:'mariana',c:'laut',n:'Palung Mariana',h:['#04101F','#0A2A43','#1C6E8C','#7FD1D8']},
{id:'reef',c:'laut',n:'Terumbu Karang',h:['#06304A','#0E7C7B','#FF7A5A','#FFD9C0']},
{id:'lagoon',c:'laut',n:'Laguna Biru',h:['#023047','#126E82','#51C4D3','#D8F3F5']},
{id:'biolum',c:'laut',n:'Bioluminesensi',h:['#03071E','#041E42','#00B4D8','#90E0EF']},
{id:'kelp',c:'laut',n:'Hutan Rumput Laut',h:['#0B2B26','#14524A','#3E8E7E','#C7E8CA']},
{id:'rainforest',c:'alam',n:'Hutan Hujan',h:['#081C15','#1B4332','#40916C','#B7E4C7']},
{id:'moss',c:'alam',n:'Lumut Pagi',h:['#1B2A21','#386641','#6A994E','#F2E8CF']},
{id:'sahara',c:'alam',n:'Gurun Sahara',h:['#3B2412','#8C5A2B','#D9A05B','#F5E1C0']},
{id:'autumn',c:'alam',n:'Musim Gugur',h:['#3A1F0B','#8C3B12','#D97706','#FDE68A']},
{id:'sakura',c:'alam',n:'Sakura',h:['#3D1B2E','#8C3A5C','#F2A7C3','#FDEEF4']},
{id:'lavender',c:'alam',n:'Lavender Provence',h:['#241B3A','#4C3A78','#9B8AC4','#EDE7F6']},
{id:'volcano',c:'alam',n:'Gunung Berapi',h:['#1A0F0F','#5C1A1A','#E4572E','#FFC857']},
{id:'aurora',c:'langit',n:'Aurora Borealis',h:['#050B23','#0B3D5C','#2EE6A8','#A7F3D0']},
{id:'dawn',c:'langit',n:'Fajar Banjarmasin',h:['#2A1A3E','#7B3F61','#F2836B','#FFD8A8']},
{id:'dusk',c:'langit',n:'Senja Ungu',h:['#1B1035','#4A2A6B','#B06AB3','#FFD3E0']},
{id:'storm',c:'langit',n:'Langit Badai',h:['#0F1620','#2C3E50','#7F8C9B','#D6DEE6']},
{id:'eclipse',c:'langit',n:'Gerhana',h:['#100A14','#3B1F2B','#C2452D','#F2B705']},
{id:'batik',c:'budaya',n:'Batik Pekalongan',h:['#2B1B12','#6B3E26','#C89B3C','#F2E3C6']},
{id:'tenun',c:'budaya',n:'Tenun Sumba',h:['#1F1410','#7A2E1E','#C7522A','#E8C39E']},
{id:'songket',c:'budaya',n:'Songket Palembang',h:['#2A0E1E','#7B1E3A','#D4AF37','#F7E7CE']},
{id:'wayang',c:'budaya',n:'Wayang Kulit',h:['#1B1208','#4A3418','#B8860B','#EFE0B9']},
{id:'ramadan',c:'budaya',n:'Ramadan Kareem',h:['#0B2A22','#14523F','#C9A227','#F3E9D2']},
{id:'hanbok',c:'budaya',n:'Hanbok',h:['#1B2A4A','#B23A48','#F2C14E','#FDF6E3']},
{id:'starry',c:'seni',n:'Malam Berbintang',h:['#0B132B','#1C3F94','#F2C230','#E8E6D9']},
{id:'hokusai',c:'seni',n:'Ombak Hokusai',h:['#12263A','#1D4E89','#7FA9C9','#F2E8DC']},
{id:'klimt',c:'seni',n:'Emas Klimt',h:['#1C1408','#6B4E16','#D4AF37','#F5E6B8']},
{id:'mondrian',c:'seni',n:'Mondrian',h:['#101010','#D7263D','#1B4FA0','#F2C230']},
{id:'bauhaus',c:'seni',n:'Bauhaus',h:['#141414','#D62828','#003F88','#F7B32B']},
{id:'artdeco',c:'seni',n:'Art Deco',h:['#0E1A17','#1F4E43','#C9A227','#EFE6D2']},
{id:'tokyo',c:'kota',n:'Neon Tokyo',h:['#0A0A12','#FF2E88','#00E5FF','#F5F5FA']},
{id:'santorini',c:'kota',n:'Santorini',h:['#0F2E4C','#1B6CA8','#8FC7E8','#FDFDFB']},
{id:'marrakech',c:'kota',n:'Marrakech',h:['#3A1E12','#A64B2A','#E08E45','#F3D9B1']},
{id:'nyc',c:'kota',n:'New York Malam',h:['#0B0C10','#1F2833','#66FCF1','#C5C6C7']},
{id:'floating',c:'kota',n:'Pasar Terapung',h:['#1B3A2F','#2F7D5C','#F2A93B','#F7E7C6']},
{id:'matcha',c:'rasa',n:'Matcha',h:['#1B2E1B','#3E6B3E','#A3C585','#F1F5E4']},
{id:'kopi',c:'rasa',n:'Kopi Tubruk',h:['#1A100C','#4A2C1D','#A9744F','#EADBC8']},
{id:'rendang',c:'rasa',n:'Rendang',h:['#2A1206','#7A2E0E','#C1440E','#E8B04B']},
{id:'klepon',c:'rasa',n:'Klepon',h:['#14301C','#2E7D32','#C9A227','#F5F0DC']},
{id:'berry',c:'rasa',n:'Sorbet Beri',h:['#2A0E2E','#7B1FA2','#FF6FA5','#FFE3F1']},
{id:'amethyst',c:'mineral',n:'Amethyst',h:['#1A0F2B','#4A2A7A','#9B6FD1','#EDE3FA']},
{id:'emerald',c:'mineral',n:'Emerald',h:['#04231A','#0B6E4F','#34D399','#D1FAE5']},
{id:'ruby',c:'mineral',n:'Ruby',h:['#2A0510','#8C0F2E','#E0245E','#FFD9E2']},
{id:'sapphire',c:'mineral',n:'Sapphire',h:['#061539','#123A8C','#3E7BFA','#D6E4FF']},
{id:'obsidian',c:'mineral',n:'Obsidian',h:['#0A0A0C','#1C1C22','#4A4A55','#C9C9D4']},
{id:'vapor',c:'retro',n:'Vaporwave',h:['#1B0B3B','#FF3CAC','#21D4FD','#F9F871']},
{id:'synth',c:'retro',n:'Synthwave',h:['#12002E','#7A04EB','#FF2079','#00F0FF']},
{id:'cyber',c:'retro',n:'Cyberpunk',h:['#0D0221','#FF2A6D','#05D9E8','#D1F7FF']},
{id:'terminal',c:'retro',n:'Terminal Hijau',h:['#030A05','#0B3D14','#22C55E','#B7F7C2']},
{id:'gameboy',c:'retro',n:'Game Boy',h:['#0F380F','#306230','#8BAC0F','#9BBC0F']},
{id:'amber',c:'retro',n:'Amber CRT',h:['#120A02','#4A2A05','#F59E0B','#FFE7A3']},
{id:'duoink',c:'minimal',n:'Duo Tinta',h:['#101418','#F2F5F7']},
{id:'duogold',c:'minimal',n:'Duo Emas',h:['#14100A','#F5B84A','#FFF3D6']},
{id:'triadpop',c:'minimal',n:'Tiga Pop',h:['#121212','#FF2E63','#08D9D6']},
{id:'duosea',c:'minimal',n:'Duo Laut',h:['#062A33','#5FE3C0']},
{id:'triwarm',c:'minimal',n:'Tiga Hangat',h:['#2A1206','#C1440E','#F5EAD0']},
{id:'sixcandy',c:'retro',n:'Enam Permen',h:['#2B0A3D','#FF3CAC','#FF9E4A','#F9F871','#21D4FD','#7CFF6B']}
];
const CATS=['all','laut','alam','langit','budaya','seni','kota','rasa','mineral','retro','minimal'];
const CATN={all:'Semua',laut:'Laut',alam:'Alam',langit:'Langit',budaya:'Budaya',seni:'Seni',kota:'Kota',rasa:'Rasa',mineral:'Mineral',retro:'Retro & Neon',minimal:'Minimal 2–3'};
const ROLE_KEYS=['bg','surface','text','accent','accent2'];
const ROLE_N={bg:'Background',surface:'Surface',text:'Teks',accent:'Aksen',accent2:'Aksen 2'};

const DEFAULT_PREVIEW={name:'Alex Morgan',role:'Product Designer · Creative Developer',
  bio:'Merancang pengalaman digital yang sederhana, bermanfaat, dan menyenangkan untuk digunakan.',
  status:'Terbuka untuk proyek',email:'hello@example.com'};
const PREVIEW_FONTS={
  jakarta:'"Plus Jakarta Sans",system-ui,sans-serif',
  space:'"Space Grotesk",system-ui,sans-serif',
  mono:'"JetBrains Mono",ui-monospace,monospace',
  serif:'Georgia,"Times New Roman",serif',
  system:'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
};
const DEFAULT_PREVIEW_STYLE={font:'jakarta',text:null,heading:null,cardBg:null,cardText:null};
const PREVIEW_LIMITS={name:60,role:100,bio:240,status:48,email:120};
const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const KEY='chromara-v1';
function defColors(){return [
  {id:uid(),name:'Palung',hex:'#1B365D',share:60,lock:false},
  {id:uid(),name:'Arus',hex:'#005A9C',share:20,lock:false},
  {id:uid(),name:'Ombak',hex:'#60C1E5',share:10,lock:false},
  {id:uid(),name:'Buih',hex:'#A0E0EF',share:10,lock:false}];}
const DEF={colors:defColors(),theme:'dark',device:'desktop',balance:true,autoRoles:true,auto:true,grain:true,motion:true,sel:0,
  roles:{bg:0,surface:1,text:3,accent:2,accent2:1},preset:'classic',
  gen:{h:205,s:72,l:52,harmony:'analog',spread:32,depth:46,count:4,seed:7},preview:{...DEFAULT_PREVIEW},
  previewStyle:{...DEFAULT_PREVIEW_STYLE},
  lib:{q:'',cat:'all'}};
let state=JSON.parse(JSON.stringify(DEF));
let undoStack=[];
try{
  const raw=localStorage.getItem(KEY);
  if(raw){const s=JSON.parse(raw);
    if(s&&Array.isArray(s.colors)&&s.colors.length>=MIN&&s.colors.length<=MAX&&s.colors.every(c=>c&&validHex(c.hex))){
      state.colors=s.colors.map((c,i)=>({id:String(c.id||uid()),name:String(c.name||('Warna '+(i+1))).slice(0,24),hex:normHex(c.hex),share:clamp(Math.round(+c.share||0),0,100),lock:!!c.lock}));}
    if(s&&(s.theme==='dark'||s.theme==='light'))state.theme=s.theme;
    if(s&&(s.device==='desktop'||s.device==='mobile'))state.device=s.device;
    ['balance','autoRoles','auto','grain','motion'].forEach(k=>{if(s&&typeof s[k]==='boolean')state[k]=s[k];});
    if(s&&typeof s.sel==='number')state.sel=clamp(s.sel|0,0,state.colors.length-1);
    if(s&&s.roles)ROLE_KEYS.forEach(k=>{if(typeof s.roles[k]==='number')state.roles[k]=clamp(s.roles[k]|0,0,state.colors.length-1);});
    if(s&&typeof s.preset==='string')state.preset=s.preset;
    if(s&&s.preview&&typeof s.preview==='object'){
      Object.keys(PREVIEW_LIMITS).forEach(k=>{if(typeof s.preview[k]==='string')state.preview[k]=s.preview[k].slice(0,PREVIEW_LIMITS[k]);});
      if(!validEmail(state.preview.email))state.preview.email=DEFAULT_PREVIEW.email;
    }
    if(s&&s.previewStyle&&typeof s.previewStyle==='object'){
      const style=s.previewStyle;
      if(Object.prototype.hasOwnProperty.call(PREVIEW_FONTS,style.font))state.previewStyle.font=style.font;
      ['text','heading','cardBg','cardText'].forEach(k=>{
        if(style[k]===null)state.previewStyle[k]=null;
        else if(typeof style[k]==='string'&&validHex(style[k]))state.previewStyle[k]=normHex(style[k]);
      });
    }
    if(s&&s.gen){const g=s.gen;
      ['h','s','l','spread','depth','seed'].forEach(k=>{if(typeof g[k]==='number')state.gen[k]=g[k];});
      state.gen.h=clamp(state.gen.h,0,360);state.gen.s=clamp(state.gen.s,0,100);state.gen.l=clamp(state.gen.l,0,100);
      state.gen.spread=clamp(state.gen.spread,6,120);state.gen.depth=clamp(state.gen.depth,12,80);
      if(['analog','comp','split','triad','tetra','mono','free'].includes(g.harmony))state.gen.harmony=g.harmony;
      if(typeof g.count==='number')state.gen.count=clamp(g.count|0,MIN,MAX);}
    if(s&&s.lib){if(typeof s.lib.q==='string')state.lib.q=s.lib.q;if(CATS.includes(s.lib.cat))state.lib.cat=s.lib.cat;}
  }else if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)state.motion=false;
}catch(e){}
let saveT=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function queueSave(){clearTimeout(saveT);saveT=setTimeout(save,250);}
function snapshot(){undoStack.push(JSON.parse(JSON.stringify({colors:state.colors,roles:state.roles,sel:state.sel,preset:state.preset})));if(undoStack.length>12)undoStack.shift();}
function doUndo(){const s=undoStack.pop();if(!s)return;state.colors=s.colors;state.roles=s.roles;state.sel=clamp(s.sel,0,s.colors.length-1);state.preset=s.preset;
  rebuildDynamic();requestUpdate();renderCandidates();toast('Dikembalikan.','info');}

const toastsEl=$('#toasts');
function toast(msg,type,action){
  type=type||'ok';
  while(toastsEl.children.length>=3)toastsEl.firstChild.remove();
  const el=document.createElement('div');el.className='toast '+type;
  el.appendChild(document.createElement('i'));
  const sp=document.createElement('span');sp.textContent=msg;el.appendChild(sp);
  if(action){const b=document.createElement('button');b.className='toast-act';b.type='button';b.textContent=action.label;
    b.addEventListener('click',()=>{action.fn();el.remove();});el.appendChild(b);}
  toastsEl.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),320);},action?5200:2600);
}
function copyText(txt,ok){
  const fb=()=>{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();
    let done=false;try{done=document.execCommand('copy');}catch(e){}ta.remove();toast(done?ok:'Gagal menyalin — salin manual dari kode.',done?'ok':'warn');};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>toast(ok,'ok')).catch(fb);else fb();
}
function download(name,content,mime){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),800);toast('File diunduh: '+name,'info');
}

const n=()=>state.colors.length;
const hexes=()=>state.colors.map(c=>c.hex);
function normShares(){const s=state.colors.reduce((a,c)=>a+c.share,0);return s>0?state.colors.map(c=>c.share/s*100):state.colors.map(()=>100/n());}
function rankOf(i){const order=state.colors.map((c,j)=>({j,s:c.share})).sort((a,b)=>b.s-a.s);return order.findIndex(o=>o.j===i);}
function rankName(i){const r=rankOf(i);return r===0?'Dominan':r===1?'Sekunder':'Aksen '+(r-1);}
function rebalanceAll(){
  if(!state.balance)return;
  let lockedSum=state.colors.reduce((a,c)=>a+(c.lock?c.share:0),0);
  if(lockedSum>100){state.colors.forEach(c=>c.lock=false);lockedSum=0;}
  const free=state.colors.map((c,i)=>c.lock?-1:i).filter(i=>i>=0);
  if(!free.length)return;
  const target=100-lockedSum;
  const al=allocRound(free.map(i=>Math.max(state.colors[i].share,0)||1),target);
  free.forEach((i,k)=>state.colors[i].share=al[k]);
}
function setShare(i,v){
  v=clamp(Math.round(v),0,100);
  if(!state.balance){state.colors[i].share=v;state.preset='custom';requestUpdate();return;}
  const lockedOthers=state.colors.reduce((a,c,j)=>a+(j!==i&&c.lock?c.share:0),0);
  v=Math.min(v,100-lockedOthers);
  const free=state.colors.map((c,j)=>(j!==i&&!c.lock)?j:-1).filter(j=>j>=0);
  const rest=100-lockedOthers-v;
  if(free.length){const al=allocRound(free.map(j=>Math.max(state.colors[j].share,0)||1),rest);free.forEach((j,k)=>state.colors[j].share=al[k]);}
  state.colors[i].share=v;state.preset='custom';requestUpdate();
}
function autoAssignRoles(){
  const N=n();const hs=hexes();
  const byL=hs.map((h,i)=>({i,l:lum(h)})).sort((a,b)=>a.l-b.l).map(o=>o.i);
  const byS=hs.map((h,i)=>({i,s:hexToHsl(h)[1]})).sort((a,b)=>b.s-a.s).map(o=>o.i);
  const dark=state.theme==='dark';
  const bg=dark?byL[0]:byL[N-1];
  const surface=dark?(byL[1]!==undefined?byL[1]:bg):(byL[N-2]!==undefined?byL[N-2]:bg);
  const text=dark?byL[N-1]:byL[0];
  const pickAccent=ex=>{for(const i of byS)if(ex.indexOf(i)<0)return i;for(const i of byL)if(ex.indexOf(i)<0)return i;return byS[0];};
  const accent=pickAccent([bg,text]);
  const accent2=pickAccent([bg,text,accent]);
  state.roles={bg,surface,text,accent,accent2};
}
function clampRoles(){ROLE_KEYS.forEach(k=>state.roles[k]=clamp(state.roles[k]|0,0,n()-1));}
function presetShares(kind,N){
  if(kind==='balanced')return allocRound(Array(N).fill(1),100);
  if(kind==='pyramid')return allocRound(Array.from({length:N},(_,i)=>Math.pow(2,N-1-i)),100);
  if(kind==='accent'){const w=[10].concat(Array.from({length:N-1},(_,i)=>i===0?3:1));return allocRound(w,100);}
  if(kind==='duo'){const w=Array(N).fill(0);w[0]=1;w[1]=1;return allocRound(w,100);}
  const w=[9].concat(Array.from({length:N-1},(_,i)=>Math.max(1,4-i)));return allocRound(w,100);
}
function applyPreset(kind){
  const al=presetShares(kind,n());
  state.colors.forEach((c,i)=>{if(!c.lock)c.share=al[i];});
  state.preset=kind;rebalanceAll();requestUpdate();
}
function makeColor(i,hex){return {id:uid(),name:'Warna '+(i+1),hex:normHex(hex),share:10,lock:false};}
function nextHex(i){
  const last=state.colors[state.colors.length-1];
  const hs=last?hexToHsl(last.hex):[205,70,50];
  return hslToHex(hs[0]+28*(i+1),clamp(hs[1]+(i%2?8:-6),15,95),clamp(hs[2]+(i%2?12:-10),8,92));
}
function setCount(v){
  const N=clamp(Math.round(v)||MIN,MIN,MAX);
  if(N===n())return;
  snapshot();
  if(N>n()){const old=n();for(let i=old;i<N;i++)state.colors.push(makeColor(i,nextHex(i-old)));}
  else state.colors.length=N;
  state.sel=clamp(state.sel,0,N-1);
  rebalanceAll();clampRoles();
  if(state.autoRoles)autoAssignRoles();
  state.preset='custom';
  rebuildDynamic();requestUpdate();renderCandidates();
  toast('Jumlah warna: '+N,'info',{label:'Urungkan',fn:doUndo});
}
function addColor(){if(n()>=MAX){toast('Maksimal '+MAX+' warna.','warn');return;}setCount(n()+1);}
function removeColor(i){
  if(n()<=MIN){toast('Minimal '+MIN+' warna.','warn');return;}
  snapshot();state.colors.splice(i,1);
  state.sel=clamp(state.sel,0,n()-1);
  rebalanceAll();clampRoles();if(state.autoRoles)autoAssignRoles();
  state.preset='custom';
  rebuildDynamic();requestUpdate();renderCandidates();
  toast('Warna dihapus.','warn',{label:'Urungkan',fn:doUndo});
}
function setColor(i,hex){state.colors[i].hex=normHex(hex);if(state.autoRoles)autoAssignRoles();requestUpdate();}
function setName(i,name){state.colors[i].name=String(name).slice(0,24)||('Warna '+(i+1));requestUpdate();}
function applyPalette(hs,name){
  if(!hs||hs.length<MIN)return;
  snapshot();
  const arr=hs.slice(0,MAX);
  state.colors=arr.map((h,i)=>({id:uid(),name:(name?name+' '+(i+1):'Warna '+(i+1)).slice(0,24),hex:normHex(h),share:0,lock:false}));
  const al=presetShares('classic',arr.length);
  state.colors.forEach((c,i)=>c.share=al[i]);
  state.sel=0;state.preset='classic';
  clampRoles();if(state.autoRoles)autoAssignRoles();
  rebuildDynamic();requestUpdate();renderCandidates();
  toast('Palet diterapkan: '+(name||'Custom')+' · '+arr.length+' warna','ok',{label:'Urungkan',fn:doUndo});
}
function randomizeStudio(){
  snapshot();
  const hs=hexes();
  for(let i=hs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=hs[i];hs[i]=hs[j];hs[j]=t;}
  state.colors.forEach((c,i)=>{c.hex=hs[i];c.lock=false;});
  const al=allocRound(state.colors.map((_,i)=>i===0?6:.4+Math.random()*1.6),100);
  state.colors.forEach((c,i)=>c.share=al[i]);
  state.preset='custom';if(state.autoRoles)autoAssignRoles();
  requestUpdate();toast('Warna & porsi diacak.','info',{label:'Urungkan',fn:doUndo});
}
function resetAll(){
  snapshot();
  const gen=state.gen,lib=state.lib;
  state=JSON.parse(JSON.stringify(DEF));
  state.colors=defColors();state.gen=gen;state.lib=lib;
  rebuildDynamic();requestUpdate();renderCandidates();
  toast('Kembali ke palet CHROMARA Ocean.','ok',{label:'Urungkan',fn:doUndo});
}
function importColors(){
  const parsed=parseColors($('#importText').value);
  if(parsed.length<MIN){toast('Butuh minimal '+MIN+' warna valid.','warn');return;}
  const used=parsed.slice(0,MAX);
  applyPalette(used,'Impor');
  if(parsed.length>MAX)toast('Hanya '+MAX+' warna pertama dipakai.','info');
}

function harmonyHues(h,kind,sp,rnd){
  switch(kind){
    case 'analog':return Array.from({length:state.gen.count},(_,i)=>h+(i-(state.gen.count-1)/2)*sp);
    case 'comp':return Array.from({length:state.gen.count},(_,i)=>h+(i%2?180:0));
    case 'split':return Array.from({length:state.gen.count},(_,i)=>i===0?h:h+180+(i%2?sp:-sp));
    case 'triad':return Array.from({length:state.gen.count},(_,i)=>h+(i%3)*120);
    case 'tetra':return Array.from({length:state.gen.count},(_,i)=>h+(i%4)*90);
    case 'mono':return Array(state.gen.count).fill(h);
    default:return Array.from({length:state.gen.count},()=>h+rnd()*360);
  }
}
function makeCandidate(i){
  const g=state.gen,rnd=mulberry32((g.seed*1000+i*77)|0);
  const jit=g.harmony==='mono'?0:(rnd()-.5)*14;
  const base=(g.h+jit+i*(g.harmony==='free'?37:4))%360;
  const hues=harmonyHues(base,g.harmony,g.spread,rnd);
  const l0=clamp(g.l-g.depth/2,5,90),step=g.depth/Math.max(1,g.count-1);
  return hues.map((h,k)=>hslToHex(h,clamp(g.s+(rnd()*20-10)-k*2,8,97),clamp(l0+step*k+(rnd()*6-3),4,96)));
}
function universeRandom(){
  state.gen.h=Math.floor(Math.random()*360);
  state.gen.s=45+Math.floor(Math.random()*50);
  state.gen.l=35+Math.floor(Math.random()*35);
  const kinds=['analog','comp','split','triad','tetra','mono','free'];
  state.gen.harmony=kinds[Math.floor(Math.random()*kinds.length)];
  state.gen.spread=12+Math.floor(Math.random()*80);
  state.gen.depth=28+Math.floor(Math.random()*46);
  state.gen.count=MIN+Math.floor(Math.random()*(MAX-MIN+1));
  state.gen.seed=Math.floor(Math.random()*99999);
  applyPalette(makeCandidate(0),'Semesta');
  renderCandidates();
}

function chromeVars(){
  const hs=hexes();
  const byL=hs.slice().sort((a,b)=>lum(a)-lum(b));
  const byS=hs.slice().sort((a,b)=>hexToHsl(b)[1]-hexToHsl(a)[1]);
  const bh=hexToHsl(byL[0]),lh=hexToHsl(byL[byL.length-1]),ah=hexToHsl(byS[0]),a2=hexToHsl(byS[1]||byS[0]);
  const seed=(h,s,l)=>hslToHex(h,clamp(s,14,88),l);
  if(state.theme==='dark'){
    const bg=forceLum(seed(bh[0],bh[1]*.6,26),.028,'down');
    const accent=forceLum(seed(ah[0],Math.max(ah[1],52),60),.45,'up');
    return{bg,bg2:forceLum(seed(bh[0],bh[1]*.6,30),.046,'down'),surface:forceLum(seed(bh[0],bh[1]*.55,34),.064,'down'),
      overlay:forceLum(seed(bh[0],bh[1]*.5,38),.088,'down'),border:forceLum(seed(bh[0],bh[1]*.4,46),.14,'down'),
      track:forceLum(seed(bh[0],bh[1]*.4,50),.18,'down'),text:forceLum(seed(bh[0],Math.min(bh[1],30),86),.78,'up'),
      heading:forceLum(seed(bh[0],Math.min(bh[1],24),93),.9,'up'),muted:forceLum(seed(bh[0],Math.min(bh[1],36),64),.42,'up'),
      accent,accent2:forceLum(seed(a2[0],Math.max(a2[1],45),46),.22,'up'),onAccent:bestText(accent),
      hg1:accent,hg2:'#F5B84A',navBg:bg+'DE',shadow:'0 24px 58px -26px rgba(0,0,0,.75)'};
  }
  const bg=forceLum(seed(lh[0],Math.min(lh[1],46),92),.93,'up');
  const accent=forceLum(seed(ah[0],Math.max(ah[1],55),40),.16,'down');
  return{bg,bg2:forceLum(seed(lh[0],Math.min(lh[1],50),88),.87,'up'),surface:forceLum(seed(lh[0],Math.min(lh[1],55),84),.8,'up'),
    overlay:forceLum(seed(lh[0],Math.min(lh[1],60),80),.72,'up'),border:forceLum(seed(lh[0],Math.min(lh[1],45),72),.6,'up'),
    track:forceLum(seed(lh[0],Math.min(lh[1],45),70),.56,'up'),text:forceLum(seed(bh[0],Math.min(bh[1],62),22),.06,'down'),
    heading:forceLum(seed(bh[0],Math.min(bh[1],66),16),.035,'down'),muted:forceLum(seed(bh[0],Math.min(bh[1],46),38),.15,'down'),
    accent,accent2:forceLum(seed(a2[0],Math.max(a2[1],45),50),.3,'down'),onAccent:bestText(accent),
    hg1:accent,hg2:'#B8860B',navBg:bg+'DE',shadow:'0 24px 48px -26px rgba(20,40,70,.3)'};
}
function previewVars(){
  const hs=hexes(),r=state.roles;
  const cBg=hs[r.bg],cSf=hs[r.surface],cTx=hs[r.text],cAc=hs[r.accent],cA2=hs[r.accent2];
  let v;
  if(state.theme==='dark'){
    v={bg:cBg,surface:mix(cBg,cSf,.35),overlay:mix(cBg,cSf,.55),text:cTx,heading:mix(cTx,'#FFFFFF',.3),muted:mix(cTx,cBg,.35),border:mix(cTx,cBg,.85),accent:cAc,accent2:cA2};
  }else{
    const light=hs.slice().sort((a,b)=>lum(b)-lum(a))[0];
    const bg=mix(light,'#FFFFFF',.86);
    v={bg,surface:mix(light,'#FFFFFF',.6),overlay:mix(light,'#FFFFFF',.5),text:cTx,heading:cTx,muted:mix(cTx,bg,.3),border:mix(cTx,bg,.85),accent:cAc,accent2:cA2};
  }
  const rawText=v.text,rawHead=v.heading,rawMuted=v.muted;
  if(state.auto){v.text=readable(v.text,v.bg,4.5);v.heading=readable(v.heading,v.bg,4.5);v.muted=readable(v.muted,v.bg,4.5);
    v.link=readable(v.accent,v.bg,4.5);v.onAccent=bestText(v.accent);}
  else{v.link=v.accent;v.onAccent=cTx;}
  v.rawAccent=cAc;v.linkFixed=v.link!==cAc;v.textFixed=v.text!==rawText||v.heading!==rawHead||v.muted!==rawMuted;
  return v;
}
function badgeFor(r){if(r>=7)return{c:'b-ok',t:'AAA'};if(r>=4.5)return{c:'b-ok',t:'AA'};if(r>=3)return{c:'b-warn',t:'AA Besar'};return{c:'b-danger',t:'Gagal'};}

const root=document.documentElement,body=document.body,pvFrame=$('#pvFrame');
function setVars(el,m){for(const k in m)el.style.setProperty(k,m[k]);}
const palGrid=$('#palGrid'),ratioBar=$('#ratioBar');
let cardRefs=[],barRefs=[],cardSig='';
const svgLock='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const svgCopy='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const svgTrash='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>';
function rebuildDynamic(){cardSig='';barRefs=[];syncCards(true);syncRoleSelects(true);syncCountChips();}
function syncCards(force){
  const sig=state.colors.map(c=>c.id).join('|');
  if(force||sig!==cardSig){
    cardSig=sig;cardRefs=[];palGrid.innerHTML='';
    state.colors.forEach((c,i)=>{
      const card=document.createElement('div');card.className='card pcard';
      card.innerHTML='<button type="button" class="psw"><span class="phex"></span><span class="prank"></span></button>'+
        '<div class="pbody"><div class="prow"><b class="pname"></b><output class="ppct"></output></div>'+
        '<input type="range" class="pshare" min="0" max="100" step="1">'+
        '<div class="pfoot"><input type="color" aria-label="Pilih warna"><button type="button" class="mini-b lock" aria-label="Kunci porsi">'+svgLock+'</button>'+
        '<button type="button" class="mini-b copy" aria-label="Salin hex">'+svgCopy+'</button>'+
        '<button type="button" class="mini-b del" aria-label="Hapus warna">'+svgTrash+'</button></div></div>';
      const sw=card.querySelector('.psw'),sl=card.querySelector('.pshare'),pk=card.querySelector('input[type="color"]'),
            lk=card.querySelector('.lock'),cp=card.querySelector('.copy'),dl=card.querySelector('.del');
      sw.addEventListener('click',()=>{state.sel=i;requestUpdate();});
      sl.addEventListener('input',()=>setShare(i,+sl.value));
      pk.addEventListener('input',()=>setColor(i,pk.value));
      lk.addEventListener('click',()=>{state.colors[i].lock=!state.colors[i].lock;requestUpdate();});
      cp.addEventListener('click',()=>copyText(state.colors[i].hex,state.colors[i].hex+' tersalin!'));
      dl.addEventListener('click',()=>removeColor(i));
      palGrid.appendChild(card);
      cardRefs.push({card,sw,hex:card.querySelector('.phex'),rank:card.querySelector('.prank'),name:card.querySelector('.pname'),
        pct:card.querySelector('.ppct'),sl,pk,lk});
    });
    ratioBar.innerHTML='';barRefs=[];
    state.colors.forEach(()=>{const seg=document.createElement('div');seg.className='rb-seg';seg.innerHTML='<span></span>';
      ratioBar.appendChild(seg);barRefs.push({seg,label:seg.querySelector('span')});});
  }
}
function syncRoleSelects(force){
  ROLE_KEYS.forEach(k=>{
    const sel=$('#role'+k.charAt(0).toUpperCase()+k.slice(1));
    if(force||sel.options.length!==n()){
      sel.innerHTML='';state.colors.forEach((c,i)=>{const o=document.createElement('option');o.value=i;sel.appendChild(o);});
    }
    Array.from(sel.options).forEach((o,i)=>{o.textContent=(i+1)+'. '+state.colors[i].name+' · '+state.colors[i].hex;});
    sel.value=state.roles[k];
  });
}
function syncCountChips(){
  const wrap=$('#countChips');
  if(wrap.children.length)return;
  [2,3,4,5,6,8,12,16].forEach(v=>{const b=document.createElement('button');b.type='button';b.className='cchip';b.textContent=v;b.dataset.n=v;
    b.addEventListener('click',()=>setCount(v));wrap.appendChild(b);});
}
function updatePreviewContent(){
  const p=state.preview,name=p.name.trim()||DEFAULT_PREVIEW.name;
  const initials=name.split(/\s+/).slice(0,2).map(part=>Array.from(part)[0].toUpperCase()).join('')||'AM';
  $('#pvInitials').textContent=initials;
  $('#pvAvatar').textContent=initials;
  $('#pvName').textContent=name;
  $('#pvRole').textContent=p.role||DEFAULT_PREVIEW.role;
  $('#pvBio').textContent=p.bio||DEFAULT_PREVIEW.bio;
  $('#pvStatus').textContent=p.status||DEFAULT_PREVIEW.status;
  const email=validEmail(p.email)?p.email:DEFAULT_PREVIEW.email;
  const mailLink=$('#pvEmail');
  mailLink.textContent=email;
  mailLink.href='mailto:'+email;
  Object.keys(PREVIEW_LIMITS).forEach(k=>{
    const field=$('[data-preview="'+k+'"]');
    if(document.activeElement!==field)field.value=p[k];
  });
}
function update(){
  const cv=chromeVars(),pv=previewVars(),norm=normShares(),N=n();
  setVars(root,{'--bg':cv.bg,'--bg2':cv.bg2,'--surface':cv.surface,'--overlay':cv.overlay,'--border':cv.border,'--track':cv.track,
    '--text':cv.text,'--heading':cv.heading,'--muted':cv.muted,'--accent':cv.accent,'--accent2':cv.accent2,'--on-accent':cv.onAccent,
    '--nav-bg':cv.navBg,'--hg1':cv.hg1,'--hg2':cv.hg2,'--shadow':cv.shadow});
  state.colors.slice(0,4).forEach((c,i)=>root.style.setProperty('--c'+i,c.hex));
  const meta=$('meta[name="theme-color"]');if(meta)meta.setAttribute('content',cv.bg);
  body.dataset.theme=state.theme;
  body.classList.toggle('no-grain',!state.grain);body.classList.toggle('no-motion',!state.motion);
  const previewStyle=state.previewStyle;
  setVars(pvFrame,{'--pv-font':PREVIEW_FONTS[previewStyle.font]||PREVIEW_FONTS.jakarta,'--pv-bg':pv.bg,'--pv-surface':pv.surface,
    '--pv-card-bg':previewStyle.cardBg||pv.surface,'--pv-overlay':pv.overlay,'--pv-text':previewStyle.text||pv.text,'--pv-heading':previewStyle.heading||pv.heading,
    '--pv-muted':previewStyle.text||pv.muted,'--pv-border':pv.border,'--pv-accent':pv.accent,'--pv-accent2':pv.accent2,'--pv-on-accent':pv.onAccent,'--pv-link':pv.link});
  if(previewStyle.cardText)pvFrame.style.setProperty('--pv-card-text',previewStyle.cardText);
  else pvFrame.style.removeProperty('--pv-card-text');
  const automaticColors={text:pv.text,heading:pv.heading,cardBg:pv.surface,cardText:pv.text};
  $$('[data-preview-style]').forEach(field=>{
    const key=field.dataset.previewStyle;
    const value=key==='font'?previewStyle.font:(previewStyle[key]||automaticColors[key]);
    if(document.activeElement!==field)field.value=value;
  });
  pvFrame.classList.toggle('mobile',state.device==='mobile');

  syncCards(false);
  state.colors.forEach((c,i)=>{
    const R=cardRefs[i],ink=bestText(c.hex);
    R.card.classList.toggle('sel',state.sel===i);
    R.sw.style.background=c.hex;R.hex.textContent=c.hex;R.hex.style.color=ink;
    R.rank.textContent=rankName(i);
    R.name.textContent=c.name;R.pct.textContent=c.share+'%';
    if(document.activeElement!==R.sl)R.sl.value=c.share;
    R.sl.style.setProperty('--p',c.share+'%');R.sl.style.setProperty('--rowc',c.hex);
    R.sl.setAttribute('aria-label','Porsi '+c.name);
    if(document.activeElement!==R.pk)R.pk.value=c.hex;
    R.lk.classList.toggle('on',c.lock);R.lk.setAttribute('aria-pressed',String(c.lock));
    const B=barRefs[i];
    B.seg.style.width=norm[i]+'%';B.seg.style.background=c.hex;
    B.seg.title=c.name+' · '+c.hex+' · '+c.share+'%';
    B.label.textContent=c.share+'%';B.label.style.color=ink;
    B.seg.classList.toggle('slim',norm[i]<7);
  });

  const sum=state.colors.reduce((a,c)=>a+c.share,0),tc=$('#totalChip');
  tc.textContent='Σ '+sum+'%';tc.classList.toggle('warn',sum!==100);
  tc.title=sum!==100?'Total ≠ 100% — bar dinormalisasi':'';
  $('#countInput').value=N;
  $$('#countChips .cchip').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.n===N)));
  $('#presetSelect').value=state.preset==='custom'?'classic':state.preset;

  state.sel=clamp(state.sel,0,N-1);
  const sc=state.colors[state.sel],hsl=hexToHsl(sc.hex),ink=bestText(sc.hex);
  const ep=$('#edPreview');ep.style.background=sc.hex;ep.style.color=ink;
  $('#edName').textContent=sc.name;$('#edHex').textContent=sc.hex;
  const slH=$('#slH'),slS=$('#slS'),slL=$('#slL');
  if(document.activeElement!==slH)slH.value=Math.round(hsl[0]);
  if(document.activeElement!==slS)slS.value=Math.round(hsl[1]);
  if(document.activeElement!==slL)slL.value=Math.round(hsl[2]);
  slH.style.setProperty('--p',(hsl[0]/360*100)+'%');
  slS.style.setProperty('--p',hsl[1]+'%');slS.style.setProperty('--rowc',hslToHex(hsl[0],100,50));
  slL.style.setProperty('--p',hsl[2]+'%');slL.style.setProperty('--rowc',sc.hex);
  $('#outH').textContent=Math.round(hsl[0])+'°';$('#outS').textContent=Math.round(hsl[1])+'%';$('#outL').textContent=Math.round(hsl[2])+'%';
  if(document.activeElement!==$('#edPicker'))$('#edPicker').value=sc.hex;
  if(document.activeElement!==$('#edHexIn'))$('#edHexIn').value=sc.hex;
  if(document.activeElement!==$('#edNameIn'))$('#edNameIn').value=sc.name;
  $('#edLock').checked=sc.lock;

  syncRoleSelects(false);
  $('#balanceSw').checked=state.balance;$('#rolesSw').checked=state.autoRoles;$('#autoSw').checked=state.auto;
  $('#grainSw').checked=state.grain;$('#motionSw').checked=state.motion;
  $$('#themeSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.thm===state.theme)));
  $$('#deviceSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dev===state.device)));
  $('#themeBtn').setAttribute('aria-pressed',String(state.theme==='light'));

  updatePreviewContent();
  renderRing(norm,sum);
  renderChecks(pv);renderRecs(pv);renderExports(pv);renderMatrix();
  $('#pvRatio').textContent='© 2026 '+(state.preview.name.trim()||DEFAULT_PREVIEW.name)+' · CHROMARA · '+N+' warna · '+state.colors.map(c=>c.share).join('·');
  queueSave();
}
let pending=false;
function requestUpdate(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update();});}

function renderRing(norm,sum){
  const R=86,C=2*Math.PI*R;let off=0,arcs='';
  state.colors.forEach((c,i)=>{
    const len=norm[i]/100*C;
    arcs+='<circle cx="110" cy="110" r="'+R+'" fill="none" stroke="'+c.hex+'" stroke-width="26" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 110 110)"><title>'+esc(c.name)+' · '+c.share+'%</title></circle>';
    off+=len;
  });
  $('#heroRing').innerHTML='<svg viewBox="0 0 220 220" role="img" aria-label="Cincin rasio warna">'+
    '<circle cx="110" cy="110" r="'+R+'" fill="none" stroke="var(--track)" stroke-width="26"/>'+arcs+
    '<circle cx="110" cy="110" r="62" fill="var(--bg2)" stroke="var(--border)"/></svg>';
  $('#ringCount').textContent=n();
  $('#ringTotal').textContent=sum+'%';
  const dom=state.colors.reduce((a,c)=>Math.max(a,c.share),0);
  $('#ringDom').textContent=dom+'%';
  $('#ringRoles').textContent=ROLE_KEYS.length;
}
let matrixSig='';
function renderMatrix(){
  const hs=hexes();const sig=hs.join('|');
  if(sig===matrixSig)return;matrixSig=sig;
  const pairs=[];
  for(let i=0;i<hs.length;i++)for(let j=i+1;j<hs.length;j++)pairs.push({i,j,r:contrast(hs[i],hs[j])});
  pairs.sort((a,b)=>b.r-a.r);
  $('#pairCount').textContent='· '+pairs.length+' pasangan';
  $('#matrix').innerHTML=pairs.map(p=>{const b=badgeFor(p.r);
    return '<div class="card mx-card"><div class="mx-pair"><span class="mx-dots"><i style="background:'+hs[p.i]+'"></i><i style="background:'+hs[p.j]+'"></i></span>'+
      '<b>'+esc(state.colors[p.i].name)+' × '+esc(state.colors[p.j].name)+'</b></div><div class="mx-ratio">'+fmtR(p.r)+'<small> : 1</small></div>'+
      '<span class="badge '+b.c+'">'+b.t+'</span></div>';}).join('');
}
function renderChecks(pv){
  const rows=[{l:'Teks di atas background',f:pv.text,b:pv.bg,s:'Aa',fx:pv.textFixed&&state.auto},
    {l:'Link aksen di atas background',f:pv.link,b:pv.bg,s:'tautan',fx:pv.linkFixed&&state.auto},
    {l:'Teks di atas tombol aksen',f:pv.onAccent,b:pv.accent,s:'Tombol',fx:state.auto}];
  $('#checks').innerHTML=rows.map(r=>{const c=contrast(r.f,r.b),b=badgeFor(c);
    return '<div class="chk-row"><span class="chk-sample" style="background:'+r.b+';color:'+r.f+'">'+r.s+'</span>'+
      '<div class="chk-meta"><b>'+r.l+'</b><span>'+(r.fx?'disesuaikan otomatis':'')+'</span></div>'+
      '<div class="chk-right"><span class="r">'+fmtR(c)+':1</span><span class="badge '+b.c+'">'+b.t+'</span></div></div>';}).join('');
}
function renderRecs(pv){
  const hs=hexes();let best=null;
  hs.forEach((c,i)=>{const r=contrast(c,pv.bg);if(!best||r>best.r)best={i,r};});
  const accR=contrast(pv.rawAccent,pv.bg),accOk=accR>=4.5;
  const dom=state.colors.reduce((a,c)=>Math.max(a,c.share),0),balOk=dom>=45;
  const ok='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 7"/></svg>';
  const wn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 21h20Z"/><path d="M12 10v5M12 18v.5"/></svg>';
  const inf='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>';
  const lines=[{k:'ok',x:'Teks terbaik di atas background: '+state.colors[best.i].name+' — '+fmtR(best.r)+':1.'},
    {k:accOk?'ok':'warn',x:accOk?'Aksen '+state.colors[state.roles.accent].name+' kuat sebagai teks ('+fmtR(accR)+':1).':'Aksen '+state.colors[state.roles.accent].name+' lemah sebagai teks ('+fmtR(accR)+':1) — auto-kontras memperbaikinya.'},
    {k:balOk?'ok':'warn',x:balOk?'Distribusi sehat: satu raja, pendukung jelas, aksen hemat.':'Dominanmu di bawah 45% — hierarki mulai kabur.'}];
  if(n()>8)lines.push({k:'info',x:'Lebih dari 8 warna aktif. Untuk UI utama, 3–6 warna biasanya lebih tenang; sisanya jadikan aksen kecil.'});
  if(n()<=3)lines.push({k:'info',x:'Palet minimalis '+n()+' warna — kontras dan hierarki jadi sangat bergantung pada terang-gelap.'});
  $('#recs').innerHTML=lines.map(l=>'<div class="rec-line '+l.k+'">'+(l.k==='ok'?ok:l.k==='warn'?wn:inf)+'<span>'+esc(l.x)+'</span></div>').join('');
}

function renderGenerator(){
  const g=state.gen;
  const gh=$('#gH'),gs=$('#gS'),gl=$('#gL'),gp=$('#gSpread'),gd=$('#gDepth');
  if(document.activeElement!==gh)gh.value=g.h;
  if(document.activeElement!==gs)gs.value=g.s;
  if(document.activeElement!==gl)gl.value=g.l;
  if(document.activeElement!==gp)gp.value=g.spread;
  if(document.activeElement!==gd)gd.value=g.depth;
  gh.style.setProperty('--p',(g.h/360*100)+'%');
  gs.style.setProperty('--p',g.s+'%');gs.style.setProperty('--rowc',hslToHex(g.h,100,50));
  gl.style.setProperty('--p',g.l+'%');gl.style.setProperty('--rowc',hslToHex(g.h,g.s,50));
  gp.style.setProperty('--p',((g.spread-6)/114*100)+'%');
  gd.style.setProperty('--p',((g.depth-12)/68*100)+'%');
  $('#gOutH').textContent=g.h+'°';$('#gOutS').textContent=g.s+'%';$('#gOutL').textContent=g.l+'%';
  $('#gOutSpread').textContent=g.spread+'°';$('#gOutDepth').textContent=g.depth+'%';
  const baseHex=hslToHex(g.h,g.s,g.l);
  $('#genSw').style.background=baseHex;
  if(document.activeElement!==$('#gPicker'))$('#gPicker').value=baseHex;
  if(document.activeElement!==$('#gHex'))$('#gHex').value=baseHex;
  $('#gHarmony').value=g.harmony;
  const gc=$('#gCount');
  if(gc.options.length!==MAX-MIN+1){gc.innerHTML='';for(let i=MIN;i<=MAX;i++){const o=document.createElement('option');o.value=i;o.textContent=i+' warna';gc.appendChild(o);}}
  gc.value=g.count;
}
function renderCandidates(){
  renderGenerator();
  const grid=$('#candGrid');grid.innerHTML='';
  const g=state.gen;
  $('#candHint').textContent=g.count+' warna per kandidat — klik untuk memakai.';
  for(let i=0;i<6;i++){
    const hs=makeCandidate(i);
    const c=document.createElement('div');c.className='cand';
    c.innerHTML='<div class="bands">'+hs.map(h=>'<i style="background:'+h+';flex:1"></i>').join('')+'</div>'+
      '<div class="cand-body"><span class="cn">#'+(i+1)+' · '+g.count+' warna</span>'+
      '<button type="button" class="btn btn-p btn-xs">Pakai</button>'+
      '<button type="button" class="mini-b copy" aria-label="Salin">'+svgCopy+'</button></div>';
    c.querySelector('.btn').addEventListener('click',()=>applyPalette(hs,'Harmoni'));
    c.querySelector('.copy').addEventListener('click',()=>copyText(hs.join(', '),'Tersalin ke clipboard!'));
    grid.appendChild(c);
  }
}
function renderLibrary(){
  const q=state.lib.q.trim().toLowerCase();
  const list=LIB.filter(p=>{
    if(state.lib.cat!=='all'&&p.c!==state.lib.cat)return false;
    if(!q)return true;
    return (p.n+' '+CATN[p.c]+' '+p.h.join(' ')).toLowerCase().indexOf(q)>=0;
  });
  const grid=$('#libGrid');
  if(!list.length){grid.innerHTML='<div class="empty">Tidak ada palet yang cocok. Coba kata lain atau bangkitkan yang baru.</div>';}
  else grid.innerHTML=list.map(p=>
    '<article class="card lib-card" data-id="'+p.id+'"><div class="bands">'+p.h.map(h=>'<i style="background:'+h+'"></i>').join('')+'</div>'+
    '<div class="lib-body"><div class="lib-top"><b>'+esc(p.n)+'</b><span class="lib-cat">'+CATN[p.c]+' · '+p.h.length+'</span></div>'+
    '<div class="lib-hex">'+p.h.map(h=>'<span>'+h+'</span>').join('')+'</div>'+
    '<div class="lib-actions"><button type="button" class="btn btn-p btn-xs" data-act="apply">Pakai</button>'+
    '<button type="button" class="mini-b" data-act="copy" aria-label="Salin">'+svgCopy+'</button></div></div></article>').join('');
  $$('#catRow .cat-chip').forEach(b=>{
    const c=b.dataset.cat;b.setAttribute('aria-pressed',String(state.lib.cat===c));
    b.querySelector('span').textContent=CATN[c];
    b.querySelector('b').textContent=c==='all'?LIB.length:LIB.filter(p=>p.c===c).length;
  });
}
function buildCats(){
  const row=$('#catRow');row.innerHTML='';
  CATS.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='cat-chip';b.dataset.cat=c;b.setAttribute('aria-pressed','false');
    b.innerHTML='<span></span><b></b>';
    b.addEventListener('click',()=>{state.lib.cat=c;renderLibrary();queueSave();});
    row.appendChild(b);});
}

let expTab='css';const expCache={css:'',tw:'',json:'',svg:''};
const EXP={css:{f:'chromara.css',m:'text/css;charset=utf-8'},tw:{f:'tailwind.config.js',m:'text/javascript;charset=utf-8'},
  json:{f:'chromara.json',m:'application/json;charset=utf-8'},svg:{f:'chromara-card.svg',m:'image/svg+xml;charset=utf-8'}};
function renderExports(pv){
  const N=n(),rs=state.colors.map(c=>c.share).join('-');
  const used={};
  const varNames=state.colors.map((c,i)=>{let s=slug(c.name);if(used[s])s=s+'-'+(i+1);used[s]=1;return s;});
  let css='/* ═══ CHROMARA · '+N+' warna · rasio '+rs+' ═══\n   Tema '+state.theme+' · auto-kontras '+(state.auto?'on':'off')+' */\n:root{\n';
  state.colors.forEach((c,i)=>{css+='  --'+varNames[i]+': '+c.hex+'; /* '+c.share+'%'+(c.lock?' · terkunci':'')+' */\n';});
  css+='\n  /* peran pratinjau */\n';
  ROLE_KEYS.forEach(k=>{css+='  --role-'+k+': var(--'+varNames[state.roles[k]]+');\n';});
  css+='\n  /* turunan */\n';
  [['bg',pv.bg],['surface',pv.surface],['overlay',pv.overlay],['text',pv.text],['heading',pv.heading],['muted',pv.muted],['border',pv.border],['accent',pv.accent],['accent-2',pv.accent2],['on-accent',pv.onAccent],['link',pv.link]].forEach(p=>css+='  --'+p[0]+': '+p[1]+';\n');
  css+='}\n';expCache.css=css;
  let tw='/** tailwind.config.js — CHROMARA · '+N+' warna · '+rs+' */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n';
  state.colors.forEach((c,i)=>{tw+='        '+varNames[i].replace(/-/g,'_')+": '"+c.hex+"', // "+c.share+'%\n';});
  tw+='        chromara: {\n';
  [['bg',pv.bg],['surface',pv.surface],['text',pv.text],['muted',pv.muted],['border',pv.border],['accent',pv.accent],['accent2',pv.accent2],['on-accent',pv.onAccent],['link',pv.link]].forEach(p=>{tw+="          '"+p[0]+"': '"+p[1]+"',\n";});
  tw+='        }\n      }\n    }\n  }\n}\n';expCache.tw=tw;
  const js={name:'CHROMARA',generated:new Date().toISOString().slice(0,10),count:N,ratio:rs,theme:state.theme,autoContrast:state.auto,
    colors:state.colors.map((c,i)=>({name:c.name,hex:c.hex,share:c.share,locked:c.lock,variable:'--'+varNames[i]})),
    roles:{},derived:{bg:pv.bg,surface:pv.surface,text:pv.text,muted:pv.muted,border:pv.border,accent:pv.accent,accent2:pv.accent2,onAccent:pv.onAccent,link:pv.link}};
  ROLE_KEYS.forEach(k=>js.roles[k]=state.colors[state.roles[k]].hex);
  expCache.json=JSON.stringify(js,null,2);
  const norm=normShares(),W=1200,H=630,M=64,gap=8,area=W-M*2,top=170,ch=330;
  let x=M,cols='';
  state.colors.forEach((c,i)=>{
    const w=Math.max(0,norm[i]/100*area-gap),ink=bestText(c.hex);
    let inner='';
    if(w>70){
      inner+='<text x="'+(x+16)+'" y="'+(top+50)+'" font-family="JetBrains Mono, monospace" font-size="30" font-weight="700" fill="'+ink+'">'+c.share+'%</text>'+
        '<text x="'+(x+16)+'" y="'+(top+ch-50)+'" font-family="Space Grotesk, Arial, sans-serif" font-size="19" font-weight="700" fill="'+ink+'">'+esc(c.name)+'</text>'+
        '<text x="'+(x+16)+'" y="'+(top+ch-26)+'" font-family="JetBrains Mono, monospace" font-size="14" fill="'+ink+'" opacity=".85">'+c.hex+'</text>';
    }
    cols+='<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+ch+'" rx="13" fill="'+c.hex+'"/>'+inner;
    x+=norm[i]/100*area;
  });
  expCache.svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+
    '<rect width="'+W+'" height="'+H+'" fill="'+pv.bg+'"/>'+
    '<text x="'+M+'" y="86" font-family="Space Grotesk, Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="4" fill="'+pv.heading+'">CHROM<tspan fill="'+pv.accent+'">ARA</tspan></text>'+
    '<text x="'+M+'" y="122" font-family="JetBrains Mono, monospace" font-size="19" fill="'+pv.muted+'">'+N+' warna  ·  '+state.colors.map(c=>c.share).join(' · ')+'  ·  tema '+state.theme+'</text>'+cols+
    '<text x="'+M+'" y="'+(H-52)+'" font-family="JetBrains Mono, monospace" font-size="16" fill="'+pv.muted+'">60-30-10 → bebas · Studio Rasio Warna</text>'+
    '<text x="'+(W-M)+'" y="'+(H-52)+'" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="16" fill="'+pv.link+'">CHROMARA.id</text></svg>';
  $('#expCode').textContent=expCache[expTab==='svg'?'css':expTab];
  $('#svgStage').innerHTML=expCache.svg;
  $('#expFile').textContent=EXP[expTab].f;
  $('#expCode').hidden=expTab==='svg';$('#svgWrap').hidden=expTab!=='svg';
}

/* events */
$('#countMinus').addEventListener('click',()=>setCount(n()-1));
$('#countPlus').addEventListener('click',()=>setCount(n()+1));
$('#countInput').addEventListener('change',e=>setCount(+e.target.value));
$('#addColorBtn').addEventListener('click',addColor);
$('#navAddBtn').addEventListener('click',()=>{addColor();$('#studio').scrollIntoView({behavior:state.motion?'smooth':'auto'});
  $('#navLinks').classList.remove('open');$('#menuBtn').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');});
$('#presetSelect').addEventListener('change',e=>applyPreset(e.target.value));
$('#balanceSw').addEventListener('change',e=>{state.balance=e.target.checked;if(state.balance){rebalanceAll();toast('Total dikunci ke 100%.','info');}else toast('Kunci dibuka — total bebas.','info');requestUpdate();});
$('#rolesSw').addEventListener('change',e=>{state.autoRoles=e.target.checked;if(state.autoRoles)autoAssignRoles();requestUpdate();});
$('#autoSw').addEventListener('change',e=>{state.auto=e.target.checked;requestUpdate();});
$('#grainSw').addEventListener('change',e=>{state.grain=e.target.checked;requestUpdate();});
$('#motionSw').addEventListener('change',e=>{state.motion=e.target.checked;if(!state.motion)$$('.reveal').forEach(el=>el.classList.add('in'));requestUpdate();});
ROLE_KEYS.forEach(k=>{
  $('#role'+k.charAt(0).toUpperCase()+k.slice(1)).addEventListener('change',e=>{
    state.roles[k]=clamp(+e.target.value,0,n()-1);state.autoRoles=false;requestUpdate();});
});
$$('#themeSeg button').forEach(b=>b.addEventListener('click',()=>{state.theme=b.dataset.thm;if(state.autoRoles)autoAssignRoles();requestUpdate();}));
$$('#deviceSeg button').forEach(b=>b.addEventListener('click',()=>{state.device=b.dataset.dev;requestUpdate();}));
$('#themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';if(state.autoRoles)autoAssignRoles();requestUpdate();});
$('#resetBtn').addEventListener('click',resetAll);
$('#randomBtn').addEventListener('click',randomizeStudio);
$('#removeSelBtn').addEventListener('click',()=>removeColor(state.sel));
$('#exportBtn').addEventListener('click',()=>$('#ekspor').scrollIntoView({behavior:state.motion?'smooth':'auto'}));
$$('[data-preview]').forEach(field=>field.addEventListener('input',()=>{
  const key=field.dataset.preview,value=field.value.slice(0,PREVIEW_LIMITS[key]);
  if(key==='email'&&!validEmail(value)){field.setAttribute('aria-invalid','true');$('#pvEmailError').hidden=false;return;}
  field.removeAttribute('aria-invalid');
  if(key==='email')$('#pvEmailError').hidden=true;
  state.preview[key]=value;
  requestUpdate();
}));
$('#previewDummyBtn').addEventListener('click',()=>{
  state.preview={...DEFAULT_PREVIEW};
  $$('[data-preview]').forEach(field=>field.removeAttribute('aria-invalid'));
  $('#pvEmailError').hidden=true;
  requestUpdate();
  toast('Data pratinjau kembali ke contoh.','info');
});
$$('[data-preview-style]').forEach(field=>field.addEventListener(field.type==='color'?'input':'change',()=>{
  const key=field.dataset.previewStyle;
  if(key==='font'){
    if(Object.prototype.hasOwnProperty.call(PREVIEW_FONTS,field.value))state.previewStyle.font=field.value;
  }else if(validHex(field.value)){
    state.previewStyle[key]=normHex(field.value);
  }
  requestUpdate();
}));
$('#previewStyleReset').addEventListener('click',()=>{
  state.previewStyle={...DEFAULT_PREVIEW_STYLE};
  requestUpdate();
  toast('Gaya pratinjau kembali mengikuti palet.','info');
});

function editSel(h,s,l){const cur=hexToHsl(state.colors[state.sel].hex);setColor(state.sel,hslToHex(h===null?cur[0]:h,s===null?cur[1]:s,l===null?cur[2]:l));}
$('#slH').addEventListener('input',e=>editSel(+e.target.value,null,null));
$('#slS').addEventListener('input',e=>editSel(null,+e.target.value,null));
$('#slL').addEventListener('input',e=>editSel(null,null,+e.target.value));
$('#edPicker').addEventListener('input',e=>setColor(state.sel,e.target.value));
$('#edHexIn').addEventListener('change',e=>{const v=normHex(e.target.value);
  if(validHex(v))setColor(state.sel,v);else{toast('Hex tidak valid — contoh: #005A9C','warn');e.target.value=state.colors[state.sel].hex;}});
$('#edNameIn').addEventListener('input',e=>setName(state.sel,e.target.value));
$('#edLock').addEventListener('change',e=>{state.colors[state.sel].lock=e.target.checked;requestUpdate();});
$('#edCopy').addEventListener('click',()=>copyText(state.colors[state.sel].hex,state.colors[state.sel].hex+' tersalin!'));
const dropBtn=$('#edDrop');
if(!('EyeDropper' in window))dropBtn.style.display='none';
dropBtn.addEventListener('click',()=>{
  if(!('EyeDropper' in window)){toast('EyeDropper tidak didukung browser ini.','warn');return;}
  try{new window.EyeDropper().open().then(r=>setColor(state.sel,r.sRGBHex)).catch(()=>{});}catch(e){toast('EyeDropper tidak didukung browser ini.','warn');}
});

const menuBtn=$('#menuBtn'),navLinks=$('#navLinks');
menuBtn.addEventListener('click',()=>{const o=navLinks.classList.toggle('open');menuBtn.classList.toggle('open',o);menuBtn.setAttribute('aria-expanded',String(o));});
$$('#navLinks a').forEach(a=>a.addEventListener('click',()=>{navLinks.classList.remove('open');menuBtn.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}));
const introScreen=$('#introScreen'),introSkip=$('#introSkip');
let introTimer,introDismissed=false;
function dismissIntro(restoreFocus){
  if(introDismissed||!introScreen.isConnected)return;
  introDismissed=true;clearTimeout(introTimer);introScreen.classList.add('is-leaving');
  const release=()=>{
    if(!introScreen.isConnected)return;
    body.classList.remove('intro-active');
    [$('#nav'),$('main'),$('footer')].forEach(el=>{el.inert=false;});
    introScreen.remove();
    if(restoreFocus)$('.brand').focus({preventScroll:true});
  };
  introScreen.addEventListener('transitionend',release,{once:true});
  setTimeout(release,700);
}
introSkip.addEventListener('click',()=>dismissIntro(true));
if(!state.motion||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){
  introDismissed=true;introScreen.remove();
}else{
  body.classList.add('intro-active');
  [$('#nav'),$('main'),$('footer')].forEach(el=>{el.inert=true;});
  introSkip.focus({preventScroll:true});
  introTimer=setTimeout(()=>dismissIntro(false),1800);
}
document.addEventListener('keydown',e=>{
  if(!introDismissed&&e.key==='Tab'){e.preventDefault();introSkip.focus();return;}
  if(e.key==='Escape'){dismissIntro(true);navLinks.classList.remove('open');menuBtn.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){const tag=(e.target.tagName||'').toLowerCase();
    if(tag!=='input'&&tag!=='textarea'){e.preventDefault();doUndo();}}
});
$$('.pv-link,.pv-btn[data-t]').forEach(el=>el.addEventListener('click',()=>{
  const tg=document.getElementById(el.dataset.t),sc=$('#pvScroll');if(!tg)return;
  sc.scrollTo({top:Math.max(0,tg.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-58),behavior:state.motion?'smooth':'auto'});
}));

function genInput(){renderCandidates();queueSave();}
$('#gH').addEventListener('input',e=>{state.gen.h=+e.target.value;genInput();});
$('#gS').addEventListener('input',e=>{state.gen.s=+e.target.value;genInput();});
$('#gL').addEventListener('input',e=>{state.gen.l=+e.target.value;genInput();});
$('#gSpread').addEventListener('input',e=>{state.gen.spread=+e.target.value;genInput();});
$('#gDepth').addEventListener('input',e=>{state.gen.depth=+e.target.value;genInput();});
$('#gHarmony').addEventListener('change',e=>{state.gen.harmony=e.target.value;genInput();});
$('#gCount').addEventListener('change',e=>{state.gen.count=+e.target.value;genInput();});
$('#gPicker').addEventListener('input',e=>{const hs=hexToHsl(e.target.value);state.gen.h=Math.round(hs[0]);state.gen.s=Math.round(hs[1]);state.gen.l=Math.round(hs[2]);genInput();});
$('#gHex').addEventListener('change',e=>{const v=normHex(e.target.value);
  if(validHex(v)){const hs=hexToHsl(v);state.gen.h=Math.round(hs[0]);state.gen.s=Math.round(hs[1]);state.gen.l=Math.round(hs[2]);genInput();}
  else{toast('Hex tidak valid — contoh: #005A9C','warn');e.target.value=hslToHex(state.gen.h,state.gen.s,state.gen.l);}});
$('#regenBtn').addEventListener('click',()=>{state.gen.seed=Math.floor(Math.random()*99999);genInput();});
$('#randBaseBtn').addEventListener('click',()=>{state.gen.h=Math.floor(Math.random()*360);state.gen.s=40+Math.floor(Math.random()*55);
  state.gen.l=32+Math.floor(Math.random()*40);state.gen.seed=Math.floor(Math.random()*99999);genInput();});
$('#genApplyBtn').addEventListener('click',()=>applyPalette(makeCandidate(0),'Harmoni'));
$('#universeBtn').addEventListener('click',universeRandom);
$('#libSearch').addEventListener('input',e=>{state.lib.q=e.target.value;renderLibrary();queueSave();});
$('#libGrid').addEventListener('click',e=>{
  const card=e.target.closest('.lib-card');if(!card)return;
  const btn=e.target.closest('[data-act]');if(!btn)return;
  const p=LIB.find(x=>x.id===card.dataset.id);if(!p)return;
  if(btn.dataset.act==='apply')applyPalette(p.h,p.n);
  else copyText(p.h.join(', '),'Tersalin ke clipboard!');
});
$('#importBtn').addEventListener('click',importColors);
$$('#expTabs .exp-tab').forEach(b=>b.addEventListener('click',()=>{expTab=b.dataset.tab;
  $$('#expTabs .exp-tab').forEach(x=>x.setAttribute('aria-selected',String(x===b)));requestUpdate();}));
$('#expCopy').addEventListener('click',()=>copyText(expCache[expTab],'Tersalin ke clipboard!'));
$('#expDown').addEventListener('click',()=>download(EXP[expTab].f,expCache[expTab],EXP[expTab].m));
window.addEventListener('pagehide',save);

function setupObservers(){
  if(!('IntersectionObserver' in window)){$$('.reveal').forEach(el=>el.classList.add('in'));return;}
  const nio=new IntersectionObserver(en=>{en.forEach(x=>{if(x.isIntersecting)
    $$('#navLinks .nl').forEach(a=>a.classList.toggle('active',a.dataset.sec===x.target.id));});},{rootMargin:'-40% 0px -55% 0px'});
  ['studio','atlas','analisis','ekspor','masukan'].forEach(id=>{const s=document.getElementById(id);if(s)nio.observe(s);});
  if(state.motion){
    const rio=new IntersectionObserver(en=>{en.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');rio.unobserve(x.target);}});},{threshold:.1});
    $$('.reveal').forEach(el=>rio.observe(el));
  }else $$('.reveal').forEach(el=>el.classList.add('in'));
}
buildCats();
$('#libSearch').value=state.lib.q;
rebuildDynamic();
renderLibrary();
renderCandidates();
update();
setupObservers();
requestAnimationFrame(()=>body.classList.add('ready'));
})();
