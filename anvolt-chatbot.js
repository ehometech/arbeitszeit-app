/* ANVOLT KI-Chatbot – erscheint ausschließlich in der angemeldeten App. */
(function(){
  const API_URL = 'https://YOUR-VERCEL-PROJECT.vercel.app/api/chat';
  const css = document.createElement('style');
  css.textContent = `
  #anvoltChatLauncher{position:fixed;right:16px;bottom:88px;z-index:1100;border:0;border-radius:28px;background:#1d4ed8;color:white;padding:12px 16px;font-weight:700;box-shadow:0 6px 22px #0003;cursor:pointer;display:none}
  #anvoltChatPanel{position:fixed;z-index:1101;right:12px;bottom:144px;width:min(410px,calc(100vw - 24px));height:min(570px,calc(100dvh - 165px));background:white;border-radius:16px;box-shadow:0 16px 60px #0004;display:none;flex-direction:column;overflow:hidden;border:1px solid #dbe3ee}
  #anvoltChatPanel.open{display:flex}#anvoltChatHeader{background:#111827;color:white;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;font-weight:700}
  #anvoltChatMessages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;white-space:pre-wrap;font-size:13px}
  .anvoltChatMsg{padding:9px 11px;border-radius:12px;line-height:1.5;max-width:95%;overflow-wrap:anywhere}
  .anvoltChatMsg.user{align-self:flex-end;background:#dbeafe}.anvoltChatMsg.bot{align-self:flex-start;background:#f3f4f6}
  #anvoltChatForm{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e7eb}#anvoltChatInput{flex:1;min-width:0}
  #anvoltChatSend{width:auto;background:#1d4ed8;color:white;border:0;border-radius:8px;padding:8px 11px;cursor:pointer}
  #anvoltChatLinks{font-size:11px}
  `;
  document.head.appendChild(css);
  const launch=document.createElement('button');launch.id='anvoltChatLauncher';launch.type='button';launch.textContent='🤖 ANVOLT KI';
  const panel=document.createElement('section');panel.id='anvoltChatPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','ANVOLT KI-Assistent');
  panel.innerHTML='<div id="anvoltChatHeader"><span>🤖 ANVOLT KI · Internetsuche</span><button type="button" id="anvoltChatClose" aria-label="Schließen" style="width:auto;background:none;color:white;border:none;font-size:22px;cursor:pointer">×</button></div><div id="anvoltChatMessages" aria-live="polite"></div><form id="anvoltChatForm"><input id="anvoltChatInput" autocomplete="off" maxlength="1500" placeholder="Frage stellen …" aria-label="Frage"/><button id="anvoltChatSend" type="submit">Senden</button></form>';
  document.body.append(launch,panel);
  const messages=panel.querySelector('#anvoltChatMessages'),input=panel.querySelector('#anvoltChatInput'),send=panel.querySelector('#anvoltChatSend');
  function addMessage(message,kind,links){
    const p=document.createElement('div');p.className='anvoltChatMsg '+kind;p.textContent=message;messages.appendChild(p);
    if(Array.isArray(links)&&links.length){const box=document.createElement('div');box.id='anvoltChatLinks';box.textContent='Quellen: ';links.slice(0,5).forEach((link,i)=>{try{const u=new URL(link);if(u.protocol!=='https:')return;const a=document.createElement('a');a.href=u.href;a.textContent=u.hostname;a.target='_blank';a.rel='noopener noreferrer';box.appendChild(a);box.append(' ')}catch(e){}});messages.appendChild(box)}
    messages.scrollTop=messages.scrollHeight;
  }
  addMessage('Hallo! Ich helfe bei Elektro, PV, Technik und allgemeinen Fragen. Internetquellen werden, soweit verfügbar, verlinkt.','bot');
  let busy=false;
  function loggedIn(){return typeof currentUser!=='undefined'&&!!currentUser&&document.getElementById('mainApp')?.style.display!=='none'}
  function refresh(){const yes=loggedIn();launch.style.display=yes?'block':'none';if(!yes){panel.classList.remove('open');messages.querySelectorAll('.anvoltChatMsg.user').forEach(e=>e.remove());}}
  launch.onclick=()=>{refresh();if(loggedIn()){panel.classList.toggle('open');if(panel.classList.contains('open'))input.focus()}};
  panel.querySelector('#anvoltChatClose').onclick=()=>panel.classList.remove('open');
  new MutationObserver(refresh).observe(document.getElementById('mainApp'),{attributes:true,attributeFilter:['style']});
  setInterval(refresh,1200);refresh();
  panel.querySelector('#anvoltChatForm').onsubmit=async e=>{
    e.preventDefault();if(busy||!loggedIn())return;
    const question=input.value.trim();if(!question)return;
    input.value='';addMessage(question,'user');busy=true;send.disabled=true;
    try{
      // Firebase Auth ID-Tokens sind erforderlich. Die aktuelle PIN-Anmeldung allein
      // ist KEINE sichere Backend-Authentifizierung und darf nicht als solche behandelt werden.
      const auth=window.firebase&&firebase.auth?firebase.auth():null;
      const account=auth&&auth.currentUser;
      if(!account)throw new Error('Der Chat benötigt eine sichere Firebase-Anmeldung. Die bestehende PIN-Anmeldung muss dafür noch angebunden werden.');
      if(API_URL.includes('YOUR-VERCEL-PROJECT'))throw new Error('Die Server-Adresse für den Chat wurde noch nicht eingerichtet.');
      const token=await account.getIdToken();
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),35000);
      let res;try{res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({question}),signal:controller.signal})}finally{clearTimeout(timeout)}
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Der Chat-Server ist derzeit nicht verfügbar.');
      addMessage(data.answer||'Keine Antwort erhalten.','bot',data.sources);
    }catch(err){addMessage(err.name==='AbortError'?'Die Anfrage hat zu lange gedauert.':err.message,'bot')}
    finally{busy=false;send.disabled=false;input.focus()}
  };
})();
