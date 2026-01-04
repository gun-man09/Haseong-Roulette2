let round = 1;
let player = { hp: 2, maxHp: 2, nextDamageMultiplier: 1, skipNextTurn:false };
let ai = { hp: 2, maxHp: 2, nextDamageMultiplier: 1, skipNextTurn:false };
let ammo = [];
let currentTurn = "player"; // player | ai
let ammoTimeout = null;
let gameOver = false;
let playerItems = [];
let aiItems = [];

// DOM
const playerHeartsEl = document.getElementById("playerHearts");
const aiHeartsEl = document.getElementById("aiHearts");
const roundInfo = document.getElementById("roundInfo");
const ammoInfo = document.getElementById("ammoInfo");
const message = document.getElementById("message");
const selfBtn = document.getElementById("selfBtn");
const aiBtn = document.getElementById("aiBtn");
const itemButtonsDiv = document.getElementById("itemButtons");

// UI
function renderHearts(character, container) {
  container.innerHTML = "";
  for (let i = 0; i < character.hp; i++) {
    const span = document.createElement("span");
    span.textContent = "❤️";
    span.className = "heart";
    container.appendChild(span);
  }
  for (let i = character.hp; i < character.maxHp; i++) {
    const span = document.createElement("span");
    span.textContent = "🤍";
    span.className = "heart empty";
    container.appendChild(span);
  }
}

function hideButtons() { selfBtn.classList.add("hidden"); aiBtn.classList.add("hidden"); itemButtonsDiv.classList.add("hidden"); }
function showButtons() { selfBtn.classList.remove("hidden"); aiBtn.classList.remove("hidden"); if(playerItems.length>0) itemButtonsDiv.classList.remove("hidden"); }

function updateUI(showAmmo = false) {
  renderHearts(player, playerHeartsEl);
  renderHearts(ai, aiHeartsEl);
  roundInfo.textContent = `라운드 ${round}`;

  if(currentTurn==="player" && showAmmo){
    ammoInfo.textContent = `탄약: ${ammo.length}발 (실탄 ${ammo.filter(a=>a==="real").length}/가짜탄 ${ammo.filter(a=>a==="fake").length})`;
    ammoInfo.style.display = "block";
    hideButtons();
    if(ammoTimeout) clearTimeout(ammoTimeout);
    ammoTimeout=setTimeout(()=>{
      ammoInfo.style.display="none";
      if(!gameOver && currentTurn==="player") showButtons();
    },5000);
  } else {
    ammoInfo.style.display="none";
  }
  renderPlayerItems();
}

// 아이템 버튼
function renderPlayerItems(){
  itemButtonsDiv.innerHTML="";
  playerItems.forEach(it=>{
    const btn=document.createElement("button");
    btn.textContent=it;
    btn.onclick=()=>usePlayerItem(it);
    itemButtonsDiv.appendChild(btn);
  });
}

// 탄약
function loadAmmo(){
  if(gameOver) return;
  ammo=[];
  if(round===1) ammo.push("real","fake","fake");
  else if(round===2) ammo.push("real","real","fake","fake","real");
  else ammo.push("real","real","real","fake","fake","fake","real");
  shuffle(ammo);
  updateUI(true);
  message.textContent="탄약 장전 완료!";
  setTimeout(()=>message.textContent="",2000);
}

// 발사
function shoot(shooter,target,isAI=false){
  if(gameOver) return;

  if(ammo.length===0){
    loadAmmo();
    if(isAI) setTimeout(()=>{ if(!gameOver) aiTurn(); },500);
    return;
  }

  const bullet=ammo.shift();
  let shooterName=shooter==="player"?"플레이어":"???";
  let targetName=target==="player"?"플레이어":"???";

  // 총알 애니메이션
  const bulletEl=document.createElement("div");
  bulletEl.className=`bullet ${bullet}`;
  bulletEl.textContent=bullet==="real"?"💥":"🔫";
  document.body.appendChild(bulletEl);

  const shooterEl=shooter==="player"?playerHeartsEl:aiHeartsEl;
  const targetEl=target==="player"?playerHeartsEl:aiHeartsEl;
  const sRect=shooterEl.getBoundingClientRect();
  const tRect=targetEl.getBoundingClientRect();
  bulletEl.style.left=`${sRect.left+sRect.width/2}px`;
  bulletEl.style.top=`${sRect.top}px`;
  const dx=tRect.left+tRect.width/2-(sRect.left+sRect.width/2);
  const dy=tRect.top-sRect.top;
  requestAnimationFrame(()=>bulletEl.style.transform=`translate(${dx}px,${dy}px)`);

  setTimeout(()=>{
    bulletEl.remove();
    const explosionEl=document.createElement("div");
    explosionEl.className="explosion";
    explosionEl.textContent=bullet==="real"?"💥":"💫";
    explosionEl.style.left=`${tRect.left+tRect.width/2}px`;
    explosionEl.style.top=`${tRect.top}px`;
    document.body.appendChild(explosionEl);
    setTimeout(()=>explosionEl.remove(),300);

    // 피해 적용 (실탄만)
    if(bullet==="real"){
      let damage=1;
      if(shooter==="player" && player.nextDamageMultiplier){ damage*=player.nextDamageMultiplier; player.nextDamageMultiplier=1; }
      if(shooter==="ai" && ai.nextDamageMultiplier){ damage*=ai.nextDamageMultiplier; ai.nextDamageMultiplier=1; }
      message.textContent=`💥 실탄! ${shooterName} → ${targetName}`;
      if(target==="player") player.hp-=damage;
      else ai.hp-=damage;
    }

    // 가짜탄 처리
    let keepTurn=false;
    if(bullet==="fake"){
      message.textContent=`🔫 가짜탄! ${shooterName} → ${targetName}`;
      if(shooter===target) keepTurn=true;
    }

    updateUI();
    checkState();

    if(!gameOver){
      if(!keepTurn) currentTurn=shooter==="player"?"ai":"player";
      if(currentTurn==="ai") setTimeout(aiTurn,900);
      if(currentTurn==="player") showButtons();
    }

  },500);
}

// 아이템 사용
function usePlayerItem(it){
  const idx=playerItems.indexOf(it);
  if(idx!==-1) playerItems.splice(idx,1);

  const anim=document.createElement("div");
  anim.className="itemAnim";
  anim.style.left="50%";
  anim.style.top="50%";
  anim.style.transform="translate(-50%,-50%)";
  let icon="";
  if(it==="톱날") icon="🗡️";
  else if(it==="돋보기") icon="🔍";
  else if(it==="담배") icon="🚬";
  else if(it==="맥주") icon="🍺";
  else if(it==="수갑") icon="⛓️";
  anim.textContent=`${icon} ${it}`;
  document.body.appendChild(anim);
  anim.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate(-50%,-150%) scale(1.5)",opacity:0}],{duration:1000,easing:"ease-out"});
  setTimeout(()=>anim.remove(),1000);

  message.textContent=`플레이어 아이템 사용: ${it}`;

  switch(it){
    case "돋보기": if(ammo.length>0) alert(`현재 약실 탄약: ${ammo[0]}`); break;
    case "맥주": 
      if(ammo.length>0){ 
        const removed=ammo.shift(); 
        message.textContent+=` | 제거된 탄약: ${removed}`;
      }
      showButtons();
      break;
    case "톱날": player.nextDamageMultiplier=2; break;
    case "담배": player.hp=Math.min(player.maxHp,player.hp+1); break;
    case "수갑": ai.skipNextTurn=true; break;
  }
  updateUI();
}

// AI 아이템 사용
function aiUseItem(item){
  const anim=document.createElement("div");
  anim.className="itemAnim";
  anim.style.left="50%";
  anim.style.top="40%";
  anim.style.transform="translate(-50%,-50%)";
  anim.style.fontSize="32px";
  anim.style.color="yellow";
  anim.style.opacity="1";
  anim.style.zIndex="50";

  switch(item.name){
    case "돋보기":
      if(ammo.length>0){
        message.textContent=`🔍 AI 약실 탄약: ${ammo[0]}`;
        anim.textContent=`🔍 ${ammo[0]}`;
        document.body.appendChild(anim);
        anim.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate(-50%,-100%) scale(1.5)",opacity:0}],{duration:1000,easing:"ease-out"});
        setTimeout(()=>anim.remove(),1000);
      }
      break;
    case "맥주":
      if(ammo.length>0){
        const removed=ammo.shift();
        message.textContent=`🍺 AI 약실 탄약 1개 제거 (${removed})`;
        anim.textContent=`🍺 - ${removed}`;
        document.body.appendChild(anim);
        anim.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate(-50%,-100%) scale(1.5)",opacity:0}],{duration:1000,easing:"ease-out"});
        setTimeout(()=>anim.remove(),1000);
      }
      break;
    case "톱날": ai.nextDamageMultiplier=2; message.textContent="🗡️ AI 톱날 사용! 다음 실탄 데미지 2배!"; break;
    case "담배": ai.hp=Math.min(ai.maxHp,ai.hp+1); message.textContent="🚬 AI 체력 +1"; updateUI(); break;
    case "수갑": player.skipNextTurn=true; message.textContent="⛓️ AI 수갑 사용! 플레이어 턴 1회 스킵"; break;
  }
}

// AI 턴
function aiTurn(){
  if(gameOver) return;
  if(ai.skipNextTurn){ ai.skipNextTurn=false; currentTurn="player"; showButtons(); return; }

  if(round>=2 && Math.random()<0.5){
    const itemPool=[
      {name:"톱날", used:false},{name:"돋보기", used:false},{name:"담배", used:false},
      {name:"맥주", used:false},{name:"수갑", used:false}
    ];
    const available=shuffle(itemPool).find(it=>!it.used);
    if(available){ available.used=true; aiUseItem(available); }
  }

  if(ammo.length===0){ loadAmmo(); setTimeout(aiTurn,500); return; }

  const target=Math.random()<0.5?"player":"ai";
  setTimeout(()=>shoot("ai",target,true),800);
}

// 상태 체크
function checkState(){
  if(player.hp<=0){ message.textContent="💀 패배! 1라운드로 돌아갑니다"; setTimeout(()=>resetGame(),1500); return; }
  if(ai.hp<=0){ if(round>=3){ message.textContent="🎉 게임 종료!"; gameOver=true; hideButtons(); return; }
    message.textContent="🎉 ??? 처치! 다음 라운드"; setTimeout(()=>{ round++; setupRound(); },1500); return;
  }
}

// 라운드
function setupRound(){
  if(round===1){ player.hp=2; player.maxHp=2; ai.hp=2; ai.maxHp=2; }
  else if(round===2){ player.hp=4; player.maxHp=4; ai.hp=4; ai.maxHp=4; }
  else{ player.hp=6; player.maxHp=6; ai.hp=6; ai.maxHp=6; }
  playerItems=round>=2?["톱날","돋보기","담배"]:[]; // 2라운드부터 아이템 지급
  aiItems=round>=2?["톱날","맥주","수갑"]:[];

  currentTurn="player";
  loadAmmo();
  updateUI(true);
}

function resetGame(){ round=1; gameOver=false; setupRound(); }

// 유틸
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

// 버튼
selfBtn.onclick=()=>{ if(currentTurn==="player") shoot("player","player"); };
aiBtn.onclick=()=>{ if(currentTurn==="player") shoot("player","ai"); };

// 시작
setupRound();
