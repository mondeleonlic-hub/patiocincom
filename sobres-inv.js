/* Patio Cinco · menú INVENTARIO para Sobres (compras, existencias, liga) */
(function(){
  const CATS=[
    ['Químicos',[['shampoo','Shampoo','j'],['cera_express','Cera express','j'],['armor_all','Armor all','j'],['filtro_conc','Filtro solar (para diluir)','j'],['filtro_dil','Filtro solar (ya diluido)','j'],['desengr_conc','Desengrasante (para diluir)','j'],['desengr_dil','Desengrasante (ya diluido)','j'],['diesel','Diesel','j'],['abrillantas','Abrillantas','j']]],
    ['Aromas',[['aromas','Aromas (esencia, botellas de 1 L)','a']]],
    ['Accesorios',[['cepillos','Cepillos','n'],['esponja','Esponja (bolsas)','n'],['cubeta','Cubeta','n'],['atomizador','Atomizador','n'],['piedra','Piedra','n']]],
    ['Herramientas',[['bolsas_basura','Bolsas de basura','n'],['escoba','Escoba','n'],['plumones','Plumones','n']]],
    ['Trapos',[['carbrite','CarBrite','n'],['mf_negra','Microfibra negra','n'],['mf_azul','Microfibra azul','n'],['mf_amarilla','Microfibra amarilla','n'],['franela','Franela de vidrios','n'],['peluche','Peluche','n']]],
    ['Aspiradoras',[['asp_act','Aspiradoras activas','n'],['asp_res','Aspiradoras reserva','n'],['asp_roto','Aspiradora sin funcionar','n']]],
    ['Detallado simple',[['cera_tempo','Cera Tempo','t'],['cera_meg','Cera Meguiars','t'],['quitagotas','Quita gotas','j'],['alumbra','Alumbra','j'],['restaurador','Restaurador de molduras (azul)','j']]]
  ];
  const SUCS=[['refugio','Refugio'],['alamos','Álamos']];
  const FORM_URL=location.origin+location.pathname.replace(/[^\/]*$/,'')+'inventario.html';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card='background:#fff;border:1px solid #e8e0cc;border-radius:16px;padding:14px;margin-bottom:14px';
  const h2='margin:0 0 6px;font-size:15px;color:#C8960C;text-transform:uppercase;letter-spacing:.5px';
  const DB=()=>firebase.firestore();
  let sub='todo',RECS={},WA={},CFG={units:{},extra:[]};
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
    let u=UNIT[type]||'pzas';if(type==='n'&&/bolsas\)/.test(label))u='bolsas';return u;
  }
  function parts(k,label,type,rec){
    if(!rec||!rec.v||rec.v[k]==null)return null;
    const v=rec.v[k];const u=unitOf(k,type,label);
    const l=(type==='j'&&rec.l&&rec.l[k]!=null&&v>0)?rec.l[k]+' L':null;
    return {q:fmt(v),u,l};
  }
  function statusOf(label,k,rec){ // 0 empty,1 low,2 ok,null no data
    if(!rec||!rec.v||rec.v[k]==null)return null;
    const isLow=(rec.low||[]).includes(label);
    if(isLow)return rec.v[k]<=0?0:1;
    return 2;
  }
  const done=()=>{let st={};try{st=JSON.parse(localStorage.getItem('pcc_done3')||'{}');}catch(e){}return st;};
  const sigOf=sl=>{const r=RECS[sl];return r?r.ts:'';};

  async function load(){
    try{const d=await DB().collection('pc_sobres').doc('inv_config').get();if(d.exists){const x=d.data();CFG={units:x.units||{},extra:x.extra||[]};}}catch(e){console.warn(e);}
    for(const [sl] of SUCS){
      try{const d=await DB().collection('pc_sobres').doc('inv_last_'+sl).get();RECS[sl]=d.exists?d.data():null;}catch(e){RECS[sl]=null;console.warn(e);}
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
          return '<div style="'+bd+';font-weight:600">'+esc(label.replace(/ \(bolsas\)/,''))+'</div><div style="'+bd+';color:#888;font-size:13px">'+u+'</div><div style="'+bd+'">'+cell(k,label,type,RECS.refugio)+'</div><div style="'+bd+'">'+cell(k,label,type,RECS.alamos)+'</div>';
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
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-top:1px solid #f0ebdc"><span style="font-weight:600;font-size:14px">'+esc(label.replace(/ \(bolsas\)/,''))+'</span><select data-unit="'+k+'" style="padding:8px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:14px;background:#fff">'+list.map(u=>'<option '+(u===cur?'selected':'')+'>'+esc(u)+'</option>').join('')+'<option value="__new">+ Agregar unidad…</option></select></div>';
      }).join('')+'</div>';
    });
    return html;
  }
  async function saveCfg(){
    try{await DB().collection('pc_sobres').doc('inv_config').set({units:CFG.units,extra:CFG.extra,updatedAt:new Date().toISOString()});}catch(e){alert('No se pudo guardar la unidad');console.warn(e);}
  }

  /* ---------- LIGA ---------- */
  function viewLiga(){
    return '<div style="'+card+'"><h3 style="'+h2+'">Liga para el coordinador</h3><div style="font-size:13px;color:#888;margin-bottom:8px">El coordinador llena el inventario aquí (no entra a Sobres):</div><input readonly value="'+esc(FORM_URL)+'" style="width:100%;padding:11px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:13px"><button data-copy="1" style="width:100%;margin-top:8px;padding:12px;border:1.5px solid #e8e0cc;border-radius:12px;background:#fff;font-weight:700;cursor:pointer">Copiar liga</button></div>';
  }

  function paint(){
    const box=document.getElementById('inv-body');if(!box)return;
    box.innerHTML=sub==='todo'?viewCompras()+'<h3 style="margin:18px 0 8px;font-size:17px">Existencias</h3>'+viewExist():sub==='units'?viewUnits():viewLiga();
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
      [['todo','Compras y existencias'],['units','Unidades'],['liga','Liga']].map(([k,n])=>'<button data-sub="'+k+'" style="padding:9px 16px;border:0;border-radius:99px;font-weight:700;cursor:pointer;background:#f0ede6;color:#555">'+n+'</button>').join('')+
      '<button id="inv-reload" style="padding:9px 14px;border:1px solid #e8e0cc;border-radius:99px;background:#fff;cursor:pointer">Actualizar</button></div></div><div id="inv-body"></div>';
    content.appendChild(pnl);
    pnl.querySelectorAll('#inv-subs button[data-sub]').forEach(b=>b.onclick=()=>{sub=b.dataset.sub;paint();});
    pnl.querySelector('#inv-reload').onclick=render;
    const t=document.createElement('button');t.className='tab';t.dataset.t='inventario';t.textContent='Inventario';
    t.onclick=()=>window.goTab('inventario');
    tabs.appendChild(t);
    if(grid){
      const src=grid.querySelector('.mas-item');
      if(src){const m=src.cloneNode(true);m.dataset.mt='inventario';m.classList.remove('on');
        const sp=m.querySelector('span');if(sp)sp.textContent='Inventario';
        m.addEventListener('click',()=>{if(window.closeMas)window.closeMas();window.goTab('inventario');if(window.syncMobNav)window.syncMobNav('inventario');});
        grid.appendChild(m);}
    }
    const orig=window.goTab;
    window.goTab=function(id){orig(id);if(id==='inventario')render();};
    return true;
  }
  let n=0;const iv=setInterval(()=>{if(install()||++n>60)clearInterval(iv);},500);
})();
