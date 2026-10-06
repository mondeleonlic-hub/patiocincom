/* Patio Cinco · módulo Compras/Inventarios para Sobres (solo administradora) */
(function(){
  const NAMES={'Shampoo':['shampoo','j'],'Cera express':['cera_express','j'],'Armor all':['armor_all','j'],'Filtro solar (para diluir)':['filtro_conc','j'],'Filtro solar (ya diluido)':['filtro_dil','j'],'Desengrasante (para diluir)':['desengr_conc','j'],'Desengrasante (ya diluido)':['desengr_dil','j'],'Diesel':['diesel','j'],'Abrillantas':['abrillantas','j'],'CarBrite':['carbrite','n'],'Microfibra negra':['mf_negra','n'],'Microfibra azul':['mf_azul','n'],'Microfibra amarilla':['mf_amarilla','n'],'Franela de vidrios':['franela','n'],'Cepillos':['cepillos','n'],'Atomizador':['atomizador','n'],'Piedra':['piedra','n'],'Cubeta':['cubeta','n'],'Cera Tempo':['cera_tempo','t'],'Cera Meguiars':['cera_meg','t'],'Quita gotas':['quitagotas','j'],'Alumbra':['alumbra','j'],'Restaurador de molduras (azul)':['restaurador','j']};
  const FORM_URL=location.origin+location.pathname.replace(/[^\/]*$/,'')+'inventario.html';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function fmt(v){const w=Math.floor(v+1e-9),f=+(v-w).toFixed(2);if(!f)return String(w);const m={.1:'1/10',.25:'1/4',.5:'1/2',.75:'3/4'}[f]||Math.round(f*100)+'%';return w?w+' '+m:m;}
  function qty(name,rec){
    const m=NAMES[name];if(!m||!rec.v)return'';const v=rec.v[m[0]];if(v==null)return'';
    if(m[1]==='j'){const l=rec.l&&rec.l[m[0]];return fmt(v)+' bidón'+(l!=null?' ('+l+' L)':'');}
    if(m[1]==='t')return fmt(v)+' bote';
    return v+' pzas';
  }
  const DB=()=>firebase.firestore();
  const card='background:#fff;border:1px solid #e8e0cc;border-radius:16px;padding:14px;margin-bottom:14px';
  const h2='margin:0 0 6px;font-size:15px;color:#C8960C;text-transform:uppercase;letter-spacing:.5px';
  let LIST=[];

  async function render(){
    const v=document.getElementById('suc-view-compras');if(!v)return;
    v.innerHTML='<div style="'+card+'">Cargando…</div>';
    let html='',merged={};
    const hist=[];
    for(const [sl,nm] of [['refugio','Refugio'],['alamos','Álamos']]){
      let rec=null;
      try{const d=await DB().collection('pc_sobres').doc('inv_last_'+sl).get();if(d.exists)rec=d.data();}catch(e){console.warn(e)}
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
    LIST=names.map(n=>n+' — '+merged[n].join(' | '));
    const done=JSON.parse(localStorage.getItem('pcc_done')||'{}');
    const top='<div style="'+card+'"><h3 style="'+h2+'">🛒 Lista de compras</h3><div style="font-size:12px;color:#888;margin-bottom:6px">'+(names.length?names.length+' producto(s) por comprar · suma de las dos sucursales':'')+'</div>'+
      (names.length?names.map(n=>'<label style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0ebdc;'+(done[n]?'opacity:.45;text-decoration:line-through':'')+'"><input type="checkbox" '+(done[n]?'checked':'')+' data-n="'+esc(n)+'" style="width:20px;height:20px"><span><b>'+esc(n)+'</b><br><small style="color:#888">'+esc(merged[n].join(' · '))+'</small></span></label>').join(''):'<div style="color:#2e9e5b;font-weight:700">✅ No hay nada que comprar</div>')+
      '<button id="cmpWA" style="width:100%;margin-top:12px;padding:13px;border:0;border-radius:12px;background:#25D366;color:#fff;font-weight:800;font-size:15px;cursor:pointer">Enviar lista por WhatsApp</button></div>';
    const link='<div style="'+card+'"><h3 style="'+h2+'">Liga para los lavadores</h3><div style="font-size:12px;color:#888;margin-bottom:8px">Ellos llenan el inventario aquí (no entran a Sobres):</div><input readonly value="'+esc(FORM_URL)+'" style="width:100%;padding:11px;border:1.5px solid #e8e0cc;border-radius:10px;font-size:13px"><button id="cmpCopy" style="width:100%;margin-top:8px;padding:12px;border:1.5px solid #e8e0cc;border-radius:12px;background:#fff;font-weight:700;cursor:pointer">Copiar liga</button></div>';
    v.innerHTML=top+html+link+'<div style="text-align:center"><button id="cmpRe" style="padding:10px 18px;border:1.5px solid #e8e0cc;border-radius:10px;background:#fff;cursor:pointer">Actualizar</button></div>';
    v.querySelectorAll('input[type=checkbox][data-n]').forEach(c=>c.onchange=()=>{const d=JSON.parse(localStorage.getItem('pcc_done')||'{}');d[c.dataset.n]=c.checked;localStorage.setItem('pcc_done',JSON.stringify(d));render();});
    const wa=document.getElementById('cmpWA');if(wa)wa.onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent('🛒 Compras Patio Cinco\n\n'+LIST.map(x=>'• '+x).join('\n')),'_blank');
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
