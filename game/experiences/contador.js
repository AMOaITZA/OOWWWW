import {node,paragraph} from './dom.js';
const names=['años','meses','días','horas','min','seg'];
function diff(start,now){
  if(now<start)now=start;
  let anchor=new Date(start),years=0,months=0;
  while(true){const next=new Date(anchor);next.setFullYear(next.getFullYear()+1);if(next>now)break;anchor=next;years++;}
  while(true){const next=new Date(anchor);next.setMonth(next.getMonth()+1);if(next>now)break;anchor=next;months++;}
  let sec=Math.floor((now-anchor)/1000);
  const days=Math.floor(sec/86400);sec%=86400;const hours=Math.floor(sec/3600);sec%=3600;const minutes=Math.floor(sec/60);sec%=60;
  return [years,months,days,hours,minutes,sec];
}
export function mount(root,data){
  const start=new Date(data.since),grid=node('div','counter-grid-game');
  const values=[];
  names.forEach((name)=>{const box=node('div','counter-box'),num=node('strong'),label=node('span','',name);box.append(num,label);grid.append(box);values.push(num);});
  root.append(grid);paragraph(root,data.text);
  function update(){diff(start,new Date()).forEach((n,i)=>{values[i].textContent=String(n).padStart(2,'0');});}
  update();const interval=setInterval(update,1000);
  return ()=>clearInterval(interval);
}
