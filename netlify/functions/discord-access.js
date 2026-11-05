
const GUILD='1567889374836957286';
const DIRECTOR='1567889789569728583';
const CONFIRMED='1567889964639723631';
const json=(code,obj)=>({statusCode:code,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'},body:JSON.stringify(obj)});
async function api(url,options={}){
 const r=await fetch(url,options);
 const txt=await r.text();
 let body;try{body=txt?JSON.parse(txt):null}catch{body={message:txt.slice(0,100)}}
 if(!r.ok)throw Object.assign(new Error(body?.message||'Service indisponible'),{status:r.status});
 return body;
}
exports.handler=async(event)=>{
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,DELETE'},body:''};
 const url=process.env.SUPABASE_URL;
 const publicKey=process.env.SUPABASE_PUBLISHABLE_KEY;
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const bot=process.env.DISCORD_BOT_TOKEN;
 if(!url||!publicKey||!serviceKey||!bot)return json(503,{error:'Configuration serveur incomplète. Contactez la direction.'});
 const token=(event.headers.authorization||event.headers.Authorization||'').match(/^Bearer (.+)$/i)?.[1];
 if(!token)return json(401,{error:'Connexion Discord nécessaire.'});
 try{
  const user=await api(url+'/auth/v1/user',{headers:{apikey:publicKey,authorization:'Bearer '+token}});
  const identities=user.identities||[];
  const discord=identities.find(i=>i.provider==='discord');
  // A Supabase Discord identity's `id` is the provider user ID.
  const discordId=discord?.id;
  if(!discordId||!/^\d{17,22}$/.test(discordId))return json(403,{error:'Compte non lié à Discord.'});
  let member;
  try{member=await api('https://discord.com/api/v10/guilds/'+GUILD+'/members/'+discordId,{headers:{authorization:'Bot '+bot}})}
  catch(e){if(e.status===404)return json(403,{error:'Vous ne faites pas partie du Discord Dynasty 8.'});throw e}
  const roles=member.roles||[];
  const role=roles.includes(DIRECTOR)?'direction':roles.includes(CONFIRMED)?'confirme':'lecture';
  const action=event.queryStringParameters?.action||'status';
  if(action==='status'&&event.httpMethod==='GET')return json(200,{role,canWrite:role!=='lecture'});
  if(role==='lecture')return json(403,{error:'Seuls la Direction et les Agents confirmés peuvent gérer les annonces.'});
  const endpoint=url+'/rest/v1/properties';
  const serviceHeaders={apikey:serviceKey,authorization:'Bearer '+serviceKey,'content-type':'application/json'};
  if(action==='save'&&event.httpMethod==='POST'){
   if((event.body||'').length>15000)return json(413,{error:'Annonce trop volumineuse.'});
   let p;try{p=JSON.parse(event.body||'')}catch{return json(400,{error:'Annonce invalide.'})}
   const keys=['id','name','type','area','price','surface','photo','description'];
   const clean=Object.fromEntries(keys.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));
   if(typeof clean.id!=='string'||clean.id.length>100||!/^[a-zA-Z0-9_-]+$/.test(clean.id)||typeof clean.name!=='string'||!clean.name.trim()||clean.name.length>100||typeof clean.area!=='string'||!clean.area.trim()||clean.area.length>100||!['Villa','Appartement','Commerce','Garage','Entrepôt','Terrain'].includes(clean.type)||!Number.isFinite(clean.price)||clean.price<0||!Number.isFinite(clean.surface)||clean.surface<0||typeof clean.description!=='string'||clean.description.length>2000||typeof clean.photo!=='string'||clean.photo.length>2000||!/^https:\/\//.test(clean.photo))return json(400,{error:'Vérifiez les champs de votre annonce.'});
   await api(endpoint+'?on_conflict=id',{method:'POST',headers:{...serviceHeaders,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(clean)});
   return json(200,{ok:true});
  }
  if(action==='delete'&&event.httpMethod==='DELETE'){
   const id=event.queryStringParameters?.id||'';
   if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return json(400,{error:'Identifiant incorrect.'});
   await api(endpoint+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:serviceHeaders});
   return json(200,{ok:true});
  }
  return json(405,{error:'Action non autorisée.'});
 }catch(e){return json(e.status===401?401:503,{error:e.status===401?'Session expirée. Reconnectez-vous.':'Vérification sécurisée indisponible. Réessayez plus tard.'})}
};
