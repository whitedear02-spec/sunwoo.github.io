const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const starter = {
  messages: [
    {id:"m1",name:"서윤",initial:"서",time:"오늘",preview:"집에 도착하면 연락해.",unread:true,thread:[
      {from:"in",text:"오늘은 조금 늦을 것 같아.",time:"오후 8:11"},
      {from:"out",text:"알겠어. 조심히 와.",time:"오후 8:12"},
      {from:"in",text:"집에 도착하면 연락해.",time:"오후 8:13"}
    ]},
    {id:"m2",name:"알 수 없는 번호",initial:"?",time:"어제",preview:"그 사진은 열어보지 마.",unread:true,thread:[
      {from:"in",text:"그 사진은 열어보지 마.",time:"오전 02:17"},
      {from:"in",text:"이미 봤다면, 아무에게도 말하지 마세요.",time:"오전 02:18"}
    ]},
    {id:"m3",name:"엄마",initial:"엄",time:"월요일",preview:"밥은 먹었니?",thread:[
      {from:"in",text:"밥은 먹었니?",time:"오후 6:30"},
      {from:"out",text:"응. 걱정하지 마.",time:"오후 6:42"}
    ]}
  ],
  notes: [
    {id:"n1",title:"할 일",date:"오늘 08:13",body:"우유 사기\n서윤에게 연락하기\n사진 백업 확인"},
    {id:"n2",title:"기억해 둘 것",date:"어제 23:41",body:"현관문을 잠갔는지 확인할 것.\n\n새벽 2시 17분에 초인종이 울려도 문을 열지 말 것."},
    {id:"n3",title:"(제목 없음)",date:"10월 12일",body:"나는 그 방에 들어간 적이 없다.\n사진에도 그렇게 남아 있어야 한다."}
  ],
  photos: [
    {id:"p1",title:"현관 앞",date:"오늘 08:01",caption:"현관 앞. 신발은 한 켤레뿐이다."},
    {id:"p2",title:"흔들린 사진",date:"어제 02:17",caption:"누군가 복도 끝에 서 있는 것 같다."},
    {id:"p3",title:"창문",date:"10월 15일",caption:"창밖은 분명 12층이었는데."},
    {id:"p4",title:"식탁",date:"10월 12일",caption:"두 사람 몫의 식기."},
    {id:"p5",title:"검은 화면",date:"10월 10일",caption:"촬영한 기억이 없다."},
    {id:"p6",title:"오래된 사진",date:"9월 28일",caption:"사진 뒷면에 날짜가 적혀 있다. 내 생일이 아니다."}
  ],
  calls: [
    {name:"서윤",type:"발신",time:"오늘 19:42"},
    {name:"알 수 없는 번호",type:"부재중",time:"오늘 02:17"},
    {name:"엄마",type:"수신",time:"어제 18:04"},
    {name:"알 수 없는 번호",type:"부재중",time:"10월 12일 02:17"}
  ],
  secretUnlocked:false,
  eventSeen:false
};
let data;
try { data = JSON.parse(localStorage.getItem("phoneSimData")) || structuredClone(starter); } catch { data = structuredClone(starter); }
let activeApp = "home", activeThread = null, activePhoto = null, activeNote = null, callState = null;
function save(){ localStorage.setItem("phoneSimData", JSON.stringify(data)); }
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2300);}
function timeNow(){return new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false});}
function updateClock(){const d=new Date();$("#status-time").textContent=d.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",hour12:false});$("#home-clock").textContent=d.toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit",hour12:false});$("#home-date").textContent=d.toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"long"});}
updateClock();setInterval(updateClock,15000);
function showHome(){activeApp="home";$("#home-view").classList.add("active");$("#app-view").classList.remove("active");$("#home-bar").style.background="#fff";}
function openApp(app){activeApp=app;$("#home-view").classList.remove("active");$("#app-view").classList.add("active");$("#app-view").classList.toggle("secret-view",app==="secret");renderApp();}
function titleFor(app){return ({messages:"메시지",photos:"사진",notes:"메모",phone:"전화",calendar:"캘린더",settings:"설정",records:"기록",secret:"복구 불가"})[app]||"휴대폰";}
function renderApp(){
 $("#app-title").textContent=titleFor(activeApp);
 $("#header-action").textContent=({notes:"＋",messages:"＋",photos:"",phone:"",calendar:"",settings:"",records:"",secret:""})[activeApp]||"";
 const c=$("#app-content"); c.innerHTML="";
 if(activeApp==="messages") renderMessages(c);
 else if(activeApp==="photos") renderPhotos(c);
 else if(activeApp==="notes") renderNotes(c);
 else if(activeApp==="phone") renderPhone(c);
 else if(activeApp==="calendar") renderCalendar(c);
 else if(activeApp==="settings") renderSettings(c);
 else if(activeApp==="records") renderRecords(c);
 else if(activeApp==="secret") renderSecret(c);
}
function renderMessages(c){
 if(activeThread){
  const t=data.messages.find(x=>x.id===activeThread); if(!t){activeThread=null;return renderMessages(c);}
  $("#app-title").textContent=t.name;
  const back=document.createElement("div");back.className="section-label";back.textContent="메시지 · 대화";c.append(back);
  const bubbles=document.createElement("div");bubbles.className="bubble-wrap";
  bubbles.innerHTML=t.thread.map(m=>`<div class="bubble ${m.from}">${esc(m.text)}<div class="bubble-time">${esc(m.time)}</div></div>`).join("");
  c.append(bubbles);
  const form=document.createElement("form");form.className="compose";form.innerHTML='<input aria-label="메시지 입력" placeholder="iMessage" maxlength="500"><button class="primary-btn">전송</button>';
  form.onsubmit=e=>{e.preventDefault();const input=form.querySelector("input");const value=input.value.trim();if(!value)return;t.thread.push({from:"out",text:value,time:timeNow()});t.preview=value;t.time="지금";save();renderApp();};
  c.append(form);t.unread=false;save();return;
 }
 c.innerHTML='<div class="section-label">고정된 대화</div><div class="list-card">'+data.messages.map(t=>`<div class="list-row" data-thread="${t.id}"><div class="avatar">${esc(t.initial)}</div><div class="row-main"><div class="row-title">${esc(t.name)} ${t.unread?'<span style="color:#2686ef">●</span>':''}</div><div class="row-sub">${esc(t.preview)}</div></div><div class="row-time">${esc(t.time)}</div></div>`).join("")+'</div><p class="section-label">가상 메시지입니다. 실제 문자로 전송되지 않습니다.</p>';
 c.querySelectorAll("[data-thread]").forEach(el=>el.onclick=()=>{activeThread=el.dataset.thread;renderApp();});
}
function renderPhotos(c){
 if(activePhoto){const p=data.photos.find(x=>x.id===activePhoto);$("#app-title").textContent=p.title;c.innerHTML=`<button class="secondary-btn" id="photo-back">‹ 모든 사진</button><div class="detail-card" style="margin-top:12px"><div class="photo-large" style="height:280px;border-radius:10px;background:linear-gradient(145deg,#8fa4ae,#34444c);display:grid;place-items:center;color:#ffffff99;font-size:46px">▧</div><div class="detail-title" style="margin-top:14px">${esc(p.title)}</div><div class="detail-meta">${esc(p.date)}</div><div class="detail-text">${esc(p.caption)}</div></div>`;$("#photo-back").onclick=()=>{activePhoto=null;renderApp();};return;}
 c.innerHTML='<div class="section-label">최근 항목</div><div class="photo-grid">'+data.photos.map(p=>`<button class="photo-tile" data-photo="${p.id}"><span>${esc(p.title)}</span></button>`).join("")+'</div><p class="section-label" style="margin-top:18px">일부 사진의 촬영 시각이 기억과 일치하지 않습니다.</p>';
 c.querySelectorAll("[data-photo]").forEach(el=>el.onclick=()=>{activePhoto=el.dataset.photo;const p=data.photos.find(x=>x.id===activePhoto);if(p.id==="p2"&&!data.secretUnlocked){toast("사진 정보가 일부 손상되었습니다.");}renderApp();});
}
function renderNotes(c){
 if(activeNote){
  const n=data.notes.find(x=>x.id===activeNote);
  $("#app-title").textContent="메모 편집";
  c.innerHTML=`<input class="form-input" id="note-title" placeholder="제목" value="${esc(n.title)}"><p class="section-label">${esc(n.date)}</p><textarea class="note-area" id="note-body" placeholder="메모 내용">${esc(n.body)}</textarea><div class="btn-row"><button class="primary-btn" id="save-note">저장</button><button class="secondary-btn" id="back-notes">완료</button></div>`;
  $("#save-note").onclick=()=>{n.title=$("#note-title").value.trim()||"(제목 없음)";n.body=$("#note-body").value;n.date="방금 수정";save();toast("메모가 저장되었습니다.");};
  $("#back-notes").onclick=()=>{activeNote=null;renderApp();};return;
 }
 c.innerHTML='<div class="section-label">나의 메모</div><div class="list-card">'+data.notes.map(n=>`<div class="list-row" data-note="${n.id}"><div class="avatar" style="border-radius:9px;background:#f6e8a8;color:#9b7a1b">▤</div><div class="row-main"><div class="row-title">${esc(n.title)}</div><div class="row-sub">${esc(n.body.replace(/\n/g," · "))}</div></div><div class="row-time">${esc(n.date)}</div></div>`).join("")+'</div><button class="primary-btn" id="new-note">＋ 새 메모</button>';
 c.querySelectorAll("[data-note]").forEach(el=>el.onclick=()=>{activeNote=el.dataset.note;renderApp();});
 $("#new-note").onclick=()=>{const n={id:"n"+Date.now(),title:"(제목 없음)",date:"방금 생성",body:""};data.notes.unshift(n);activeNote=n.id;save();renderApp();};
}
function renderPhone(c){
 c.innerHTML='<div class="section-label">최근 통화</div><div class="list-card">'+data.calls.map((x,i)=>`<div class="list-row" data-call="${i}"><div class="avatar" style="background:${x.type==="부재중"?"#f8dede":"#dcefe3"};color:${x.type==="부재중"?"#c44":"#31805c"}">${x.type==="발신"?"↗":x.type==="수신"?"↙":"↙"}</div><div class="row-main"><div class="row-title" style="color:${x.type==="부재중"?"#d34":"#222"}">${esc(x.name)}</div><div class="row-sub">${esc(x.type)}</div></div><div class="row-time">${esc(x.time)}</div></div>`).join("")+'</div><p class="section-label">최근 통화는 이 기기 안의 가상 기록입니다.</p>';
 c.querySelectorAll("[data-call]").forEach(el=>el.onclick=()=>{callState=data.calls[Number(el.dataset.call)];renderCall(c);});
}
function renderCall(c){c.innerHTML=`<div class="call-screen"><div class="call-avatar">${esc(callState.name.slice(0,1))}</div><div class="call-name">${esc(callState.name)}</div><div class="call-sub" id="call-status">${callState.type==="부재중"?"부재중 전화":"최근 통화 · "+esc(callState.type)}</div><div class="call-actions"><button class="call-action" id="call-back">↩</button><button class="call-action end" id="call-end">☎</button></div><p class="section-label" style="margin-top:32px">시뮬레이션 · 실제 전화 연결 없음</p></div>`;$("#call-back").onclick=()=>renderApp();$("#call-end").onclick=()=>{toast("통화 화면을 종료했습니다.");renderApp();};}
function renderCalendar(c){c.innerHTML='<div class="detail-card"><div class="detail-title">10월 19일</div><div class="detail-meta">월요일 · 일정 1개</div><div class="detail-text">02:17　알 수 없는 번호에서 부재중 전화\n08:13　기기 백업 완료</div></div><div class="system-note">일정이 하나 더 있었던 것 같지만, 현재 동기화된 캘린더에는 표시되지 않습니다.</div>';}
function renderSettings(c){c.innerHTML='<div class="list-card"><div class="list-row"><div class="row-main"><div class="row-title">사용자</div><div class="row-sub">개인 기기 · 로컬 프로필</div></div><span>›</span></div><div class="list-row"><div class="row-main"><div class="row-title">알림</div><div class="row-sub">메시지 알림 켜짐</div></div><span>›</span></div><div class="list-row"><div class="row-main"><div class="row-title">저장 공간</div><div class="row-sub">일부 항목을 확인할 수 없음</div></div><span>›</span></div></div><div class="system-note">앱 데이터는 현재 브라우저의 로컬 저장 공간에 보관됩니다.</div><button class="secondary-btn" id="unlock-hint">기기 진단</button><div id="diagnostic"></div>';$("#unlock-hint").onclick=()=>{$("#diagnostic").innerHTML='<div class="detail-card" style="margin-top:12px"><div class="detail-title">진단 결과</div><div class="detail-text">백업 인덱스: 불일치\n복구 가능한 항목: 1\n오류 코드: 0217</div><p style="font-size:11px;color:#8b343a">오류 코드 0217은 메모 앱의 기록과 연관되어 있습니다.</p></div>';toast("진단이 완료되었습니다.");};}
function renderRecords(c){c.innerHTML='<div class="section-label">기기 기록</div><div class="detail-card"><div class="detail-title">최근 활동</div><div class="detail-text">08:13　백업 완료\n08:12　사진 앱 열림\n02:18　화면 잠금\n02:17　알 수 없는 번호에서 전화 수신\n02:17　사진 파일 읽기\n02:16　기록 인덱스 오류</div></div><button class="secondary-btn" id="check-records">기록 다시 확인</button><div id="record-extra"></div>';$("#check-records").onclick=()=>{$("#record-extra").innerHTML='<div class="detail-card" style="margin-top:12px"><div class="detail-title">복구된 로그</div><div class="event-text">02:17:04 — user_opened: photo_0217\n02:17:09 — face_count: 2\n02:17:09 — local_photo_metadata: 1\n02:17:10 — face_count: 1\n\nNOTE: 두 번째 인물의 데이터가 없습니다.</div></div>';data.eventSeen=true;save();maybeUnlock();};}
function maybeUnlock(){const memo=data.notes.some(n=>/0217|두 번째 인물|두번째 인물|돌아오지 않았다/.test(n.body));if((data.eventSeen||memo)&&!data.secretUnlocked){data.secretUnlocked=true;save();$("#secret-icon").hidden=false;toast("새로운 앱이 나타났습니다.");}}
function renderSecret(c){$("#app-title").textContent="복구 불가";c.innerHTML='<div class="section-label" style="color:#b45a64">UNKNOWN APPLICATION</div><div class="detail-card"><div class="detail-title">사용자 인증</div><div class="detail-text">이 앱은 홈 화면에서 삭제된 기록이 있습니다.\n접근 코드를 입력하십시오.</div><input class="form-input" id="secret-code" placeholder="접근 코드" autocomplete="off" style="margin-top:14px"><button class="primary-btn" id="secret-submit" style="margin-top:10px;width:100%">기록 열기</button><div id="secret-result" style="margin-top:14px"></div></div><div class="event-text">RECOVERY STATUS: PARTIAL\nLAST ACCESS: 02:17\nOWNER: UNKNOWN</div>';
 $("#secret-submit").onclick=()=>{const code=$("#secret-code").value.trim().toLowerCase();const out=$("#secret-result");if(["0217","복구","return"].includes(code)){out.innerHTML='<div class="event-text">기록 01 / 자동 저장됨\n\n“내가 집에 돌아왔을 때, 집에는 이미 내가 있었다.”\n\n기록 02 / 손상됨\n\n“사진을 지워도 촬영된 사실까지 사라지는 것은 아니다.”\n\n새로운 기록이 발견되었습니다.</div>';toast("숨겨진 기록을 복구했습니다.");}else{out.innerHTML='<p style="font-size:11px;color:#c96b72">접근 코드가 일치하지 않습니다.</p>';}};}
$$(".app").forEach(el=>el.addEventListener("click",()=>openApp(el.dataset.app)));
$("#back-btn").onclick=()=>{if(activeApp==="messages"&&activeThread){activeThread=null;renderApp();}else if(activeApp==="photos"&&activePhoto){activePhoto=null;renderApp();}else if(activeApp==="notes"&&activeNote){activeNote=null;renderApp();}else showHome();};
$("#home-bar").onclick=showHome;
$("#header-action").onclick=()=>{if(activeApp==="messages"){activeThread=null;toast("새 메시지는 기존 대화를 선택해 작성할 수 있습니다.");}else if(activeApp==="notes"){$("#new-note")?.click();}};
$("#reset-btn").onclick=()=>{if(confirm("저장된 가상 메시지, 메모 및 이벤트 진행 상황을 초기화할까요?")){localStorage.removeItem("phoneSimData");data=structuredClone(starter);activeThread=activePhoto=activeNote=null;$("#secret-icon").hidden=true;showHome();toast("기기 데이터를 초기화했습니다.");}};
const originalRenderApp=renderApp;
renderApp=function(){originalRenderApp();$("#secret-icon").hidden=!data.secretUnlocked;};
maybeUnlock();
