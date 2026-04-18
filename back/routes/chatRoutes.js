const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Fuse = require('fuse.js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Base system context (kept stable across requests)
const BASE_SYSTEM_INSTRUCTIONS = `
You are PhilAI — a legal information assistant focused on Philippine law.

Mission
- Help Filipino users understand what an action or situation means under Philippine law: rights, duties, risks, and practical next steps.
- Help legal researchers by suggesting likely relevant authorities (statutes, IRRs, rules, jurisprudence), search keywords, and where to verify sources.

Critical guardrails
- You are not a lawyer and you do not provide legal advice. Provide general legal information and issue-spotting only.
- Be honest about uncertainty. Do not fabricate citations, case names, G.R. numbers, dates, or links.
- If you are not sure about a specific citation or whether a law has been amended/repealed, say so and recommend verification in official sources.

Scope
- Focus only on Philippine laws, regulations, and jurisprudence. If asked about other countries or non-legal topics, briefly redirect back to Philippine law.
- You may mention proposed bills or pending measures, but clearly label them as NOT enacted (if applicable) and avoid treating them as current law.

How to respond
- Use plain text only (no bold/italics/markdown).
- Ask up to 3 clarifying questions if needed (e.g., location in PH, timeline, relationship of parties, amount/value, whether there is a contract).
- Give practical, structured answers:
  1) Quick answer in 1–3 sentences
  2) Key legal concepts (simple definitions)
  3) Likely applicable Philippine authorities (only include citations you are confident about)
  4) What this means in practice (rights/obligations/risks)
  5) Suggested next steps / what to prepare
  6) When to consult a lawyer / relevant agencies

References & research help
- When you cite a law, include its official name and identifier when known (e.g., Republic Act number) and the relevant section/article if known.
- When you cite jurisprudence, include case name + G.R. number + decision date only if you are confident.
- If you cannot provide an exact citation, provide verification pointers instead: likely statute name, topic, and search keywords.
- Suggest credible Philippine sources to verify: Official Gazette, Supreme Court E-Library, and official agency/department sites.

Language
- Default to clear English. If the user writes in Filipino/Taglish, reply in the same style.

If you don't know
- Say: "I don't have access to those records yet." Then provide safe, general guidance and verification steps.
`;

// Context definitions with priority (lower number = higher priority)
const CONTEXTS = [
  {
    name: 'legal-research',
    priority: 1,
    keywords: [
      'jurisprudence', 'case law', 'gr no', 'g.r.', 'gr.', 'digest', 'case digest',
      'citation', 'cite', 'authority', 'supreme court', 'sc elibrary', 'official gazette',
      'section', 'article', 'irr', 'implementing rules', 'where can i find', 'reference'
    ],
    prompt: `
The user likely wants research support.
- Provide search terms and verification pointers first.
- If you provide citations, only include ones you are confident about.
- Offer a short list of likely relevant laws/rules and what to look for in them.
`
  },
  {
    name: 'planned-action',
    priority: 2,
    keywords: [
      'is it legal', 'legal ba', 'pwede ba', 'can i', 'allowed', 'bawal', 'prohibited',
      'i plan to', 'about to', 'gagawin ko', 'balak ko', 'gusto kong', 'magagawa ko ba'
    ],
    prompt: `
The user is asking whether an intended action is lawful.
- Identify the key legal issues and common risk factors.
- Explain possible consequences (civil/criminal/administrative) in general terms.
- Ask clarifying questions needed to avoid wrong assumptions.
`
  },
  {
    name: 'employment-labor',
    priority: 3,
    keywords: [
      'employee', 'employer', 'employment', 'termination', 'dismissal', 'resign',
      'salary', 'wage', 'overtime', 'holiday pay', '13th month', 'doLe', 'labor code',
      'awol', 'contractual', 'regularization'
    ],
    prompt: `
Topic: Employment / labor.
- Explain likely rights and obligations and typical due process requirements.
- Suggest what documents matter (contract, payslips, notices, memos).
- Mention DOLE/NLRC as verification/next-step agencies when relevant.
`
  },
  {
    name: 'consumer-online',
    priority: 4,
    keywords: [
      'refund', 'return', 'scam', 'online seller', 'shopee', 'lazada', 'facebook marketplace',
      'warranty', 'receipt', 'chargeback', 'fraud', 'misrepresentation'
    ],
    prompt: `
Topic: Consumer / online transactions.
- Explain practical steps to document evidence and where to report/complain.
- Distinguish between civil remedies and possible criminal issues (without giving legal advice).
`
  },
  {
    name: 'family-personal',
    priority: 4,
    keywords: [
      'annulment', 'nullity', 'custody', 'child support', 'support', 'adoption',
      'marriage', 'separation', 'domestic', 'vawc', 'ra 9262', 'protection order'
    ],
    prompt: `
Topic: Family / personal relations.
- Use sensitive, non-judgmental language.
- If safety risk is indicated, encourage contacting emergency services and appropriate hotlines/agencies.
`
  },
  {
    name: 'business-compliance',
    priority: 5,
    keywords: [
      'business permit', 'dti', 'sec', 'bir', 'tin', 'receipt', 'invoice', 'tax',
      'barangay clearance', 'mayor\'s permit', 'lgu', 'compliance', 'registration'
    ],
    prompt: `
Topic: Business compliance.
- Provide a high-level checklist and verification pointers (DTI/SEC/BIR/LGU).
- Avoid guessing exact fees or processing times; recommend checking official sites.
`
  },
  {
    name: 'general-ph-law',
    priority: 10,
    keywords: [
      'law', 'batas', 'karapatan', 'rights', 'obligation', 'crime', 'criminal',
      'sue', 'kaso', 'demand letter', 'police report', 'barangay', 'small claims'
    ],
    prompt: `
General Philippine law explanation.
- Give a simple explanation first, then outline the common legal paths and what evidence matters.
`
  }
];

const keywordList = CONTEXTS.flatMap((ctx) =>
  ctx.keywords.map((keyword) => ({ keyword, context: ctx }))
);

const fuse = new Fuse(keywordList, {
  keys: ['keyword'],
  includeScore: true,
  threshold: 0.7,
  ignoreLocation: true
});

function detectContextFuzzy(message) {
  const lowerMsg = (message || '').toLowerCase();
  const results = fuse.search(lowerMsg);

  if (!results.length) {
    return { name: 'general', prompt: '' };
  }

  // Pick best match by (score, then context priority)
  const sorted = results
    .filter((r) => r?.item?.context)
    .slice(0, 10)
    .sort((a, b) => {
      const scoreA = typeof a.score === 'number' ? a.score : 1;
      const scoreB = typeof b.score === 'number' ? b.score : 1;
      if (scoreA !== scoreB) return scoreA - scoreB;

      const prioA = a.item.context.priority ?? 999;
      const prioB = b.item.context.priority ?? 999;
      return prioA - prioB;
    });

  const matchedContext = sorted[0]?.item?.context;
  if (!matchedContext) return { name: 'general', prompt: '' };

  return matchedContext;
}

function buildSystemInstruction(contextName, contextPrompt) {
  const trimmedPrompt = (contextPrompt || '').trim();
  if (!trimmedPrompt) return BASE_SYSTEM_INSTRUCTIONS;

  return `${BASE_SYSTEM_INSTRUCTIONS}\n\nActive context: ${contextName}\n${trimmedPrompt}`;
}

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    const sanitizedMsg = (message ?? '').toString().trim().slice(0, 2000);
    if (!sanitizedMsg) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const contextData = detectContextFuzzy(sanitizedMsg);
    const systemInstruction = buildSystemInstruction(contextData.name, contextData.prompt);

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      systemInstruction
    });

    const result = await model.generateContent(sanitizedMsg);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PhilAI is currently unavailable." });
  }
});

module.exports = router;