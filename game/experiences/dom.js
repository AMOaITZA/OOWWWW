export const node=(tag,cls,text)=>{
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text!==undefined)element.textContent=text;
  return element;
};
export function paragraph(root,text,cls=''){const p=node('p',cls,text);root.append(p);return p;}
export function picture(src,alt=''){
  const image=node('img');image.src=src;image.alt=alt;image.loading='lazy';image.decoding='async';return image;
}
export function labeledButton(text,onClick,cls='pixel-action'){
  const button=node('button',cls,text);button.type='button';button.addEventListener('click',onClick);return button;
}
export function heading(root,text){root.append(node('h3','experience-heading',text));}
