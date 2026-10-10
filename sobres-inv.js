/* Patio Cinco · módulo Compras/Inventarios para Sobres (solo administradora) */
(function(){
  const NAMES={'Shampoo':['shampoo','j'],'Cera express':['cera_express','j'],'Armor all':['armor_all','j'],'Filtro solar (para diluir)':['filtro_conc','j'],'Filtro solar (ya diluido)':['filtro_dil','j'],'Desengrasante (para diluir)':['desengr_conc','j'],'Desengrasante (ya diluido)':['desengr_dil','j'],'Diesel':['diesel','j'],'Abrillantas':['abrillantas','j'],'CarBrite':['carbrite','n'],'Microfibra negra':['mf_negra','n'],'Microfibra azul':['mf_azul','n'],'Microfibra amarilla':['mf_amarilla','n'],'Franela de vidrios':['franela','n'],'Cepillos':['cepillos','n'],'Atomizador':['atomizador','n'],'Piedra':['piedra','n'],'Cubeta':['cubeta','n'],'Cera Tempo':['cera_tempo','t'],'Cera Meguiars':['cera_meg','t'],'Quita gotas':['quitagotas','j'],'Alumbra':['alumbra','j'],'Restaurador de molduras (azul)':['restaurador','j'],
    // artículos que solo vienen en el inventario largo (mensual)
    'Concentrado Coco (esencia, botellas de 1 L)':['aroma_coco','b'],'Concentrado Polo Sport (esencia, botellas de 1 L)':['aroma_polo','b'],'Concentrado Auto Nuevo (esencia, botellas de 1 L)':['aroma_nuevo','b'],'Aroma Patio Cinco (esencia, botellas de 1 L)':['aroma_pc','b'],
    'Polish (botellas de 1 L)':['polish','b'],'Quita etiquetas (botellas de 1 L)':['quita_etiq','b'],'APC (shampoo de vestiduras)':['apc','j'],
    'Jabón en polvo (bolsas)':['jabon_polvo','n'],'Jabón Roma (bolsas)':['jabon_roma','n'],'Cloro (botellas)':['cloro','n'],'Limpiador de baño y pisos (botellas)':['limpiador','n'],'Bolsas de basura (paquetes)':['bolsas_basura','n'],'Filtros de aspiradora (de repuesto)':['filtro_asp','n'],'Bolsas de aspiradora (de repuesto)':['bolsa_asp','n']};
  const FORM_URL=location.origin+location.pathname.replace(/[^\/]*$/,'')+'inventario.html';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fmt(v){const w=Math.floor(v+1e-9),f=+(v-w).toFixed(2);if(!f)return String(w);const m={.1:'1/10',.25:'1/4',.5:'1/2',.75:'3/4'}[f]||Math.round(f*100)+'%';return w?w+' '+m:m;}
  function qty(name,rec){
    const m=NAMES[name];if(!m||!rec.v)return'';const v=rec.v[m[0]];if(v==null)return'';
    if(m[1]==='j'){const l=rec.l&&rec.l[m[0]];return fmt(v)+' bidón'+(l!=null?' ('+l+' L)':'');}
    if(m[1]==='t')return fmt(v)+' bote';
    if(m[1]==='b')return fmt(v)+' botella';
    return v+' pzas';
  }

  function level(name,rec){ // 0=se acabó 1=queda poco 2=ok / null sin dato
    const m=NAMES[name];if(!m||!rec||!rec.v||rec.v[m[0]]==null)return null;
    return rec.v[m[0]]<=0?0:1;
  }
  function plain(name,rec){
    const m=NAMES[name];if(!m||!rec||!rec.v||rec.v[m[0]]==null)return 'sin dato';
    const v=rec.v[m[0]];
    if(v<=0)return 'se acabó';
    if(m[1]==='j'){const l=rec.l&&rec.l[m[0]];return 'queda '+fmt(v)+' bidón'+(l!=null?' ('+l+' L)':'');}
    if(m[1]==='t')return 'queda '+fmt(v)+' bote';
    if(m[1]==='b')return 'queda '+fmt(v)+' botella';
    return 'quedan '+v;
  }
  const DB=()=>firebase.firestore();
  const card='background:#fff;border:1px solid #e8e0cc;border-radius:16px;padding:14px;margin-bottom:14px';
  const h2='margin:0 0 6px;font-size:15px;color:#C8960C;text-transform:uppercase;letter-spacing:.5px';
  let LIST=[];

  async function render(){
    const v=document.getElementById('suc-view-compras');if(!v)return;
    v.innerHTML='<div style="'+card+'">Cargando…</div>';
    let html='',merged={},recR=null,recA=null;
    const hist=[];
    for(const [sl,nm] of [['refugio','Refugio'],['alamos','Álamos']]){
      let rec=null;
      try{const d=await DB().collection('pc_sobres').doc('inv_last_'+sl).get();if(d.exists)rec=d.data();}catch(e){console.warn(e)}
      if(sl==='refugio')recR=rec;else recA=rec;
    if(!rec){html+='<div style="'+card+'"><h3 style="'+h2+'">'+nm+'</h3><div style="color:#888;font-size:13px">Todavía no hay inventario enviado.</div></div>';continue;}
      const when=new Date(rec.ts).toLocaleString('es-MX',{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      const low=rec.low||[];
      low.forEach(n=>{(merged[n]=merged[n]||[]).push(nm+': '+qty(n,rec));});
      html+='<div style="'+card+'"><h3 style="'+h2+'">'+nm+'</h3><div style="font-size:12px;color:#888;margin-bottom:8px">Inventario: '+esc(when)+' · '+esc(rec.resp||'')+'</div>'+
        (low.length?low.map(n=>'<div style="display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid #f0ebdc"><b>'+esc(n)+'</b><b style="color:#d63a2f">'+esc(qty(n,rec)||'bajo')+'</b></div>').join(''):'<div style="color:#2e9e5b;font-weight:700">✅ Nada bajo en esta sucursal</div>')+
        (rec.notas?'<div style="font-size:12px;color:#666;margin-top:8px">📝 '+esc(rec.notas)+'</div>':'')+
        '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px;color:#555">Ver inventario completo</summary><pre style="white-space:pre-wrap;font-size:12px;background:#f6f3ea;border-radius:10px;padding:10px;margin-top:8px">'+esc(rec.texto||'')+'</pre></details></div>';
    }
    const names=Object.keys(merged);
    const recs={Refugio:recR,'Álamos':recA};
    const info=names.map(n=>{
      const per=['Refugio','Álamos'].map(sc=>{const r=recs[sc];if(!r)return null;const isLow=(r.low||[]).includes(n);return {sc,txt:plain(n,r),low:isLow,empty:level(n,r)===0};}).filter(Boolean);
      return {n,per,urgent:per.some(p=>p.low&&p.empty)};
    }).sort((x,y)=>(y.urgent-x.urgent)||x.n.localeCompare(y.n));
    const sig=((recR&&recR.ts)||'')+'|'+((recA&&recA.ts)||'');
    let st={};try{st=JSON.parse(localStorage.getItem('pcc_done2')||'{}');}catch(e){}
    if(st.sig!==sig)st={sig,items:{}};
    const done=st.items||{};
    const row=i=>'<label style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid #f0ebdc;cursor:pointer"><input type="checkbox" '+(done[i.n]?'checked':'')+' data-n="'+esc(i.n)+'" style="width:22px;height:22px;margin-top:2px"><span style="flex:1"><b style="font-size:16px;'+(done[i.n]?'text-decoration:line-through;color:#999':'')+'">'+esc(i.n)+'</b>'+
      '<span style="display:block;margin-top:4px;font-size:13px;line-height:1.7">'+i.per.map(p=>'<span style="display:inline-block;margin-right:6px;padding:2px 9px;border-radius:99px;'+(p.low?(p.empty?'background:#fde7e4;color:#b3261e;font-weight:700':'background:#fff3dc;color:#8a5a00;font-weight:700'):'background:#eef6ef;color:#2e7d4f')+'">'+p.sc+': '+esc(p.txt)+'</span>').join('')+'</span></span></label>';
    const pend=info.filter(i=>!done[i.n]),bought=info.filter(i=>done[i.n]);
    const bySuc={Refugio:[],'Álamos':[]};
    pend.forEach(i=>i.per.forEach(p=>{if(p.low)bySuc[p.sc].push({n:i.n,txt:p.txt,empty:p.empty});}));
    LIST=[];
    ['Refugio','Álamos'].forEach(sc=>{const arr=bySuc[sc].sort((x,y)=>(y.empty-x.empty)||x.n.localeCompare(y.n));
      if(arr.length){if(LIST.length)LIST.push('');LIST.push('*'+sc+'*');arr.forEach(x=>LIST.push('• '+x.n+' — '+x.txt));}});
    const urg=pend.filter(i=>i.urgent),low=pend.filter(i=>!i.urgent);
    const top='<div style="'+card+'"><h3 style="'+h2+'">🛒 Qué comprar</h3>'+
      (info.length?'<div></div>'+
        (urg.length?'<div style="margin-top:10px;font-weight:800;color:#b3261e">🔴 Urgente · se acabó</div>'+urg.map(row).join(''):'')+
        (low.length?'<div style="margin-top:14px;font-weight:800;color:#8a5a00">🟠 Queda poco</div>'+low.map(row).join(''):'')+
        (!pend.length?'<div style="color:#2e9e5b;font-weight:700;padding:10px 0">✅ Ya compraste todo lo de esta lista</div>':'')+
        (bought.length?'<div style="margin-top:14px;font-weight:800;color:#2e7d4f">✅ Ya comprado ('+bought.length+') · toca para regresarlo</div>'+bought.map(row).join(''):'')
        :'<div style="color:#2e9e5b;font-weight:700;padding:8px 0">✅ No hay nada que comprar</div>')+
      '<button id="cmpWA" style="width:100%;margin-top:12px;padding:13px;border:0;border-radius:12px;background:#25D366;color:#fff;font-weight:800;font-size:15px;cursor:pointer">Enviar lista por WhatsApp</button></div>';
    const link='<div style="'+card+'"><h3 style="'+h2+'">Liga para el coordinador</h3><div style="font-size:12px;color:#888;margin-bottom:8px">El coordinador llena el inventario aquí (no entra a Sobres):</div><input readonly value="'+esc(FORM_URL)+'" style="width:100%;padding:11px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:13px"><button id="cmpCopy" style="width:100%;margin-top:8px;padding:12px;border:1.5px solid #e8e0cc;border-radius:12px;background:#fff;font-weight:700;cursor:pointer">Copiar liga</button></div>';
    v.innerHTML=top+'<details style="margin-bottom:14px"><summary style="cursor:pointer;padding:12px 4px;font-weight:700">Ver detalle por sucursal</summary>'+html+'</details>'+link+'<div style="text-align:center"><button id="cmpRe" style="padding:10px 18px;border:1.5px solid #e8e0cc;border-radius:10px;background:#fff;cursor:pointer">Actualizar</button></div>';
    v.querySelectorAll('input[type=checkbox][data-n]').forEach(c=>c.onchange=()=>{st.items[c.dataset.n]=c.checked;localStorage.setItem('pcc_done2',JSON.stringify(st));render();});
    const wa=document.getElementById('cmpWA');if(wa)wa.onclick=()=>{if(!LIST.length){alert('No hay nada pendiente por comprar');return;}window.open('https://wa.me/?text='+encodeURIComponent('🛒 Por comprar · Patio Cinco\n\n'+LIST.join('\n')),'_blank');};
    document.getElementById('cmpCopy').onclick=()=>navigator.clipboard.writeText(FORM_URL).then(()=>alert('Liga copiada'));
    document.getElementById('cmpRe').onclick=render;
  }

  function install(){
    const anchor=document.getElementById('suctab-insumos'),host=document.getElementById('suc-view-insumos');
    if(!anchor||!host||document.getElementById('suctab-compras'))return !!document.getElementById('suctab-compras');
    const btn=anchor.cloneNode(false);
    btn.id='suctab-compras';btn.removeAttribute('onclick');btn.textContent='Compras';
    btn.onclick=()=>window.setSucTab('compras');
    anchor.after(btn);
    const view=document.createElement('div');view.id='suc-view-compras';view.style.display='none';
    host.after(view);
    const orig=window.setSucTab;
    window.setSucTab=function(tab){
      orig(tab);
      const on=tab==='compras';
      view.style.display=on?'block':'none';
      btn.style.background=on?'#111':'#f0ede6';btn.style.color=on?'#fff':'#555';
      if(on){['pagos','performance','hist','ranking','insumos'].forEach(t=>{const e=document.getElementById('suc-view-'+t);if(e)e.style.display='none';});render();}
    };
    return true;
  }
  let n=0;const iv=setInterval(()=>{if(install()||++n>60)clearInterval(iv);},500);
})();
