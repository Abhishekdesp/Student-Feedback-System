import { env } from '../config/env.js';
export class AISentimentService {
    static positiveWords = [
        'excellent', 'great', 'amazing', 'helpful', 'clear', 'interactive', 'punctual',
        'supportive', 'best', 'engaging', 'thorough', 'expert', 'passionate', 'kind',
        'friendly', 'well', 'good', 'awesome', 'understandable', 'effective', 'inspiring',
        'organized', 'dedicated', 'patient', 'approachable', 'fair', 'superb'
    ];
    static constructiveWords = [
        'improve', 'slow', 'fast', 'confusing', 'unclear', 'difficult', 'tough',
        'hard', 'strict', 'more', 'less', 'assignments', 'speed', 'pace', 'late',
        'volume', 'doubt', 'explain', 'homework', 'exam', 'practice', 'slides'
    ];
    static async analyzeSentiment(text, useExternalAi = true) {
        const apiKey = env.GEMINI_API_KEY;
        if (useExternalAi && apiKey && apiKey.trim().length > 0) {
            try {
                const cloudResult = await AISentimentService.analyzeWithGemini(text, apiKey);
                if (cloudResult) {
                    return cloudResult;
                }
            }
            catch (err) {
                console.warn('Gemini API call failed, falling back to Offline Lexicon:', err);
            }
        }
        return AISentimentService.analyzeOffline(text);
    }
    static async analyzeWithGemini(text, apiKey) {
        const candidateModels = Array.from(new Set([
            env.GEMINI_MODEL,
            'gemini-3.5-flash',
            'gemini-3.8-flash',
            'gemini-3.1-flash-lite',
            'gemini-2.5-flash-lite'
        ]));
        for (const model of candidateModels) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [
                    {
                        parts: [
                            {
                                text: `Classify the sentiment of this student feedback as ONLY one word: Positive, Neutral, or Constructive. Comment: "${text}"`
                            }
                        ]
                    }
                ]
            };
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`Gemini API model ${model} returned status ${response.status}: ${errText}`);
                    continue;
                }
                const json = await response.json();
                const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                const match = reply.match(/Positive|Neutral|Constructive/i);
                if (match) {
                    const raw = match[0].toLowerCase();
                    const label = raw === 'positive' ? 'Positive' : raw === 'constructive' ? 'Constructive' : 'Neutral';
                    return {
                        label,
                        score: 1.0,
                        engine: `Gemini (${model})`
                    };
                }
            }
            catch (err) {
                console.warn(`Error calling Gemini API for model ${model}:`, err);
            }
        }
        return null;
    }
    static analyzeOffline(text) {
        const cleanText = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
        const words = cleanText.split(/\s+/).filter(Boolean);
        let posCount = 0;
        let conCount = 0;
        for (const w of words) {
            if (AISentimentService.positiveWords.includes(w)) {
                posCount++;
            }
            if (AISentimentService.constructiveWords.includes(w)) {
                conCount++;
            }
        }
        const totalHits = posCount + conCount;
        if (totalHits === 0) {
            return {
                label: 'Neutral',
                score: 0.0,
                engine: 'Offline Lexicon'
            };
        }
        const netScore = (posCount - conCount) / Math.max(1, totalHits);
        if (netScore > 0.1) {
            return {
                label: 'Positive',
                score: Number(netScore.toFixed(2)),
                engine: 'Offline Lexicon'
            };
        }
        else if (netScore < -0.1 || conCount > posCount) {
            return {
                label: 'Constructive',
                score: Number(netScore.toFixed(2)),
                engine: 'Offline Lexicon'
            };
        }
        else {
            return {
                label: 'Neutral',
                score: Number(netScore.toFixed(2)),
                engine: 'Offline Lexicon'
            };
        }
    }
}
