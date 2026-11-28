import {node,labeledButton} from './dom.js';
import {SECRET_QUESTIONS,SECRET_ENDING,normalizeSecretQuiz,chooseSecretAnswer,moveSecretQuiz,resetSecretQuiz} from '../secret-quiz.js';
import './secreto.css';

export function mount(root,_data,api){
  api.save??={};
  let state=normalizeSecretQuiz(api.save.secretQuiz),alive=true;
  const shell=node('section','secret-quiz');
  shell.setAttribute('aria-label','Preguntas de nuestro rincón secreto');
  const intro=node('p','secret-intro','Hay respuestas que siempre me llevan a ti. Elige una y escucha lo que Leo quiere decirte.');
  const progress=node('p','secret-progress');
  const dots=node('div','secret-dots');dots.setAttribute('aria-hidden','true');
  const card=node('div','secret-card'),heading=node('h3','secret-question');heading.tabIndex=-1;
  const options=node('div','secret-options');options.setAttribute('role','group');
  const reply=node('p','secret-reply');reply.setAttribute('role','status');reply.setAttribute('aria-live','polite');
  const replyAgain=labeledButton('Otra vez, Leo',()=>{
    const question=SECRET_QUESTIONS[state.index];
    if(state.index===SECRET_QUESTIONS.length)api.onLeoSay?.(SECRET_ENDING);
    else if(question&&state.choices[state.index])api.onLeoSay?.(question.reply);
  },'secret-button secret-repeat');
  const controls=node('div','secret-controls');
  const previous=labeledButton('Anterior',()=>navigate(-1),'secret-button');
  const next=labeledButton('Siguiente',()=>navigate(1),'secret-button secret-next');
  const restart=labeledButton('Volver a jugar',()=>{
    if(!alive)return;
    state=resetSecretQuiz();save();render();heading.focus({preventScroll:false});
  },'secret-button secret-next');
  controls.append(previous,next,restart);card.append(heading,options,reply,replyAgain);
  shell.append(intro,progress,dots,card,controls);root.append(shell);
  function save(){api.save.secretQuiz={index:state.index,choices:[...state.choices]};api.onProgressChange?.();}
  function navigate(delta){
    if(!alive)return;
    const before=state.index;state=moveSecretQuiz(state,delta);
    if(before===state.index)return;
    save();render();heading.focus({preventScroll:false});
    if(state.index===SECRET_QUESTIONS.length)api.onLeoSay?.(SECRET_ENDING);
  }
  function choose(id){
    if(!alive)return;
    const result=chooseSecretAnswer(state,id);if(!result)return;
    state=result.state;save();render();api.onLeoSay?.(result.line);next.focus({preventScroll:true});
  }
  function render(){
    const ended=state.index===SECRET_QUESTIONS.length,question=SECRET_QUESTIONS[state.index];
    shell.dataset.question=ended?'end':question.id;
    progress.textContent=ended?'Un secreto para guardar':'Pregunta '+(state.index+1)+' de '+SECRET_QUESTIONS.length;
    dots.replaceChildren();
    SECRET_QUESTIONS.forEach((_question,index)=>{
      const dot=node('span',index===state.index?'current':state.choices[index]?'answered':'');dots.append(dot);
    });
    heading.textContent=ended?'Mi respuesta favorita eres tú':question.prompt;
    options.replaceChildren();options.hidden=ended;
    options.setAttribute('aria-label',ended?'Preguntas terminadas':question.prompt);
    if(question)for(const option of question.options){
      const button=labeledButton(option.label,()=>choose(option.id),'secret-choice');
      button.dataset.choice=option.id;button.setAttribute('aria-pressed',String(state.choices[state.index]===option.id));
      if(option.swatch){button.style.setProperty('--secret-swatch',option.swatch);button.classList.add('has-swatch');}
      options.append(button);
    }
    const answered=!ended&&Boolean(state.choices[state.index]);
    reply.hidden=!ended&&!answered;
    reply.textContent=ended?'Leo: '+SECRET_ENDING:answered?'Leo: '+question.reply:'';
    replyAgain.hidden=!answered&&!ended;previous.disabled=state.index===0;
    next.disabled=!answered;next.hidden=ended;next.textContent=state.index===SECRET_QUESTIONS.length-1?'Guardar este secreto':'Siguiente';
    restart.hidden=!ended;
  }
  render();
  return ()=>{alive=false;};
}
