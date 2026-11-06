
(function(){
const c=window.DYNASTY8_SUPABASE||{},storage='dynasty8_discord_session_v18';
const ready=()=>!!(c.url&&c.anonKey);
const get=()=>{try{return JSON.parse(sessionStorage.getItem(storage)||'null')}catch{return null}};
const set=s=>s?sessionStorage.setItem(storage,JSON.stringify(s)):sessionStorage.removeItem(storage);
async function req(path,opt={},token){
 const r=await fetch(c.url.replace(/\/$/,'')+path,{...opt,headers:{apikey:c.anonKey,...(token?{authorization:'Bearer '+token}:{}),...(opt.headers||{})}});
 const t=await r.text();let body=null;try{body=t?JSON.parse(t):null}catch{throw Error('Réponse JSON incorrecte')}
 if(!r.ok)throw Error(body?.msg||body?.message||body?.error||'Supabase '+r.status);return body;
}
async function token(){
 const s=get();if(!s)return null;
 if(Date.now()<s.expires_at-60000)return s.access_token;
 try{const n=await req('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});set({...n,expires_at:Date.now()+n.expires_in*1000});return n.access_token}catch{set(null);return null}
}
async function secured(action,method='GET',body=null,id=''){
 const t=await token();if(!t)throw Error('Connectez-vous avec Discord.');
 const r=await fetch('/api/discord-access?action='+encodeURIComponent(action)+(id?'&id='+encodeURIComponent(id):''),{method,headers:{authorization:'Bearer '+t,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await r.text();let data;try{data=text?JSON.parse(text):{}}catch{throw Error('Réponse serveur incorrecte')}
 if(!r.ok)throw Error(data.error||'Accès refusé.');return data;
}
function consumeCallback(){
 const hash=new URLSearchParams(location.hash.replace(/^#/,''));const access_token=hash.get('access_token'),refresh_token=hash.get('refresh_token'),expires_in=Number(hash.get('expires_in')||3600);
 if(access_token&&refresh_token){set({access_token,refresh_token,expires_at:Date.now()+expires_in*1000});history.replaceState(null,'',location.pathname+location.search);return true}
 const error=hash.get('error_description');if(error)throw Error(error);return false;
}
window.D8Cloud={
 ready,consumeCallback,
 async startDiscord(){const redirect=location.origin+'/agent-login.html';location.assign(c.url.replace(/\/$/,'')+'/auth/v1/authorize?provider=discord&redirect_to='+encodeURIComponent(redirect))},
 async logout(){const t=await token();if(t)try{await req('/auth/v1/logout',{method:'POST'},t)}catch{}set(null)},
 async authenticated(){return !!(await token())},
 async role(){return secured('status')},
 
async saveZone(zone){
  return secured('zones-save','POST',zone);
},

async zoneEditorSource(){
  const t = await token();

  if (!t) {
    throw Error("Connectez-vous avec Discord.");
  }

  const response = await fetch(
    "/api/discord-access?action=zone-editor",
    {
      method: "GET",
      headers: {
        authorization: "Bearer " + t
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    let error = "Accès à l'éditeur refusé.";

    try {
      const data = await response.json();
      error = data.error || error;
    } catch {}

    throw Error(error);
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("javascript")) {
    throw Error("Le serveur n'a pas renvoyé le script attendu.");
  }

  return await response.text();
},

 async isAgent(){try{return (await secured('status')).canWrite}catch{return false}},
 
async isDirection(){
  try {
    const status = await secured('status');
    return status.canEditZones === true;
  } catch {
    return false;
  }
},

 async list(){return req('/rest/v1/properties?select=*&order=name.asc',{method:'GET'})},
 async upsert(p){return secured('save','POST',p)},
 async remove(id){return secured('delete','DELETE',null,id)}
};
})();
