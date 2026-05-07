
import { AnalysisSummary } from '../types';

const DANGER_COLOR = '#e53e3e';
const SUCCESS_COLOR = '#38a169';
const TITLE_COLOR = '#63b3ed';
const BG_COLOR = '#1a202c';
const CARD_COLOR = '#2d3748';
const TEXT_COLOR = '#e2e8f0';
const BORDER_COLOR = '#4a5568';

const processLine = (line: string): string => {
    let styledLine = line;

    // Remove markdown-style bolding for HTML processing
    styledLine = styledLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Color-code specific keywords
    if (line.includes('KILL IT') || line.includes('🔪')) {
        return `<span style="color: ${DANGER_COLOR};">${styledLine}</span>`;
    }
    if (line.includes('SCALE IT') || line.includes('🚀')) {
        return `<span style="color: ${SUCCESS_COLOR};">${styledLine}</span>`;
    }
    return styledLine;
};

export const generateEmailHtml = (recommendations: string, summary: AnalysisSummary, attachmentNote: string): string => {
    const sections: { [key: string]: string[] } = {};
    let currentSection = 'Introduction';
    sections[currentSection] = [];

    recommendations.split('\n').forEach(line => {
        if (line.startsWith('**') && line.endsWith('**')) {
            currentSection = line.replace(/\*\*/g, '');
            sections[currentSection] = [];
        } else if (line.trim() !== '') {
            sections[currentSection].push(line);
        }
    });

    let htmlSections = '';
    for (const title in sections) {
        if (sections[title].length > 0) {
            htmlSections += `
                <h3 style="color: ${TITLE_COLOR}; border-bottom: 1px solid ${BORDER_COLOR}; padding-bottom: 8px; margin-top: 24px;">${title}</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    ${sections[title].map(line => `<li style="padding: 4px 0;">${processLine(line)}</li>`).join('')}
                </ul>
            `;
        }
    }
    
    const attachmentNoteHtml = attachmentNote ? `
        <p style="font-style: italic; color: #a0aec0; margin-top: 24px; border-top: 1px solid ${BORDER_COLOR}; paddingTop: 16px;">${attachmentNote}</p>
    ` : '';


    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meta Ads Performance Analysis Report</title>
    </head>
    <body style="background-color: ${BG_COLOR}; color: ${TEXT_COLOR}; font-family: Arial, sans-serif; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="20" style="background-color: ${CARD_COLOR}; border-radius: 8px;">
                        <tr>
                            <td>
                                <h1 style="color: #ffffff; text-align: center;">Meta Ads Performance Report</h1>
                                <h2 style="color: ${TITLE_COLOR}; border-bottom: 1px solid ${BORDER_COLOR}; padding-bottom: 8px;">Overall Performance Summary</h2>
                                <p><strong>Total Ad Spend:</strong> €${summary.totalSpend.toFixed(2)}</p>
                                <p><strong>Overall ROAS:</strong> <span style="font-weight: bold; color: ${summary.overallROAS >= 3 ? SUCCESS_COLOR : DANGER_COLOR};">${summary.overallROAS.toFixed(2)}x</span></p>
                                <p><strong>Total Purchases:</strong> ${summary.totalPurchases.toLocaleString()}</p>
                                
                                ${htmlSections}
                                
                                ${attachmentNoteHtml}

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};
