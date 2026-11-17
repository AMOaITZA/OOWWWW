import test from 'node:test';
import assert from 'node:assert/strict';
import {SECRET_QUESTIONS,SECRET_ENDING,normalizeSecretQuiz,chooseSecretAnswer,moveSecretQuiz,resetSecretQuiz} from '../game/secret-quiz.js';

test('eight complete romantic questions provide distinct choices and the requested first replies',()=>{
  assert.equal(SECRET_QUESTIONS.length,8);assert.equal(new Set(SECRET_QUESTIONS.map(q=>q.id)).size,8);
  assert.equal(SECRET_QUESTIONS[0].reply,'Noo, el de tus ojos.');assert.match(SECRET_QUESTIONS[1].reply,/^Noo, el tuyo/);
  for(const question of SECRET_QUESTIONS){
    assert.ok(question.prompt.endsWith('?'));assert.ok(question.options.length>=3&&question.options.length<=4);
    assert.equal(new Set(question.options.map(option=>option.id)).size,question.options.length);
    assert.ok(question.options.every(option=>option.label));assert.ok(question.reply.length>10);
  }
});
test('every option reveals the same caring reply without a wrong-answer branch',()=>{
  let state=resetSecretQuiz();
  for(const question of SECRET_QUESTIONS){
    for(const option of question.options){
      const result=chooseSecretAnswer(state,option.id);assert.equal(result.line,question.reply);
      assert.equal(result.state.choices[state.index],option.id);assert.equal(state.choices[state.index],null);
    }
    state=chooseSecretAnswer(state,question.options[0].id).state;state=moveSecretQuiz(state,1);
  }
  assert.equal(state.index,8);assert.match(SECRET_ENDING,/te amo/i);
});
test('navigation requires an answer but preserves choices when revisiting and reloading',()=>{
  let state=resetSecretQuiz();assert.equal(moveSecretQuiz(state,1).index,0);
  state=chooseSecretAnswer(state,'verde').state;state=moveSecretQuiz(state,1);
  state=chooseSecretAnswer(state,'flores').state;state=moveSecretQuiz(state,-1);
  assert.equal(state.index,0);assert.equal(state.choices[0],'verde');
  assert.deepEqual(normalizeSecretQuiz(JSON.parse(JSON.stringify(state))),state);
  assert.equal(moveSecretQuiz(state,1).choices[1],'flores');assert.equal(chooseSecretAnswer(state,'outside'),null);
});
test('legacy and damaged progress cannot skip unanswered questions or retain unknown choices',()=>{
  for(const saved of [undefined,null,'wrong',{index:99,choices:['unknown']},{index:-4,choices:[]}])
    assert.deepEqual(normalizeSecretQuiz(saved),{index:0,choices:Array(8).fill(null)});
  assert.equal(normalizeSecretQuiz({index:7,choices:['azul','cafe']}).index,2);
});
test('the final chapter remains saved and restarting produces a fresh independent game',()=>{
  let state=resetSecretQuiz();
  for(const question of SECRET_QUESTIONS){state=chooseSecretAnswer(state,question.options[0].id).state;state=moveSecretQuiz(state,1);}
  assert.equal(normalizeSecretQuiz(state).index,8);assert.equal(moveSecretQuiz(state,1).index,8);
  assert.equal(moveSecretQuiz(state,-1).index,7);assert.deepEqual(resetSecretQuiz(),{index:0,choices:Array(8).fill(null)});
});
