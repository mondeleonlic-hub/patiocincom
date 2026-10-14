/* Catálogo ÚNICO de artículos de inventario (lo usan inventario.html y el menú Inventario de Sobres).
   t:'jug' = líquido/bote con nivel · t:'n' = conteo
   L:1 = solo inventario LARGO · C:1 = solo CORTO · sin marca = en los dos
   cap:1 = botella de 1 L · tin:1 = bote de cera · dc:1 = capacidad editable (1,5,10,20 L) */
window.INV_CATS=[
{id:'q',name:'Químicos',items:[
{k:'shampoo',n:'Shampoo',t:'jug',min:.25},
{k:'cera_express',n:'Cera express',t:'jug',min:.25},
{k:'armor_all',n:'Armor all',t:'jug',min:.1},
{k:'filtro_conc',n:'Filtro solar',sub:'para diluir',t:'jug',min:.25},
{k:'filtro_dil',n:'Filtro solar',sub:'ya diluido',t:'jug',min:.5,dep:'filtro_conc'},
{k:'desengr_conc',n:'Desengrasante',sub:'para diluir',t:'jug',min:.25},
{k:'desengr_dil',n:'Desengrasante',sub:'ya diluido',t:'jug',min:.25,dep:'desengr_conc'},
{k:'diesel',n:'Diesel',t:'jug',min:.25},
{k:'abrillantas',n:'Abrillantas',t:'jug',min:.25}]},
{id:'ar',name:'Aromas',items:[
{k:'aromas',n:'Aromas',sub:'esencia, botellas de 1 L',t:'jug',min:null,cap:1,C:1},
{k:'aroma_coco',n:'Concentrado Coco',sub:'esencia, botellas de 1 L',t:'jug',min:.25,cap:1,L:1},
{k:'aroma_polo',n:'Concentrado Polo Sport',sub:'esencia, botellas de 1 L',t:'jug',min:.25,cap:1,L:1},
{k:'aroma_nuevo',n:'Concentrado Auto Nuevo',sub:'esencia, botellas de 1 L',t:'jug',min:.25,cap:1,L:1},
{k:'aroma_pc',n:'Aroma Patio Cinco',sub:'esencia, botellas de 1 L',t:'jug',min:.25,cap:1,L:1},
{k:'frasco_aroma',n:'Frascos de aroma',t:'n',min:null,L:1},
{k:'atom_aroma',n:'Atomizadores de frasco de aroma',t:'n',min:null,L:1}]},
{id:'ac',name:'Accesorios',items:[
{k:'cepillos',n:'Cepillos',t:'n',min:3},
{k:'esponja',n:'Esponja',sub:'bolsas',t:'n',min:0,C:1},
{k:'esponja_gde',n:'Esponjas grandes',t:'n',min:null,L:1},
{k:'esponja_peq',n:'Esponjas pequeñas',t:'n',min:null,L:1},
{k:'cubeta',n:'Cubeta',t:'n',min:1},
{k:'atomizador',n:'Atomizador',t:'n',min:3},
{k:'piedra',n:'Piedra',t:'n',min:2},
{k:'quita_pelos',n:'Quita pelos',t:'n',min:null,L:1}]},
{id:'h',name:'Herramientas',items:[
{k:'bolsas_basura',n:'Bolsas de basura',sub:'paquetes',t:'n',min:1},
{k:'escoba',n:'Escoba',t:'n',min:0},
{k:'plumones',n:'Plumones',t:'n',min:1},
{k:'hidro_ok',n:'Hidrolavadoras funcionando',t:'n',min:null,L:1},
{k:'hidro_roto',n:'Hidrolavadoras sin funcionar',t:'n',min:null,L:1},
{k:'pist_hidro',n:'Pistolas de hidrolavadora',t:'n',min:null,L:1},
{k:'espumador',n:'Pistolas de espuma',sub:'espumador',t:'n',min:null,L:1},
{k:'mang_agua',n:'Mangueras de agua',t:'n',min:null,L:1},
{k:'mang_shampoo',n:'Mangueras de shampoo',t:'n',min:null,L:1},
{k:'mang_aire',n:'Mangueras de aire',t:'n',min:null,L:1},
{k:'pist_aire',n:'Pistolas de aire',sub:'para sopletear',t:'n',min:null,L:1},
{k:'pulidora',n:'Pulidora',t:'n',min:null,L:1},
{k:'botes',n:'Botes de basura',t:'n',min:null,L:1},
{k:'pala',n:'Pala',t:'n',min:null,L:1},
{k:'conos',n:'Conos',t:'n',min:null,L:1}]},
{id:'tr',name:'Trapos',items:[
{k:'carbrite',n:'CarBrite',t:'n',min:2},
{k:'mf_negra',n:'Microfibra negra',t:'n',min:3},
{k:'mf_azul',n:'Microfibra azul',t:'n',min:3},
{k:'mf_amarilla',n:'Microfibra amarilla',t:'n',min:3},
{k:'franela',n:'Franela de vidrios',t:'n',min:3},
{k:'peluche',n:'Peluche',t:'n',min:2},
{k:'trapo_vid_azul',n:'Trapo de vidrios azul',t:'n',min:null,L:1},
{k:'gamuza',n:'Trapo de gamuza',t:'n',min:null,L:1}]},
{id:'a',name:'Aspiradoras',items:[
{k:'asp_act',n:'Aspiradoras activas',t:'n',min:0},
{k:'asp_res',n:'Aspiradoras reserva',t:'n',min:0},
{k:'asp_roto',n:'Aspiradora sin funcionar',t:'n',min:null},
{k:'filtro_asp',n:'Filtros de aspiradora',sub:'de repuesto',t:'n',min:1,L:1},
{k:'bolsa_asp',n:'Bolsas de aspiradora',sub:'de repuesto',t:'n',min:1,L:1}]},
{id:'d',name:'Detallado simple',nl:'Detallado',items:[
{k:'cera_tempo',n:'Cera Tempo',t:'jug',tin:1,cap:1,min:.25},
{k:'cera_meg',n:'Cera Meguiars',t:'jug',tin:1,cap:1,min:.25},
{k:'cera_turtle',n:'Cera Turtle Wax',t:'jug',tin:1,cap:1,min:null,L:1},
{k:'quitagotas',n:'Quita gotas',t:'jug',min:.25},
{k:'alumbra',n:'Alumbra',t:'jug',min:.25},
{k:'restaurador',n:'Restaurador de molduras (azul)',t:'jug',min:.25},
{k:'polish',n:'Polish',sub:'botellas de 1 L',t:'jug',cap:1,min:.25,L:1},
{k:'pulidor_grueso',n:'Pulidor grueso',t:'jug',dc:1,min:null,L:1},
{k:'pulidor_fino',n:'Pulidor fino',t:'jug',dc:1,min:null,L:1},
{k:'quita_etiq',n:'Quita etiquetas',sub:'botellas de 1 L',t:'jug',cap:1,min:.25,L:1},
{k:'apc',n:'APC',sub:'shampoo de vestiduras',t:'jug',dc:1,min:.25,L:1},
{k:'pads',n:'Discos para pulir',t:'n',min:null,L:1},
{k:'plastilina',n:'Plastilina automotriz',t:'n',min:null,L:1},
{k:'lub_plastilina',n:'Lubricante de plastilina',t:'jug',dc:1,min:null,L:1},
{k:'lija_1000',n:'Lija 1000',t:'n',min:null,L:1},
{k:'tiner',n:'Tíner',t:'jug',dc:1,min:null,L:1},
{k:'descont_vidrios',n:'Descontaminador de vidrios',t:'jug',dc:1,min:null,L:1},
{k:'descont_rines',n:'Descontaminador de rines',t:'jug',dc:1,min:null,L:1},
{k:'rem_mosco',n:'Removedor de mosco',t:'jug',dc:1,min:null,L:1},
{k:'hid_viniles',n:'Hidratante de viniles',t:'jug',dc:1,min:null,L:1},
{k:'hid_plasticos',n:'Hidratante de plásticos',t:'jug',dc:1,min:null,L:1},
{k:'trat_piel',n:'Tratamiento de piel',t:'jug',dc:1,min:null,L:1},
{k:'shampoo_cera',n:'Shampoo con cera',t:'jug',dc:1,min:null,L:1},
{k:'jabon_manchas',n:'Jabón quita manchas',t:'jug',dc:1,min:null,L:1},
{k:'ceramic',n:'Ceramic coating',t:'jug',dc:1,min:null,L:1},
{k:'desengr_xf',n:'Desengrasante extra fuerte',t:'jug',dc:1,min:null,L:1}]},
{id:'c',name:'Consumibles',items:[
{k:'jabon_polvo',n:'Jabón en polvo',sub:'bolsas',t:'n',min:1,L:1},
{k:'jabon_roma',n:'Jabón Roma',sub:'bolsas',t:'n',min:1,L:1},
{k:'cloro',n:'Cloro',sub:'botellas',t:'n',min:1,L:1},
{k:'limpiador',n:'Limpiador de baño y pisos',sub:'botellas',t:'n',min:1,L:1},
{k:'garrafon',n:'Garrafones de agua',t:'n',min:null,L:1}]},
{id:'u',name:'Uniformes y otros',items:[
{k:'sombrillas',n:'Sombrillas',t:'n',min:null,L:1},
{k:'ponchos',n:'Ponchos',t:'n',min:null,L:1},
{k:'uniformes',n:'Uniformes',sub:'escribe las tallas en Notas',t:'n',min:null,L:1}]}
];
/* unidad por defecto de un artículo */
window.invDefUnit=function(i,capNow){
  if(i.t==='jug')return i.tin?'bote':((i.cap||capNow||20)<=1?'botella':'bidón');
  return ['bolsas','paquetes','botellas'].includes(i.sub)?i.sub:'pzas';
};
