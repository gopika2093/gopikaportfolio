// A finite, hand-written conversation. Choices live only in the current page.
export const conversations={
 students:{
  start:{copy:'I worked with elected student committees here. Each group brought its own purpose and community. I tried to understand what they wanted to achieve, then help them find a workable way forward.',choices:[['How did you help them feel confident?','confidence'],['What did you change in the system?','change'],['Can you give me an example?','example']]},
  confidence:{copy:'I think people do their best work when they have room to make their own decisions, with support available when they need it. I helped make responsibilities clearer and stayed alongside committees as they found their own way of leading.',choices:[['Can you give me an example?','example']]},
  change:{copy:'I developed guidance, templates, training and a Student Groups Handbook. The aim was to make responsibilities easier to understand and help each new committee carry knowledge forward.',choices:[['Can you give me an example?','example']]},
  example:{copy:'Student committees often came to us with an activity they wanted to run. They were learning to plan, manage funding and consider risks at the same time. If we only reviewed spending afterwards, we missed the chance to help while their ideas were still taking shape.',choices:[['What did you change?','funding'],['How did students respond?','response']]},
  funding:{copy:'I introduced seed funding and activity-based requests. That gave us a reason to talk earlier about the purpose of an activity, what it needed and what might get in the way. The committee still made its decisions. I helped make the path clearer.',choices:[['How did students respond?','response']]},
  response:{copy:'It took time for students to adjust to the new process. I listened to their questions and helped them understand how planning earlier could make things easier. Once they became familiar with it, they started driving the process themselves.',choices:[]}
 },
 carnival:{
  start:{copy:'Carnival was a chance for student groups and the wider community to meet. I wanted it to feel like one shared experience, shaped by the people taking part.',choices:[['How did you make people feel welcome?','welcome'],['What did organising it involve?','team']]},
  welcome:{copy:'Carnival took shape through conversations with student associations and student leaders. We listened to their suggestions and used that feedback as we planned. It wasn’t an experience we simply designed for students; they helped shape it.',choices:[['What did that look like?','activities']]},
  activities:{copy:'I put together a team to work alongside me. We brought in student associations to run activities and faculty teams to offer outreach, competitions and community activities. Student performances gave people a chance to share their talents. The day carried ideas from many people.',choices:[['What did organising it involve?','team']]},
  team:{copy:'I put together a team and helped student casuals prepare for their roles. Planning, communication, risk and the work on the day had to come together. I wanted the different activities to feel connected, rather than like separate events.',choices:[['How did students shape it?','welcome']]}
 },
 research:{
  start:{copy:'At the Energy and Resources Institute, I supported the work around research: meetings, communication and events. I enjoyed learning what mattered to the people involved, then finding practical ways to help their work move forward.',choices:[['Can you show me an example?','symposium'],['What else did you support?','boards']]},
  symposium:{copy:'In 2023, I helped coordinate the Australian Combustion Symposium. I began by listening to the people involved and understanding what they needed. My part was to keep the planning, communication and practical details moving together, so participants could focus on sharing their work and meeting others in the field. I found meaning in creating the conditions for other people’s knowledge to be shared and heard.',choices:[['What else did you support?','boards']]},
  boards:{copy:'I also supported advisory and steering committee meetings, from preparing agendas to keeping accurate minutes and records. Clear information helped people make decisions and follow through on them.',choices:[['Tell me about the symposium','symposium']]}
 },
 cafe:{
  start:{copy:'Across these roles, I’ve found that I do my best work when I first listen and understand the people and the system around them. I enjoy making things easier to use and easier to carry forward. I don’t want to take over someone else’s work; I want to support them until they’re ready to lead it themselves.',choices:[['How would you approach a new team?','approach'],['What are you looking for next?','next']]},
  approach:{copy:'I would start by observing and listening: what matters to the people here, where do things already work well, and where is the friction? Then I’d look for a useful contribution that fits the team, rather than arriving with a solution before understanding the place.',choices:[['What are you looking for next?','next']]},
  next:{copy:'I’ve moved to Melbourne and would welcome the chance to support people in a university or research setting. If something in this walk connects with your work, I’d be glad to continue the conversation.',choices:[]}
 }
};
