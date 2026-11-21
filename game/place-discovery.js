export function visiblePlaces(places,save={}){
  const visited=new Set(save.visited??[]);
  return places.filter(place=>!place.hidden||visited.has(place.id));
}
export function placeProgress(places,save={}){
  const visible=visiblePlaces(places,save),visited=new Set(save.visited??[]);
  return {visited:visible.filter(place=>visited.has(place.id)).length,total:visible.length};
}
