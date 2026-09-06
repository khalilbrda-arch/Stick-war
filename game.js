const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');let W=0,H=0,D=1,last=0,running=false,paused=false,spawn=0,waveTime=0,saveClock=0,shake=0;
const S={gold:500,gems:8,hp:150,base:1,wave:1,kills:0,maxWave:15};const U=[],P=[],FX=[],FLOAT=[];
const T={
 miner:{cost:60,hp:70,dmg:8,range:28,speed:31,rate:.72,scale:.9},sword:{cost:90,hp:115,dmg:22,range:32,speed:44,rate:.58,scale:1},archer:{cost:120,hp:62,dmg:17,range:220,speed:29,rate:1.05,ranged:1,scale:.92},spearman:{cost:150,hp:145,dmg:31,range:48,speed:35,rate:.82,scale:1.03},giant:{cost:300,hp:470,dmg:52,range:48,speed:19,rate:1.35,scale:1.55},tank:{cost:420,hp:760,dmg:70,range:175,speed:13,rate:1.55,ranged:1,vehicle:1,scale:1.18},cannon:{cost:360,hp:300,dmg:105,range:250,speed:8,rate:2.4,ranged:1,vehicle:1,aoe:38,scale:1},rocket:{cost:500,hp:360,dmg:150,range:330,speed:7,rate:3.2,ranged:1,vehicle:1,aoe:58,scale:1.05},brute:{hp:190,dmg:23,range:36,speed:25,rate:.78,scale:1.05},enemyArcher:{hp:82,dmg:18,range:180,speed:21,rate:1.2,ranged:1,scale:.92},enemyTank:{hp:650,dmg:58,range:155,speed:11,rate:1.8,ranged:1,vehicle:1,scale:1.1},enemyRocket:{hp:500,dmg:115,range:280,speed:8,rate:3,ranged:1,vehicle:1,aoe:45,scale:1},boss:{hp:1800,dmg:95,range:80,speed:10,rate:1.35,scale:2.1,vehicle:1}};
function resize(){D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*D;canvas.height=H*D;ctx.setTransform(D,0,0,D,0,0)}addEventListener('resize',resize);resize();const ground=()=>H-145;
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1400)}
function ui(){gold.textContent=Math.floor(S.gold);gems.textContent=S.gems;hp.textContent=Math.max(0,Math.ceil(S.hp));baseLevel.textContent=S.base;wave.textContent=S.wave;maxWave.textContent=S.maxWave;upgradeCost.textContent=350*S.base;waveBar.style.width=Math.min(100,waveTime/24*100)+'%';enemyCount.textContent='الأعداء: '+U.filter(u=>u.team==='enemy'&&u.hp>0).length;document.querySelectorAll('.unit').forEach(b=>b.disabled=!running||paused||S.gold<T[b.dataset.unit].cost);airstrike.disabled=!running||paused||S.gold<120}
function add(type,team='player',x=null){const t=T[type],enemy=team==='enemy';U.push({id:Math.random(),type,team,x:x??(enemy?W-105:95),y:ground(),hp:t.hp,max:t.hp,dmg:t.dmg,range:t.range,speed:t.speed,rate:t.rate,cd:Math.random()*.5,phase:Math.random()*7,atk:0,dead:0})}
function buy(type){if(!running||paused)return;const t=T[type];if(S.gold<t.cost)return toast('ذهب غير كافٍ');S.gold-=t.cost;add(type);ui()}document.querySelectorAll('.unit').forEach(b=>b.onclick=()=>buy(b.dataset.unit));
upgrade.onclick=()=>{if(!running||paused)return;const c=350*S.base;if(S.gold<c)return toast('تحتاج '+c+' ذهب');S.gold-=c;S.base++;S.hp=Math.min(150+S.base*40,S.hp+65);S.gems+=1;toast('🏰 القاعدة الآن مستوى '+S.base);ui()};pause.onclick=()=>{paused=!paused;pause.querySelector('small').textContent=paused?'استمرار':'إيقاف';ui()};start.onclick=()=>newGame();
airstrike.onclick=()=>{if(S.gold<120||!running||paused)return;S.gold-=120;const enemies=U.filter(u=>u.team==='enemy'&&u.hp>0).sort((a,b)=>a.x-b.x).slice(0,4);enemies.forEach((e,i)=>{setTimeout(()=>{if(e.hp>0){e.hp-=260;burst(e.x,e.y-25,22,'#e4a53b');shake=.25}},i*180)});toast('🚀 ضربة صاروخية!');ui()};
function newGame(){Object.assign(S,{gold:500,gems:8,hp:150,base:1,wave:1,kills:0});U.length=P.length=FX.length=FLOAT.length=0;running=true;paused=false;spawn=0;waveTime=0;saveClock=0;overlay.style.display='none';add('miner');add('sword');add('sword');add('archer');toast('⚔️ المعركة بدأت');ui()}
function target(u){let best=null,bd=Infinity;for(const v of U)if(v.team!==u.team&&v.hp>0){const d=Math.abs(v.x-u.x);if(d<bd){bd=d;best=v}}return best}
function spawnWave(){if(S.wave===15){if(!U.some(u=>u.type==='boss'&&u.hp>0))add('boss','enemy',W-110);return}const n=1+Math.floor(S.wave*.45)+(Math.random()<.45?1:0);for(let i=0;i<n;i++){const r=Math.random();let type='brute';if(S.wave>=5&&r>.72)type='enemyArcher';if(S.wave>=8&&r>.86)type='enemyTank';if(S.wave>=11&&r>.94)type='enemyRocket';add(type,'enemy',W-105-i*20)}}
function kill(v){if(v.hp>0)return;if(v.dead)return;v.dead=1;if(v.team==='enemy'){const reward=30+S.wave*4+(T[v.type].vehicle?25:0);S.gold+=reward;S.kills++;FLOAT.push({x:v.x,y:v.y-62,text:'+'+reward+' 🪙',life:1.1});burst(v.x,v.y-30,10,'#e7bd59')}}
function fire(a,v){const t=T[a.type];if(t.ranged){P.push({x:a.x+(a.team==='player'?20:-20),y:a.y-35,target:v,spd:a.type.includes('rocket')?330:500,dmg:a.dmg,aoe:t.aoe||0,team:a.team,kind:a.type})}else{v.hp-=a.dmg;burst(v.x,v.y-36,5,'#f2c45e');kill(v)}a.atk=.16}
function burst(x,y,n,c='#f0b63e'){for(let i=0;i<n;i++)FX.push({x,y,vx:(Math.random()-.5)*130,vy:-Math.random()*120,life:.45,max:.45,c})}
function update(dt){if(!running||paused)return;S.gold+=dt*(2.1+S.base*.32);waveTime+=dt;spawn+=dt;saveClock+=dt;if(spawn>Math.max(.62,2.15-S.wave*.075)){spawn=0;spawnWave()}if(waveTime>=24){waveTime=0;if(S.wave<S.maxWave){S.wave++;toast(S.wave===15?'👑 الزعيم الأخير!':'🌊 الموجة '+S.wave)}else if(!U.some(u=>u.team==='enemy'&&u.hp>0))win()}
for(const u of U){if(u.hp<=0)continue;const t=T[u.type];u.cd-=dt;u.atk=Math.max(0,u.atk-dt);u.phase+=dt*5;const v=target(u),d=v?Math.abs(v.x-u.x):9999;if(v&&d<=u.range){if(u.cd<=0){u.cd=u.rate;fire(u,v)}}else{u.x+=(u.team==='player'?1:-1)*u.speed*dt}u.x=u.team==='player'?Math.min(W-105,u.x):Math.max(105,u.x);if(u.team==='enemy'&&u.x<=112&&u.cd<=0){u.cd=u.rate;S.hp-=u.dmg*.32;FLOAT.push({x:72,y:ground()-95,text:'-'+Math.ceil(u.dmg*.32)+' HP',life:.8});shake=.12}} 
for(let i=P.length-1;i>=0;i--){const p=P[i],v=p.target;if(!v||v.hp<=0){P.splice(i,1);continue}const dx=v.x-p.x,dy=v.y-35-p.y,dist=Math.hypot(dx,dy),step=p.spd*dt;if(dist<=step){if(p.aoe){for(const q of U)if(q.team!==p.team&&q.hp>0&&Math.abs(q.x-v.x)<p.aoe)q.hp-=p.dmg*(q===v?1:.45),kill(q)}else v.hp-=p.dmg;burst(v.x,v.y-35,8,p.kind.includes('rocket')?'#ff8055':'#e7bd59');kill(v);P.splice(i,1);shake=p.aoe?.08:0}else{p.x+=dx/dist*step;p.y+=dy/dist*step}}
for(let i=U.length-1;i>=0;i--)if(U[i].hp<=0)U.splice(i,1);for(const f of FX){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=190*dt;f.life-=dt}for(let i=FX.length-1;i>=0;i--)if(FX[i].life<=0)FX.splice(i,1);for(const f of FLOAT){f.y-=26*dt;f.life-=dt}for(let i=FLOAT.length-1;i>=0;i--)if(FLOAT[i].life<=0)FLOAT.splice(i,1);if(saveClock>4){localStorage.setItem('swa_iron_best',JSON.stringify({wave:S.wave,kills:S.kills,gems:S.gems}));saveClock=0}if(S.hp<=0)lose();ui()}
function glow(x,y,r,color,a=.18){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace(')',`,${a})`).replace('rgb','rgba'));g.addColorStop(1,color.replace(')',`,0)`).replace('rgb','rgba'));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawStick(u){const t=T[u.type],s=u.team==='player'?1:-1,sc=t.scale||1;ctx.save();ctx.translate(u.x,u.y+Math.sin(u.phase)*1.4);ctx.scale(sc,sc);ctx.shadowBlur=0;if(t.vehicle) drawVehicle(u,s); else drawWarrior(u,s);ctx.restore();bar(u)}
function drawWarrior(u,s){const enemy=u.team==='enemy';const main=enemy?'#d94d59':'#e8edf4', accent=enemy?'#ff8b67':'#4fd6ff', metal=enemy?'#7f2637':'#26384d';
  ctx.lineCap='round';ctx.lineJoin='round';
  // aura + shadow
  ctx.shadowBlur=12;ctx.shadowColor=accent;ctx.globalAlpha=.14;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(0,-38,28,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
  // legs / boots
  ctx.strokeStyle='#10151d';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(14*s,15);ctx.moveTo(0,-7);ctx.lineTo(-14*s,15);ctx.stroke();
  ctx.strokeStyle=main;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(14*s,14);ctx.moveTo(0,-8);ctx.lineTo(-14*s,14);ctx.stroke();
  ctx.fillStyle='#111820';roundRect(-21*s,9,13*s,8,3);ctx.fill();roundRect(8*s,9,13*s,8,3);ctx.fill();
  // torso armor
  const armor=ctx.createLinearGradient(-15,-42,15,-8);armor.addColorStop(0,main);armor.addColorStop(.5,metal);armor.addColorStop(1,'#0e151d');ctx.fillStyle=armor;roundRect(-13,-41,26,34,7);ctx.fill();
  ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-39);ctx.lineTo(0,-10);ctx.stroke();
  // head + helmet
  ctx.fillStyle='#0c1219';ctx.beginPath();ctx.arc(0,-53,13,0,Math.PI*2);ctx.fill();ctx.fillStyle=main;ctx.beginPath();ctx.arc(0,-53,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=metal;roundRect(-13,-58,26,8,4);ctx.fill();ctx.fillStyle=accent;roundRect(-9,-55,18,3,1.5);ctx.fill();
  // arms
  ctx.strokeStyle=main;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-9,-32);ctx.lineTo(-20*s,-16);ctx.moveTo(9,-32);ctx.lineTo(20*s,-18);ctx.stroke();
  // class weapons
  ctx.strokeStyle=accent;ctx.lineWidth=3;
  if(u.type==='archer'||u.type==='enemyArcher'){ctx.strokeStyle='#d8b46a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(17*s,-18);ctx.lineTo(45*s,-18);ctx.stroke();ctx.beginPath();ctx.arc(45*s,-18,13,Math.PI*.5,Math.PI*1.5,s<0);ctx.stroke();ctx.fillStyle='#e9edf4';ctx.fillRect(27*s,-20,18*s,3)}
  else if(u.type==='spearman'||u.type==='boss'){ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(16*s,-17);ctx.lineTo(62*s,-35);ctx.stroke();ctx.fillStyle='#dce7f1';ctx.beginPath();ctx.moveTo(63*s,-35);ctx.lineTo(54*s,-39);ctx.lineTo(57*s,-29);ctx.closePath();ctx.fill()}
  else if(u.type==='giant'){ctx.lineWidth=9;ctx.strokeStyle=main;ctx.beginPath();ctx.moveTo(17*s,-18);ctx.lineTo(48*s,10);ctx.stroke();ctx.fillStyle=accent;ctx.beginPath();ctx.arc(48*s,10,7,0,Math.PI*2);ctx.fill()}
  else if(u.type==='miner'){ctx.lineWidth=5;ctx.strokeStyle='#d5b06b';ctx.beginPath();ctx.moveTo(15*s,-18);ctx.lineTo(38*s,-43);ctx.stroke();ctx.beginPath();ctx.moveTo(30*s,-47);ctx.lineTo(45*s,-38);ctx.stroke()}
  else {ctx.lineWidth=5;ctx.strokeStyle='#d5dce5';ctx.beginPath();ctx.moveTo(16*s,-18);ctx.lineTo(40*s,-2);ctx.stroke();ctx.fillStyle=accent;ctx.beginPath();ctx.arc(40*s,-2,4,0,Math.PI*2);ctx.fill()}
}
function drawVehicle(u,s){const enemy=u.team==='enemy';const accent=enemy?'#ff4e62':'#40d8ff', dark=enemy?'#361923':'#152938', body=enemy?'#8d3444':'#31586d';
  ctx.shadowBlur=18;ctx.shadowColor=accent;ctx.globalAlpha=.16;ctx.fillStyle=accent;ctx.beginPath();ctx.ellipse(0,-8,47,24,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;
  // tracks
  ctx.fillStyle='#090e14';roundRect(-40,-5,80,24,8);ctx.fill();ctx.fillStyle='#26323c';roundRect(-36,-2,72,17,6);ctx.fill();
  ctx.strokeStyle='#56636e';ctx.lineWidth=2;for(let x=-28;x<=28;x+=12){ctx.beginPath();ctx.moveTo(x,-1);ctx.lineTo(x+3,14);ctx.stroke()}
  // hull
  const grad=ctx.createLinearGradient(0,-58,0,-8);grad.addColorStop(0,body);grad.addColorStop(.55,dark);grad.addColorStop(1,'#0b1118');ctx.fillStyle=grad;roundRect(-35,-48,70,36,9);ctx.fill();
  ctx.strokeStyle=accent;ctx.lineWidth=2;roundRect(-35,-48,70,36,9);ctx.stroke();
  // turret
  ctx.fillStyle='#202e39';roundRect(-19,-62,38,22,8);ctx.fill();ctx.fillStyle=accent;ctx.globalAlpha=.8;roundRect(-10,-59,20,4,2);ctx.fill();ctx.globalAlpha=1;
  let len=u.type==='rocket'||u.type==='enemyRocket'?58:(u.type==='cannon'?54:48);ctx.strokeStyle='#cbd5df';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(9*s,-51);ctx.lineTo(len*s,-51);ctx.stroke();
  if(u.type==='rocket'||u.type==='enemyRocket'){for(let i=0;i<3;i++){ctx.fillStyle='#dfe7ee';roundRect((12+i*11)*s,-71,19,8,3);ctx.fill()}ctx.fillStyle='#ffb24b';ctx.shadowBlur=10;ctx.shadowColor='#ff6b3d';ctx.beginPath();ctx.moveTo(18*s,-75);ctx.lineTo(9*s,-82);ctx.lineTo(20*s,-80);ctx.closePath();ctx.fill();ctx.shadowBlur=0}
  if(u.type==='tank'||u.type==='enemyTank'){ctx.fillStyle=accent;ctx.beginPath();ctx.arc(0,-51,7,0,Math.PI*2);ctx.fill()}
  // headlights / reactor
  ctx.fillStyle=accent;ctx.shadowBlur=14;ctx.shadowColor=accent;ctx.beginPath();ctx.arc(-26,-28,4,0,Math.PI*2);ctx.arc(26,-28,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
}
function bar(u){const p=Math.max(0,u.hp/u.max);ctx.fillStyle='#10141a';ctx.fillRect(u.x-23,u.y-79,46,5);ctx.fillStyle=u.team==='player'?'#63d68b':'#eb6464';ctx.fillRect(u.x-23,u.y-79,46*p,5)}
function base(x,team){const enemy=team==='enemy',accent=enemy?'#ff465f':'#43d9ff';ctx.save();ctx.translate(x,ground());ctx.shadowBlur=25;ctx.shadowColor=accent;ctx.globalAlpha=.16;ctx.fillStyle=accent;ctx.fillRect(-60,-165,120,180);ctx.globalAlpha=1;ctx.shadowBlur=0;
  const g=ctx.createLinearGradient(-50,-155,50,0);g.addColorStop(0,enemy?'#6b2537':'#234b61');g.addColorStop(.55,enemy?'#341722':'#142936');g.addColorStop(1,'#090f15');ctx.fillStyle=g;roundRect(-42,-148,84,164,8);ctx.fill();
  ctx.strokeStyle=accent;ctx.lineWidth=2;roundRect(-42,-148,84,164,8);ctx.stroke();
  ctx.fillStyle=enemy?'#9a4050':'#3d7187';roundRect(-57,-160,114,22,5);ctx.fill();
  ctx.fillStyle='#090f15';roundRect(-14,-70,28,70,5);ctx.fill();ctx.fillStyle=accent;roundRect(-9,-63,18,5,2);ctx.fill();
  for(let i=-27;i<=27;i+=18){ctx.fillStyle='#26343e';ctx.fillRect(i,-126,10,30);ctx.fillStyle=accent;ctx.fillRect(i+3,-120,4,8)}
  ctx.fillStyle=accent;ctx.shadowBlur=14;ctx.shadowColor=accent;ctx.beginPath();ctx.arc(0,-104,8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore()}
function draw(){ctx.clearRect(0,0,W,H);ctx.save();
  if(shake>0){ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*6)}
  // cinematic sky
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050914');g.addColorStop(.35,'#0b1830');g.addColorStop(.68,'#111b27');g.addColorStop(1,'#06090e');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // moon / horizon glow
  const mx=W*.72,my=H*.25;glow(mx,my,150,'rgb(55,178,255)',.13);ctx.fillStyle='rgba(150,220,255,.16)';ctx.beginPath();ctx.arc(mx,my,42,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(220,245,255,.72)';ctx.beginPath();ctx.arc(mx-8,my-5,31,0,Math.PI*2);ctx.fill();
  // distant mountains
  ctx.fillStyle='#09111d';ctx.beginPath();ctx.moveTo(0,ground()-175);for(let x=0;x<=W;x+=90)ctx.lineTo(x,ground()-175-(Math.sin(x*.012)*45+((x*7)%55)));ctx.lineTo(W,ground()+10);ctx.lineTo(0,ground()+10);ctx.fill();
  // stars
  for(let i=0;i<65;i++){const x=(i*149)%W,y=66+(i*67)%Math.max(1,ground()-190),a=.25+((i*17)%60)/100;ctx.fillStyle=`rgba(190,225,255,${a})`;ctx.beginPath();ctx.arc(x,y,(i%4===0?1.3:.7),0,Math.PI*2);ctx.fill()}
  // ground
  const gg=ctx.createLinearGradient(0,ground()-10,0,H);gg.addColorStop(0,'#27313b');gg.addColorStop(.1,'#18212b');gg.addColorStop(1,'#080b10');ctx.fillStyle=gg;ctx.fillRect(0,ground()-4,W,H-ground()+4);
  ctx.strokeStyle='#42515d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,ground());ctx.lineTo(W,ground());ctx.stroke();
  // battlefield lane
  ctx.fillStyle='rgba(4,7,11,.65)';roundRect(90,ground()+18,W-180,62,8);ctx.fill();ctx.strokeStyle='rgba(86,105,118,.45)';ctx.lineWidth=1;roundRect(90,ground()+18,W-180,62,8);ctx.stroke();
  ctx.strokeStyle='rgba(86,215,255,.22)';ctx.setLineDash([18,16]);ctx.beginPath();ctx.moveTo(105,ground()+49);ctx.lineTo(W-105,ground()+49);ctx.stroke();ctx.setLineDash([]);
  // tech pylons
  for(let x=130;x<W-100;x+=Math.max(150,W/5)){ctx.fillStyle='#101820';roundRect(x,ground()-35,7,35,2);ctx.fill();ctx.fillStyle='#43d9ff';ctx.shadowBlur=8;ctx.shadowColor='#43d9ff';ctx.fillRect(x+2,ground()-27,3,7);ctx.shadowBlur=0}
  base(50,'player');base(W-50,'enemy');[...U].sort((a,b)=>a.y-b.y).forEach(drawStick);
  for(const p of P){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2((p.target?.y||p.y)-35-p.y,(p.target?.x||p.x)-p.x));const c=p.kind.includes('rocket')?'#ff704d':'#ffd05b';ctx.shadowBlur=14;ctx.shadowColor=c;ctx.fillStyle=c;roundRect(-7,-3,18,6,3);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(8,-1,5,2);ctx.restore()}
  for(const f of FX){ctx.globalAlpha=f.life/f.max;ctx.shadowBlur=10;ctx.shadowColor=f.c;ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(f.x,f.y,2+5*(f.life/f.max),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1}
  for(const f of FLOAT){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle='#ffe08a';ctx.font='900 12px Arial';ctx.shadowBlur=5;ctx.shadowColor='#000';ctx.fillText(f.text,f.x,f.y);ctx.shadowBlur=0;ctx.globalAlpha=1}
  ctx.restore();if(shake>0)shake=Math.max(0,shake-.016)}
function lose(){running=false;overlay.style.display='flex';screenTitle.textContent='💀 هُزمت';screenText.textContent='سقطت القاعدة في الموجة '+S.wave+'. قتلاتك: '+S.kills;start.textContent='إعادة المحاولة'}function win(){running=false;overlay.style.display='flex';screenTitle.textContent='🏆 انتصار';screenText.textContent='هزمت الموجات الـ15 والزعيم الحديدي! قتلاتك: '+S.kills;start.textContent='حملة جديدة'}function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(loop)}ui();requestAnimationFrame(loop);
