import { db } from "./firebase";
import {
  collection,
  addDoc
} from "firebase/firestore";
import React, { useMemo, useState } from "react";

const levelLabels = { grade3: '3級', pre2: '準2級', pre2plus: '準2級プラス', grade2: '2級', pre1: '準1級' };
const taskLabels = { opinion: '意見論述', email: 'Eメール', summary: '要約' };
const levels = ['grade3', 'pre2', 'pre2plus', 'grade2', 'pre1'];
const schoolClasses = [
  "1年1組",
  "1年2組",
  "1年3組",
  "1年4組",
  "1年5組",

  "2年1組",
  "2年2組",
  "2年3組",
  "2年4組",
  "2年5組",

  "3年1組",
  "3年2組",
  "3年3組",
  "3年4組",
  "3年5組"
];
const tasks = {
  grade3: [
    { id:'g3-email-1', type:'email', title:'3級 Eメール 1：週末', wordRange:'15〜25語', targetMin:15, targetMax:25, question:'You received an e-mail from your friend Alex. Write a reply and answer both questions.', email:'Hi! I went to a summer festival yesterday. It was very fun. What did you do last weekend? Did you enjoy it? Your friend, Alex', points:['2つの質問に答える','自然な返信','15〜25語'], model:'Hi Alex. I played soccer with my friends last weekend. Yes, I enjoyed it because the weather was nice and we had a good time.' },
    { id:'g3-email-2', type:'email', title:'3級 Eメール 2：誕生日', wordRange:'15〜25語', targetMin:15, targetMax:25, question:'You received an e-mail from your friend Emma. Write a reply and answer both questions.', email:'Hi! My birthday is next Sunday. I will have a party at home. When is your birthday? What do you usually do on your birthday? Your friend, Emma', points:['誕生日を答える','普段することを答える','15〜25語'], model:'Hi Emma. My birthday is in October. I usually eat cake with my family and get presents. I hope you enjoy your party.' },
    { id:'g3-email-3', type:'email', title:'3級 Eメール 3：学校行事', wordRange:'15〜25語', targetMin:15, targetMax:25, question:'You received an e-mail from your friend Liam. Write a reply and answer both questions.', email:'Hi! We had a sports day at school. I ran in a relay race. What school event do you like? Why do you like it? Your friend, Liam', points:['好きな学校行事','理由','15〜25語'], model:'Hi Liam. I like our school festival. I like it because I can work with my friends and enjoy many interesting activities.' },
    { id:'g3-opinion-1', type:'opinion', title:'3級 意見論述 1：英語学習', wordRange:'25〜35語', targetMin:25, targetMax:35, question:'Do you like studying English?', points:['理由を2つ','簡単で正確な文','25〜35語'], model:'I like studying English. First, I can talk with people from other countries. Second, English songs are interesting. I want to use English in the future.' },
    { id:'g3-opinion-2', type:'opinion', title:'3級 意見論述 2：朝食', wordRange:'25〜35語', targetMin:25, targetMax:35, question:'Do you think breakfast is important?', points:['立場を示す','理由を2つ','25〜35語'], model:'I think breakfast is important. First, it gives us energy in the morning. Second, I can study better after eating breakfast. So I always eat breakfast.' },
    { id:'g3-opinion-3', type:'opinion', title:'3級 意見論述 3：ペット', wordRange:'25〜35語', targetMin:25, targetMax:35, question:'Do you want to have a pet?', points:['Yes/Noを明確に','理由を2つ','25〜35語'], model:'Yes, I want to have a pet. First, animals are cute. Second, I can learn how to take care of another living thing. I want a dog.' }
  ],
  pre2: [
    { id:'p2-email-1', type:'email', title:'準2級 Eメール 1：家庭用ロボット', wordRange:'40〜50語', targetMin:40, targetMax:50, question:"You received an e-mail from your friend Jamie. Write a reply. Answer Jamie's question and ask two questions about the topic.", email:'Hi! My family bought a small robot pet last week. It can move around the house and respond to our voices. Have you ever used a robot at home? Your friend, Jamie', points:['相手の質問に答える','質問を2つ書く','40〜50語'], model:'Hi Jamie. I have never used a robot at home, but I think it sounds interesting. What does your robot pet look like? Can it understand many words? I want to see it someday.' },
    { id:'p2-email-2', type:'email', title:'準2級 Eメール 2：学校図書館', wordRange:'40〜50語', targetMin:40, targetMax:50, question:"You received an e-mail from your friend Taylor. Write a reply. Answer Taylor's question and ask two questions about the topic.", email:'Hi! Our school library opened a new reading room. Students can study there after school. Do you often use your school library? Your friend, Taylor', points:['質問に答える','図書館について2つ質問','40〜50語'], model:'Hi Taylor. Yes, I often use my school library because it is quiet. How many students can use the new reading room? Is it open on Saturdays? I think your school library sounds very useful.' },
    { id:'p2-email-3', type:'email', title:'準2級 Eメール 3：地域イベント', wordRange:'40〜50語', targetMin:40, targetMax:50, question:"You received an e-mail from your friend Morgan. Write a reply. Answer Morgan's question and ask two questions about the topic.", email:'Hi! I joined a local clean-up event last weekend. Many students helped clean the river. Have you ever joined a community event? Your friend, Morgan', points:['経験を答える','イベントについて2つ質問','40〜50語'], model:'Hi Morgan. Yes, I have joined a community event at a park. It was interesting. How long did the clean-up event take? Did many people in your town join it? I want to try it too.' },
    { id:'p2-opinion-1', type:'opinion', title:'準2級 意見論述 1：ボランティア', wordRange:'50〜60語', targetMin:50, targetMax:60, question:'Do you think students should do volunteer work in their community?', points:['help other people','learn new things','make friends'], model:'I think students should do volunteer work in their community. First, they can help people who need support. For example, they can clean parks or help elderly people. Second, students can learn many important things through these activities. For these reasons, volunteer work is good for students.' },
    { id:'p2-opinion-2', type:'opinion', title:'準2級 意見論述 2：スマートフォン', wordRange:'50〜60語', targetMin:50, targetMax:60, question:'Do you think students should use smartphones in class?', points:['find information','communication','concentration'], model:'I think students should use smartphones in class if teachers allow them. First, students can find information quickly. This helps them understand difficult topics. Second, smartphones can make group work easier. However, students must not use them for games. If they use smartphones carefully, they can be useful tools.' },
    { id:'p2-opinion-3', type:'opinion', title:'準2級 意見論述 3：部活動', wordRange:'50〜60語', targetMin:50, targetMax:60, question:'Do you think school club activities are important?', points:['teamwork','health','time'], model:'I think school club activities are important. First, students can learn teamwork by practicing with their friends. This is useful in school life and the future. Second, club activities help students stay healthy. They may be busy, but they can get many good experiences from clubs.' }
  ],
  pre2plus: [
    { id:'p2plus-email-1', type:'email', title:'準2級プラス Eメール 1：オンライン交流', wordRange:'50〜60語', targetMin:50, targetMax:60, question:"You received an e-mail from your friend Casey. Write a reply. Answer Casey's question and ask two questions about the topic.", email:'Hi! Our school started a new online exchange program with students in Canada. We will talk online once a month. Do you think this kind of program is useful for students? Your friend, Casey', points:['質問に答える','話題について質問を2つ','50〜60語'], model:'Hi Casey. Yes, I think an online exchange program is useful because students can learn about other cultures. How many students will join the program? What topics will you talk about with Canadian students? I hope you enjoy it.' },
    { id:'p2plus-email-2', type:'email', title:'準2級プラス Eメール 2：職場体験', wordRange:'50〜60語', targetMin:50, targetMax:60, question:"You received an e-mail from your friend Riley. Write a reply. Answer Riley's question and ask two questions about the topic.", email:'Hi! Next month, I will join a work experience program at a small company. I am excited but nervous. Do you think work experience is important for students? Your friend, Riley', points:['意見を答える','職場体験について質問2つ','50〜60語'], model:'Hi Riley. Yes, I think work experience is important because students can learn about real jobs. What kind of company will you visit? How many days will you work there? I hope you will have a good experience.' },
    { id:'p2plus-email-3', type:'email', title:'準2級プラス Eメール 3：地域交通', wordRange:'50〜60語', targetMin:50, targetMax:60, question:"You received an e-mail from your friend Jordan. Write a reply. Answer Jordan's question and ask two questions about the topic.", email:'Hi! My town started a new bus service for students and elderly people. It is cheaper than before. Do you think public transportation is important? Your friend, Jordan', points:['質問に答える','公共交通について質問2つ','50〜60語'], model:'Hi Jordan. Yes, I think public transportation is important because many people need it every day. How often does the new bus run? Can students use it on weekends? It sounds helpful for your town.' },
    { id:'p2plus-opinion-1', type:'opinion', title:'準2級プラス 意見論述 1：環境授業', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Do you think schools should have more classes about environmental problems?', points:['education','daily life','future'], model:'I think schools should have more classes about environmental problems. First, students can learn how their daily actions affect nature. For example, they may start saving energy or reducing plastic waste. Second, environmental problems will become more important in the future. If students learn about them now, they can make better choices as adults.' },
    { id:'p2plus-opinion-2', type:'opinion', title:'準2級プラス 意見論述 2：キャッシュレス', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Do you think cashless payment is better than using cash?', points:['convenience','safety','elderly people'], model:'I think cashless payment is better than using cash. First, it is very convenient because people can pay quickly with a card or smartphone. Second, it may be safer because people do not need to carry much money. However, some elderly people may find it difficult, so shops should accept both cash and cashless payment.' },
    { id:'p2plus-opinion-3', type:'opinion', title:'準2級プラス 意見論述 3：昼食時間', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Do you think students should have a longer lunch break at school?', points:['health','communication','schedule'], model:'I think students should have a longer lunch break at school. First, they can eat more slowly, which is better for their health. Second, they can talk with classmates and relax before afternoon classes. Of course, schools have busy schedules, but a longer lunch break may help students concentrate better.' }
  ],
  grade2: [
    { id:'g2-summary-1', type:'summary', title:'2級 要約 1：食品ロス', wordRange:'45〜55語', targetMin:45, targetMax:55, question:'Read the passage and summarize it in English.', passage:'Many towns are trying to reduce food waste. Some supermarkets now sell vegetables and fruit that look unusual at lower prices. These products used to be thrown away, even though they were safe to eat. This system helps farmers earn money and gives customers cheaper food. It may also help protect the environment by reducing waste.', points:['主題を入れる','具体例を短くまとめる','45〜55語'], model:'Some towns are working to reduce food waste. Supermarkets sell unusual-looking fruit and vegetables cheaply instead of throwing them away. This helps farmers and customers because farmers can earn money and customers can buy cheaper food. It can also protect the environment.' },
    { id:'g2-summary-2', type:'summary', title:'2級 要約 2：自転車通学', wordRange:'45〜55語', targetMin:45, targetMax:55, question:'Read the passage and summarize it in English.', passage:"More cities are encouraging students to go to school by bicycle. Cycling can reduce traffic and is good for students' health. Some schools have built larger bicycle parking areas to support this change. However, there are also concerns about safety. Cities need better roads and traffic education so that students can ride bicycles safely.", points:['利点と課題','安全面','45〜55語'], model:'Some cities want students to go to school by bicycle because it reduces traffic and improves health. Schools are adding bicycle parking areas. However, safety is a concern, so cities need better roads and traffic education to help students ride safely.' },
    { id:'g2-summary-3', type:'summary', title:'2級 要約 3：オンライン診療', wordRange:'45〜55語', targetMin:45, targetMax:55, question:'Read the passage and summarize it in English.', passage:'Online medical services are becoming more common. They are useful for people who live far from hospitals or have little time to visit doctors. Patients can talk to doctors from home, which saves time. However, online services cannot solve every problem. Some illnesses still require direct examinations at hospitals.', points:['便利な点','限界','45〜55語'], model:'Online medical services are becoming popular because patients can talk to doctors from home. This is helpful for people far from hospitals or with busy schedules. However, these services cannot treat every illness, and some patients still need direct examinations.' },
    { id:'g2-opinion-1', type:'opinion', title:'2級 意見論述 1：AI教育', wordRange:'80〜100語', targetMin:80, targetMax:100, question:'Some people say that schools should teach students how to use AI tools. Do you agree with this opinion?', points:['education','future jobs','problems'], model:'I agree that schools should teach students how to use AI tools. First, AI is becoming common in many workplaces, so students will need to understand it in the future. If they learn how to use AI properly, they may have more chances to succeed in their careers. Second, schools can teach students about the risks of AI, such as wrong information and overdependence. Therefore, AI education should be included in school lessons.' },
    { id:'g2-opinion-2', type:'opinion', title:'2級 意見論述 2：短い動画', wordRange:'80〜100語', targetMin:80, targetMax:100, question:'Today, many young people prefer watching short videos to reading books. Do you think this is a serious problem?', points:['reading skills','concentration','entertainment'], model:'I think this is a serious problem. First, reading books helps young people improve their vocabulary and thinking skills. If they only watch short videos, they may have fewer chances to read long and complex texts. Second, short videos can make it harder for students to concentrate. They may become used to quick entertainment and lose patience with studying. Of course, short videos can be enjoyable, but young people should also spend enough time reading books.' },
    { id:'g2-opinion-3', type:'opinion', title:'2級 意見論述 3：制服', wordRange:'80〜100語', targetMin:80, targetMax:100, question:'Some people believe that school uniforms are no longer necessary. Do you agree with this opinion?', points:['identity','cost','freedom'], model:'I partly agree that school uniforms are no longer necessary. First, students can express themselves more freely without uniforms. This may make school life more comfortable. Second, uniforms can be expensive for some families, especially when children grow quickly. However, uniforms also help students feel that they belong to the same school. Therefore, schools should consider both freedom and practical benefits before deciding.' }
  ],
  pre1: [
    { id:'p1-summary-1', type:'summary', title:'準1級 要約 1：週休4日', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Read the passage and summarize it in English.', passage:"In recent years, many companies have introduced four-day workweeks. Supporters claim that shorter workweeks can improve workers' mental health and increase productivity because employees have more time to rest. Some companies have reported fewer absences and better performance. However, critics argue that this system may not work in all industries. Hospitals, schools, and customer service businesses may find it difficult to reduce working days without lowering the quality of service.", points:['賛成側と反対側','具体例を整理','60〜70語'], model:"Many companies have started four-day workweeks. Supporters say this can improve workers' mental health and productivity because employees can rest more, and some companies have seen fewer absences. However, critics believe it may not suit every industry, such as hospitals or schools, because service quality could be affected." },
    { id:'p1-summary-2', type:'summary', title:'準1級 要約 2：都市の緑化', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Read the passage and summarize it in English.', passage:'Urban greening projects are spreading in large cities. Trees and rooftop gardens can lower temperatures, improve air quality, and provide relaxing spaces for residents. These benefits are especially important as summers become hotter. However, such projects can be expensive to maintain, and some buildings are not suitable for rooftop gardens. City planners must balance environmental goals with cost and safety concerns.', points:['利点','課題','60〜70語'], model:'Urban greening projects are becoming common in big cities. Trees and rooftop gardens can reduce heat, improve air quality, and create relaxing spaces, which is important during hotter summers. However, these projects may be costly to maintain, and some buildings are unsuitable, so planners must consider cost and safety.' },
    { id:'p1-summary-3', type:'summary', title:'準1級 要約 3：リスキリング', wordRange:'60〜70語', targetMin:60, targetMax:70, question:'Read the passage and summarize it in English.', passage:'As technology changes rapidly, many workers are trying to learn new skills. Companies offer reskilling programs so employees can use digital tools and adapt to new roles. Such programs may help businesses remain competitive and reduce unemployment. Nevertheless, some workers find it difficult to study while working full-time, and small companies may lack the money to provide enough training opportunities.', points:['背景','利点','問題点','60〜70語'], model:'Because technology is changing quickly, workers need new skills. Companies provide reskilling programs to help employees use digital tools and move into new roles, which can support competitiveness and reduce unemployment. However, full-time workers may struggle to study, and small companies may not afford enough training.' },
    { id:'p1-opinion-1', type:'opinion', title:'準1級 意見論述 1：AI規制', wordRange:'120〜150語', targetMin:120, targetMax:150, question:'Should governments do more to regulate the use of artificial intelligence?', points:['technology','safety','economy','education'], model:'I believe governments should do more to regulate the use of artificial intelligence. First, AI systems can influence important decisions in areas such as employment, education, and healthcare. If these systems are not checked carefully, unfair results may occur. Second, regulation can help protect people from misinformation and privacy problems. Companies may focus mainly on profit, so public rules are necessary to ensure responsible use. On the other hand, excessive regulation could slow innovation, which is important for economic growth. Therefore, governments should create balanced rules that protect citizens while allowing useful technology to develop.' },
    { id:'p1-opinion-2', type:'opinion', title:'準1級 意見論述 2：地方移住', wordRange:'120〜150語', targetMin:120, targetMax:150, question:'Should more people be encouraged to move from large cities to rural areas?', points:['population','work','environment','community'], model:'I think more people should be encouraged to move from large cities to rural areas. First, many rural communities are facing population decline, and new residents could help support local schools, shops, and public services. Second, remote work has made it easier for people to live outside major cities while continuing their careers. This could reduce overcrowding and improve quality of life. However, rural areas need better transportation, medical services, and internet access. Without these conditions, moving there may be difficult. Therefore, governments should support rural development while encouraging people to consider new lifestyles.' },
    { id:'p1-opinion-3', type:'opinion', title:'準1級 意見論述 3：宇宙開発', wordRange:'120〜150語', targetMin:120, targetMax:150, question:'Is spending public money on space exploration worthwhile?', points:['science','economy','environment','priorities'], model:'I believe spending public money on space exploration is worthwhile, but it should be carefully controlled. First, space programs lead to scientific progress and new technologies. Some technologies developed for space can later be used in daily life, medicine, and disaster prevention. Second, space projects can create jobs and encourage young people to study science. However, governments also have urgent problems on Earth, such as poverty and environmental damage. If too much money is spent on space, citizens may feel that their needs are ignored. Therefore, space exploration should continue, but governments must balance it with social responsibilities.' }
  ]
};

function countWords(text) { const words = text.trim().match(/[A-Za-z]+(?:'[A-Za-z]+)?/g); return words ? words.length : 0; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function analyzeEssay(text, task, level) {
  if (!text.trim()) {
  if (task.type === "email") {
    return {
      scores: {
        content: 0,
        vocabulary: 0,
        grammar: 0
      },
      total: 0,
      maxTotal: 9,
      wordCount: 0,
      inRange: false,
      checks: {
        hasOpinion: false,
        hasFirst: false,
        hasSecond: false,
        hasConclusion: false,
        hasQuestion: false,
        hasTwoQuestions: false,
        sentenceCount: 0
      }
    };
  }

  return {
    scores: {
      content: 0,
      organization: 0,
      vocabulary: 0,
      grammar: 0
    },
    total: 0,
    maxTotal: 16,
    wordCount: 0,
    inRange: false,
    checks: {
      hasOpinion: false,
      hasFirst: false,
      hasSecond: false,
      hasConclusion: false,
      hasQuestion: false,
      hasTwoQuestions: false,
      sentenceCount: 0
    }
  };
}
  const wordCount = countWords(text);
  const lower = text.toLowerCase();
  const hasOpinion = /i think|i agree|i disagree|in my opinion|i believe|yes|no|partly agree/.test(lower);
  const hasFirst = /first|firstly|one reason/.test(lower);
  const hasSecond = /second|secondly|also|in addition|another reason/.test(lower);
  const hasConclusion = /for these reasons|therefore|so i think|in conclusion|overall/.test(lower);
  const hasQuestion = (text.match(/\?/g) || []).length >= 1;
  const hasTwoQuestions = (text.match(/\?/g) || []).length >= 2;
  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  const words = text.toLowerCase().match(/[a-z]+/g) || [];
  const uniqueWords = new Set(words).size;
  const inRange = wordCount >= task.targetMin && wordCount <= task.targetMax;
  const levelBonus = ['pre2plus', 'grade2', 'pre1'].includes(level);
  const advancedVocab = /important|useful|improve|experience|responsible|beneficial|opportunity|environment|technology|society|regulate|privacy|productivity|supporters|critics|community|transportation|exploration|competitive|urban/.test(lower);
  const obviousErrors = /\bi am agree\b|\bpeople is\b|\bstudents is\b|\bmore better\b|\bhe have\b|\bshe have\b/.test(lower);

  if (task.type === 'email') {
    let content = 1;
    if (wordCount > 0) content += 1;
    if (hasQuestion || /yes|no|i think|i have|i went|i did|i like|because/.test(lower)) content += 1;
    if (!inRange) content = Math.max(1, content - 1);
    let vocabulary = 1;
    if (uniqueWords >= 18) vocabulary += 1;
    if (/hi|hello|thanks|hope|interesting|enjoy|want|think|because|sounds|useful/.test(lower)) vocabulary += 1;
    let grammar = 1;
    if (sentenceCount >= 2) grammar += 1;
    if (!obviousErrors) grammar += 1;
    const scores = { content: clamp(content,1,3), vocabulary: clamp(vocabulary,1,3), grammar: clamp(grammar,1,3) };
    return { scores, total: scores.content + scores.vocabulary + scores.grammar, maxTotal: 9, wordCount, inRange, checks: { hasOpinion, hasFirst, hasSecond, hasConclusion, hasQuestion, hasTwoQuestions, sentenceCount } };
  }

  let content = 2;
  if (task.type === 'summary') {
    if (wordCount > 0) content += 1;
    if (/however|but|also|because|therefore|supporters|critics|some|many/.test(lower)) content += 1;
  } else {
    if (hasOpinion) content += 1;
    if (hasFirst && hasSecond) content += 1;
  }
  if (!inRange) content -= 1;
  content = clamp(content, 1, 4);

  let organization = 1;
  if (task.type === 'summary') {
    if (sentenceCount >= 2) organization += 1;
    if (/however|but|also|because|while/.test(lower)) organization += 1;
    if (wordCount >= task.targetMin - 10) organization += 1;
  } else {
    if (hasOpinion) organization += 1;
    if (hasFirst || hasSecond) organization += 1;
    if (hasConclusion) organization += 1;
  }
  organization = clamp(organization, 1, 4);

  let vocabulary = 2;
  if (uniqueWords >= (levelBonus ? 45 : 30)) vocabulary += 1;
  if (advancedVocab) vocabulary += 1;
  vocabulary = clamp(vocabulary, 1, 4);

  let grammar = 2;
  if (sentenceCount >= (levelBonus ? 4 : 3)) grammar += 1;
  if (!obviousErrors) grammar += 1;
  grammar = clamp(grammar, 1, 4);
  const scores = { content, organization, vocabulary, grammar };
  return { scores, total: content + organization + vocabulary + grammar, maxTotal: 16, wordCount, inRange, checks: { hasOpinion, hasFirst, hasSecond, hasConclusion, hasQuestion, hasTwoQuestions, sentenceCount } };
}

function feedback(key, score, max, type) {
  const high = score >= max;
  const mid = score >= Math.ceil(max * 0.67);
  const data = {
    content: [type === 'summary' ? '本文の中心内容をよく拾えています。' : type === 'email' ? '相手の内容に合った返信ができています。' : '問いに対する立場が明確です。', '条件をもう一度確認し、必要な情報を足しましょう。', '質問への答えを最初にはっきり書きましょう。'],
    organization: ['全体の流れが自然です。', 'First / However / Therefore などを使いましょう。', '中心文→理由・説明→まとめの順にしましょう。'],
    vocabulary: ['級に合った語彙が使えています。', 'useful, improve, important などを増やしましょう。', '同じ単語に頼りすぎず、基本語を正確に使いましょう。'],
    grammar: ['文意が伝わる文法で書けています。', '主語と動詞の一致、複数形、冠詞を確認しましょう。', '短く正確な文から書きましょう。']
  };
  return high ? data[key][0] : mid ? data[key][1] : data[key][2];
}

function csvEscape(value) { return `"${String(value).replaceAll('"','""')}"`; }

export default function App() {
  const [level, setLevel] = useState("grade3");
  const [taskId, setTaskId] = useState("g3-email-1");
  const [studentNumber, setStudentNumber] =  useState("");
  const [className, setClassName] = useState("");
  const [essay, setEssay] = useState("");
``
  const [showModel, setShowModel] = useState(false);
  const [history, setHistory] = useState([]);

  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
 
  
 
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState("");
  const [submissionCount, setSubmissionCount] =
  useState(0);
  const taskList = tasks[level];
  const selectedTask = taskList.find((t) => t.id === taskId) || taskList[0];

  const analysis = useMemo(
    () => analyzeEssay(essay, selectedTask, level),
    [essay, selectedTask, level]
  );

 const wordStatus =
  analysis.wordCount === 0
    ? "未入力"
    : analysis.wordCount < selectedTask.targetMin
    ? "少なめ"
    : analysis.wordCount > selectedTask.targetMax
    ? "多め"
    : "適正";

  const rubric =
    selectedTask.type === "email"
      ? [
          ["content", "内容", 3],
          ["vocabulary", "語彙", 3],
          ["grammar", "文法", 3]
        ]
      : [
          ["content", "内容", 4],
          ["organization", "構成", 4],
          ["vocabulary", "語彙", 4],
          ["grammar", "文法", 4]
        ];
 const aiScores = aiFeedback?.score || null;

const displayScores = aiScores
  ? {
      content: Number(aiScores.content || 0),
      organization: Number(aiScores.organization || 0),
      vocabulary: Number(aiScores.vocabulary || 0),
      grammar: Number(aiScores.grammar || 0)
    }
  : {
      content: 0,
      organization: 0,
      vocabulary: 0,
      grammar: 0
    };

const displayTotal =
  selectedTask.type === "email"
    ? displayScores.content +
      displayScores.vocabulary +
      displayScores.grammar
    : displayScores.content +
      displayScores.organization +
      displayScores.vocabulary +
      displayScores.grammar;
const displayMaxTotal =
  selectedTask.type === "email" ? 9 : 16;


  const matchesName =
    !teacherSearch ||
    String(item.studentNumber || "")
      .toLowerCase()
      .includes(teacherSearch.toLowerCase());

  const matchesClass =
    !classFilter ||
    String(item.className || "") === classFilter;

  return matchesName && matchesClass;
});

const totalSubmissions = filteredTeacherData.length;

const averageScore =
  totalSubmissions > 0
    ? (
        filteredTeacherData.reduce(
          (sum, item) => sum + Number(item.score || 0),
          0
        ) / totalSubmissions
      ).toFixed(1)
    : "0.0";

const averageWords =
  totalSubmissions > 0
    ? Math.round(
        filteredTeacherData.reduce(
          (sum, item) => sum + Number(item.words || 0),
          0
        ) / totalSubmissions
      )
    : 0;

const classOptions = [
  ...new Set(
    teacherData
      .map((item) => item.className)
      .filter(Boolean)
  )
];
const studentNumbers = Array.from(
  { length: 40 },
  (_, i) => i + 1
);

  const records = teacherData.filter(
    (item) => item.className === className
  );

  const avgScore =
    records.length > 0
      ? (
          records.reduce(
            (sum, item) => sum + Number(item.score || 0),
            0
          ) / records.length
        ).toFixed(1)
      : "0.0";

  const avgWords =
    records.length > 0
      ? Math.round(
          records.reduce(
            (sum, item) => sum + Number(item.words || 0),
            0
          ) / records.length
        )
      : 0;

  return {
    className,
    count: records.length,
    avgScore,
    avgWords
  };
});

  function changeLevel(nextLevel) {
    setLevel(nextLevel);
    const firstTask = tasks[nextLevel][0];
    setTaskId(firstTask.id);
    setEssay("");
    setShowModel(false);
    setAiFeedback(null);
  }

  function changeTask(nextTaskId) {
    const nextTask = taskList.find((t) => t.id === nextTaskId) || taskList[0];
    setTaskId(nextTask.id);
    setEssay("");
    setShowModel(false);
    setAiFeedback(null);
  }

 function saveResult() {

  const grammarCorrectionsText =
    aiFeedback?.grammarCorrections && aiFeedback.grammarCorrections.length > 0
      ? aiFeedback.grammarCorrections
          .map((item, index) => {
            return `${index + 1}. 元の表現: ${item.original || ""} / 修正例: ${
              item.corrected || ""
            } / 説明: ${item.explanation || ""}`;
          })
          .join(" | ")
      : "";

  const item = {
    id: Date.now(),
    time: new Date().toLocaleString("ja-JP"),
    className: className || "未入力",
    studentNumber: studentNumber || "未入力",
    level: levelLabels[level],
    taskType: taskLabels[selectedTask.type],
    topic: selectedTask.title,
    score: analysis.total,
    maxScore: analysis.maxTotal,
    words: analysis.wordCount,
    essay,

    aiScoreTotal: aiFeedback?.score?.total ?? "",
    aiScoreContent: aiFeedback?.score?.content ?? "",
    aiScoreOrganization: aiFeedback?.score?.organization ?? "",
    aiScoreVocabulary: aiFeedback?.score?.vocabulary ?? "",
    aiScoreGrammar: aiFeedback?.score?.grammar ?? "",

    aiComment: aiFeedback?.overallComment || "",
    aiGoodPoints: aiFeedback?.goodPoints
      ? aiFeedback.goodPoints.join(" / ")
      : "",
    aiImprovementPoints: aiFeedback?.improvementPoints
      ? aiFeedback.improvementPoints.join(" / ")
      : "",
    aiGrammarCorrections: grammarCorrectionsText,
    aiImprovedAnswer: aiFeedback?.improvedAnswer || "",
    aiNextAdvice: aiFeedback?.nextAdvice || ""
  };

  setHistory([item, ...history].slice(0, 50));
}
   async function saveToFirebase() {
  try {
    if (!className) {
  alert("クラスを選択してください");
  return;
}

if (!studentNumber) {
  alert("出席番号を選択してください");
  return;
}
    await addDoc(
      collection(db, "submissions"),
      {
        className,
        studentNumber,
        studentId:
  `${className}-${studentNumber}`,
        level: levelLabels[level],
        taskType: taskLabels[selectedTask.type],
        topic: selectedTask.title,
       score: displayTotal,
maxScore: displayMaxTotal,
words: analysis.wordCount,

aiScoreContent: displayScores.content,
aiScoreOrganization: displayScores.organization,
aiScoreVocabulary: displayScores.vocabulary,
aiScoreGrammar: displayScores.grammar,
        essay,

        aiComment:
          aiFeedback?.overallComment || "",

        createdAt: new Date()
      }
    );
const now = new Date().toLocaleString("ja-JP");

setSubmitted(true);
setSubmittedAt(now);
setSubmissionCount(
(prev) => prev + 1
);
    
alert("提出しました");
  } catch (error) {
    alert(error.message);
  }
}
 
  function downloadCsv() {
  
    const header = [
    "日時",
    "クラス",
    "出席番号",
    "級",
    "形式",
    "問題",
    "簡易得点",
    "満点",
    "語数",
    "英文",

    "AI総合点",
    "AI内容点",
    "AI構成点",
    "AI語彙点",
    "AI文法点",
    "AI総評",
    "AI良い点",
    "AI改善点",
    "AI文法修正",
    "AI改善後英文",
    "AI次回アドバイス"
  ];

 

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eiken-writing-results.csv";
  a.click();
  URL.revokeObjectURL(url);
}
 
  async function getAiFeedback() {
    setAiLoading(true);
    setAiFeedback(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          level: levelLabels[level],
          taskType: taskLabels[selectedTask.type],
          question: selectedTask.question,
          passage: selectedTask.passage,
          email: selectedTask.email,
          essay,
          wordCount: analysis.wordCount
        })
      });

      const data = await response.json();

     if (!response.ok) {
  throw new Error(data.detail || data.error || "AI添削に失敗しました");
}

      setAiFeedback(data.feedback);
    } catch (error) {
      setAiFeedback({
        overallComment:
          "AI添削中にエラーが発生しました。時間をおいてもう一度試してください。",
        detail: error.message,
        goodPoints: [],
        improvementPoints: [],
        grammarCorrections: [],
        improvedAnswer: "",
        nextAdvice: ""
      });
    } finally {
      setAiLoading(false);
    }
  }
async function submitWithAi() {
  try {
    setAiLoading(true);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        level: levelLabels[level],
        taskType: taskLabels[selectedTask.type],
        question: selectedTask.question,
        passage: selectedTask.passage,
        email: selectedTask.email,
        essay,
        wordCount: analysis.wordCount
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
        data.error ||
        "AI添削に失敗しました"
      );
    }

    const feedback = data.feedback;

    setAiFeedback(feedback);

    await addDoc(
      collection(db, "submissions"),
      {
        className,
        studentNumber,
        level: levelLabels[level],
        taskType: taskLabels[selectedTask.type],
        topic: selectedTask.title,
        score: analysis.total,
        words: analysis.wordCount,
        essay,

        aiComment:
          feedback?.overallComment || "",

        createdAt: new Date()
      }
    );

    const now =
      new Date().toLocaleString("ja-JP");

    setSubmitted(true);
    setSubmittedAt(now);

    setSubmissionCount(
      (prev) => prev + 1
    );

    alert("AI添削と提出が完了しました");
  } catch (error) {
    alert(error.message);
  } finally {
    setAiLoading(false);
  }
}
  return (
    <main className="app">
      <section className="hero card">
        <div>
          <p className="eyebrow">英検ライティング問題演習</p>
          <h1>3級〜準1級</h1>
          <p>
            自分の練習したい級と問題タイプを選び、英文を入力しましょう。
            入力ができたら提出ボタンを押して添削してもらいましょう。
          </p>
        </div>

      <div className="levelButtons">



          {levels.map((lv) => (
      
            <button
              key={lv}
              className={level === lv ? "active" : ""}
              onClick={() => changeLevel(lv)}
            >
              {levelLabels[lv]}
            </button>
          ))}
        </div>
      </section>

      <div className="layout">
        <section className="mainColumn">
          <div className="card grid2">
               <label>
  クラス
  <select
    value={className}
    onChange={(e) => setClassName(e.target.value)}
  >
    <option value="">
      クラスを選択してください
    </option>

    {schoolClasses.map((cls) => (
      <option key={cls} value={cls}>
        {cls}
      </option>
    ))}
  </select>
</label>
           <label>
  出席番号

  <select
    value={studentNumber}
    onChange={(e) =>
      setStudentNumber(e.target.value)
    }
  >
    <option value="">
      番号を選択してください
    </option>

    {studentNumbers.map((num) => (
      <option
        key={num}
        value={num}
      >
        {num}
      </option>
    ))}
  </select>
</label>

       
          </div>

          <section className="card">
            <h2>問題選択</h2>

            <select
              value={taskId}
              onChange={(e) => changeTask(e.target.value)}
            >
              {taskList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} / {taskLabels[t.type]}
                </option>
              ))}
            </select>

            <div className="problemBox">
              <div className="chips">
                <span>{levelLabels[level]}</span>
                <span>{taskLabels[selectedTask.type]}</span>
                <span>語数：{selectedTask.wordRange}</span>
                <span>この級の問題数：{taskList.length}問</span>
              </div>

              <h3>QUESTION</h3>
              <p className="question">{selectedTask.question}</p>

              {selectedTask.email && (
                <Prompt title="E-mail" text={selectedTask.email} />
              )}

              {selectedTask.passage && (
                <Prompt title="Passage" text={selectedTask.passage} />
              )}

              <div className="points">
                {selectedTask.points.map((p) => (
                  <span key={p}>POINT: {p}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="rowBetween">
              <h2>解答入力</h2>
              <strong>
  {analysis.wordCount === 0
    ? "未入力"
    : `${analysis.wordCount} words / ${wordStatus}`}
</strong>
            </div>
{submitted && (
  <div className="submittedBanner">
    ✅ この答案は提出済みです
  </div>
)}
           <textarea
  value={essay}
  readOnly={submitted}
  className={submitted ? "submittedEssay" : ""}
  onChange={(e) =>
    setEssay(e.target.value)
  }
/>
            <div className="actions">
             <button
  onClick={submitWithAi}
  disabled={aiLoading}
>
  {aiLoading
    ? "添削・提出中..."
    : "提出"}
</button>
              
              <button
                className="secondary"
                onClick={() => setShowModel(!showModel)}
              >
                模範解答を{showModel ? "隠す" : "表示"}
              </button>
                        
  
            </div>
{submitted && (
  <div className="history">
    <p>✅ 提出済み</p>
    <p>提出日時：{submittedAt}</p>
    <p>提出回数：{submissionCount}回</p>
  </div>
)}
            {showModel && (
              <div className="model">
                <h3>模範解答例</h3>
                <p>{selectedTask.model}</p>
              </div>
            )}

            {aiFeedback && (
              <div className="model">
                <h3>AI添削結果</h3>

              {aiFeedback.score && (
  <p>
    <strong>AIスコア：</strong>
    {displayTotal}点
  </p>
)}

                {aiFeedback.overallComment && (
                  <p>
                    <strong>総評：</strong>
                    {aiFeedback.overallComment}
                  </p>
                )}

                {aiFeedback.goodPoints &&
                  aiFeedback.goodPoints.length > 0 && (
                    <>
                      <h4>良い点</h4>
                      <ul>
                        {aiFeedback.goodPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}

                {aiFeedback.improvementPoints &&
                  aiFeedback.improvementPoints.length > 0 && (
                    <>
                      <h4>改善点</h4>
                      <ul>
                        {aiFeedback.improvementPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}

                {aiFeedback.grammarCorrections &&
                  aiFeedback.grammarCorrections.length > 0 && (
                    <>
                      <h4>文法・表現の修正</h4>
                      {aiFeedback.grammarCorrections.map((item, index) => (
                        <div key={index} className="history">
                          <p>
                            <strong>元の表現：</strong>
                            {item.original}
                          </p>
                          <p>
                            <strong>修正例：</strong>
                            {item.corrected}
                          </p>
                          <p>
                            <strong>説明：</strong>
                            {item.explanation}
                          </p>
                        </div>
                      ))}
                    </>
                  )}

                {aiFeedback.improvedAnswer && (
                  <>
                    <h4>改善後の英文例</h4>
                    <p>{aiFeedback.improvedAnswer}</p>
                  </>
                )}

                {aiFeedback.nextAdvice && (
                  <p>
                    <strong>次回へのアドバイス：</strong>
                    {aiFeedback.nextAdvice}
                  </p>
                )}

                {aiFeedback.detail && (
                  <p>
                    <strong>詳細：</strong>
                    {aiFeedback.detail}
                  </p>
                )}
              </div>
            )}
          </section>
        </section>

        <aside className="sideColumn">
          <section className="scoreCard">
            <p>総合スコア</p>
            <div>
             <strong>{displayTotal}</strong>
<span>/ {displayMaxTotal}</span>
            </div>
           <progress value={displayTotal} max={displayMaxTotal}></progress>
          </section>

          <section className="card">
            <h2>チェック項目</h2>

            {selectedTask.type === "opinion" && (
              <>
                <Check ok={analysis.checks.hasOpinion} text="自分の意見がある" />
                <Check ok={analysis.checks.hasFirst} text="First が使えている" />
                <Check
                  ok={analysis.checks.hasSecond}
                  text="Second / Also が使えている"
                />
                <Check ok={analysis.checks.hasConclusion} text="結論表現がある" />
              </>
            )}

            {selectedTask.type === "email" && (
              <>
                <Check ok={analysis.wordCount > 0} text="返信を書いている" />
                <Check ok={analysis.checks.hasQuestion} text="疑問文がある" />
             <Check
  ok={
    analysis.wordCount > 0 &&
    analysis.checks.hasTwoQuestions
  }
  text="必要な質問数を意識している"
/>
              </>
            )}

            {selectedTask.type === "summary" && (
              <>
                <Check ok={analysis.wordCount > 0} text="要約を書いている" />
                <Check
                  ok={analysis.checks.sentenceCount >= 2}
                  text="複数文で整理している"
                />
                <Check
                  ok={/however|but|also|because|while/.test(
                    essay.toLowerCase()
                  )}
                  text="情報の関係を示している"
                />
              </>
            )}

            <Check ok={analysis.inRange} text="語数が目安内" />
          </section>

              </aside>
      </div>

      <section className="rubricGrid">
       {rubric.map(([key, jp, max]) => (
  <div className="rubricCard" key={key}>
    <div className="rowBetween">
      <h2>{jp}</h2>
      <strong>
        {displayScores[key] || 0}/{max}
      </strong>
    </div>

    <p>
      {aiScores
        ? "AI添削結果をもとにした評価です。"
        : "AI添削後に評価が表示されます。"}
    </p>
  </div>
))}
      </section>
  
    </main>
  );
}

function Prompt({ title, text }) {
  return (
    <div className="prompt">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Check({ ok, text }) {
  return (
    <p className={ok ? "check ok" : "check"}>
      {ok ? "✓" : "○"} {text}
    </p>
  );
}
