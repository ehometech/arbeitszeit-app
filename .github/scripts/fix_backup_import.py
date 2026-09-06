from pathlib import Path
import re

p = Path('index.html')
text = p.read_text(encoding='utf-8')

new_section = r'''// ============ BACKUP / IMPORT ============
function exportBackup(){
  var data={
    APP_PIN:APP_PIN,
    employees:employees,
    entries:entries,
    fotos:fotos,
    firma:firma,
    baustellen:baustellen,
    timers:timers,
    protokolle:protokolle,
    komponentenDB:komponentenDB,
    arbeitsberichte:arbeitsberichte,
    dokumente:dokumente,
    exportedAt:new Date().toISOString(),
    version:15
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='arbeitszeit-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importBackup(event){
  var file=event.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(data.APP_PIN)APP_PIN=data.APP_PIN;
      if(Array.isArray(data.employees))employees=data.employees;
      if(Array.isArray(data.entries))entries=data.entries;
      if(Array.isArray(data.fotos))fotos=data.fotos;
      if(data.firma&&typeof data.firma==='object')firma=data.firma;
      if(Array.isArray(data.baustellen))baustellen=data.baustellen;
      if(data.timers&&typeof data.timers==='object')timers=data.timers;
      if(Array.isArray(data.protokolle))protokolle=data.protokolle;
      if(data.komponentenDB&&typeof data.komponentenDB==='object')komponentenDB=data.komponentenDB;
      if(Array.isArray(data.arbeitsberichte))arbeitsberichte=data.arbeitsberichte;
      if(Array.isArray(data.dokumente))dokumente=data.dokumente;
      Promise.resolve(saveData()).then(function(){
        alert('Backup erfolgreich importiert.');
        location.reload();
      }).catch(function(err){
        console.warn('Cloud-Speichern nach Import fehlgeschlagen:',err);
        alert('Backup lokal importiert. Cloud-Synchronisierung wird erneut versucht.');
        location.reload();
      });
    }catch(err){
      console.error('Backup-Import fehlgeschlagen:',err);
      alert('Ungültige Backup-Datei');
    }
  };
  reader.readAsText(file);
}

// ============ PDF / CSV EXPORT ============'''

pattern = re.compile(
    r'// ============ BACKUP / IMPORT ============.*?// ============ PDF / CSV EXPORT ============',
    re.S,
)
patched, count = pattern.subn(lambda m: new_section, text, count=1)
if count != 1:
    raise SystemExit(f'Backup-Bereich nicht eindeutig gefunden: {count}')

old_hours = "function berichtStunden(p){return (p.zeiten||[]).reduce(function(a,r){return a+(Number(r.h)||0);},0);}"
new_hours = """function berichtZeitStunden(r){
  var st=String((r&&r.start)||''),en=String((r&&r.end)||'');
  var m1=st.match(/^(\\d{1,2}):(\\d{2})$/),m2=en.match(/^(\\d{1,2}):(\\d{2})$/);
  if(m1&&m2){
    var startMin=Number(m1[1])*60+Number(m1[2]);
    var endMin=Number(m2[1])*60+Number(m2[2]);
    var netto=endMin-startMin-(Number(r.pause)||0);
    if(netto>=0)return netto/60;
  }
  return Number(r&&r.h)||0;
}
function berichtStunden(p){return (p.zeiten||[]).reduce(function(a,r){return a+berichtZeitStunden(r);},0);}"""
if old_hours in patched:
    patched = patched.replace(old_hours, new_hours, 1)
elif 'function berichtZeitStunden(r)' not in patched:
    raise SystemExit('berichtStunden-Funktion nicht gefunden')

p.write_text(patched, encoding='utf-8')

check = p.read_text(encoding='utf-8')
required = [
    'arbeitsberichte:arbeitsberichte',
    'komponentenDB:komponentenDB',
    'dokumente:dokumente',
    'if(Array.isArray(data.arbeitsberichte))arbeitsberichte=data.arbeitsberichte;',
    'if(Array.isArray(data.baustellen))baustellen=data.baustellen;',
    'if(Array.isArray(data.protokolle))protokolle=data.protokolle;',
    'function berichtZeitStunden(r)',
]
missing = [x for x in required if x not in check]
if missing:
    raise SystemExit('Prüfung fehlgeschlagen: ' + ', '.join(missing))
print('Backup Import/Export und minutengenaue Berichtsstunden erfolgreich gepatcht.')
