const admin = require('firebase-admin');
if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))});
}
module.exports = async function handler(req,res) {
  res.setHeader('Access-Control-Allow-Origin',process.env.CHAT_ALLOWED_ORIGIN||'https://ehometech.github.io');
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({error:'Nur POST erlaubt.'});
  if(req.headers.origin!==(process.env.CHAT_ALLOWED_ORIGIN||'https://ehometech.github.io'))return res.status(403).json({error:'Origin nicht erlaubt.'});
  if(!process.env.OPENAI_API_KEY||!admin.apps.length)return res.status(503).json({error:'Server nicht eingerichtet.'});
  const match=/^Bearer (.+)$/.exec(req.headers.authorization||'');
  if(!match)return res.status(401).json({error:'Anmeldung erforderlich.'});
  let auth;try{auth=await admin.auth().verifyIdToken(match[1],true)}catch(e){return res.status(401).json({error:'Anmeldung ungültig.'})}
  if(auth.firebase?.sign_in_provider==='anonymous')return res.status(403).json({error:'Anonyme Anmeldung nicht erlaubt.'});
  const question=typeof req.body?.question==='string'?req.body.question.trim():'';
  if(!question||question.length>1500)return res.status(400).json({error:'Frage muss 1–1500 Zeichen enthalten.'});
  try {
    const api=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',tools:[{type:'web_search_preview'}],input:[{role:'system',content:'Du bist der ANVOLT KI-Assistent für Mitarbeiter eines Elektrofachbetriebs. Antworte verständlich auf Deutsch oder Vietnamesisch entsprechend der Frage. Nutze aktuelle Quellen bei technischen Angaben. Bei elektrischen Sicherheitsfragen keine unbelegten Normbehauptungen; weise auf Fachprüfung und aktuelle Herstellerangaben hin. Gib Quellen möglichst an. Keine personenbezogenen Daten anfordern.'},{role:'user',content:question}],max_output_tokens:900})});
    const data=await api.json();
    if(!api.ok)throw new Error(data.error?.message||'KI-Dienst nicht verfügbar');
    const answer=(data.output||[]).flatMap(o=>o.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
    const sources=[...new Set((data.output||[]).flatMap(o=>o.content||[]).flatMap(c=>c.annotations||[]).map(a=>a.url).filter(u=>typeof u==='string'&&u.startsWith('https://')))];
    return res.status(200).json({answer:answer||'Keine Antwort gefunden.',sources});
  }catch(e){return res.status(502).json({error:'Die KI-Antwort konnte nicht geladen werden.'})}
};
