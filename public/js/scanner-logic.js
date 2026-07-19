import { AI_CLICHES, appState } from './store.js';

export function splitIntoSentences(text) {
  const sentences = text.match(/[^.!?\s][^.!?]*(?:[.!?](?!['"]?\s|$)[^.!?]*)*[.!?]['"]?(?=\s|$)/g);
  if (!sentences) {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 3);
  }
  return sentences.map(s => s.trim()).filter(s => s.length > 3);
}

export function countSyllablesInWord(word) {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syls = word.match(/[aeiouy]{1,2}/g);
  return syls ? syls.length : 1;
}

export function analyzeTextLocally(text) {
  const sentences = splitIntoSentences(text);
  const words = text.toLowerCase().match(/\b[\w'-]+\b/g) || [];
  
  if (sentences.length === 0 || words.length === 0) {
    throw new Error('Could not analyze text structure. Check input.');
  }

  const uniqueWords = new Set(words);
  const ttr = words.length > 0 ? (uniqueWords.size / words.length) : 0;
  let diversityScore = Math.max(0, Math.min(100, ((0.72 - ttr) / 0.24) * 100));
  
  const sentenceLengths = sentences.map(s => (s.match(/\b[\w'-]+\b/g) || []).length);
  const totalSentenceWords = sentenceLengths.reduce((a, b) => a + b, 0);
  const avgSentenceLength = totalSentenceWords / sentences.length;
  
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgSentenceLength, 2), 0) / sentences.length;
  const stdDev = Math.sqrt(variance);
  
  let burstinessScore = Math.max(0, Math.min(100, ((8.5 - stdDev) / 6.5) * 100));

  let clichéMatches = 0;
  const lowercaseText = text.toLowerCase();
  
  AI_CLICHES.forEach(cliche => {
    const regex = new RegExp(`\b${cliche}\b`, 'g');
    const matches = lowercaseText.match(regex);
    if (matches) clichéMatches += matches.length;
  });
  
  const clicheDensity = words.length > 0 ? (clichéMatches / words.length) * 100 : 0;
  let clichesScore = Math.min(100, (clicheDensity / 1.4) * 100);

  let syllableCount = 0;
  words.forEach(w => {
    syllableCount += countSyllablesInWord(w);
  });
  const readabilityScore = Math.max(0, Math.min(100, 
    206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllableCount / words.length)
  ));

  let multiplier = 1.0;
  if (appState.settings.sensitivity === 'strict') multiplier = 1.25;
  if (appState.settings.sensitivity === 'lax') multiplier = 0.75;
  
  let overallAIScore = Math.round(
    (burstinessScore * 0.35 + diversityScore * 0.25 + clichesScore * 0.40) * multiplier
  );
  overallAIScore = Math.max(0, Math.min(99, overallAIScore));

  let verdict = 'Mixed/Suspicious';
  let explanation = '';
  if (overallAIScore < 30) {
    verdict = 'Human-written';
    explanation = `This document matches typical human styling signatures. It features dynamic sentence structures (burstiness std-dev: ${stdDev.toFixed(1)} words) and normal vocabulary diversity (TTR: ${ttr.toFixed(2)}). Only ${clichéMatches} corporate AI word matches were detected.`;
  } else if (overallAIScore > 70) {
    verdict = 'AI-generated';
    explanation = `High probability of AI generation. The text has a very uniform sentence length distribution (std-dev: ${stdDev.toFixed(1)} words, indicating flat burstiness) and is repetitive (TTR: ${ttr.toFixed(2)}). High density of typical LLM clichés (${clicheDensity.toFixed(2)}% of content) was flagged.`;
  } else {
    verdict = 'Mixed/Suspicious';
    explanation = `The text contains a blend of human writing patterns and robotic passages. Readability difficulty is balanced, but the sentence structure fluctuates. We recommend checking individual sentence highlights for potential AI insertions.`;
  }

  const sentenceEvaluations = sentences.map((sentence, idx) => {
    const sWords = sentence.toLowerCase().match(/\b[\w'-]+\b/g) || [];
    const len = sWords.length;
    
    let sClicheCount = 0;
    let markersFound = [];
    
    AI_CLICHES.forEach(cliche => {
      if (sentence.toLowerCase().includes(cliche)) {
        sClicheCount++;
        markersFound.push(cliche);
      }
    });

    const passiveVoicePattern = /\b(am|is|are|was|were|be|been|being)\b\s+\w+ed\b/i;
    if (passiveVoicePattern.test(sentence)) {
      markersFound.push('passive voice');
    }

    const dev = Math.abs(len - avgSentenceLength);
    const uniformity = dev < 3 ? 80 : (dev > 10 ? 10 : 50);

    let sentenceScore = Math.round((uniformity * 0.4 + (sClicheCount > 0 ? 90 : 10) * 0.6) * multiplier);
    sentenceScore = Math.max(0, Math.min(100, sentenceScore));

    return {
      index: idx,
      text: sentence,
      aiScore: sentenceScore,
      reason: sClicheCount > 0 
        ? `Contains AI buzzwords: ${markersFound.join(', ')}.` 
        : `Flat, uniform construction. Length fits standard AI average.`
    };
  });

  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    excerpt: text.substring(0, 100) + '...',
    text,
    mode: 'local',
    score: overallAIScore,
    verdict,
    explanation,
    metrics: {
      burstiness: Math.round(burstinessScore),
      diversity: Math.round(diversityScore),
      cliches: Math.round(clichesScore),
      readability: Math.round(readabilityScore)
    },
    sentenceEvaluations
  };
}

export async function analyzeTextWithGemini(text, updateStatusCallback) {
  const apiKey = appState.settings.apiKey;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  updateStatusCallback('Generating analytical prompt...', 30);
  
  const systemPrompt = `You are a professional linguistic forensic expert and writing detector. Analyze the input text and evaluate if it was written by a human or generated by an AI model (like GPT-4, Claude-3, Gemini, Llama).
  
  Perform quantitative analysis and return your response EXCLUSIVELY as a JSON object matching the schema below. Do not wrap it in markdown code blocks or add explanations.
  
  JSON Schema format:
  {
    "score": (integer overall AI probability from 0 to 100),
    "verdict": (string: must be exactly "Human-written", "Mixed/Suspicious", or "AI-generated"),
    "explanation": (string summarizing your findings, sentence variances, cliches, and tone),
    "metrics": {
      "burstiness": (integer from 0 to 100),
      "diversity": (integer from 0 to 100),
      "cliches": (integer from 0 to 100),
      "readability": (integer Flesch Reading Ease score from 0 to 100)
    },
    "sentenceEvaluations": [
      {
        "index": (integer, 0-based index of sentence in order of appearance),
        "text": (string, exact sentence text),
        "aiScore": (integer AI probability from 0 to 100),
        "reason": (string explaining why, e.g. mentioning passive voice, uniform lengths, clichés found)
      }
    ]
  }

  IMPORTANT RULES:
  - Splitting sentences: Ensure you split sentences sequentially. Make sure every single sentence of the input text is present in the "sentenceEvaluations" array in order, so the client-side highlighter doesn't skip sentences.
  - Return ONLY valid raw JSON text. No preambles, no postscripts, no code fences.`;

  updateStatusCallback('Contacting Gemini servers...', 60);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt + "\n\nText to analyze:\n" + text
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || response.statusText || 'Connection failed.';
      throw new Error(`Gemini API Error: ${message}`);
    }

    updateStatusCallback('Parsing response payload...', 85);
    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini API returned an empty response. Verify model availability.');
    }

    let responseText = data.candidates[0].content.parts[0].text;
    
    responseText = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
    
    const parsedJSON = JSON.parse(responseText);
    
    let adjustedScore = parsedJSON.score;
    if (appState.settings.sensitivity === 'strict') adjustedScore = Math.min(100, Math.round(adjustedScore * 1.2));
    if (appState.settings.sensitivity === 'lax') adjustedScore = Math.max(0, Math.round(adjustedScore * 0.8));

    let verdict = parsedJSON.verdict;
    if (adjustedScore < 30) verdict = 'Human-written';
    else if (adjustedScore > 70) verdict = 'AI-generated';
    else verdict = 'Mixed/Suspicious';

    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      excerpt: text.substring(0, 100) + '...',
      text,
      mode: 'gemini',
      score: adjustedScore,
      verdict,
      explanation: parsedJSON.explanation,
      metrics: parsedJSON.metrics,
      sentenceEvaluations: parsedJSON.sentenceEvaluations
    };
  } catch (err) {
    console.error('Gemini call error:', err);
    throw new Error(`Cloud Scan Failed: ${err.message}`);
  }
}
