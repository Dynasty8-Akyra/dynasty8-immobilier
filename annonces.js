const KEY='dynasty8_annonces_v12';
const defaults=[{id:'demo-1',name:'Villa Eclipse',type:'Villa',area:'Vinewood Hills',price:2850000,surface:480,photo:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000',description:'Villa contemporaine avec terrasse et piscine.'},{id:'demo-2',name:'Penthouse Imperial',type:'Appartement',area:'Downtown Los Santos',price:1250000,surface:265,photo:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000',description:'Penthouse avec vue panoramique sur la ville.'}];
function getAnnonces(){try{const d=JSON.parse(localStorage.getItem(KEY));return Array.isArray(d)?d:defaults}catch{return defaults}}
function saveAnnonces(d){localStorage.setItem(KEY,JSON.stringify(d))}
function money(n){return new Intl.NumberFormat('fr-FR').format(n)+' $'}
function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
