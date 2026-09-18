/**
 * Transparent descriptive coaching, not a psychometric or clinical assessment.
 * Input: saved snapshots {id, startedAt, updatedAt, endedAt?, state, numeracy?}.
 * Give questions/records eventId and createdAt; retain IDs when saving a snapshot.
 * Give a replay a NEW eventId. Legacy IDs are conservatively deduplicated.
 * Interview self-rubric: state.interviewRubric = {question,evidence,reasoning,conclusion},
 * each an integer 0..2, or null if not rated. No prose is automatically graded.
 */
const DAY = 86_400_000;
const LABELS = {addition:'Addition', subtraction:'Subtraction', evidence:'Evidence reasoning', interview:'Coherent explanation'};
const RUBRIC_KEYS = ['question','evidence','reasoning','conclusion'];
// Verified keys are bundled with the service, never accepted from a saved response.
const CASE_KEYS = {
  'hubble-v1':{c1:0,c2:1,c3:2},
  'apollo13-air-v1':{a13c1:1,a13c2:2,a13c3:0}
};
const CASE_IDS = Object.fromEntries(Object.entries(CASE_KEYS).flatMap(([caseId,keys])=>Object.keys(keys).map(id=>[id,caseId])));
const object = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const array = x => Array.isArray(x) ? x : [];
const text = x => typeof x === 'string' ? x.trim() : '';
const finite = x => typeof x === 'number' && Number.isFinite(x);
const stamp = x => typeof x === 'string' && Number.isFinite(Date.parse(x)) ? Date.parse(x) : null;
const iso = x => new Date(x).toISOString();
const safeInt = x => Number.isSafeInteger(x);
const median = xs => { if(!xs.length) return null; const a=[...xs].sort((x,y)=>x-y), n=a.length; return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2; };
const hasWords = x => !!text(x);

function timestamp(snapshot, record={}, question={}) {
  if(question.provenance==='imported-undated'&&stamp(record.firstAnswerAt)===null) return {at:null,timestampSource:'unknown'};
  for (const [source,value] of [['answer',record.firstAnswerAt],['created',record.createdAt],['created',question.createdAt],['saved',snapshot.updatedAt],['session',snapshot.startedAt]]) {
    const ms=stamp(value); if(ms!==null) return {at:iso(ms),timestampSource:source};
  }
  return {at:null,timestampSource:'unknown'};
}

function identity(snapshot, record, question, fallback) {
  const stable=text(record.eventId)||text(record.trialId)||text(question.eventId)||text(question.trialId);
  if(stable) return {id:stable,identitySource:'event'};
  const lineage=text(object(snapshot.state).historyId)||text(object(snapshot.state).historyLineageId);
  return {id:`legacy:${lineage||'unknown'}:${fallback}`,identitySource:'legacy'};
}

function rubric(raw) {
  const source=object(raw), dimensions={};
  for(const key of RUBRIC_KEYS) dimensions[key]=Number.isInteger(source[key])&&source[key]>=0&&source[key]<=2?source[key]:null;
  const values=Object.values(dimensions).filter(x=>x!==null);
  return {dimensions,rated:values.length,total:values.length?values.reduce((a,b)=>a+b,0):null,possible:values.length*2,complete:values.length===4};
}

/** Normalize one snapshot. Generated but unvisited questions do not become trials. */
export function summarizeSession(snapshot={}) {
  snapshot=object(snapshot);
  const state=object(snapshot.state), records=object(state.records), bank={...object(state.numberBank)}, events=[];
  for(const q of array(snapshot.numeracy)) if(q&&text(q.id)&&!bank[q.id]) bank[q.id]=q;
  const sessionId=text(snapshot.id)||'unknown', caseTrial=object(state.caseTrial);
  for(const [recordKey,raw] of Object.entries(records)) {
    const r=object(raw), answers=array(r.answers).filter(a=>a&&typeof a==='object'), first=answers[0], q=object(bank[recordKey]);
    const hinted=finite(r.hints)&&r.hints>0 || answers.some(a=>a.hintUsed===true);
    const revealed=r.revealed===true, completed=r.complete===true||revealed;
    // An active clock alone means a question was displayed, not attempted.
    if(!answers.length&&!hinted&&!revealed&&!completed&&r.sourceOpened!==true) continue;
    if(['add','sub'].includes(q.op)&&safeInt(q.a)&&safeInt(q.b)&&Number.isInteger(q.level)&&q.level>=1&&q.level<=5) {
      const expected=q.op==='add'?q.a+q.b:q.a-q.b;
      if(!safeInt(expected)) continue;
      const attempted=!!first&&safeInt(first.value), firstCorrect=attempted?first.value===expected:null;
      // Missing hint metadata is not proof of an independent response.
      const independent=firstCorrect===true&&first.hintUsed===false&&!revealed;
      const ms=finite(r.firstMs)&&r.firstMs>0?r.firstMs:null;
      events.push({...identity(snapshot,r,q,`number:${q.id||recordKey}:${q.serial??''}:${q.round??''}:${q.op}:${q.level}:${q.a}:${q.b}`),
        ...timestamp(snapshot,r,q),sessionId:text(r.sessionId)||text(q.sessionId)||sessionId,kind:'numeracy',skill:q.op==='add'?'addition':'subtraction',
        phase:q.phase==='calibration'?'calibration':'practice',level:q.level,format:text(q.format)||'calculation',
        itemKey:`${q.op}:${q.a}:${q.b}`,roundId:`${text(state.historyId)||sessionId}:${q.round??'unknown'}`,
        attempted,firstCorrect,independent,hintUsed:hinted,revealed,completed:completed||answers.some(a=>safeInt(a.value)&&a.value===expected),
        attempts:answers.filter(a=>safeInt(a.value)).length,interrupted:r.interrupted===true,firstMs:ms,
        timingEligible:independent&&r.interrupted!==true&&ms!==null});
    } else if(Object.hasOwn(CASE_IDS,recordKey)||r.skill==='Evidence reasoning') {
      const caseId=text(caseTrial.caseId)||CASE_IDS[recordKey]||'unknown-case', keys=CASE_KEYS[caseId];
      const key=keys&&Object.hasOwn(keys,recordKey)?keys[recordKey]:null;
      const attempted=!!first&&Number.isInteger(first.value), firstCorrect=attempted&&key!==null?first.value===key:null;
      const priorFamiliarity=r.priorFamiliarity===true||caseTrial.priorFamiliarity===true, repeatExposure=caseTrial.exposure==='repeat';
      // Prefer a captured first-answer flag; ever-opened flags have unknown ordering.
      const sourceOpened=typeof first?.sourceOpened==='boolean'?first.sourceOpened:
        typeof r.sourceOpenedBeforeAnswer==='boolean'?r.sourceOpenedBeforeAnswer:r.sourceOpened===true||caseTrial.sourceOpened===true;
      const trialRecord={...r,eventId:r.eventId||(text(caseTrial.id)?`${caseTrial.id}:${recordKey}`:undefined)};
      events.push({...identity(snapshot,trialRecord,{},`case:${recordKey}`),...timestamp(snapshot,r,{createdAt:caseTrial.startedAt}),
        sessionId:text(r.sessionId)||text(caseTrial.sessionId)||sessionId,kind:'case',skill:'evidence',
        phase:'practice',caseId,itemKey:`${caseId}:${recordKey}`,attempted,firstCorrect,
        independent:firstCorrect===true&&first.hintUsed===false&&!revealed&&!sourceOpened&&!priorFamiliarity&&!repeatExposure,
        priorFamiliarity,repeatExposure,sourceOpened,hintUsed:hinted,revealed,
        completed:completed||answers.some(a=>key!==null&&a.value===key),attempts:answers.length});
    }
  }
  const draft=object(state.draft), thinking=object(state.interviewThinking), selfRubric=rubric(state.interviewRubric);
  const fields=['problem','action','why','result'], filled=fields.filter(k=>hasWords(draft[k]));
  if(filled.length||['interpretation','approach','rationale','revision'].some(k=>hasWords(thinking[k]))||selfRubric.rated||state.interviewSaved===true) {
    const trial=object(state.interviewTrial), r={eventId:state.interviewTrialId||trial.id,createdAt:state.interviewStartedAt||trial.startedAt};
    events.push({...identity(snapshot,r,{},'interview:process-improvement-v1'),...timestamp(snapshot,r),sessionId:text(trial.sessionId)||sessionId,
      kind:'interview',skill:'interview',phase:'practice',itemKey:text(state.interviewQuestionId)||text(trial.promptId)||'process-improvement-v1',
      filledParts:filled.length,missingParts:fields.filter(k=>!hasWords(draft[k])),finished:state.interviewSaved===true,
      supportUsed:thinking.supportUsed===true,initialAttemptRecorded:!!object(thinking.firstAttempt).interpretation,
      selfRubric});
  }
  // Archives contain actual replay trials, rather than copies of one current record.
  for(const rawTrial of array(state.caseTrials)) {
    const trial=object(rawTrial);
    events.push(...summarizeSession({...snapshot,state:{historyId:state.historyId,caseTrial:trial,records:object(trial.records)}}).events);
  }
  for(const rawTrial of array(state.interviewTrials)) {
    const trial=object(rawTrial);
    events.push(...summarizeSession({...snapshot,state:{historyId:state.historyId,interviewTrial:trial,
      interviewThinking:trial.thinking,draft:trial.draft,interviewRubric:trial.rubric,interviewSaved:trial.finished}}).events);
  }
  return {id:sessionId,startedAt:stamp(snapshot.startedAt)===null?null:iso(stamp(snapshot.startedAt)),
    updatedAt:stamp(snapshot.updatedAt)===null?null:iso(stamp(snapshot.updatedAt)),ended:stamp(snapshot.endedAt)!==null,
    events,limitations:events.some(e=>e.identitySource==='legacy')?['Some older records have no stable trial ID; copied records are conservatively deduplicated.']:[]};
}

function counts(events) {
  const answered=events.filter(e=>e.attempted), scoreable=answered.filter(e=>typeof e.firstCorrect==='boolean');
  return {trials:events.length,answered:answered.length,scoreable:scoreable.length,
    firstCorrect:scoreable.filter(e=>e.firstCorrect).length,firstAccuracy:scoreable.length?scoreable.filter(e=>e.firstCorrect).length/scoreable.length:null,
    independentCorrect:events.filter(e=>e.independent).length,hinted:events.filter(e=>e.hintUsed).length,
    revealed:events.filter(e=>e.revealed).length,completed:events.filter(e=>e.completed).length};
}

function bucketStats(events) {
  const eligible=events.filter(e=>e.timingEligible), result=counts(events);
  return {...result,rounds:new Set(events.map(e=>e.roundId)).size,timedTrials:eligible.length,
    medianFirstMs:median(eligible.map(e=>e.firstMs)),interrupted:events.filter(e=>e.interrupted).length};
}

function numericRow(skill,current,previous,all,preferredLevel) {
  const recent=current.filter(e=>e.skill===skill), practice=recent.filter(e=>e.phase==='practice'), prior=previous.filter(e=>e.skill===skill&&e.phase==='practice');
  const latest=[...all].reverse().find(e=>e.skill===skill), level=preferredLevel??latest?.level??null;
  const keys=[...new Set(practice.concat(prior).map(e=>`${e.level}|${e.format}`))].sort();
  const byLevel=keys.map(key=>{
    const [rawLevel,format]=key.split('|'), n=Number(rawLevel), select=xs=>xs.filter(e=>e.level===n&&e.format===format);
    const now=bucketStats(select(practice)), before=bucketStats(select(prior));
    return {level:n,format,current:now,previous:before,
      accuracyDifference:now.scoreable>=8&&before.scoreable>=8?now.firstAccuracy-before.firstAccuracy:null,
      medianFirstMsDifference:now.timedTrials>=4&&before.timedTrials>=4?now.medianFirstMs-before.medianFirstMs:null};
  });
  const selected=practice.filter(e=>e.level===level&&e.format===(latest?.format||'calculation')&&e.attempted).slice(-8);
  const s=bucketStats(selected), enough=s.scoreable>=8&&s.rounds>=2;
  let status=!recent.length?'no_recent_practice':!enough?'collecting':s.firstCorrect>=7&&s.independentCorrect>=6?(level<5?'ready_for_probe':'maintain'):'consolidate';
  const note=status==='ready_for_probe'?'Recent accuracy supports trying a small number of harder questions; this is not a mastery claim.':
    status==='maintain'?'Vary questions at this level. Correct answers do not establish performance on other skills.':
    status==='consolidate'?'Practise the same method with fresh questions and optional support.':
    status==='collecting'?'Gather more comparable practice. Calibration and timing alone do not establish mastery.':'No recent practice recorded for this skill.';
  return {skill,label:LABELS[skill],status,currentLevel:level,practice:counts(practice),previousPractice:counts(prior),
    calibration:counts(recent.filter(e=>e.phase==='calibration')),previousCalibration:counts(previous.filter(e=>e.skill===skill&&e.phase==='calibration')),byLevel,note};
}

function caseRow(current) {
  const events=current.filter(e=>e.skill==='evidence'), stats=counts(events);
  return {skill:'evidence',label:LABELS.evidence,status:events.length?'task_evidence':'no_recent_practice',practice:stats,
    novelItems:events.filter(e=>e.novelItem).length,repeatedTrials:events.filter(e=>!e.novelItem).length,
    firstRecordedItems:events.filter(e=>e.firstRecordedItem).length,
    priorFamiliarTrials:events.filter(e=>e.priorFamiliarity||e.repeatExposure).length,
    sourceSupportedTrials:events.filter(e=>e.sourceOpened).length,
    novelIndependentCorrect:events.filter(e=>e.novelItem&&e.independent).length,
    note:'First recorded items are not proof of unfamiliarity. Declared familiarity and repeat exposure count as familiar practice. Source exposure excludes independent credit; older source flags with unknown timing are treated conservatively. Fixed choices do not grade written reasoning.'};
}

function interviewRow(current) {
  const events=current.filter(e=>e.kind==='interview'), dimensions={};
  for(const key of RUBRIC_KEYS) {const values=events.map(e=>e.selfRubric.dimensions[key]).filter(v=>v!==null);dimensions[key]={ratedTrials:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
  return {skill:'interview',label:LABELS.interview,status:events.length?'self_review':'no_recent_practice',
    practice:{trials:events.length,finished:events.filter(e=>e.finished).length,completeOutlines:events.filter(e=>e.filledParts===4).length,
      supported:events.filter(e=>e.supportUsed).length,initialAttempts:events.filter(e=>e.initialAttemptRecorded).length},
    selfRubric:{ratedTrials:events.filter(e=>e.selfRubric.rated>0).length,dimensions},
    note:'Outline completeness and self-ratings are separate. Neither is an automated assessment of reasoning quality; there is no IQ or attention score.'};
}

function nextTasks(matrix,events) {
  const result=[];
  for(const row of matrix.filter(r=>['addition','subtraction'].includes(r.skill))) {
    const level=row.currentLevel??4, probe=row.status==='ready_for_probe';
    result.push({skill:row.skill,minutes:5,action:probe?`Try two level ${level+1} ${row.label.toLowerCase()} questions, then two familiar ones.`:
      `Try four fresh ${row.label.toLowerCase()} questions at level ${level}.`,
      level,probeLevel:probe?level+1:null,reason:row.status==='consolidate'?'Recent first answers need more consolidation. Use a worked example if useful.':
        probe?'At least seven of eight comparable first answers were correct, including six without support.':row.status==='maintain'?'Current questions are accurate; vary examples and explain one method.':'There is not yet enough comparable recent practice to recommend an increase.'});
  }
  const cases=events.filter(e=>e.skill==='evidence'), seenItems=new Set(cases.map(e=>e.itemKey));
  const remainingCase=Object.keys(CASE_KEYS).find(id=>Object.keys(CASE_KEYS[id]).some(key=>!seenItems.has(`${id}:${key}`)));
  const caseId=remainingCase||'apollo13-air-v1', seenCase=cases.some(e=>e.caseId===caseId), title=caseId==='hubble-v1'?'Hubble':'Apollo 13';
  result.push({skill:'evidence',minutes:8,caseId,caseMode:remainingCase?(seenCase?'continue':'first'):'revisit',
    action:remainingCase?`${seenCase?'Continue':'Try'} the ${title} investigation, then explain which clue supports your choice.`:
      'Revisit one Apollo 13 decision. Give a credible alternative and explain which clue favours your choice.',
    reason:remainingCase?(seenCase?'There are still clues in this available case without a recorded response or worked explanation.':
      'This case has no recorded responses yet. Record any prior familiarity; a new record does not guarantee a new problem.'):
      'Both available cases have been encountered. This is explanation practice on familiar material.'});
  const last=[...events].reverse().find(e=>e.kind==='interview');
  const prompts={problem:'State the specific problem your example addresses.',action:'State what you personally did.',why:'Explain why your action suited the problem.',result:'Name one outcome you can support.'};
  const low=last?RUBRIC_KEYS.find(k=>last.selfRubric.dimensions[k]!==null&&last.selfRubric.dimensions[k]<2):null;
  const actions={question:'State what the question asks before choosing your example.',evidence:'Connect one claim in your answer to a concrete example.',reasoning:'Explain why your chosen action addressed the problem, and one alternative.',conclusion:'Finish with a supported outcome and one remaining uncertainty.'};
  result.push({skill:'interview',minutes:10,action:!last?'Build a four-part example: problem, action, reason and outcome.':
    last.missingParts.length?prompts[last.missingParts[0]]:low?actions[low]:'Give your answer aloud once; self-review its question, evidence, reasoning and conclusion.',
    reason:!last?'Create a starting example without a quality score.':last.missingParts.length?'This part of the outline is still empty; filling it does not by itself establish quality.':
      low?'This targets a dimension you rated as needing attention, not an inferred weakness.':'Use a self-review separately from the check that all four parts contain text.'});
  return result;
}

function weeklyTimeline(events,now) {
  const weeks=[];
  for(let offset=25;offset>=0;offset--) {
    const end=now-offset*7*DAY,start=end-7*DAY;
    const slice=events.filter(e=>stamp(e.at)>=start&&(offset===0?stamp(e.at)<=end:stamp(e.at)<end));
    const skills=Object.keys(LABELS).map(skill=>{
      const rows=slice.filter(e=>e.skill===skill);
      if(skill==='interview') {const row=interviewRow(rows);return {skill,practice:row.practice,selfRubric:row.selfRubric};}
      if(skill==='evidence') {const row=caseRow(rows);return {skill,practice:row.practice,novelItems:row.novelItems,repeatedTrials:row.repeatedTrials,
        firstRecordedItems:row.firstRecordedItems,priorFamiliarTrials:row.priorFamiliarTrials,sourceSupportedTrials:row.sourceSupportedTrials};}
      const practice=rows.filter(e=>e.phase==='practice'), groups=new Map();
      for(const e of practice) {const key=`${e.level}|${e.format}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
      return {skill,practice:counts(practice),calibrationTrials:rows.filter(e=>e.phase==='calibration').length,
        byLevel:[...groups.values()].map(es=>({level:es[0].level,format:es[0].format,...bucketStats(es)}))};
    });
    weeks.push({start:iso(start),end:iso(end),skills});
  }
  return weeks;
}

/** Weekly rolling UTC window [now - 7 days, now], with the prior seven days for comparison. */
export function analyze(sessions=[],nowISO=new Date().toISOString()) {
  const now=stamp(nowISO);if(now===null) throw new TypeError('nowISO must be a valid date string');
  const raw=array(sessions).filter(s=>s&&typeof s==='object');
  raw.sort((a,b)=>(stamp(a.updatedAt)??stamp(a.startedAt)??0)-(stamp(b.updatedAt)??stamp(b.startedAt)??0));
  const unique=new Map(), sessionMap=new Map(), chosenLevels={};
  for(const snapshot of raw) {
    const observed=stamp(snapshot.updatedAt)??stamp(snapshot.startedAt);if(observed!==null&&observed>now)continue;
    const summary=summarizeSession(snapshot);sessionMap.set(summary.id,summary);
    const profiles=object(object(snapshot.state).profiles);
    for(const [op,skill] of [['add','addition'],['sub','subtraction']]) {
      const level=object(profiles[op]).level;if(Number.isInteger(level)&&level>=1&&level<=5) chosenLevels[skill]=level;
    }
    for(const event of summary.events) {
      const key=`${event.kind}:${event.id}`, previous=unique.get(key);
      if(previous&&event.timestampSource!=='answer'&&previous.at&&(!event.at||stamp(previous.at)<stamp(event.at))) {
        event.at=previous.at;event.timestampSource=previous.timestampSource;
      }
      unique.set(key,event);
    }
  }
  const events=[...unique.values()].filter(e=>stamp(e.at)!==null&&stamp(e.at)<=now).sort((a,b)=>stamp(a.at)-stamp(b.at)||a.id.localeCompare(b.id));
  const seen=new Set();for(const e of events.filter(e=>e.kind==='case')){
    e.firstRecordedItem=!seen.has(e.itemKey);e.novelItem=e.firstRecordedItem&&!e.priorFamiliarity&&!e.repeatExposure;seen.add(e.itemKey);
  }
  const start=now-7*DAY, previousStart=start-7*DAY;
  const current=events.filter(e=>stamp(e.at)>=start), previous=events.filter(e=>stamp(e.at)>=previousStart&&stamp(e.at)<start);
  const evidence=caseRow(current), priorEvidence=caseRow(previous), interview=interviewRow(current), priorInterview=interviewRow(previous);
  evidence.previousPractice=priorEvidence.practice;evidence.previousNovelItems=priorEvidence.novelItems;evidence.previousRepeatedTrials=priorEvidence.repeatedTrials;
  interview.previousPractice=priorInterview.practice;interview.previousSelfRubric=priorInterview.selfRubric;
  const matrix=[numericRow('addition',current,previous,events,chosenLevels.addition),numericRow('subtraction',current,previous,events,chosenLevels.subtraction),evidence,interview];
  const recentSessions=[...sessionMap.values()].filter(s=>{const t=stamp(s.startedAt)??stamp(s.updatedAt);return t!==null&&t>=start&&t<=now;});
  const warnings=[];
  if(events.some(e=>e.identitySource==='legacy')) warnings.push('Older records lack stable trial IDs; copied records are conservatively deduplicated and distinct repeats may be undercounted.');
  if(events.some(e=>['saved','session'].includes(e.timestampSource))) warnings.push('Some activity dates use the first saved observation because the original event time was not recorded.');
  if([...unique.values()].some(e=>!e.at)) warnings.push('Undated trials are excluded from weekly totals.');
  return {version:1,generatedAt:iso(now),period:{start:iso(start),end:iso(now),previousStart:iso(previousStart)},
    sessions:{total:recentSessions.length,active:new Set(current.map(e=>e.sessionId)).size,ended:recentSessions.filter(s=>s.ended).length},
    uniqueTrials:events.length,matrix,weekly:weeklyTimeline(events,now),nextSession:nextTasks(matrix,events),
    limitations:[...warnings,'Timing comparisons use independently correct, uninterrupted first answers within the same operation, level and format. Timing is descriptive, not an attention score.',
      'Weekly differences describe these tasks. They do not establish a general cognitive improvement, an IQ level or an ADHD diagnosis.']};
}
