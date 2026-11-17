// Native 32×48 cells. Hair-only bands exclude the face, clothing and cap.
const bands=(...groups)=>groups.flatMap(([top,bottom,left,right])=>
  Array.from({length:bottom-top+1},(_,index)=>[top+index,left,right]));
const sides=(top,bottom,left,right)=>bands([top,bottom,0,left],[top,bottom,right,31]);
export const HAIR_REGIONS={
  'walk-principal':[
    [...bands([0,10,0,31]),...sides(11,13,9,23),...sides(14,16,8,25),
      ...sides(17,24,6,26),...sides(25,33,9,24),...sides(34,37,8,25)],
    [...bands([0,8,0,31],[9,14,0,20],[15,17,0,18],[18,23,0,13],
      [24,37,0,12],[38,39,0,11],[18,20,17,17],[22,22,17,18],
      [23,23,15,17],[24,33,17,17])],
    [...bands([0,35,0,31]),...sides(36,36,11,23)]
  ],
  'walk-alternativo':[
    [...sides(14,16,8,25),...sides(17,24,6,27),...sides(25,34,8,25),...sides(35,37,7,26)],
    // The face-framing lock lies in front of the ear at x16–19. It is
    // separate from both the long rear hair and the hoodie below y26.
    // Keep the cap crown and the projecting rear bill black.
    [...bands([12,14,16,20],[15,15,17,19],[16,17,16,18],
      [18,19,10,15],[20,24,7,15],[25,38,5,12],
      [18,24,16,18],[25,26,17,18],[27,29,18,19])],
    [...bands([15,18,12,25],[19,29,6,27]),...sides(30,34,9,25)]
  ],
  'walk-boda':[
    // Trace the fringe above the forehead and the locks below the glasses
    // separately. The previous left/right bands skipped the entire inside
    // edge of the right lock; it is hair, not the cheek or the gown.
    [...bands([0,10,0,25],[11,11,16,20],[12,12,17,20],[13,13,18,21],
      [14,14,19,21],[15,15,19,24],[16,16,21,24]),
      ...sides(11,13,8,23),...sides(14,17,6,25),...sides(18,21,5,24),
      ...sides(22,23,5,21),...sides(24,24,5,20),...sides(25,27,10,19),
      ...bands([26,26,16,18],[27,27,17,18]),
      ...sides(28,31,8,19),...sides(32,33,8,20),...sides(34,37,7,21)],
    // The front lock continues beside the cheek through x18, not x13.
    // Narrow it again at the shoulder so the exposed arm/gown stay intact.
    [...bands([0,9,0,26],[10,13,9,21],[14,14,12,21],[15,18,10,18],
      [19,25,9,18],[26,27,5,18],[28,30,5,16],[31,34,2,16],[35,38,4,16],[39,39,8,12])],
    // The veil stops at y25. Its former gutter x6–8 becomes a rear lock
    // below it, so keeping that gutter transparent in the mask left a black
    // stripe. Flower/veil RGB and the two exposed arms remain untouched.
    [...bands([0,10,0,31],[11,13,10,27],[14,25,8,28],[26,33,5,28],
      [34,35,6,26],[36,37,7,25],[38,38,9,23])]
  ],
  'seat-principal':[
    ...bands([0,9,0,31]),...sides(10,14,10,24),...sides(15,21,8,26),
    ...sides(22,37,10,24),...bands([38,39,8,10],[38,39,24,26])
  ],
  'seat-alternativo':[
    ...sides(11,14,9,25),...sides(15,21,8,26),...sides(22,37,10,24),
    ...bands([38,39,8,10],[38,39,24,26])
  ],
  'seat-boda':[
    ...bands([0,9,0,24]),...sides(10,14,10,24),...sides(15,21,7,26),
    ...sides(22,37,10,24),...bands([38,39,8,10],[38,39,24,26])
  ]
};
