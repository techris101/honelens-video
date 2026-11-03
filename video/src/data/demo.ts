// One illustrative article and its HoneLENS results, shared by both videos so every scene tells
// the same story. Everything here is fictional (journal, authors, numbers). The DOI uses Crossref's
// reserved test prefix 10.5555, and the site uses the reserved .example domain, so nothing points at
// a real paper. Numbers are internally consistent: 31/206 vs 49/206 readmissions.
//   risk 15.0% vs 23.8% · RR 0.63 (95% CI 0.42 to 0.95) · ARR 8.7 points · NNT 12 (11.5 rounded up)

export const ARTICLE = {
  site: 'journals.northbridge.example',
  url: 'journals.northbridge.example/nursing/article/2024-0311',
  journal: 'The Northbridge Journal of Nursing',
  journalShort: 'Northbridge J Nurs',
  publisher: 'Northbridge University Press',
  kind: 'Original research',
  title: 'Nurse-led discharge teaching and 30-day readmission in adults with heart failure: a randomized controlled trial',
  authors: 'Maria Rivera, Lei Chen, Adaeze Okafor, Sunil Patel, Thao Nguyen',
  authorsShort: 'Rivera M, Chen L, Okafor A, et al.',
  year: 2024,
  published: 'Mar 12, 2024',
  volume: '18(3):211–224',
  doi: '10.5555/nbjn.2024.0311',
  pmid: '48210375',
  studyType: 'Randomized controlled trial',
  abstract: [
    ['Background', 'Adults with heart failure are often readmitted within a month of discharge. Structured teaching by nurses may help patients manage symptoms at home.'],
    ['Methods', 'We randomly assigned 412 adults hospitalized with heart failure at three US hospitals to nurse-led discharge teaching (two sessions and a follow-up call at 72 hours) or usual discharge instructions.'],
    ['Results', 'Thirty-day readmission occurred in 31 of 206 patients (15.0%) in the teaching group and 49 of 206 (23.8%) in the usual-care group (relative risk 0.63; 95% CI 0.42 to 0.95).'],
    ['Conclusions', 'Nurse-led discharge teaching reduced 30-day readmissions in adults with heart failure.'],
  ] as Array<[string, string]>,
  // Body passages shown on the page (the quote below must appear verbatim in one of them).
  body: [
    ['Outcome assessment', 'Readmissions were identified from hospital records and patient report. Outcome assessors were aware of group allocation, and adherence to the teaching plan was self-reported at the 30-day call.'],
    ['Funding', 'This trial was funded by CardioHome Inc., which makes home monitoring devices. Two authors report consulting fees from the funder.'],
  ] as Array<[string, string]>,
};

export const ANALYSIS = {
  oneSentence: 'Nurse-led discharge teaching cut 30-day readmissions from 24% to 15% in adults with heart failure.',
  summary:
    'In a trial at three US hospitals, 412 adults with heart failure were randomly assigned to two nurse-led teaching sessions plus a follow-up call, or to usual discharge instructions. Within 30 days, 15% of the teaching group and 24% of the usual-care group were readmitted. The authors conclude that structured teaching by nurses lowers early readmission.',
  explainMore: [
    ['What they did', 'Nurses taught each patient twice before discharge: warning signs, daily weights, medicines and when to call. A nurse phoned every patient 72 hours after going home.'],
    ['What they found', 'Readmission fell from 23.8% to 15.0%. The relative risk was 0.63 (95% CI 0.42 to 0.95), so the true effect is probably real but could be small.'],
    ['How to read it', 'About 12 patients need the teaching to prevent one readmission within 30 days.'],
  ] as Array<[string, string]>,
  pico: [
    ['P', '412 adults hospitalized with heart failure at 3 US hospitals'],
    ['I', 'Two nurse-led teaching sessions and a call at 72 hours'],
    ['C', 'Usual discharge instructions'],
    ['O', '30-day readmission: 15.0% vs 23.8% (RR 0.63)'],
  ] as Array<[string, string]>,
  limitations: [
    { text: 'Outcome assessors knew who got the teaching', quote: 'Outcome assessors were aware of group allocation' },
    { text: 'Follow-up lasted only 30 days', quote: '' },
    { text: 'Three hospitals in one region', quote: '' },
  ],
  biases: [
    { kind: 'Funding', text: 'Funded by a home-monitoring device maker', quote: 'This trial was funded by CardioHome Inc., which makes home monitoring devices.' },
    { kind: 'Conflict', text: 'Two authors were paid consultants of the funder', quote: 'Two authors report consulting fees from the funder.' },
    { kind: 'Bias', text: 'Adherence was self-reported', quote: 'adherence to the teaching plan was self-reported at the 30-day call' },
  ],
  chat: {
    question: 'How long were the teaching sessions?',
    answer: 'Each of the two sessions lasted about 30 minutes, the day before and the day of discharge. A nurse then called at 72 hours. (Methods, Intervention)',
    suggestions: ['What was the dropout rate?', 'How was readmission measured?'],
  },
};

export const SOURCE_CHECK = {
  rows: [
    { label: 'Identifiers', value: 'DOI and PMID found', state: 'match' as const, chip: 'Matches' },
    { label: 'Published', value: 'Mar 12, 2024 · within your 5-year rule', state: 'match' as const, chip: 'Matches' },
    { label: 'Study type', value: 'Randomized controlled trial · primary research', state: 'match' as const, chip: 'Matches' },
    { label: 'Updates', value: 'No matching update record found in Crossref on Oct 10, 2026.', state: 'unknown' as const, chip: 'No update record found' },
    { label: 'Full text', value: 'Free full text in Europe PMC', state: 'match' as const, chip: 'Free full text' },
  ],
  // A second, different fictional paper for the retraction moment.
  retracted: { title: 'Daily fluid diaries and heart failure outcomes', journal: 'Lakeshore Nursing Review', year: 2019, notice: 'Retraction notice, Jan 2023' },
};

export const CITE = {
  apa: 'Rivera, M., Chen, L., Okafor, A., Patel, S., & Nguyen, T. (2024). Nurse-led discharge teaching and 30-day readmission in adults with heart failure: A randomized controlled trial. *The Northbridge Journal of Nursing, 18*(3), 211–224. https://doi.org/10.5555/nbjn.2024.0311',
  ama: 'Rivera M, Chen L, Okafor A, et al. Nurse-led discharge teaching and 30-day readmission in adults with heart failure: a randomized controlled trial. *Northbridge J Nurs*. 2024;18(3):211-224. doi:10.5555/nbjn.2024.0311',
};

export const EBP = {
  assignment: 'Heart failure readmissions',
  picot: 'In adults with heart failure (P), does nurse-led discharge teaching (I), compared with usual care (C), reduce readmission (O) within 30 days (T)?',
  papers: [
    { id: 'P1', short: 'Rivera 2024', design: 'Randomized controlled trial', sample: '412 adults, 3 hospitals', intervention: 'Two teaching sessions + 72-hour call', outcomes: '30-day readmission', findings: '15.0% vs 23.8% (RR 0.63)', limits: 'Assessors not blinded', level: 'II · nearest fit' },
    { id: 'P2', short: 'Haddad 2023', design: 'Cohort study', sample: '1,180 adults, 1 health system', intervention: 'Teach-back at discharge', outcomes: '90-day readmission', findings: 'No difference at 90 days', limits: 'Not randomized', level: 'IV · nearest fit' },
    { id: 'P3', short: 'Lindqvist 2022', design: 'Systematic review', sample: '14 trials, 3,920 adults', intervention: 'Structured self-care education', outcomes: 'All-cause readmission', findings: 'Fewer readmissions (RR 0.79)', limits: 'Mixed teaching methods', level: 'I · nearest fit' },
    { id: 'P4', short: 'Moreau 2021', design: 'Qualitative study', sample: '22 patients, 9 nurses', intervention: 'Discharge conversations', outcomes: 'Patient experience', findings: 'Teaching felt rushed on discharge day', limits: 'Single site', level: 'VI · nearest fit' },
  ],
  synthesis: 'Three of four papers favor structured teaching; the cohort study (P2) found no difference at 90 days.',
  agreements: ['Teaching that includes daily weights and warning signs (P1, P3)'],
  differences: ['Effect fades by 90 days in routine care (P2)'],
  gaps: ['No trial followed patients past 6 months'],
};

export const STATS = { nnt: 12, arr: '8.7', ci: '0.42 to 0.95', rr: '0.63', plain: 'Teach about 12 patients to prevent one readmission within 30 days.' };

export const DOSAGE = {
  order: 'Metoprolol tartrate 37.5 mg by mouth twice daily',
  have: 'Tablets: 25 mg each',
  steps: ['37.5 mg', '× 1 tablet / 25 mg', '= 1.5 tablets'],
  answer: '1.5 tablets',
  doNotUse: { written: 'Metoprolol 25 mg qd', flag: 'qd', fix: 'Write “daily”' },
  exam: { line: 'Ready on 4 of 5 topics · review IV flow rates next' },
};

export const KEYS = {
  gemini: { label: 'Get Google Gemini key', tag: 'Free', recommended: true, host: 'aistudio.google.com/apikey' },
  openrouter: { label: 'Get OpenRouter key', tag: 'Free', host: 'openrouter.ai/settings/keys' },
  masked: 'AIza••••••••••••••••••••••••••',
};

export const COPY = {
  tagline: 'Your thinking, honed by evidence.',
  cta: 'Add HoneLENS to Chrome',
  ctaSub: 'Free to start. Bring your own free AI key.',
};
