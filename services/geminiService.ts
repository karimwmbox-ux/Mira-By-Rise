
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Campaign, AnalysisSummary } from '../types';

const getAiClient = (isThinkingMode: boolean) => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const config = isThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};
    return { ai, modelName, config };
};

const getLanguageName = (language: 'en' | 'fr' | 'ar'): string => {
    const languageMap = { en: 'English', fr: 'French', ar: 'Arabic' };
    return languageMap[language];
};

export const getRecommendations = async (campaigns: Campaign[], summary: AnalysisSummary, language: 'en' | 'fr' | 'ar', isThinkingMode: boolean): Promise<string> => {
    const { ai, modelName, config } = getAiClient(isThinkingMode);
    const languageName = getLanguageName(language);
    const hasAudienceData = campaigns.some(c => c.audience && c.audience !== 'N/A' && c.audience !== 'Multiple');
    const hasRoasData = summary.overallROAS > 0.01;
    const campaignsWithAnomalies = campaigns.filter(c => c.anomalies && c.anomalies.length > 0);

    const roasAnalysisBlock = `
**THE BOTTOM LINE:**
Start with a no-BS summary of the account's health. Is it making money or burning cash? What's the overall ROAS? Be direct.

**ALGERIAN MARKET CONTEXT 🇩🇿:**
Provide specific insights for the Algerian market. Mention common behaviors (e.g., high mobile usage, preference for COD - Cash on Delivery, peak engagement times like evenings/weekends, and the importance of trust/social proof in Algeria).

**META BLUEPRINT COMPLIANCE:**
Evaluate the account based on Meta Blueprint "Power5" standards. Are they using Broad targeting? Advantage+? Is the account structure consolidated or fragmented?

**KILL OR SCALE: Campaign Breakdown**
*   **SCALE IT 🚀:** Identify the top 1-2 campaigns that are printing money (highest ROAS). Explain exactly WHY they are winning and give an aggressive scaling plan (e.g., "Crank up the budget by 30% now.").
*   **KILL IT 🔪:** Identify the 1-2 worst-performing campaigns that are bleeding money. Be ruthless. Tell the user to pause them immediately and explain why they're failing (e.g., "This campaign has a 1.5x ROAS. You're losing money. Shut it down yesterday.").
    `;

    const cppAnalysisBlock = `
**THE BOTTOM LINE (ROAS DATA UNAVAILABLE):**
ROAS data is missing, so I'm switching to a Cost-Per-Purchase (CPP) analysis. The game is about acquiring customers as cheaply as possible. Your average CPP is **${summary.avgCPP.toFixed(2)} ${summary.currency}**. Let's see who's efficient and who's just burning cash.

**ALGERIAN MARKET CONTEXT 🇩🇿:**
Provide specific insights for the Algerian market. Mention common behaviors (e.g., high mobile usage, preference for COD - Cash on Delivery, peak engagement times like evenings/weekends, and the importance of trust/social proof in Algeria).

**META BLUEPRINT COMPLIANCE:**
Evaluate the account based on Meta Blueprint "Power5" standards. Are they using Broad targeting? Advantage+? Is the account structure consolidated or fragmented?

**KILL OR SCALE: Campaign Breakdown**
*   **SCALE IT 🚀:** Identify the top 1-2 campaigns with the **LOWEST CPP**. These are your most efficient customer acquisition machines. Explain why they're working (likely a winning combo of creative and audience) and how to scale them.
*   **KILL IT 🔪:** Identify the 1-2 campaigns with the **HIGHEST CPP** or those spending significant money with zero purchases. These are budget vampires. Tell the user to kill them immediately.
    `;
    
    const deepDiveBlock = `
**STRATEGIC OVERVIEW & UNTAPPED OPPORTUNITIES:**
Go beyond the immediate data. Based on the patterns you see (winning audiences, successful campaign types, goals), what is the overarching strategic direction this ad account should take over the next quarter?
*   **Funnel Health Check:** Analyze the spend distribution across goals (Awareness, Consideration, Conversion). Is it balanced? Are they investing enough in top-of-funnel to feed their retargeting? Provide specific recommendations.
*   **Creative Angle Mastery:** Based on the creative angle analysis, what is the 'big idea' behind the ads that are working? How can they double down on this theme in future ads?
*   **Hidden Gem:** Identify one non-obvious but potentially high-impact opportunity based on a subtle pattern in the data. (e.g., "Your 'Awareness' campaign has a surprisingly low CPC; you should test a retargeting layer for users who engaged with these ads.")

**PREDICTIVE OUTLOOK & BUDGET SIMULATION:**
*   **Forecast:** Based on recent performance trends, project the potential results (Spend, Purchases, ROAS) for the next 30 days if they continue on this path.
*   **Optimal Budget Allocation:** If you were given an extra €100/day, where would you allocate it for maximum impact? Be specific about campaigns and expected returns.
    `;
    
    const anomalyBlock = `
**ANOMALY ALERTS ⚠️:**
My system has flagged the following campaigns for unusual performance. Pay special attention to these. A positive anomaly (📈) is a massive opportunity to scale. A negative one (📉) is a fire that needs to be put out immediately.
${JSON.stringify(campaignsWithAnomalies, (key, value) => typeof value === 'number' ? value.toFixed(2) : value, 2)}
    `;

    const prompt = `
        You are 'THE WOLF OF ADS', the world's greatest media buyer, known for turning ad spend into massive profits. Your advice is direct, brutally honest, and hyper-focused on scaling what works and killing what doesn't. You don't waste time on vanity metrics. You care about efficiency and profit.

        Analyze the following Meta Ads campaign data like a top-tier performance marketer. The currency is likely EUR based on the export.

        **Overall Summary:**
        ${JSON.stringify(summary, (key, value) => typeof value === 'number' ? value.toFixed(2) : value, 2)}
        
        ${campaignsWithAnomalies.length > 0 ? anomalyBlock : ''}

        **Performance by Campaign (Full Data):**
        ${JSON.stringify(campaigns, (key, value) => { if (key !== 'anomalies') return typeof value === 'number' ? value.toFixed(2) : value; }, 2)}

        Provide your analysis in aggressive, actionable Markdown format. Use this structure:

        ${hasRoasData ? roasAnalysisBlock : cppAnalysisBlock}

        ${hasAudienceData ? `
        **GOLDMINE AUDIENCES:**
        This is where the real money is made.
        *   **Winning Audiences:** Pinpoint the exact audiences with the highest ROAS (or lowest CPP if ROAS is unavailable). Tell the user to double down on these.
        *   **Loser Audiences:** Pinpoint the audiences that are a waste of money. Tell the user to stop targeting them.
        *   **Alpha Insight:** Provide a key insight about their audiences. Are retargeting audiences carrying all the weight? Is a specific prospecting audience showing potential?
        ` : ''}

        ${isThinkingMode ? deepDiveBlock : ''}

        **IMMEDIATE ACTION PLAN (Your Roadmap to Profit):**
        Give a numbered list of 3-5 high-impact, immediate actions. This is a direct order list. Address any detected anomalies in your plan.
        1.  **Budget Reallocation:** Be specific. "ACTION: Pause [Campaign X] immediately. Reallocate its entire daily budget to [Campaign Y] and [Campaign Z], splitting it 50/50."
        2.  **Audience & Targeting:** Be precise. "ACTION: The '[Audience Name]' is your goldmine. Create a new ad set targeting a 1% Lookalike Audience in your primary market based on these converters. Exclude recent purchasers."
        3.  **Creative Testing:** Give a clear testing instruction. "ACTION: The creative in your winning campaigns is working. Duplicate the ads from [Campaign Y] into a new ad set targeting your best Lookalike audience. Don't change a thing."
        4.  **Kill a Loser:** Reiterate the need to cut losses. "ACTION: I already told you to kill [Campaign X]. If you haven't done it yet, do it now. Stop wasting money."

        Your tone must be confident, expert, and laser-focused on maximizing profit. No fluff. Just actionable, money-making advice.
        
        IMPORTANT: Your entire response, including all titles and content, MUST be in ${languageName}.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: config
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get recommendations from AI. Please check the API key and try again.");
    }
};
