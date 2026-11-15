/** Job-driven interview practice questions + one follow-up per axis (max 10 turns). */

export type PracticeLang = 'ja' | 'en';
export type PracticeTurn = { kind: 'main' | 'followup'; axis: number; question: string };

export const ANSWER_PATTERN_HINT = '回答の型：結論 → 根拠 → 実例 → 次の一手';
export const ANSWER_PATTERN_HINT_EN = 'Answer shape: conclusion → reason → example → next step';

const TECH_WORDS = [
  'WordPress', 'React', 'Next.js', 'Vue', 'Nuxt', 'TypeScript', 'JavaScript', 'PHP', 'Laravel',
  'Shopify', 'STUDIO', 'Figma', 'HTML', 'CSS', 'Tailwind', 'Node.js', 'Python', 'Django',
  'Flutter', 'Swift', 'Kotlin', 'Firebase', 'Supabase', 'AWS', 'Docker', 'GraphQL', 'REST',
  'WooCommerce', 'EC-CUBE', 'Liquid', 'ACF', 'GPT', 'OpenAI', 'RAG', 'チャットボット',
];

const DELIVERABLE_PATTERNS: Array<[RegExp, string, string]> = [
  [/LP|ランディング/i, 'LP', 'landing page'],
  [/ホームページ|コーポレートサイト|公式サイト|Webサイト|ウェブサイト/i, 'Webサイト', 'website'],
  [/ECサイト|オンラインショップ|Shopify/i, 'ECサイト', 'e-commerce site'],
  [/チャットボット|bot/i, 'チャットボット', 'chatbot'],
  [/アプリ|application|iOS|Android/i, 'アプリ', 'app'],
  [/管理画面|ダッシュボード|admin/i, '管理画面', 'admin panel'],
  [/API連携|API/i, 'API連携', 'API integration'],
];

export type BriefHints = {
  tech: string;
  deliverable: string;
  techEn: string;
  deliverableEn: string;
};

export function extractBriefHints(brief: string): BriefHints {
  const text = String(brief || '');
  const techHit = TECH_WORDS.find((w) => text.toLowerCase().includes(w.toLowerCase()));
  let deliverable = '';
  let deliverableEn = '';
  for (const [re, ja, en] of DELIVERABLE_PATTERNS) {
    if (re.test(text)) {
      deliverable = ja;
      deliverableEn = en;
      break;
    }
  }
  return {
    tech: techHit || '',
    deliverable,
    techEn: techHit || '',
    deliverableEn,
  };
}

const GENERAL_MAIN: Record<PracticeLang, string[]> = {
  ja: [
    'ご自身の経験と、今回の案件で貢献できることを教えてください。',
    '似た機能を制作した経験はありますか？未経験の部分にはどう対応しますか？',
    '見積もりと納期は、どう積算し、何が変動要因になりますか？',
    '進捗報告の頻度・方法と、問題が起きたときの連絡はどうしますか？',
    'リモート・稼働時間・連絡手段・言語など、条件面で確認したいことは何ですか？',
  ],
  en: [
    'Tell me about your experience and how you can contribute to this project.',
    'Have you built something similar? If not, how would you show an alternative?',
    'How do you estimate scope and deadline, and what usually changes the plan?',
    'How often would you report progress, and how would you escalate problems?',
    'What working conditions (remote, hours, channel, language) would you confirm first?',
  ],
};

const GENERAL_FOLLOW: Record<PracticeLang, string[]> = {
  ja: [
    '着手前に、発注者へ必ず確認する項目を3つ挙げてください。',
    'その制作で一番詰まった点と、どう抜けましたか？（未経験なら、どう調べて進めるかを教えてください）',
    '遅れそうになった時点で、何を・いつ・どう伝えますか？',
    '報告が途切れそうなとき、どう立て直しますか？',
    '条件が合わない場合、どう提案し直しますか？',
  ],
  en: [
    'Name three things you would clarify with the client before starting.',
    'What was the hardest part of a similar build, and how did you get unstuck? (If none, how would you learn and proceed?)',
    'If you might miss the deadline, what would you say, when, and how?',
    'If reporting starts to slip, how would you recover the cadence?',
    'If conditions do not fit, how would you renegotiate?',
  ],
};

function jobMains(lang: PracticeLang, h: BriefHints): string[] {
  const techJa = h.tech || '指定の技術';
  const delJa = h.deliverable || '成果物';
  const techEn = h.techEn || 'the required stack';
  const delEn = h.deliverableEn || 'the deliverable';
  if (lang === 'ja') {
    return [
      `この案件で最初に作る${delJa}は何で、着手前に発注者へ何を確認しますか？`,
      `${techJa}を使った似た制作の経験はありますか？ない場合は、どう代替を示しますか？（実績の創作は不要です）`,
      `${delJa}の見積もりと納期は、どう積算し、何が変動要因になりますか？`,
      '進捗報告の頻度・方法と、問題が起きたときの連絡はどうしますか？',
      'リモート、稼働時間、連絡手段、言語など、条件面で確認したいことは何ですか？',
    ];
  }
  return [
    `For this project, what ${delEn} would you build first, and what would you clarify before starting?`,
    `Have you shipped something similar with ${techEn}? If not, how would you show an alternative without inventing experience?`,
    `How would you estimate the ${delEn} and deadline, and what usually changes the plan?`,
    'How often would you report progress, and how would you escalate problems?',
    'What conditions (remote, hours, channel, language) would you confirm first?',
  ];
}

function jobFollows(lang: PracticeLang, h: BriefHints): string[] {
  const delJa = h.deliverable || '成果物';
  const delEn = h.deliverableEn || 'deliverable';
  if (lang === 'ja') {
    return [
      `最初の${delJa}を始める前に、確認漏れが怖い項目は何ですか？`,
      'その制作で一番詰まった点と、どう抜けましたか？（未経験なら、調べ方と最初の一歩を教えてください）',
      '遅れそうになった時点で、何を・いつ・どう伝えますか？',
      '報告が滞りそうなとき、どう立て直しますか？',
      '条件が合わない場合、どう提案し直しますか？',
    ];
  }
  return [
    `Before starting the first ${delEn}, what confirmation worry you most about missing?`,
    'What was the hardest stuck point in a similar build, and how did you get through it? (If none, how would you research and take the first step?)',
    'If you might miss the deadline, what would you communicate, when, and how?',
    'If reporting starts to slip, how would you restore the cadence?',
    'If conditions do not fit, how would you renegotiate the offer?',
  ];
}

/** Build up to 10 turns: each main question followed by one axis-linked follow-up. */
export function buildPracticeTurns(opts: {
  lang: PracticeLang;
  source: 'general' | 'job';
  brief?: string;
}): PracticeTurn[] {
  const lang = opts.lang === 'en' ? 'en' : 'ja';
  const useJob = opts.source === 'job' && !!String(opts.brief || '').trim();
  const hints = extractBriefHints(opts.brief || '');
  const mains = useJob ? jobMains(lang, hints) : GENERAL_MAIN[lang];
  const follows = useJob ? jobFollows(lang, hints) : GENERAL_FOLLOW[lang];
  const turns: PracticeTurn[] = [];
  for (let i = 0; i < 5; i++) {
    turns.push({ kind: 'main', axis: i, question: mains[i] });
    turns.push({ kind: 'followup', axis: i, question: follows[i] });
  }
  return turns.slice(0, 10);
}

export function practiceAnswerHint(lang: PracticeLang) {
  return lang === 'en' ? ANSWER_PATTERN_HINT_EN : ANSWER_PATTERN_HINT;
}
