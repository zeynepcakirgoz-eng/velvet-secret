(() => {
'use strict';
const $ = id => document.getElementById(id);
const MAX_ENERGY = 500, ENERGY_INTERVAL = 60000;
const items = [
 {name:'Gül',icon:'🌹'}, {name:'Parfüm',icon:'🧴'}, {name:'Ruj',icon:'💄'},
 {name:'Topuklu',icon:'👠'}, {name:'Mücevher',icon:'💎'}, {name:'Davet',icon:'💌'},
 {name:'Şampanya',icon:'🍾'}, {name:'Taç',icon:'👑'}
];
const tasks = [
 {id:'merge',name:'İlk mükemmel birleşim',desc:'Objeleri birleştir',goal:3,reward:40,metric:'merges'},
 {id:'jewel',name:'Sosyetenin gözdesi',desc:'Seviye 4 veya üstü mücevher üret',goal:1,reward:80,metric:'jewels'},
 {id:'order',name:'Kusursuz ev sahibi',desc:'Siparişleri tamamla',goal:2,reward:60,metric:'orders'}
];
let state;
function initialState(){
 const board = Array.from({length:25},(_,i)=>i%6===0?null:{type:Math.floor(Math.random()*4),level:1});
 return {energy:500,energyUpdated:Date.now(),prestige:1200,gems:10,hearts:0,level:1,board,selected:null,merges:0,jewels:0,orders:0,claimed:[],storyChoice:null,hotel:1,notice:'Hoş geldin. Aynı tür ve seviyedeki objeleri birleştir.',storyTitle:'Bir davet, bin sır…',storyText:'Açılış gecesinde Isabella Laurent, masada unutulmuş mühürlü bir mektup buldu. Bu gece herkesin sakladığı bir şey var.',log:'Henüz bir seçim yapmadın. Her karar hikâyenin yönünü değiştirecek.'};
}
function load(){
 try{const raw=localStorage.getItem('velvetSecretsSave');if(raw){const s=JSON.parse(raw);if(s&&Array.isArray(s.board)&&s.board.length===25){state={...initialState(),...s};return;}}}catch(e){}
 state=initialState();
}
function save(){try{localStorage.setItem('velvetSecretsSave',JSON.stringify(state));}catch(e){}}
function tick(){
 const now=Date.now(), elapsed=Math.max(0,now-(state.energyUpdated||now));
 const gained=Math.floor(elapsed/ENERGY_INTERVAL);
 if(gained>0){state.energy=Math.min(MAX_ENERGY,state.energy+gained);state.energyUpdated=state.energy>=MAX_ENERGY?now:(state.energyUpdated+gained*ENERGY_INTERVAL);}
 if(state.energy>=MAX_ENERGY)state.energyUpdated=now;
}
function itemName(it){if(!it)return '';return it.level>=5?items[Math.min(7,it.type+4)].name:items[it.type].name;}
function itemIcon(it){if(!it)return '';return it.level>=5?items[Math.min(7,it.type+4)].icon:items[it.type].icon;}
function notify(s){state.notice=s;$('notice').textContent=s;save();}
function render(){
 tick();
 $('energy').textContent=state.energy;$('coins').textContent=state.prestige;$('gems').textContent=state.gems;
 const left=state.energy>=MAX_ENERGY?60:60-Math.floor((Date.now()-state.energyUpdated)/1000)%60;
 $('timer').textContent='00:'+String(left).padStart(2,'0');
 $('storyTitle').textContent=state.storyTitle;$('storyText').textContent=state.storyText;$('log').textContent=state.log;
 $('hotelLevel').textContent='Seviye '+state.hotel;
 $('hotelTitle').textContent=state.hotel===1?'Lobi — ilk adım':state.hotel===2?'Altın Salon — yenilendi':'Aurelia Terası — açıldı';
 $('hotelText').textContent=state.hotel===1?'Prestij biriktirerek otelin yeni bölümlerini aç.':state.hotel===2?'Lobi yenilendi. Şimdi konukların gözdesi olan terasa hazırlan.':'Terasın ışıkları tüm körfezi aydınlatıyor.';
 $('renovate').textContent=state.hotel===1?'Lobiyi yenile · 300 ◆':state.hotel===2?'Terasa erişim aç · 500 ◆':'Tüm alanlar yenilendi ✦';
 $('renovate').disabled=state.hotel>=3;
 const board=$('board');board.innerHTML='';
 state.board.forEach((it,i)=>{
  const b=document.createElement('button');b.className='tile'+(!it?' empty':'')+(state.selected===i?' selected':'');
  b.setAttribute('aria-label',it?itemName(it)+' seviye '+it.level:'Boş alan');
  b.innerHTML=it?'<span class="emoji">'+itemIcon(it)+'</span><span class="lv">LV.'+it.level+'</span>':'<span class="emoji">＋</span>';
  board.appendChild(b);
 });
 renderTasks();
 document.querySelectorAll('[data-choice]').forEach(b=>b.disabled=!!state.storyChoice);
 save();
}
function spend(n){tick();if(state.energy<n){notify('Enerjin yetersiz. Her dakika enerji kazanırsın; görevleri tamamlayarak daha fazlasını alabilirsin.');return false;}state.energy-=n;if(state.energy<MAX_ENERGY&&state.energyUpdated>Date.now())state.energyUpdated=Date.now();return true;}
function tap(i){
 const target=state.board[i];
 if(state.selected===null){if(!target){notify('Önce dolu bir alandaki objeyi seç.');return;}state.selected=i;render();notify(itemName(target)+' seçildi. Aynı tür ve seviyede bir obje seç.');return;}
 const from=state.selected,source=state.board[from];state.selected=null;
 if(from===i){render();return;}
 if(!target){if(!spend(1)){render();return;}state.board[i]=source;state.board[from]=null;render();notify('Obje taşındı.');return;}
 if(source&&source.type===target.type&&source.level===target.level){
  if(!spend(1)){render();return;}
  const newLevel=target.level+1;state.board[i]={type:target.type,level:newLevel};state.board[from]=null;
  state.merges++;state.prestige+=newLevel*10;
  if(state.merges%3===0)state.prestige+=25;
  if(newLevel>=3)state.hearts++;
  if(newLevel>=4){state.jewels++;state.gems+=1;}
  state.level=Math.max(state.level,Math.min(10,1+Math.floor(state.merges/5)));
  render();notify('Birleştirme başarılı! '+itemName(state.board[i])+' üretildi. +'+newLevel*10+' prestij kazandın.');return;
 }
 state.selected=i;render();notify('Birleştirmek için aynı tür ve seviyedeki iki objeyi seç.');
}
function renderTasks(){
 const el=$('tasks');el.innerHTML='';
 tasks.forEach(t=>{
  const count=t.metric==='merges'?state.merges:t.metric==='jewels'?state.jewels:state.orders;
  const done=count>=t.goal,claimed=state.claimed.includes(t.id),pct=Math.min(100,count/t.goal*100);
  const d=document.createElement('div');d.className='task';
  d.innerHTML='<div class="tasktop"><span class="taskname">'+t.name+'</span><span class="reward">⚡ +'+t.reward+' enerji</span></div><div class="taskdesc">'+t.desc+'</div><div class="bar"><div style="width:'+pct+'%"></div></div><div class="taskfoot"><span>'+Math.min(count,t.goal)+' / '+t.goal+(claimed?' · Alındı':'')+'</span><button class="claim" '+(!done||claimed?'disabled':'')+'>'+(claimed?'ALINDI':done?'ÖDÜLÜ AL':'DEVAM ET')+'</button></div>';
  d.querySelector('button').addEventListener('click',()=>{if(!done||claimed)return;state.claimed.push(t.id);state.energy=Math.min(MAX_ENERGY,state.energy+t.reward);state.prestige+=50;notify('Görev ödülü alındı: +'+t.reward+' enerji ve +50 prestij!');render();});
  el.appendChild(d);
 });
}
$('order').addEventListener('click',()=>{
 if(state.orders>=5){notify('Bu demo bölümündeki siparişler tamamlandı. Hikâyeyi keşfetmeye devam et!');return;}
 if(!spend(5)){render();return;}
 state.orders++;state.prestige+=120;state.energy=Math.min(MAX_ENERGY,state.energy+25);
 state.storyTitle=state.orders===1?'Gizemli bir misafir':'Gece yarısı gelen mesaj';
 state.storyText=state.orders===1?'Adrian Vale, Isabella’ya özel bir sipariş bıraktı. İçindeki notta yalnızca üç kelime vardı: “Ona güvenme, Isabella.”':'Bir mesaj tüm geceyi değiştirdi. Birisi otelin güvenlik kayıtlarını görmek istiyor. Kimin tarafında olacaksın?';
 render();notify('Sipariş tamamlandı! +120 prestij ve +25 enerji kazandın.');
});
$('refresh').addEventListener('click',()=>{
 if(!spend(10)){render();return;}
 const filled=state.board.filter(Boolean);
 for(let i=filled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[filled[i],filled[j]]=[filled[j],filled[i]];}
 let k=0;state.board=state.board.map(x=>x?filled[k++]:null);state.selected=null;render();notify('Tahta yeniden düzenlendi. Yeni birleşimler keşfet!');
});
document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{
 if(state.storyChoice){notify('Bu bölümde seçimini yaptın. Yeni kararlar sonraki bölümlerde açılacak.');return;}
 state.storyChoice=b.dataset.choice;
 if(state.storyChoice==='love'){state.hearts+=3;state.prestige+=30;state.log='Isabella mektubu Adrian’a gösterdi. Adrian’ın bakışlarında hem korku hem şefkat vardı. “Sana anlatmam gereken bir şey var,” dedi. İlişki +3.';}
 else if(state.storyChoice==='gossip'){state.prestige+=150;state.log='Isabella davetteki fısıltıların izini sürdü. Bir davetli ona gizli dosyanın yerini söyledi. Prestij +150. Ama bu bilgi kimin canını yakacak?';}
 else{state.gems+=2;state.log='Isabella acele etmedi. Mektubun mührünü inceleyince otelin eski arşivine ait bir işaret buldu. +2 mücevher. Bir sonraki adımını dikkatle seçmeli.';}
 render();notify('Kararın kaydedildi. Hikâyenin yönünü sen belirliyorsun.');
}));
$('renovate').addEventListener('click',()=>{
 if(state.hotel>=3)return;
 const cost=state.hotel===1?300:500;
 if(state.prestige<cost){notify('Yeterli prestijin yok. Siparişlerden ve birleşimlerden prestij kazan.');return;}
 state.prestige-=cost;state.hotel++;
 if(state.hotel===2){state.storyTitle='Altın Salon açılıyor';state.storyText='Lobi yenilendi. Açılış gecesinin konuk listesinde silinmiş bir isim ortaya çıktı: Adrian Vale.';}
 else{state.storyTitle='Terasın ardındaki sır';state.storyText='Teras açıldı. Körfeze bakan masada yeni bir zarf var. Üzerinde Isabella’nın adı yazıyor.';}
 render();notify('Mekân geliştirildi! Aurelia Oteli yeni bir görünüme kavuştu.');
});
load();render();
setInterval(render,1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else{tick();render();}});
window.addEventListener('beforeunload',save);
})();