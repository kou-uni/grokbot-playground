/* Presentation only: all competition state comes from the existing event log. */
let arenaSignature = '', arenaRound = 0, arenaLastEvent = '', arenaPaused = false;
let replaySpeed = 1, replayStep = null, audioEnabled = false, selectedArtifact = null;
let artifactManifest = [], artifactPinned = false, toastTimer, bubbleTimer;
const demoMode = Q.get('demo') === '1';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canonicalName = n => Object.keys(CHARS).find(k => k === n) || Object.keys(CHARS).find(k => n.toUpperCase().includes(k.toUpperCase())) || n;
function toast(title, subtitle) {
  if (reducedMotion) return;
  const box = $('scene-toast'); box.replaceChildren(el('small', null, subtitle), el('div', null, title));
  box.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => box.hidden = true, 2600);
}
function speakLine(text) {
  if (!audioEnabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text.slice(0, 150));
  utterance.lang = 'ja-JP'; utterance.rate = 1.12; speechSynthesis.speak(utterance);
}
function openCharacter(name) {
  const c = charOf(name); if (!c) return;
  const box = $('dialog-body'); box.replaceChildren();
  const detail = el('div', 'character-detail'), portrait = el('div'); portrait.innerHTML = avatar(name);
  const info = el('div'); info.append(el('small', 'eyebrow', (c.team || 'ARENA STAFF') + ' / ' + (c.mbti || 'JUDGE')),
    el('h2', null, name), el('p', null, c.catch || c.tone || c.note), el('blockquote', null, '「' + (c.line || 'コードの先に、価値を見る。') + '」'),
    el('small', null, 'キャラクター設定の決め台詞'), el('p', null, c.skill || c.role));
  const actions = el('div', 'detail-actions'), line = el('button', 'plain-btn', '決め台詞を再生');
  line.disabled = !('speechSynthesis' in window); line.onclick = () => { audioEnabled = true; updateAudio(); speakLine(c.line || 'コードの先に、価値を見る。'); };
  const sheet = el('a', null, 'キャラクターシート ↗'); sheet.href = c.sheet; sheet.target = '_blank'; sheet.rel = 'noopener'; actions.append(line,sheet); info.append(actions); detail.append(portrait,info); box.append(detail); $('arena-dialog').showModal();
}
function createWorld(v2, all) {
  const grid = $('world-grid'); grid.replaceChildren();
  for (const t of v2 ? V2TEAMS : ['A','B']) {
    const station = el('section','station'); station.id = 'station-' + t; station.style.setProperty('--team',TEAMS[t].c);
    const head = el('div','station-head'); head.append(el('b',null, TEAMS[t].label),el('span','station-state','STANDBY'));
    const squad = el('div','squad');
    const names = v2 ? Object.keys(MEMBERS).filter(n => MEMBERS[n] === t) : [...new Set(all.filter(m => teamOf(m.from) === t && isMember(m.from)).map(m => m.from))];
    for (const name of names) {
      const bot = el('button','bot'); bot.type='button'; bot.dataset.name = name; bot.setAttribute('aria-label',name + ' のキャラクターを見る');
      bot.innerHTML = avatar(name); bot.append(el('span','effect'),el('span','bot-name',name.replace(/^[AB]・/,'')),el('span','bot-role',charOf(name)?.mbti || 'BOT'));
      bot.onclick = () => openCharacter(name); if(!charOf(name)){bot.disabled=true;bot.setAttribute('aria-label',name+' · 第1回のBot');} squad.append(bot);
    }
    const bench = el('div','bench'); const lights=el('div','worklights'); for(let i=0;i<4;i++) lights.append(el('i'));
    bench.append(el('span',null,'アイデアを待っています'),lights); station.append(head,squad,bench); grid.append(station);
  }
}
function renderJudges(all, v2, T) {
  const box=$('judge-list'); box.replaceChildren();
  document.querySelector('.game-sidebar .panel-sub').textContent=v2?'3つの視点。勝負を決める3票。':'3つの基準。実物を触って採点。';
  document.querySelector('.intro-tag').textContent=v2?'8 personalities. 4 teams. 1 winner.':'2 teams. 2 builds. 1 winner.';
  const now = all.at(-1)?.round || 0;
  const round = now >= (v2 ? 4 : 3) ? (v2 ? 4 : 3) : Math.max(0,...all.filter(m=>m.kind==='採点').map(m=>m.round));
  for (const [i,crit] of (v2 ? CRITS : ['総合']).entries()) {
    const name = v2 ? '審査・'+crit : '審査';
    const event = [...all].reverse().find(m=>m.kind==='採点' && m.round===round && (v2?m.from.includes(crit):true) && complete(m));
    const vote = event && bodyOf(event).match(new RegExp('(?:投票|勝者)\\s*[:：]\\s*(?:チーム)?\\s*'+TEAM_RE,'i'));
    const row=el('div','judge-row'+(vote?' voted':'')); const portrait=el('div'); portrait.innerHTML=avatar(v2?name:'審査・発想');
    const info=el('div'); info.append(el('strong',null,crit),el('small',null,v2?['ORIGINALITY','HUMAN VALUE','SCALABILITY'][i]:'TOTAL SCORE'));
    const label=vote?normTeam(vote[1]):event?'採点済み':'投票待ち'; const badge=el('span','judge-vote',label);
    if(vote && TEAMS[label]) badge.style.color=TEAMS[label].c;
    const last=all.at(-1); row.classList.toggle('judging',!!last && last.to.includes('審査') && !event);
    row.append(portrait,info,badge); if(event) row.title=bodyOf(event); box.append(row);
  }
  $('result-banner').textContent=T.champ?'★ WINNER · '+TEAMS[T.champ].label:'';
  $('judge-phase').textContent=round?(round >= (v2?4:3)?'FINAL ROUND':'QUALIFIERS'):'WAITING';
}
function safeProjectUrl(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw, location.href);
    if (raw.startsWith('/') && !raw.startsWith('//') && url.origin===location.origin) return url.href;
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host==='localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':')) return null;
    return url.href;
  } catch { return null; }
}
function getArtifacts(all) {
  const ideas=ideaByTeam(all), v2=isV2(currentList(true)), finalRound=v2?4:3;
  const list = (v2?V2TEAMS:['A','B']).map(team=>{
    const proposal=[...all].reverse().find(m=>teamOf(m.from)===team && m.round>=finalRound && complete(m) && /提案|修正|相談/.test(m.kind));
    const text=proposal?bodyOf(proposal):'';
    // Only explicitly labeled artifacts become links. Research citations are not projects.
    const raw=text.match(/(?:成果物|公開URL|作品URL|デモURL)\s*[:：]\s*(https:\/\/[^\s）)」]+|\/projects\/[^\s）)」]+)/)?.[1];
    const recordedRun=Q.get('log') || '';
    const manifest=artifactManifest.find(a=>a.team===team && a.log===recordedRun && all.some(m=>m.round>=finalRound));
    return {team,title:manifest?.title || ideas[team] || 'まだ企画が届いていません',description:manifest?.description || (proposal?'Botの制作記録が届いています。公開された作品はここから開けます。':'チームの企画・作品が届くと、この場所に表示されます。'),image:manifest?.image,url:safeProjectUrl(manifest?.url || raw),available:!!proposal || !!manifest};
  });
  return list;
}
function openProject(item) {
  const box=$('dialog-body'); box.replaceChildren(el('h2',null,item.title));
  if(item.image){const img=el('img','project-full');img.src=item.image;img.alt=item.title+' 審査時の画面';box.append(img);}
  if(item.url){const frame=el('iframe','project-frame');frame.title=item.title;frame.sandbox='allow-scripts';frame.referrerPolicy='no-referrer';frame.src=item.url;box.append(frame); const a=el('a','artifact-link','別タブで作品を開く ↗');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';box.append(a);box.append(el('p','artifact-desc','埋め込みが表示されない場合は、別タブで開いてください。'));}
  $('arena-dialog').showModal();
}
function renderArtifacts(all) {
  const items=getArtifacts(all), tabs=$('artifact-tabs'); tabs.replaceChildren();
  if(!artifactPinned){const winner=tally(all).champ, recent=teamOf(all.at(-1)?.from);selectedArtifact=winner || (items.some(a=>a.team===recent)?recent:selectedArtifact);}
  if(!items.some(a=>a.team===selectedArtifact))selectedArtifact=items.find(a=>a.available)?.team || items[0].team;
  for(const item of items){const button=el('button',item.team===selectedArtifact?'selected':'',TEAMS[item.team].label);button.onclick=()=>{artifactPinned=true;selectedArtifact=item.team;renderArtifacts(currentList());};tabs.append(button);}
  const item=items.find(a=>a.team===selectedArtifact), box=$('artifact-content');box.replaceChildren();
  if(item.image){const btn=el('button','image-button');btn.style.cssText='border:0;background:none;padding:0;width:100%';btn.setAttribute('aria-label',item.title+' のスクリーンショットを拡大');const img=el('img','artifact-image');img.src=item.image;img.alt=item.title+' — 実際の審査時のスクリーンショット';btn.append(img);btn.onclick=()=>openProject(item);box.append(btn);}
  else {const empty=el('div','artifact-empty');empty.append(el('b',null,item.available?'⌘':'◇'),el('span',null,item.available?'制作記録あり · 公開を待っています':'NEXT BIG IDEA, LOADING…'));box.append(empty);}
  box.append(el('h3','artifact-title',item.title),el('p','artifact-desc',item.description));
  if(item.url){const b=el('button','plain-btn','▶ 作品をさわる');b.onclick=()=>openProject(item);box.append(b);}
  else if(item.image)box.append(el('span','artifact-desc','審査時の実画面 · アプリ本体は未公開'));
}
window.renderArena = function(all,v2,T) {
  const signature=(v2?'v2':'v1')+Object.keys(CHARS).length;
  if(arenaSignature!==signature){arenaSignature=signature;createWorld(v2,currentList(true));}
  const last=all.at(-1), ideas=ideaByTeam(all), finalists=v2?finalistsOf(all):new Set();
  const round=last?.round||0;
  $('arena-mode').textContent=demoMode?'DEMO REPLAY':replayLimit!=null?'RECORDED REPLAY':Q.get('log')?'SAVED RUN':'LIVE ARENA';
  $('arena-event').textContent=all.length+' EVENTS · '+(round?'ROUND '+round:'WAITING FOR BOTS');
  $('replay-progress').max=Math.max(1,currentList(true).length); $('replay-progress').value=all.length;
  $('replay-position').textContent=all.length+'/'+currentList(true).length;
  const changed=last && last.id+':'+complete(last)!==arenaLastEvent;
  for(const station of $('world-grid').children){
    const team=station.id.replace('station-',''), events=all.filter(m=>teamOf(m.from)===team), latest=events.at(-1);
    station.classList.toggle('active',!!last && teamOf(last.from)===team && !T.champ);
    station.classList.toggle('eliminated',finalists.size>0&&!finalists.has(team));station.classList.toggle('winner',T.champ===team);
    station.querySelector('.station-state').textContent=T.champ===team?'★ WINNER':finalists.size&&!finalists.has(team)?'予選終了':latest?({'相談':'● 相談中','調査':'⌕ リサーチ','提案':'✦ 提案完了','修正':'↗ 改善中'}[latest.kind]||'制作中'):'STANDBY';
    station.querySelector('.bench span').textContent=ideas[team]||'アイデアを待っています';
    station.querySelectorAll('.worklights i').forEach((dot,i)=>dot.classList.toggle('lit',i<Math.min(events.length,4)));
    for(const bot of station.querySelectorAll('.bot')){
      const active=!!last&&canonicalName(last.from)===bot.dataset.name&&!T.champ;
      bot.classList.toggle('speaking',active&&!arenaPaused);
      bot.querySelector('.effect').textContent=active?(/提案|修正/.test(last.kind)?'💡':last.kind==='調査'?'🔎':'•••'):T.champ===team?'★':'';
    }
    if(changed){station.querySelector('.station-bubble')?.remove();if(last && teamOf(last.from)===team){const bubble=el('div','station-bubble');bubble.append(el('b',null,last.from+' · '+last.kind),el('span',null,bodyOf(last).slice(0,65)+(bodyOf(last).length>65?'…':'')));station.append(bubble);}}
  }
  if(!last){ arenaLastEvent=''; arenaRound=0; document.querySelectorAll('.station-bubble').forEach(b=>b.remove()); }
  if(changed){
    clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>document.querySelectorAll('.station-bubble').forEach(b=>b.remove()),6500);
    if(round!==arenaRound && arenaLastEvent)toast((v2?CH2:CH1)[round]||'NEXT CHAPTER','CHAPTER '+String(round).padStart(2,'0'));
    if(T.champ)toast(TEAMS[T.champ].label+' WINS!','HACKATHON COMPLETE');
    const c=charOf(last.from);if(c?.line && bodyOf(last).includes(c.line))speakLine(c.line);
    arenaLastEvent=last.id+':'+complete(last);arenaRound=round;
  }
  renderJudges(all,v2,T);renderArtifacts(all);
};
function updateAudio(){ $('audio-toggle').textContent=audioEnabled?'♫ 音声 ON':'♫ 音声 OFF';$('audio-toggle').setAttribute('aria-pressed',String(audioEnabled)); }
$('audio-toggle').onclick=()=>{audioEnabled=!audioEnabled;updateAudio();if(!audioEnabled && 'speechSynthesis'in window)speechSynthesis.cancel();};
if(!('speechSynthesis'in window)){$('audio-toggle').disabled=true;$('audio-toggle').title='このブラウザは音声読み上げに対応していません';}
$('pause-replay').onclick=toggleReplay;
$('replay-speed').onchange=e=>replaySpeed=Number(e.target.value);
$('replay-progress').oninput=e=>{
  clearTimeout(replayTimer);replayStep=advanceReplay;replayLimit=Number(e.target.value);arenaPaused=true;document.body.classList.add('paused');$('pause-replay').textContent='▶ 再開';stageKey='';arenaLastEvent='';sync(true);
};
$('restart-replay').onclick=()=>{if(replayLimit!=null)stopReplay();replay();};
$('dialog-close').onclick=()=>$('arena-dialog').close();
$('arena-dialog').addEventListener('close',()=>{$('dialog-body').replaceChildren();if('speechSynthesis'in window)speechSynthesis.cancel();});
$('arena-dialog').addEventListener('click',e=>{if(e.target===$('arena-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
fetch('artifacts.json').then(r=>r.ok?r.json():[]).then(data=>{artifactManifest=Array.isArray(data)?data:[];renderArtifacts(currentList());}).catch(()=>{});
if(demoMode)$('demo-notice').hidden=false;
