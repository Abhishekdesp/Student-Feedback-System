import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { env } from '../config/env.js';
import { TeacherService } from './teacherService.js';
export class TeacherChatService {
    static async handleChat(user, userMessage, history = []) {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey || apiKey.trim().length === 0) {
            return 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in your server .env file.';
        }
        const modelName = env.GEMINI_MODEL || 'gemini-3.5-flash';
        // 1. Define LangChain Tools bound to the authenticated teacher's context
        const getDashboardSummaryTool = tool(async () => {
            try {
                const stats = await TeacherService.getDashboardStats(user);
                return JSON.stringify(stats);
            }
            catch (err) {
                return JSON.stringify({ error: err.message || 'Failed to fetch dashboard stats' });
            }
        }, {
            name: 'get_dashboard_summary',
            description: 'Fetches overall teaching summary metrics for this teacher, such as overall rating (out of 5), total student responses, total enrolled students, and number of active course surveys.',
            schema: z.object({}),
        });
        const getMySubjectsTool = tool(async () => {
            try {
                const subjects = await TeacherService.getTeacherSubjects(user);
                return JSON.stringify(subjects.map((s) => ({
                    id: s.id,
                    code: s.code,
                    semester: s.semester,
                    academicYear: s.academicYear,
                    totalStudents: s.totalStudents,
                    responseCount: s.responseCount,
                    averageRating: s.averageRating,
                })));
            }
            catch (err) {
                return JSON.stringify({ error: err.message || 'Failed to fetch subjects' });
            }
        }, {
            name: 'get_my_subjects',
            description: 'Lists all academic subjects assigned to this teacher with their subject codes, semester, academic year, response count, and average rating.',
            schema: z.object({}),
        });
        const getSubjectAnalyticsTool = tool(async ({ subjectCode }) => {
            try {
                const subjects = await TeacherService.getTeacherSubjects(user);
                const cleanCode = subjectCode.trim().toUpperCase();
                const target = subjects.find((s) => s.code.toUpperCase() === cleanCode || s.id === subjectCode.trim());
                if (!target) {
                    return JSON.stringify({
                        error: `Subject with code "${subjectCode}" was not found in your assigned subjects list.`,
                    });
                }
                const analytics = await TeacherService.getSubjectAnalytics(user, target.id);
                return JSON.stringify({
                    subjectCode: analytics.subject.code,
                    overallRating: analytics.overallRating,
                    totalResponses: analytics.totalResponses,
                    highestRatedQuestion: analytics.highestRatedQuestion,
                    lowestRatedQuestion: analytics.lowestRatedQuestion,
                    questionWise: analytics.questionWise.map((q) => ({
                        question: q.questionText,
                        avgRating: q.avgRating,
                        responsesCount: q.responsesCount,
                    })),
                    sentimentDistribution: analytics.sentimentDistribution,
                    aiInsights: analytics.aiInsights,
                });
            }
            catch (err) {
                return JSON.stringify({ error: err.message || 'Failed to fetch subject analytics' });
            }
        }, {
            name: 'get_subject_analytics',
            description: 'Gets question-by-question ratings, average scores, highest and lowest rated questions, and sentiment stats for a specific subject code (e.g. CS101, 3150703).',
            schema: z.object({
                subjectCode: z.string().describe('The subject code, e.g. CS101 or 3150703'),
            }),
        });
        const getSubjectCommentsTool = tool(async ({ subjectCode }) => {
            try {
                const subjects = await TeacherService.getTeacherSubjects(user);
                const cleanCode = subjectCode.trim().toUpperCase();
                const target = subjects.find((s) => s.code.toUpperCase() === cleanCode || s.id === subjectCode.trim());
                if (!target) {
                    return JSON.stringify({
                        error: `Subject with code "${subjectCode}" was not found in your assigned subjects list.`,
                    });
                }
                const comments = await TeacherService.getSubjectComments(user, target.id);
                return JSON.stringify({
                    subjectCode: target.code,
                    totalComments: comments.length,
                    comments: comments.slice(0, 20).map((c) => ({
                        comment: c.userComment,
                        sentiment: c.sentiment?.label || 'Neutral',
                    })),
                });
            }
            catch (err) {
                return JSON.stringify({ error: err.message || 'Failed to fetch comments' });
            }
        }, {
            name: 'get_subject_comments',
            description: 'Gets anonymized qualitative student comments and their sentiment labels (Positive, Neutral, Constructive) for a given subject code.',
            schema: z.object({
                subjectCode: z.string().describe('The subject code, e.g. CS101'),
            }),
        });
        const tools = [
            getDashboardSummaryTool,
            getMySubjectsTool,
            getSubjectAnalyticsTool,
            getSubjectCommentsTool,
        ];
        const toolsByName = {
            get_dashboard_summary: getDashboardSummaryTool,
            get_my_subjects: getMySubjectsTool,
            get_subject_analytics: getSubjectAnalyticsTool,
            get_subject_comments: getSubjectCommentsTool,
        };
        // 2. Initialize LangChain Google Generative AI
        const model = new ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: apiKey,
            temperature: 0.2,
        });
        const modelWithTools = model.bindTools(tools);
        const systemPrompt = `You are the AI Teaching Assistant and Feedback Insights Copilot for the Student Feedback System, built with LangChain and Google Gemini.
You are currently assisting the authenticated teacher (Professor ${user.username}).

Capabilities and Responsibilities:
- Use your tools (get_dashboard_summary, get_my_subjects, get_subject_analytics, get_subject_comments) whenever the teacher asks about their performance, subjects, ratings, student comments, or trends.
- STRICT ANONYMITY: Student feedback is completely anonymous. NEVER attempt to identify students or reveal student identities.
- Format responses cleanly with Markdown: use bold text, bullet points, headers, and numbered lists.
- If asked for advice on improving teaching or lecture pace, provide constructive, encouraging, and practical pedagogical strategies based on the feedback.`;
        const messages = [new SystemMessage(systemPrompt)];
        // Append conversation history (last 8 turns for context)
        const recentHistory = history.slice(-8);
        for (const h of recentHistory) {
            if (h.sender === 'user') {
                messages.push(new HumanMessage(h.text));
            }
            else if (h.sender === 'bot') {
                messages.push(new AIMessage(h.text));
            }
        }
        messages.push(new HumanMessage(userMessage));
        // 3. Agent Execution Loop
        try {
            let currentResponse = await modelWithTools.invoke(messages);
            messages.push(currentResponse);
            let loopCount = 0;
            while (currentResponse.tool_calls && currentResponse.tool_calls.length > 0 && loopCount < 4) {
                loopCount++;
                for (const toolCall of currentResponse.tool_calls) {
                    const selectedTool = toolsByName[toolCall.name];
                    if (selectedTool) {
                        const toolResult = await selectedTool.invoke(toolCall.args);
                        messages.push(new ToolMessage({
                            tool_call_id: toolCall.id || `call_${Date.now()}`,
                            content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                        }));
                    }
                    else {
                        messages.push(new ToolMessage({
                            tool_call_id: toolCall.id || `call_${Date.now()}`,
                            content: JSON.stringify({ error: `Tool ${toolCall.name} not found` }),
                        }));
                    }
                }
                currentResponse = await modelWithTools.invoke(messages);
                messages.push(currentResponse);
            }
            return typeof currentResponse.content === 'string'
                ? currentResponse.content
                : JSON.stringify(currentResponse.content);
        }
        catch (err) {
            console.error('LangChain Teacher Chatbot Error:', err);
            return `I encountered an issue processing your request: ${err.message || 'Unknown error'}. Please try asking in a different way.`;
        }
    }
}
