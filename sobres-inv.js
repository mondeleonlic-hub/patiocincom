/* Patio Cinco · menú INVENTARIO para Sobres (compras, existencias, liga) */
(function(){
  /* El catálogo viene de inv-catalog.js (el mismo que usa el formulario del coordinador): corto + largo */
  let CATS=[],ITEM={};
  function buildCats(){
    CATS=[];ITEM={};
    (window.INV_CATS||[]).forEach(c=>{
      const items=c.items.map(i=>{
        ITEM[i.k]=i;
        const type=i.t==='jug'?(i.tin?'t':(i.cap===1?'a':'j')):'n';
        return [i.k,i.n+(i.sub?' ('+i.sub+')':''),type];
      });
      if(items.length)CATS.push([c.name,items]);
    });
  }
  function loadCat(){
    if(loadCat.busy)return;loadCat.busy=true;
    const base=location.origin+location.pathname.replace(/[^\/]*$/,'');
    const s=document.createElement('script');s.src=base+'inv-catalog.js?v='+Date.now();
    s.onerror=()=>{loadCat.busy=false;};
    document.head.appendChild(s);
  }
  const clean=l=>l.replace(' (bolsas)','').replace(' (paquetes)','').replace(' (botellas)','');
  const SUCS=[['refugio','Refugio'],['alamos','Álamos']];
  const FORM_URL=location.origin+location.pathname.replace(/[^\/]*$/,'')+'inventario.html';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card='background:#fff;border:1px solid #e8e0cc;border-radius:16px;padding:14px;margin-bottom:14px';
  const h2='margin:0 0 6px;font-size:15px;color:#C8960C;text-transform:uppercase;letter-spacing:.5px';
  const DB=()=>firebase.firestore();
  let sub='todo',RECS={},RAW={},WA={},CFG={units:{},extra:[],mins:{}},fixSuc='refugio';
  const BASE_UNITS=['bidón','botella','bote','pzas','bolsas','litros','galón','caja','rollo','paquete','kg'];

  function fmt(v){const w=Math.floor(v+1e-9),f=+(v-w).toFixed(2);if(!f)return String(w);const m={.1:'1/10',.25:'1/4',.5:'1/2',.75:'3/4'}[f]||Math.round(f*100)+'%';return w?w+' '+m:m;}
  function plain(k,type,rec){
    if(!rec||!rec.v||rec.v[k]==null)return null;
    const v=rec.v[k];
    if(v<=0)return 'se acabó';
    if(type==='j'||type==='a'){const l=rec.l&&rec.l[k];return fmt(v)+(type==='a'?' botella':' bidón')+(l!=null&&type==='j'?' ('+l+' L)':'');}
    if(type==='t')return fmt(v)+' bote';
    return String(v);
  }
  function battery(v,s){
    const p=Math.max(0,Math.min(1,v)),col=s===0?'#d63a2f':s===1?'#e08a00':'#2e9e5b';
    return '<span style="display:inline-flex;align-items:flex-end;vertical-align:middle;margin-right:6px"><span style="display:inline-flex;flex-direction:column;align-items:center"><span style="width:8px;height:4px;background:#444;border-radius:2px 2px 0 0"></span><span style="position:relative;width:20px;height:26px;border:2px solid #444;border-radius:5px 5px 4px 4px;background:#fff;box-sizing:content-box;overflow:hidden"><span style="position:absolute;left:0;right:0;bottom:0;height:'+Math.round(p*100)+'%;background:'+col+'"></span></span></span>'+(v>1.001?'<span style="font-size:11px;color:#666;margin-left:3px">+'+fmt(v-1)+'</span>':'')+'</span>';
  }
  const UNIT={j:'bidón',a:'botella',t:'bote',n:'pzas'};
  function unitOf(k,type,label){
    if(CFG.units[k])return CFG.units[k];
    if(ITEM[k]&&window.invDefUnit)return window.invDefUnit(ITEM[k],null);
    return UNIT[type]||'pzas';
  }
  function parts(k,label,type,rec){
    if(!rec||!rec.v||rec.v[k]==null)return null;
    const v=rec.v[k];const u=unitOf(k,type,label);
    const l=(type==='j'&&rec.l&&rec.l[k]!=null&&v>0)?rec.l[k]+' L':null;
    return {q:fmt(v),u,l};
  }
  const labelOf=k=>{const i=ITEM[k];return i?i.n+(i.sub?' ('+i.sub+')':''):k;};
  const capOf=(k,rec)=>{const i=ITEM[k];return i.tin?1:((rec&&rec.caps&&rec.caps[k])||i.cap||i.dc||20);};
  const measOf=(k,rec)=>{const i=ITEM[k],v=rec.v[k];return i.t==='jug'?(rec.l&&rec.l[k]!=null?rec.l[k]:+(v*capOf(k,rec)).toFixed(2)):v;};
  function statusOf(label,k,rec){ // 0 empty,1 low,2 ok,null no data. Se recalcula con los mínimos vigentes
    if(!rec||!rec.v||rec.v[k]==null)return null;
    const i=ITEM[k];if(!i)return 2;
    const v=rec.v[k];
    if(i.dep&&rec.v[i.dep]>0)return 2;
    const lim=window.invMinLim(i,rec.caps&&rec.caps[k],CFG.mins);
    if(lim==null||lim<=0)return 2;
    if(measOf(k,rec)<=lim+1e-9){
      if(v>0)return 1; // si tiene algo es porque lo tocaron
      const touched=(rec.low||[]).includes(label)||(rec.ed&&rec.ed[k])||CFG.mins[k]!=null;
      return touched?0:2;
    }
    return 2;
  }
  const done=()=>{let st={};try{st=JSON.parse(localStorage.getItem('pcc_done3')||'{}');}catch(e){}return st;};
  const sigOf=sl=>{const r=RECS[sl];return r?r.ts:'';};

  function merge(docs){ // une el último inventario corto y el último largo: por artículo manda el más reciente
    const ds=docs.filter(d=>d&&d.v).sort((x,y)=>String(x.ts).localeCompare(String(y.ts)));
    if(!ds.length)return null;
    const m={v:{},l:{},caps:{},ed:{},low:[],ts:ds[ds.length-1].ts,resp:ds[ds.length-1].resp,tipo:ds[ds.length-1].tipo};
    const lowK={};
    ds.forEach(d=>{for(const k in d.v){m.v[k]=d.v[k];if(d.l&&d.l[k]!=null)m.l[k]=d.l[k];else delete m.l[k];if(d.caps&&d.caps[k]!=null)m.caps[k]=d.caps[k];
      lowK[k]=(d.low||[]).includes(labelOf(k));if(d.ed&&d.ed[k])m.ed[k]=true;else delete m.ed[k];}});
    m.low=Object.keys(lowK).filter(k=>lowK[k]).map(labelOf);
    return m;
  }
  async function load(){
    try{const d=await DB().collection('pc_sobres').doc('inv_config').get();if(d.exists){const x=d.data();CFG={units:x.units||{},extra:x.extra||[],mins:x.mins||{}};}}catch(e){console.warn(e);}
    for(const [sl] of SUCS){
      let c=null,l=null;
      try{const d=await DB().collection('pc_sobres').doc('inv_last_'+sl).get();c=d.exists?d.data():null;}catch(e){console.warn(e);}
      try{const d=await DB().collection('pc_sobres').doc('inv_last_largo_'+sl).get();l=d.exists?d.data():null;}catch(e){console.warn(e);}
      RAW[sl]={c,l};RECS[sl]=merge([c,l]);
    }
  }

  /* ---------- COMPRAS (una tarjeta por sucursal) ---------- */
  function viewCompras(){
    const st=done();WA={};
    let html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px">';
    for(const [sl,nm] of SUCS){
      const rec=RECS[sl];
      if(!rec){html+='<div style="'+card+'"><h3 style="'+h2+'">'+nm+'</h3><div style="color:#888;font-size:13px">Todavía no hay inventario enviado.</div></div>';continue;}
      const sig=sigOf(sl);const mine=(st[sl]&&st[sl].sig===sig)?st[sl].items:{};
      const empty=[],poco=[],bought=[];
      CATS.forEach(([cn,items])=>items.forEach(([k,label,type])=>{
        const s=statusOf(label,k,rec);if(s===null||s===2)return;
        const pt=parts(k,label,type,rec);const o={k,label,bat:(type==='j'||type==='a'||type==='t')?battery(rec.v[k],s):'',q:pt.q,u:pt.u,l:pt.l,txt:pt.q+' '+pt.u,cat:cn};
        if(mine[k])bought.push(o);else(s===0?empty:poco).push(o);
      }));
      WA[sl]=[...empty,...poco].map(o=>'• '+o.label+' — '+o.txt);
      const when=new Date(rec.ts).toLocaleString('es-MX',{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      const row=(o,cls)=>'<label style="display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #f0ebdc;cursor:pointer"><input type="checkbox" data-s="'+sl+'" data-k="'+o.k+'" '+(mine[o.k]?'checked':'')+' style="width:20px;height:20px"><span style="flex:1;font-size:15px;font-weight:600;'+(mine[o.k]?'text-decoration:line-through;color:#999':'')+'">'+esc(o.label)+'</span>'+o.bat+'<span style="min-width:44px;text-align:center;font-size:14px;padding:2px 10px;border-radius:99px;'+cls+'">'+esc(o.q)+'</span><span style="width:56px;font-size:13px;color:#888">'+esc(o.u)+(o.l?'<br><span style="font-size:11px;color:#aaa">'+esc(o.l)+'</span>':'')+'</span></label>';
      const R='background:#fde7e4;color:#b3261e;font-weight:700',A='background:#fff3dc;color:#8a5a00;font-weight:700';
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+nm+'</h3><div style="font-size:12px;color:#888;margin-bottom:6px">Inventario: '+esc(when)+' · '+esc(rec.resp||'')+'</div>'+
        (empty.length?'<div style="margin-top:6px;font-weight:800;color:#b3261e;font-size:14px">Se acabó</div>'+empty.map(o=>row(o,R)).join(''):'')+
        (poco.length?'<div style="margin-top:12px;font-weight:800;color:#8a5a00;font-size:14px">Queda poco</div>'+poco.map(o=>row(o,A)).join(''):'')+
        (!empty.length&&!poco.length?'<div style="color:#2e9e5b;font-weight:700;padding:8px 0">✅ Nada por comprar en esta sucursal</div>':'')+
        (bought.length?'<div style="margin-top:12px;font-weight:800;color:#2e7d4f;font-size:14px">Ya comprado ('+bought.length+')</div>'+bought.map(o=>row(o,'background:#eef6ef;color:#2e7d4f')).join(''):'')+
        '<button data-wa="'+sl+'" style="width:100%;margin-top:12px;padding:13px;border:0;border-radius:12px;background:#25D366;color:#fff;font-weight:800;font-size:15px;cursor:pointer">Mandar lista de '+nm+' por WhatsApp</button></div>';
    }
    return html+'</div>';
  }

  /* ---------- EXISTENCIAS ---------- */
  function viewExist(){
    const cell=(k,label,type,rec)=>{
      const p=parts(k,label,type,rec);if(!p)return '<span style="color:#bbb">—</span>';
      const s=statusOf(label,k,rec);
      const sty=s===0?'color:#b3261e;font-weight:700':s===1?'color:#8a5a00;font-weight:700':'color:#111;font-weight:600';
      const bat=(type==='j'||type==='a'||type==='t')?battery(rec.v[k],s):'';
      return bat+'<span style="'+sty+'">'+esc(p.q)+'</span>'+(s===0||s===1?' <span style="font-size:10px;padding:1px 6px;border-radius:99px;background:'+(s===0?'#fde7e4;color:#b3261e':'#fff3dc;color:#8a5a00')+'">comprar</span>':'')+(p.l?' <span style="font-size:11px;color:#aaa">'+esc(p.l)+'</span>':'');
    };
    const dates=SUCS.map(([sl,nm])=>RECS[sl]?nm+': '+new Date(RECS[sl].ts).toLocaleDateString('es-MX',{day:'numeric',month:'short'}):nm+': sin datos').join(' · ');
    const cols='display:grid;grid-template-columns:1.3fr .6fr 1.3fr 1.3fr;font-size:14px;align-items:center';
    const bd='padding:8px 0;border-top:1px solid #f0ebdc';
    let html='<div style="font-size:12px;color:#888;margin-bottom:10px">Último inventario · '+esc(dates)+'</div>';
    CATS.forEach(([cn,items])=>{
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+cn+'</h3><div style="'+cols+'">'+['Producto','Unidad','Refugio','Álamos'].map(h=>'<div style="font-size:12px;color:#888;padding:4px 0">'+h+'</div>').join('')+
        items.map(([k,label,type])=>{
          const u=unitOf(k,type,label);
          return '<div style="'+bd+';font-weight:600">'+esc(clean(label))+'</div><div style="'+bd+';color:#888;font-size:13px">'+u+'</div><div style="'+bd+'">'+cell(k,label,type,RECS.refugio)+'</div><div style="'+bd+'">'+cell(k,label,type,RECS.alamos)+'</div>';
        }).join('')+'</div></div>';
    });
    return html;
  }

  /* ---------- UNIDADES ---------- */
  function viewUnits(){
    const opts=[...BASE_UNITS,...(CFG.extra||[])];
    let html='<div style="font-size:13px;color:#888;margin-bottom:10px">Elige la unidad de medida de cada producto. Si no está en la lista, usa "+ Agregar unidad…". Se refleja aquí y en el formulario del coordinador.</div>';
    CATS.forEach(([cn,items])=>{
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+cn+'</h3>'+items.map(([k,label,type])=>{
        const cur=unitOf(k,type,label);const list=opts.includes(cur)?opts:[...opts,cur];
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #f0ebdc"><span style="font-weight:600;font-size:14px">'+esc(clean(label))+'</span><select data-unit="'+k+'" style="padding:8px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:14px;background:#fff">'+list.map(u=>'<option '+(u===cur?'selected':'')+'>'+esc(u)+'</option>').join('')+'<option value="__new">+ Agregar unidad…</option></select></div>';
      }).join('')+'</div>';
    });
    return html;
  }
  async function saveCfg(){
    try{await DB().collection('pc_sobres').doc('inv_config').set({units:CFG.units,extra:CFG.extra,mins:CFG.mins||{},updatedAt:new Date().toISOString()});}catch(e){alert('No se pudo guardar la unidad');console.warn(e);}
  }

  /* ---------- MÍNIMOS ---------- */
  function minUnit(k,type,label){return type==='j'?'L':unitOf(k,type,label);}
  function minDefault(i){
    if(i.t==='jug'){if(i.minL!=null)return i.minL+' L';if(i.min==null)return 'sin alerta';return fmt(i.min)+' '+(i.tin?'bote':(i.cap===1?'botella':'bidón'));}
    return (i.min==null||i.min<=0)?'sin alerta':String(i.min);
  }
  function viewMins(){
    let html='<div style="font-size:13px;color:#888;margin-bottom:10px">Cuando una existencia llega a este mínimo (o menos) sale en Compras. Los líquidos se miden en <b>litros</b>. Deja vacío para usar el mínimo original; pon 0 para quitar la alerta. Aplica de inmediato en Compras y en el formulario del coordinador.</div>';
    CATS.forEach(([cn,items])=>{
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+cn+'</h3>'+items.map(([k,label,type])=>{
        const i=ITEM[k],cur=CFG.mins[k];
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #f0ebdc"><span style="font-weight:600;font-size:14px;flex:1">'+esc(clean(label))+(i.L?' <span style="font-size:10px;color:#8a5a00;background:#fdf8ec;border:1px solid #e8e0cc;border-radius:6px;padding:1px 5px">LARGO</span>':'')+'</span><input data-min="'+k+'" type="number" step="any" min="0" inputmode="decimal" value="'+(cur!=null?cur:'')+'" placeholder="'+esc(minDefault(i))+'" style="width:92px;padding:8px;border:1.5px solid '+(cur!=null?'#C8960C':'#e8e0cc')+';border-radius:10px;font-size:14px;text-align:center"><span style="width:56px;font-size:12px;color:#888">'+esc(minUnit(k,type,label))+'</span></div>';
      }).join('')+'</div>';
    });
    return html;
  }

  /* ---------- CORREGIR EXISTENCIAS ---------- */
  function curVal(k,rec){if(!rec||!rec.v||rec.v[k]==null)return null;return ITEM[k].t==='jug'?+measOf(k,rec).toFixed(2):rec.v[k];}
  function viewFix(){
    const rec=RECS[fixSuc];
    let html='<div style="display:flex;gap:8px;margin-bottom:10px">'+SUCS.map(([sl,nm])=>'<button data-fixsuc="'+sl+'" style="padding:9px 18px;border:0;border-radius:99px;font-weight:700;cursor:pointer;background:'+(sl===fixSuc?'#C8960C':'#f0ede6')+';color:'+(sl===fixSuc?'#fff':'#555')+'">'+nm+'</button>').join('')+'</div>';
    html+='<div style="font-size:13px;color:#888;margin-bottom:10px">Corrige lo que el coordinador capturó mal. Los líquidos se escriben en <b>litros</b> (ej. 12.5); lo demás en piezas. Solo se guardan los números que cambies. '+(rec?'Inventario base: '+esc(new Date(rec.ts).toLocaleDateString('es-MX',{day:'numeric',month:'short'}))+' · '+esc(rec.resp||''):'Aún no hay inventario de esta sucursal.')+'</div>';
    CATS.forEach(([cn,items])=>{
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+cn+'</h3>'+items.map(([k,label,type])=>{
        const cv=curVal(k,rec);
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #f0ebdc"><span style="font-weight:600;font-size:14px;flex:1">'+esc(clean(label))+(rec&&rec.ed&&rec.ed[k]?' <span style="font-size:10px;color:#2e7d4f">corregido</span>':'')+'</span><input data-fk="'+k+'" data-cur="'+(cv==null?'':cv)+'" type="number" step="any" min="0" inputmode="decimal" value="'+(cv==null?'':cv)+'" placeholder="—" style="width:92px;padding:8px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:14px;text-align:center"><span style="width:56px;font-size:12px;color:#888">'+esc(minUnit(k,type,label))+'</span></div>';
      }).join('')+'</div>';
    });
    html+='<button id="fix-save" style="width:100%;padding:15px;border:0;border-radius:12px;background:#111;color:#fff;font-weight:800;font-size:15px;cursor:pointer">Guardar correcciones de '+esc(SUCS.find(x=>x[0]===fixSuc)[1])+'</button>';
    return html;
  }
  async function saveFix(box){
    const sl=fixSuc,rec=RECS[sl]||{v:{},l:{},caps:{},ed:{},low:[]},raw=RAW[sl]||{};
    const ch={};
    box.querySelectorAll('input[data-fk]').forEach(inp=>{
      const raw0=inp.value.trim();if(raw0==='')return;
      const n=parseFloat(raw0.replace(',','.'));if(isNaN(n)||n<0)return;
      const cur=inp.dataset.cur===''?null:parseFloat(inp.dataset.cur);
      if(cur===null||Math.abs(n-cur)>1e-9)ch[inp.dataset.fk]=n;
    });
    const keys=Object.keys(ch);
    if(!keys.length){alert('No cambiaste ningún número.');return;}
    const nv={...rec.v},nl={...(rec.l||{})},ne={...(rec.ed||{})},nc={...(rec.caps||{})};
    const patches={};
    keys.forEach(k=>{
      const i=ITEM[k],cap=capOf(k,rec),n=ch[k];
      let v=n,l=null;
      if(i.t==='jug'){l=+n.toFixed(2);v=+(n/cap).toFixed(3);nl[k]=l;nc[k]=cap;}
      nv[k]=v;ne[k]=true;
      let tg=['c','l'].filter(x=>raw[x]&&raw[x].v&&raw[x].v[k]!=null);
      if(!tg.length)tg=[(i.L&&raw.l)?'l':'c'];
      tg.forEach(x=>{const p=patches[x]=patches[x]||{v:{},l:{},caps:{},ed:{}};p.v[k]=v;if(l!=null){p.l[k]=l;p.caps[k]=cap;}p.ed[k]=true;});
    });
    const nrec={v:nv,l:nl,ed:ne,caps:nc,low:rec.low||[]};
    try{
      for(const x of Object.keys(patches)){
        const d=raw[x]||{};let low=(d.low||[]).slice();
        keys.forEach(k=>{if(!patches[x].v.hasOwnProperty(k))return;const lb=labelOf(k);low=low.filter(z=>z!==lb);if(statusOf(lb,k,nrec)<2)low.push(lb);});
        const p=patches[x];p.low=low;p.editedAt=new Date().toISOString();p.editedBy='admin';
        if(!Object.keys(p.l).length){delete p.l;delete p.caps;}
        await DB().collection('pc_sobres').doc(x==='c'?'inv_last_'+sl:'inv_last_largo_'+sl).set(p,{merge:true});
      }
    }catch(e){alert('No se pudo guardar la corrección');console.warn(e);return;}
    await load();paint();alert('Listo: '+keys.length+' corrección'+(keys.length>1?'es':'')+' guardada'+(keys.length>1?'s':'')+'.');
  }

  /* ---------- LIGA ---------- */
  function viewLiga(){
    return '<div style="'+card+'"><h3 style="'+h2+'">Liga para el coordinador</h3><div style="font-size:13px;color:#888;margin-bottom:8px">El coordinador llena el inventario aquí (no entra a Sobres):</div><input readonly value="'+esc(FORM_URL)+'" style="width:100%;padding:11px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:13px"><button data-copy="1" style="width:100%;margin-top:8px;padding:12px;border:1.5px solid #e8e0cc;border-radius:12px;background:#fff;font-weight:700;cursor:pointer">Copiar liga</button></div>';
  }

  function paint(){
    const box=document.getElementById('inv-body');if(!box)return;
    box.innerHTML=sub==='todo'?viewCompras()+'<h3 style="margin:18px 0 8px;font-size:17px">Existencias</h3>'+viewExist():sub==='units'?viewUnits():sub==='mins'?viewMins():sub==='fix'?viewFix():viewLiga();
    document.querySelectorAll('#inv-subs button').forEach(b=>{const on=b.dataset.sub===sub;b.style.background=on?'#111':'#f0ede6';b.style.color=on?'#fff':'#555';});
    box.querySelectorAll('input[type=checkbox][data-s]').forEach(c=>c.onchange=()=>{
      const st=done(),sl=c.dataset.s,sig=sigOf(sl);
      if(!st[sl]||st[sl].sig!==sig)st[sl]={sig,items:{}};
      st[sl].items[c.dataset.k]=c.checked;localStorage.setItem('pcc_done3',JSON.stringify(st));paint();});
    box.querySelectorAll('button[data-wa]').forEach(b=>b.onclick=()=>{
      const sl=b.dataset.wa,nm=SUCS.find(x=>x[0]===sl)[1],lines=WA[sl]||[];
      if(!lines.length){alert('No hay nada pendiente por comprar en '+nm);return;}
      window.open('https://wa.me/?text='+encodeURIComponent('🛒 Por comprar · '+nm+'\n\n'+lines.join('\n')),'_blank');});
    box.querySelectorAll('select[data-unit]').forEach(sel=>sel.onchange=async()=>{
      const k=sel.dataset.unit;let v=sel.value;
      if(v==='__new'){const n=(prompt('Nombre de la nueva unidad (ej. garrafón, litro, tambo)')||'').trim();
        if(!n){paint();return;}
        if(!BASE_UNITS.includes(n)&&!(CFG.extra||[]).includes(n))CFG.extra=[...(CFG.extra||[]),n];v=n;}
      CFG.units[k]=v;await saveCfg();paint();});
    box.querySelectorAll('input[data-min]').forEach(inp=>inp.onchange=async()=>{
      const k=inp.dataset.min,t=inp.value.trim().replace(',','.');
      if(t===''||isNaN(parseFloat(t)))delete CFG.mins[k];else CFG.mins[k]=Math.max(0,parseFloat(t));
      await saveCfg();paint();});
    box.querySelectorAll('button[data-fixsuc]').forEach(b=>b.onclick=()=>{fixSuc=b.dataset.fixsuc;paint();});
    const fs=box.querySelector('#fix-save');if(fs)fs.onclick=()=>saveFix(box);
    box.querySelectorAll('button[data-copy]').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(FORM_URL).then(()=>alert('Liga copiada')));
  }
  async function render(){
    const box=document.getElementById('inv-body');if(box)box.innerHTML='<div style="'+card+'">Cargando…</div>';
    await load();paint();
  }

  function install(){
    const content=document.getElementById('content'),tabs=document.querySelector('.tabs-inner'),grid=document.getElementById('mas-grid');
    if(!content||!tabs||typeof window.goTab!=='function')return false;
    if(document.getElementById('pnl-inventario'))return true;
    const pnl=document.createElement('div');pnl.id='pnl-inventario';pnl.className='pnl';
    pnl.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px"><h2 style="margin:0;font-size:20px">Inventario carwash</h2><div id="inv-subs" style="display:flex;gap:8px;flex-wrap:wrap">'+
      [['todo','Compras y existencias'],['mins','Mínimos'],['fix','Corregir existencias'],['units','Unidades'],['liga','Liga']].map(([k,n])=>'<button data-sub="'+k+'" style="padding:9px 16px;border:0;border-radius:99px;font-weight:700;cursor:pointer;background:#f0ede6;color:#555">'+n+'</button>').join('')+
      '<button id="inv-reload" style="padding:9px 14px;border:1px solid #e8e0cc;border-radius:99px;background:#fff;cursor:pointer">Actualizar</button></div></div><div id="inv-body"></div>';
    content.appendChild(pnl);
    pnl.querySelectorAll('#inv-subs button[data-sub]').forEach(b=>b.onclick=()=>{sub=b.dataset.sub;paint();});
    pnl.querySelector('#inv-reload').onclick=render;
    const t=document.createElement('button');t.className='tab';t.dataset.t='inventario';t.textContent='Inventario';
    t.onclick=()=>window.goTab('inventario');
    const an=tabs.querySelector('.tab[data-t="sucursales"]');an?tabs.insertBefore(t,an):tabs.appendChild(t); // Analytics siempre al final
    if(grid){
      const src=grid.querySelector('.mas-item');
      if(src){const m=src.cloneNode(true);m.dataset.mt='inventario';m.classList.remove('on');
        const sp=m.querySelector('span');if(sp)sp.textContent='Inventario';
        m.addEventListener('click',()=>{if(window.closeMas)window.closeMas();window.goTab('inventario');if(window.syncMobNav)window.syncMobNav('inventario');});
        const anM=grid.querySelector('.mas-item[data-mt="sucursales"]');anM?grid.insertBefore(m,anM):grid.appendChild(m);}
    }
    const orig=window.goTab;
    window.goTab=function(id){orig(id);if(id==='inventario')render();};
    return true;
  }
  let n=0;const iv=setInterval(()=>{if(!window.INV_CATS){loadCat();if(++n>60)clearInterval(iv);return;}if(!CATS.length)buildCats();if(install()||++n>60)clearInterval(iv);},500);
})();
