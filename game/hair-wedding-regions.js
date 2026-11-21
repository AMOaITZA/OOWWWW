// Hand traced on the native 64×48 couple cells. Runs are inclusive [y,x0,x1]
// and describe only Itza's crown and long locks. Faces, glasses, veil, gown,
// Leo and the ceremonial bench are outside these regions. The hair renderer
// additionally filters neutral dark hair shades and preserves black outlines.
const region=(segments,holes=[])=>({runs:segments.flatMap(([top,bottom,left,right])=>
  Array.from({length:bottom-top+1},(_,offset)=>[top+offset,left,right]))
  .flatMap(run=>holes.reduce((runs,[top,bottom,left,right])=>runs.flatMap(([y,a,b])=>{
    if(y<top||y>bottom||b<left||a>right)return [[y,a,b]];
    return [...(a<left?[[y,a,left-1]]:[]),...(b>right?[[y,right+1,b]]:[])];
  }),[run]))});
const shifted=(segments,dx=0,dy=0)=>segments.map(([a,b,c,d])=>[a+dy,b+dy,c+dx,d+dx]);

const idle=[
  [4,9,32,49],[10,12,31,34],[10,12,42,49],
  [13,14,31,32],[13,14,44,49],[15,22,31,32],[15,22,46,49],
  [23,24,30,35],[23,24,42,49],[25,28,30,33],[25,28,42,49],
  [29,31,30,32],[29,31,44,49],[32,33,31,32],[32,33,44,48],
  [34,35,44,46]
];
const vows=[
  [5,9,33,50],[10,12,32,34],[10,12,42,49],
  [13,14,31,33],[13,14,44,49],[15,22,32,33],[15,22,46,49],
  [23,24,32,35],[23,24,42,49],[25,28,32,35],[25,28,44,49],
  [29,33,33,34],[29,33,44,48],[34,35,46,48]
];
const kiss0=[
  [5,9,32,49],[10,10,32,34],[10,10,41,49],
  [11,13,31,33],[11,13,40,49],[14,22,31,32],[14,22,44,48],
  [23,25,33,35],[23,25,40,48],[26,30,39,48],[31,34,40,47],
  [35,35,41,44]
];
const kiss1=[
  [6,10,32,49],[11,13,31,32],[11,13,38,48],
  [14,17,31,31],[14,17,40,48],[18,23,44,47],
  [24,27,39,47],[28,31,39,46],[32,35,39,45],[36,36,42,43]
];
const kiss2=[
  [6,10,32,48],[11,14,31,32],[11,14,37,47],
  [15,18,39,47],[19,23,43,47],[24,28,37,46],
  [29,34,36,45],[35,38,38,41]
];
const hug0=[
  [5,9,32,47],[10,12,31,32],[10,12,40,46],
  [13,15,31,31],[13,15,42,46],[16,22,44,46],
  [23,25,40,46],[26,29,39,45],[30,33,37,45],
  [34,36,39,43],[37,37,41,42]
];
const hug1=[
  [6,11,32,46],[12,14,31,31],[12,14,37,45],
  [15,17,39,45],[18,22,43,45],[23,26,39,45],
  [27,30,38,45],[31,33,37,44],[34,36,39,43],[37,37,41,42]
];
const celebration=[
  [5,9,32,49],[10,12,31,34],[10,12,42,49],
  [13,14,31,32],[13,14,44,49],[15,22,31,32],[15,22,46,49],
  [23,24,31,35],[23,24,42,49],[25,28,30,34],[25,29,43,48],
  [29,32,31,33],[30,34,44,48],[35,35,44,46]
];
const celebrationRaised=[
  ...celebration.filter(([top])=>top<25),
  [25,28,30,34],[29,32,31,33],[25,35,41,48],[36,36,43,46]
];
const bench=[
  [4,8,33,51],[9,11,32,35],[9,11,43,50],
  [12,12,32,34],[12,12,45,50],[13,21,32,33],[13,21,47,50],
  [22,24,32,36],[22,24,43,50],[25,28,32,34],[25,28,43,50],
  [29,31,33,34],[29,31,46,49],[32,34,46,48]
];

export const WEDDING_HAIR_REGIONS={
  idle:[region(idle,[[9,14,47,52]]),region(idle,[[9,14,47,52]])],
  vows:[region(vows,[[10,14,47,52]]),region(vows,[[10,14,47,52]]),
    region(vows,[[10,14,47,52]]),region(shifted(vows,-1),[[10,14,46,51]])],
  kiss:[region(kiss0,[[11,15,46,51]]),region(kiss1,[[12,16,45,50]]),
    region(kiss2,[[12,16,44,49]])],
  hug:[region(hug0,[[11,15,44,49]]),region(hug1,[[11,15,42,47]])],
  celebrate:[region(celebration,[[10,14,46,51]]),region(celebrationRaised,[[10,14,46,51]]),
    region(celebration,[[10,14,46,51]])],
  'wedding-bench-v2':[region(bench,[[9,14,48,53]]),region(bench,[[9,14,48,53]])],
  'wedding-bench':[region(bench,[[9,14,48,53]]),region(bench,[[9,14,48,53]])]
};
