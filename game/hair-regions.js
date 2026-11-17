// Native 32×48 cells. Hair-only bands exclude the face, clothing and cap.
const bands=(...groups)=>groups.flatMap(([top,bottom,left,right])=>
  Array.from({length:bottom-top+1},(_,index)=>[top+index,left,right]));
const sides=(top,bottom,left,right)=>bands([top,bottom,0,left],[top,bottom,right,31]);
export const HAIR_REGIONS={
  'walk-principal':[
    [...bands([0,10,0,31]),
      // The sloping parting reaches into the forehead band. It is not
      // the straight pair of eyebrows two rows below it.
      ...sides(11,11,11,20),...sides(12,12,10,21),...sides(13,13,9,21),
      ...sides(14,14,8,22),...sides(15,16,8,23),
      ...sides(17,17,6,24),...sides(18,21,6,26),...sides(22,22,6,25),
      ...sides(23,23,7,23),...sides(24,24,9,23),
      // The inner edges of the long locks sit beside the lapels, at
      // x10 and x22. Omitting them left two black strips in light hair.
      ...sides(25,26,10,21),...sides(27,34,10,22),...sides(35,37,8,24)],
    [...bands([0,8,0,31],[9,14,0,20],[15,17,0,18],[18,23,0,13],
      [24,28,0,13],[29,37,0,12],[38,39,0,11],[18,20,17,17],[22,22,17,18],
      [23,23,15,17],[24,33,17,17])],
    [...bands([0,35,0,31]),...sides(36,36,11,23)]
  ],
  'walk-alternativo':[
    // Keep the cap (including its front panel and brow-high brim) black.
    // Under that brim, both face-framing locks continue inward of x25.
    [...sides(14,14,9,22),...sides(15,16,8,22),...sides(17,17,6,24),
      ...sides(18,21,7,24),...sides(22,22,8,24),...sides(23,24,8,23),
      ...sides(25,31,8,23),...sides(32,34,8,24),...sides(35,37,7,26)],
    // The face-framing lock lies in front of the ear at x16–19. It is
    // separate from both the long rear hair and the hoodie below y26.
    // Keep the cap crown and the projecting rear bill black.
    [...bands([12,12,14,20],[13,13,13,20],[14,14,12,20],
      [15,15,11,19],[16,17,11,18],
      [18,19,10,15],[20,24,7,15],[25,38,5,12],
      [18,24,16,18],[25,26,17,18],[27,29,18,19])],
    [...bands([15,18,12,25],[19,26,6,27],[27,29,5,27]),
      ...sides(30,34,9,25),...bands([35,36,6,8],[35,36,25,27])]
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
    ...bands([0,9,0,31]),...sides(10,11,11,20),...sides(12,12,10,21),
    ...sides(13,13,9,21),...sides(14,14,9,22),...sides(15,19,8,24),
    ...sides(20,20,8,22),...sides(21,21,9,21),...sides(22,37,10,22),
    ...bands([38,39,8,10],[38,39,24,26])
  ],
  'seat-alternativo':[
    ...sides(11,11,9,22),...sides(12,12,10,23),...sides(13,13,9,22),
    ...sides(14,14,9,22),...sides(15,19,8,24),...sides(20,20,8,22),
    ...sides(21,21,9,21),...sides(22,37,10,22),
    ...bands([38,39,8,10],[38,39,24,26])
  ],
  'seat-boda':[
    ...bands([0,7,0,31],[8,9,0,20],[8,12,27,31],[10,10,19,20]),
    ...bands([10,10,0,11],[11,12,0,10]),...sides(13,13,10,21),
    ...sides(14,14,8,22),...sides(15,15,9,24),...sides(16,19,7,24),
    ...sides(20,20,8,23),...sides(21,21,9,22),...sides(22,37,10,22),
    ...bands([38,39,8,10],[38,39,24,26])
  ]
};
