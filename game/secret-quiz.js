import questions from './data/secret-questions.json' with {type:'json'};

export const SECRET_QUESTIONS=questions;
export const SECRET_ENDING='Al final, todas mis respuestas favoritas se parecen a ti. Te amo mil ocho mil.';
export function normalizeSecretQuiz(saved){
  const choices=questions.map((question,index)=>{
    const value=saved?.choices?.[index];
    return question.options.some(option=>option.id===value)?value:null;
  });
  const raw=saved?.index;
  let index=Number.isInteger(raw)?Math.max(0,Math.min(questions.length,raw)):0;
  // A damaged save cannot skip past the first unanswered question.
  const unanswered=choices.indexOf(null);
  if(unanswered>=0)index=Math.min(index,unanswered);
  return {index,choices};
}
export function chooseSecretAnswer(saved,optionId){
  const state=normalizeSecretQuiz(saved),question=questions[state.index];
  if(!question||!question.options.some(option=>option.id===optionId))return null;
  state.choices[state.index]=optionId;
  return {state,line:question.reply};
}
export function moveSecretQuiz(saved,delta){
  const state=normalizeSecretQuiz(saved);
  if(delta!==-1&&delta!==1)return state;
  if(delta===1&&(state.index===questions.length||!state.choices[state.index]))return state;
  return {...state,index:Math.max(0,Math.min(questions.length,state.index+delta))};
}
export const resetSecretQuiz=()=>normalizeSecretQuiz();
