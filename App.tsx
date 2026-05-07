
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KpiCard } from './components/KpiCard';
import { Campaign, AnalysisSummary, DailyDataPoint, CreativeAnglePerformance, ProcessedData } from './types';
import { parseAndProcessData } from './utils/dataProcessor';
import { getRecommendations } from './services/geminiService';
import { DollarSignIcon, TargetIcon, EyeIcon, PointerIcon, UsersIcon, UploadIcon, SendIcon, NetworkIntelligenceIcon, AlertTriangleIcon } from './components/icons';
import { Sparkles, Brain, Search, Globe, LayoutDashboard, FileText, Zap, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateEmailHtml } from './utils/emailGenerator';
import { translations } from './i18n/translations';
import { CampaignTable } from './components/CampaignTable';
import { SpendTreemap } from './components/SpendTreemap';
import { GoalPerformanceTable } from './components/GoalPerformanceTable';
import { TrendChart } from './components/TrendChart';
import { CreativeAngleTable } from './components/CreativeAngleTable';
import { BlueprintCard } from './components/BlueprintCard';
import { BudgetPacing } from './components/BudgetPacing';
import { ScalingSimulator } from './components/ScalingSimulator';
import { StrategicPlan } from './components/StrategicPlan';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

type Language = 'en' | 'fr' | 'ar';

const App: React.FC = () => {
    const [csvData, setCsvData] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [recommendations, setRecommendations] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [language, setLanguage] = useState<Language>('fr');
    const [isThinkingMode, setIsThinkingMode] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isMetaConnected, setIsMetaConnected] = useState<boolean>(false);
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>('');
    const [isFetchingMeta, setIsFetchingMeta] = useState<boolean>(false);
    const [isConnectingMeta, setIsConnectingMeta] = useState<boolean>(false);
    const [user, setUser] = useState<{ email: string | null; name: string | null; isLoggedIn: boolean }>({ email: null, name: null, isLoggedIn: false });
    const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);

    const t = useMemo(() => translations[language], [language]);

    useEffect(() => {
        checkUserSession();
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'META_AUTH_SUCCESS') {
                setIsMetaConnected(true);
                fetchAdAccounts();
            }
            if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                checkUserSession();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const checkUserSession = async () => {
        try {
            const response = await fetch('/api/user/me');
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error("Failed to fetch user session:", error);
        }
    };

    const handleConnectGoogle = async () => {
        setIsConnectingGoogle(true);
        try {
            const response = await fetch('/api/auth/google/url');
            const { url } = await response.json();
            window.open(url, 'google_auth', 'width=600,height=700');
        } catch (error) {
            console.error("Failed to get Google auth URL:", error);
        } finally {
            setIsConnectingGoogle(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/user/logout', { method: 'POST' });
            setUser({ email: null, name: null, isLoggedIn: false });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const fetchAdAccounts = async () => {
        try {
            const response = await fetch('/api/meta/ad-accounts');
            if (response.ok) {
                const data = await response.json();
                setAdAccounts(data.data || []);
                setIsMetaConnected(true);
            }
        } catch (error) {
            console.error("Failed to fetch ad accounts:", error);
        }
    };

    const handleConnectMeta = async () => {
        setIsConnectingMeta(true);
        try {
            const response = await fetch('/api/auth/meta/url');
            const { url } = await response.json();
            window.open(url, 'meta_auth', 'width=600,height=700');
        } catch (error) {
            console.error("Failed to get Meta auth URL:", error);
        } finally {
            setIsConnectingMeta(false);
        }
    };

    const handleDisconnectMeta = () => {
        setIsMetaConnected(false);
        setAdAccounts([]);
        setSelectedAdAccountId('');
    };

    const handleFetchMetaCampaigns = async () => {
        if (!selectedAdAccountId) return;
        setIsFetchingMeta(true);
        setError('');
        try {
            const response = await fetch(`/api/meta/campaign-data?adAccountId=${selectedAdAccountId}`);
            if (!response.ok) throw new Error("Failed to fetch campaign data");
            const { campaigns } = await response.json();
            
            // For real data, we generate dummy daily data for visualization
            const dummyDailyData: DailyDataPoint[] = Array.from({ length: 30 }, (_, i) => {
                const spend = campaigns.reduce((acc: number, c: any) => acc + c.spend, 0) / 30;
                const revenue = campaigns.reduce((acc: number, c: any) => acc + c.revenue, 0) / 30;
                return {
                    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    spend,
                    purchases: campaigns.reduce((acc: number, c: any) => acc + c.purchases, 0) / 30,
                    roas: spend > 0 ? revenue / spend : 0,
                };
            });

            const totalSpend = campaigns.reduce((acc: number, c: any) => acc + c.spend, 0);
            const totalImpressions = campaigns.reduce((acc: number, c: any) => acc + c.impressions, 0);
            const totalClicks = campaigns.reduce((acc: number, c: any) => acc + c.clicks, 0);
            const totalPurchases = campaigns.reduce((acc: number, c: any) => acc + c.purchases, 0);
            const totalRevenue = campaigns.reduce((acc: number, c: any) => acc + c.revenue, 0);

            const summary: AnalysisSummary = {
                totalSpend,
                totalImpressions,
                totalClicks,
                totalPurchases,
                overallROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
                avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
                avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
                avgCPM: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
                avgCPP: totalPurchases > 0 ? totalSpend / totalPurchases : 0,
                currency: 'EUR',
            };

            setProcessedData({
                campaigns,
                summary,
                dailyData: dummyDailyData,
                creativeAngles: [],
                autoRules: [],
                blueprint: { score: 75, checks: [] }
            });

            // Get AI recommendations
            const aiRecs = await getRecommendations(campaigns, summary, language, isThinkingMode);
            setRecommendations(aiRecs);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsFetchingMeta(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    setCsvData(text);
                    setError('');
                } else {
                    setError(t.errorFileRead);
                }
            };
            reader.onerror = () => {
                setError(t.errorFileRead2);
            };
            reader.readAsText(file);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!csvData.trim()) {
            setError(t.errorNoData);
            return;
        }
        setIsLoading(true);
        setError('');
        setRecommendations('');
        setProcessedData(null);

        try {
            const data = parseAndProcessData(csvData);
            setProcessedData(data);

            const aiRecommendations = await getRecommendations(data.campaigns, data.summary, language, isThinkingMode);
            setRecommendations(aiRecommendations);

        } catch (e: any) {
            setError(`${t.errorAnalysisFailed} ${e.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [csvData, language, t, isThinkingMode]);

    const exampleCSV = `
"Day","Campaign Name","Ad Set Name","Ad Name","Impressions","Link Clicks","Amount Spent (EUR)","Purchase ROAS (return on ad spend)","Purchases"
2025-12-19,"CONV - ProLaunch Max","Lookalike Audience 1% - FR","VIDEO_UGC_BestFeature",8000,320,50.00,4.5,5
2025-12-19,"CONV - ProLaunch Max","Retargeting 7d","IMAGE_Testimonial_1",5000,250,35.00,6.2,7
2025-12-19,"AWA - Winter Sale","Broad Audience - All","VIDEO_BrandStory",25000,250,40.00,0,0
2025-12-19,"CONS - Ebook Download","Interest: Marketing","CAROUSEL_Benefits",12000,480,30.00,0,1
2025-12-20,"CONV - ProLaunch Max","Lookalike Audience 1% - FR","VIDEO_UGC_BestFeature",8200,330,52.00,4.8,6
2025-12-20,"CONV - ProLaunch Max","Retargeting 7d","IMAGE_Testimonial_1",5100,260,36.00,6.5,8
2025-12-20,"AWA - Winter Sale","Broad Audience - All","VIDEO_BrandStory",26000,270,42.00,0,0
2025-12-20,"CONS - Ebook Download","Interest: Marketing","CAROUSEL_Benefits",12500,500,32.00,1.2,1
2025-12-21,"CONV - ProLaunch Max","Lookalike Audience 1% - FR","VIDEO_UGC_BestFeature",7900,310,48.00,4.2,4
2025-12-21,"CONV - ProLaunch Max","Retargeting 7d","IMAGE_Testimonial_1",5500,280,38.00,6.0,7
2025-12-21,"AWA - Winter Sale","Broad Audience - All","VIDEO_BrandStory",24000,240,39.00,0.5,0
2025-12-21,"CONS - Ebook Download","Interest: Marketing","CAROUSEL_Benefits",13000,510,33.00,0,0
2025-12-21,"CONV - Legacy Product","Interest: Old Customers","IMAGE_Static_Ad",4000,50,25.00,0.8,1
`;

    const handleUseExample = () => {
        setCsvData(exampleCSV);
        setFileName('export_meta_ads_daily_fr.csv');
        setError('');
    };
    
    const audiencePerformance = useMemo(() => {
        if (!processedData) return [];
        const audienceMap = new Map<string, { totalSpend: number; totalPurchases: number; totalRevenue: number }>();
        
        // This logic is now simplified as we don't need to re-parse
        const tempCampaignMap = new Map<string, { spend: number, purchases: number, revenue: number }>();
        processedData.campaigns.forEach(campaign => {
            // This is a simplification; a more accurate way would be to re-process the raw data by audience
            const stats = tempCampaignMap.get(campaign.audience) || { spend: 0, purchases: 0, revenue: 0 };
            stats.spend += campaign.spend;
            stats.purchases += campaign.purchases;
            stats.revenue += campaign.spend * campaign.roas;
            tempCampaignMap.set(campaign.audience, stats);
        });

        const performanceData = Array.from(tempCampaignMap.entries()).map(([audience, stats]) => ({
            audience,
            roas: stats.spend > 0 ? stats.revenue / stats.spend : 0,
            cpp: stats.purchases > 0 ? stats.spend / stats.purchases : 0,
            spend: stats.spend
        }));
        
        if (processedData.summary.overallROAS < 0.01) {
            return performanceData.filter(a => a.cpp > 0).sort((a, b) => a.cpp - b.cpp);
        }
        return performanceData.sort((a, b) => b.roas - a.roas);

    }, [processedData]);

    const bestAudience = useMemo(() => {
        if (audiencePerformance.length === 0 || !processedData) return { name: 'N/A', value: 'N/A' };
        const topAudience = audiencePerformance[0];
        const currency = processedData.summary.currency;
        if (processedData.summary.overallROAS < 0.01) {
             return { name: topAudience.audience, value: `${currency === 'DZD' ? '' : '€'}${topAudience.cpp.toFixed(2)} ${currency === 'DZD' ? 'دج' : 'CPP'}` };
        }
        return { name: topAudience.audience, value: `${topAudience.roas.toFixed(2)}x ROAS` };
    }, [audiencePerformance, processedData]);
    
    const totalAnomalies = useMemo(() => processedData?.campaigns.reduce((acc, c) => acc + (c.anomalies?.length || 0), 0) || 0, [processedData]);

    const handleGenerateAndSendReport = async () => {
        if (!processedData || !recommendations) return;
        setIsExporting(true);
        setError('');

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let yPos = margin;

            doc.setTextColor('#e2e8f0');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text(t.title, pdfWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            const addCanvasToPdf = async (elementId: string, currentY: number) => {
                 const element = document.getElementById(elementId);
                 if (element) {
                    const canvas = await html2canvas(element, { backgroundColor: '#1f2937', scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const imgHeight = (canvas.height * (pdfWidth - margin * 2)) / canvas.width;
                    if (doc.internal.pageSize.getHeight() - currentY < imgHeight) {
                        doc.addPage();
                        currentY = margin;
                    }
                    doc.addImage(imgData, 'PNG', margin, currentY, pdfWidth - margin * 2, imgHeight);
                    return currentY + imgHeight + 10;
                 }
                 return currentY;
            }

            yPos = await addCanvasToPdf('kpi-container', yPos);
            
            autoTable(doc, {
                startY: yPos,
                html: '#campaign-table-for-export',
                theme: 'grid',
                headStyles: { fillColor: [41, 51, 65] },
                styles: { textColor: [226, 232, 240], cellPadding: 2, fontSize: 8 },
                didDrawPage: (data: any) => { yPos = data.cursor.y; }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;

            yPos = await addCanvasToPdf('temporal-analysis-container', yPos);
            yPos = await addCanvasToPdf('auto-rules-container', yPos);
            yPos = await addCanvasToPdf('goal-performance-container', yPos);
            yPos = await addCanvasToPdf('creative-angle-container', yPos);
            
            const treemapEl = document.getElementById('treemap-container');
            const audienceEl = document.getElementById('audience-chart-container');
            if (treemapEl && audienceEl) {
                if (doc.internal.pageSize.getHeight() - yPos < 100) { doc.addPage(); yPos = margin; }
                const treemapCanvas = await html2canvas(treemapEl, { backgroundColor: '#1f2937', scale: 2 });
                const audienceCanvas = await html2canvas(audienceEl, { backgroundColor: '#1f2937', scale: 2 });
                const vizWidth = (pdfWidth - margin * 3) / 2;
                const treemapImgHeight = (treemapCanvas.height * vizWidth) / treemapCanvas.width;
                const audienceImgHeight = (audienceCanvas.height * vizWidth) / audienceCanvas.width;
                doc.addImage(treemapCanvas.toDataURL('image/png'), 'PNG', margin, yPos, vizWidth, treemapImgHeight);
                doc.addImage(audienceCanvas.toDataURL('image/png'), 'PNG', margin + vizWidth + 5, yPos, vizWidth, audienceImgHeight);
                yPos += Math.max(treemapImgHeight, audienceImgHeight) + 10;
            }
            
            yPos = await addCanvasToPdf('recommendations-container', yPos);
            
            doc.save('meta-ads-report.pdf');

            const emailBody = generateEmailHtml(recommendations, processedData.summary, t.emailAttachmentNote);
            window.location.href = `mailto:?subject=${encodeURIComponent("Meta Ads Performance Analysis Report")}&body=${encodeURIComponent(emailBody)}`;

        } catch (err: any) {
            console.error("Report generation failed:", err);
            setError(`PDF export failed. Please try again. Error: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const { campaigns, summary, dailyData, creativeAngles, autoRules, blueprint } = processedData || {};

    return (
        <div className="min-h-screen bg-[#F0F2F5] text-gray-900 font-sans selection:bg-blue-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm p-4 sticky top-0 z-40">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <motion.div 
                            whileHover={{ rotate: 10 }}
                            className="bg-gradient-to-br from-[#0064E0] to-[#00A1FF] p-2.5 rounded-xl shadow-lg shadow-blue-200/50"
                        >
                            <TargetIcon className="text-white w-6 h-6" />
                        </motion.div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                {t.title}
                                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-[#0064E0] text-[10px] font-bold rounded-full border border-blue-100">PRO</span>
                            </h1>
                            {processedData && (
                                <div className="flex items-center space-x-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t.blueprintScoreLabel}:</span>
                                    <div className="flex items-center">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${processedData.blueprint.score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full ${processedData.blueprint.score >= 70 ? 'bg-green-500' : processedData.blueprint.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                            ></motion.div>
                                        </div>
                                        <span className={`ml-2 text-xs font-bold ${processedData.blueprint.score >= 70 ? 'text-green-600' : processedData.blueprint.score >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                                            {processedData.blueprint.score}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                     <div className="flex items-center space-x-4">
                        {!user.isLoggedIn ? (
                            <button 
                                onClick={handleConnectGoogle}
                                disabled={isConnectingGoogle}
                                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"
                            >
                                {isConnectingGoogle ? <Zap className="animate-spin h-4 w-4" /> : <Globe className="w-4 h-4 text-red-500" />}
                                <span>{t.connectGoogleButton}</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <div className="hidden sm:flex flex-col items-end text-right">
                                    <span className="text-xs font-black text-gray-900">{user.name}</span>
                                    <span className="text-[10px] text-gray-400 font-bold">{user.email}</span>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                    title={t.logout}
                                >
                                    <Info className="w-5 h-5 rotate-180" />
                                </button>
                            </div>
                        )}
                        <div className="hidden md:flex items-center space-x-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                            {(['fr', 'en', 'ar'] as Language[]).map(lang => (
                                <button 
                                    key={lang} 
                                    onClick={() => setLanguage(lang)} 
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${language === lang ? 'bg-white text-[#0064E0] shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        {processedData && (
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGenerateAndSendReport} 
                                disabled={isExporting} 
                                className="hidden sm:flex items-center space-x-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-200/50 active:scale-95 disabled:opacity-50"
                            >
                                {isExporting ? <Zap className="animate-pulse h-4 w-4" /> : <SendIcon className="w-4 h-4" />}
                                <span>{isExporting ? t.generatingReportButton : t.generateAndSendButton}</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <AnimatePresence mode="wait">
                    {!user.isLoggedIn ? (
                        <motion.div 
                            key="login-prompt"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 text-center"
                        >
                            <div className="inline-block p-6 bg-red-50 rounded-3xl mb-8">
                                <Globe className="w-12 h-12 text-red-600" />
                            </div>
                            <h2 className="text-3xl font-black mb-4 text-gray-900">{(t as any).loginRequired}</h2>
                            <p className="text-gray-500 font-medium mb-10">{(t as any).loginDescription}</p>
                            <button 
                                onClick={handleConnectGoogle}
                                disabled={isConnectingGoogle}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-xl shadow-red-100 transition-all flex items-center justify-center space-x-3 active:scale-95"
                            >
                                {isConnectingGoogle ? <Zap className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                <span className="text-lg">{t.connectGoogleButton}</span>
                            </button>
                        </motion.div>
                    ) : !processedData ? (
                        <motion.div 
                            key="upload"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200 overflow-hidden mb-8"
                        >
                            <div className="p-8 md:p-16">
                                <div className="max-w-3xl mx-auto text-center mb-12">
                                    <motion.div 
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="inline-block p-4 bg-blue-50 rounded-3xl mb-6"
                                    >
                                        <LayoutDashboard className="w-12 h-12 text-[#0064E0]" />
                                    </motion.div>
                                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 tracking-tight">{t.uploadTitle}</h2>
                                    <p className="text-xl text-gray-500 font-medium leading-relaxed">Transformez vos exports Meta Ads en insights stratégiques actionnables avec notre IA spécialisée.</p>
                                </div>
                                
                                <div className="max-w-4xl mx-auto space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* CSV Upload */}
                                        <label htmlFor="csv-upload" className="relative flex flex-col items-center justify-center w-full h-80 border-2 border-gray-200 border-dashed rounded-3xl cursor-pointer bg-gray-50 hover:bg-blue-50/30 hover:border-[#0064E0]/30 transition-all group overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative flex flex-col items-center justify-center pt-5 pb-6 text-center z-10">
                                                <motion.div 
                                                    whileHover={{ y: -5 }}
                                                    className="bg-white p-6 rounded-2xl shadow-xl mb-8 group-hover:scale-110 transition-all duration-300"
                                                >
                                                    <UploadIcon className="text-[#0064E0] w-14 h-14" />
                                                </motion.div>
                                                {fileName ? ( 
                                                    <motion.div 
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="bg-green-50 text-green-700 px-8 py-4 rounded-2xl font-bold flex items-center space-x-4 border border-green-100 shadow-sm"
                                                    >
                                                        <ShieldCheck className="w-6 h-6 text-green-500" />
                                                        <span className="text-xl">{fileName}</span>
                                                    </motion.div>
                                                ) : (
                                                    <>
                                                        <p className="mb-4 text-2xl text-gray-800 font-black tracking-tight">{t.uploadClick} <span className="text-[#0064E0]">{t.uploadDrag}</span></p>
                                                        <p className="text-base text-gray-400 font-medium max-w-sm mx-auto">{t.uploadHint}</p>
                                                    </>
                                                )}
                                            </div>
                                            <input id="csv-upload" type="file" className="hidden" accept=".csv, text/csv" onChange={handleFileChange} />
                                        </label>

                                        {/* Meta API Connect */}
                                        <div className="relative flex flex-col items-center justify-center w-full h-80 border-2 border-gray-200 border-dashed rounded-3xl bg-gray-50 p-8 text-center space-y-6">
                                            <div className="bg-white p-6 rounded-2xl shadow-xl">
                                                <Globe className="text-blue-600 w-14 h-14" />
                                            </div>
                                            
                                            {!isMetaConnected ? (
                                                <>
                                                    <div>
                                                        <p className="text-2xl text-gray-800 font-black tracking-tight">{t.connectMetaButton}</p>
                                                        <p className="text-base text-gray-400 font-medium mt-2">{t.strategicBenchmarkingLabel}</p>
                                                    </div>
                                                    <button 
                                                        onClick={handleConnectMeta}
                                                        disabled={isConnectingMeta}
                                                        className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-100 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isConnectingMeta ? <Zap className="animate-spin w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                                        <span>{isConnectingMeta ? t.connectingMeta : t.connectMetaButton}</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-green-600 font-bold flex items-center gap-2">
                                                            <ShieldCheck className="w-5 h-5" />
                                                            {t.metaConnected}
                                                        </p>
                                                        <button 
                                                            onClick={handleDisconnectMeta}
                                                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                                                        >
                                                            {language === 'ar' ? 'قطع الاتصال' : (language === 'fr' ? 'Déconnecter' : 'Disconnect')}
                                                        </button>
                                                    </div>
                                                    <select 
                                                        value={selectedAdAccountId}
                                                        onChange={(e) => setSelectedAdAccountId(e.target.value)}
                                                        className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 shadow-sm"
                                                    >
                                                        <option value="">{t.selectAdAccount}</option>
                                                        {adAccounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.account_id})</option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={handleFetchMetaCampaigns}
                                                        disabled={isFetchingMeta || !selectedAdAccountId}
                                                        className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
                                                    >
                                                        {isFetchingMeta ? <Zap className="animate-spin w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                                        <span>{isFetchingMeta ? t.fetchingData : t.fetchDataButton}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between mt-12 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                        <div className="flex items-center space-x-8 mb-6 md:mb-0">
                                            <div className="flex items-center space-x-4 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div 
                                            onClick={() => setIsThinkingMode(!isThinkingMode)} 
                                            className={`w-12 h-6 flex items-center rounded-full transition-all cursor-pointer ${isThinkingMode ? 'bg-[#0064E0]' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full mx-0.5 shadow-md transform transition-transform ${isThinkingMode ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-sm leading-none">{t.thinkingMode}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{t.deepAnalysisLabel}</span>
                                        </div>
                                    </div>
                                    <button onClick={handleUseExample} className="text-sm font-bold text-gray-500 hover:text-[#0064E0] transition-colors flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                        <span>{t.exampleButton}</span>
                                    </button>
                                </div>
                                
                                <button 
                                    onClick={handleAnalyze} 
                                    disabled={isLoading || !csvData} 
                                    className="w-full md:w-auto px-12 py-4 bg-[#0064E0] hover:bg-[#0054BD] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-xl font-black text-white shadow-xl shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center space-x-4 group"
                                >
                                    {isLoading ? ( 
                                        <><svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="text-lg">{t.analyzingButton}</span></> 
                                    ) : ( 
                                        <>
                                            <NetworkIntelligenceIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                            <span className="text-lg uppercase tracking-wider">{t.analyzeButton}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-50 border-t border-red-100 flex items-center justify-center space-x-3">
                            <AlertTriangleIcon className="text-red-500 w-5 h-5 flex-shrink-0" />
                            <p className="text-red-700 text-sm font-bold">{error}</p>
                        </div>
                    )}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="report"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            id="analysis-report" 
                            className="space-y-10"
                        >
                            <div id="kpi-container" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-1.5 h-8 bg-[#0064E0] rounded-full"></div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.dashboardTitle}</h2>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-blue-50 text-[#0064E0] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100">
                                        <DollarSignIcon className="w-3 h-3" />
                                        <span>{summary.currency} Analysis</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                                    <KpiCard 
                                        title={t.kpiSpend} 
                                        value={`${summary.currency === 'DZD' ? '' : '€'}${summary.totalSpend.toLocaleString()} ${summary.currency === 'DZD' ? 'دج' : ''}`} 
                                        icon={<Zap className="w-6 h-6" />} 
                                        tooltipText={t.tooltipKpiSpend} 
                                    />
                                    {summary.overallROAS > 0.01 ? 
                                        <KpiCard title={t.kpiRoas} value={`${summary.overallROAS.toFixed(2)}x`} icon={<TrendingUp className="w-6 h-6" />} tooltipText={t.tooltipKpiRoas} /> : 
                                        <KpiCard 
                                            title={t.kpiCpp} 
                                            value={`${summary.currency === 'DZD' ? '' : '€'}${summary.avgCPP.toFixed(2)} ${summary.currency === 'DZD' ? 'دج' : ''}`} 
                                            icon={<TargetIcon />} 
                                            tooltipText={t.tooltipKpiCpp} 
                                        /> 
                                    }
                                    {audiencePerformance.length > 0 && <KpiCard title={t.kpiAudience} value={bestAudience.name} subValue={bestAudience.value} icon={<UsersIcon />} tooltipText={t.tooltipKpiAudience} />}
                                    {totalAnomalies > 0 && <KpiCard title={t.kpiAnomalies} value={totalAnomalies.toString()} icon={<AlertTriangleIcon />} tooltipText={t.tooltipKpiAnomalies} />}
                                    <KpiCard title={t.kpiImpressions} value={summary.totalImpressions.toLocaleString()} icon={<EyeIcon />} tooltipText={t.tooltipKpiImpressions} />
                                    <KpiCard title={t.kpiClicks} value={summary.totalClicks.toLocaleString()} icon={<PointerIcon />} tooltipText={t.tooltipKpiClicks} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {summary && dailyData && <BudgetPacing summary={summary} dailyData={dailyData} language={language} />}
                                {summary && <ScalingSimulator summary={summary} language={language} />}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-8">
                                <CampaignTable campaigns={campaigns} translations={t} />
                            </div>
                            <div className="lg:col-span-4 space-y-10">
                                {blueprint && <BlueprintCard blueprint={blueprint} language={language} />}
                                {campaigns && autoRules && <StrategicPlan campaigns={campaigns} autoRules={autoRules} language={language} />}
                            </div>
                        </div>
                        
                        <div id="temporal-analysis-container" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <TrendChart data={dailyData} translations={t} language={language} />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                           <div id="goal-performance-container" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"><GoalPerformanceTable campaigns={campaigns} translations={t} /></div>
                           <div id="creative-angle-container" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"><CreativeAngleTable creativeAngles={creativeAngles} translations={t} /></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                           <div id="treemap-container" className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 p-8"><SpendTreemap data={campaigns} translations={t} /></div>
                           <div id="audience-chart-container" className="lg:col-span-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                                <h3 className="text-xl font-black mb-10 text-gray-900 tracking-tight">{t.chartAudienceTitle}</h3>
                                 <ResponsiveContainer width="100%" height={400}>
                                     <BarChart data={audiencePerformance} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" horizontal={false} />
                                        <XAxis type="number" stroke="#94A3B8" fontSize={10} fontWeight="bold" />
                                        <YAxis type="category" dataKey="audience" stroke="#94A3B8" width={120} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                        <Tooltip 
                                            cursor={{ fill: '#F8FAFC' }}
                                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }} 
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            formatter={(value: number) => value.toFixed(2)} 
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                         {summary.overallROAS > 0.01 ? <Bar dataKey="roas" fill="#0064E0" radius={[0, 6, 6, 0]} name={t.roasLabel} barSize={24} /> : <Bar dataKey="cpp" fill="#4FD1C5" radius={[0, 6, 6, 0]} name={`${t.cppLabel} (€)`} barSize={24} />}
                                     </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {recommendations && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-[#0064E0] to-[#00A8FF] p-8 text-white">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                                                <NetworkIntelligenceIcon className="text-white w-8 h-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black tracking-tight">{t.recommendationsTitle}</h2>
                                                <p className="text-white/80 font-medium mt-1">Intelligence artificielle optimisée pour Meta Blueprint.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleGenerateAndSendReport} 
                                            disabled={isExporting} 
                                            className="w-full md:w-auto px-10 py-4 bg-white text-[#0064E0] hover:bg-blue-50 disabled:bg-white/50 disabled:cursor-wait rounded-xl font-black shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-95"
                                        >
                                            {isExporting ? (
                                                <><svg className="animate-spin h-5 w-5 text-[#0064E0]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>{t.generatingReportButton}</span></>
                                            ) : (
                                                <><SendIcon className="w-5 h-5" /><span>{t.generateAndSendButton}</span></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div id="recommendations-container" className="p-10 prose prose-blue max-w-none text-gray-700 leading-relaxed">
                                    <div className="markdown-body">
                                        <Markdown>{recommendations}</Markdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
             {/* Hidden table for PDF export */}
                {campaigns && (
                    <div className="hidden">
                        <table id="campaign-table-for-export">
                            <thead><tr><th>Campaign</th><th>Spend (€)</th><th>Impressions</th><th>Clicks</th><th>CTR (%)</th><th>CPC (€)</th><th>Purchases</th><th>ROAS</th><th>CPP (€)</th></tr></thead>
                            <tbody>{campaigns.map(c => (<tr key={c.name}><td>{c.name}</td><td>{c.spend.toFixed(2)}</td><td>{c.impressions.toLocaleString()}</td><td>{c.clicks.toLocaleString()}</td><td>{c.ctr.toFixed(2)}</td><td>{c.cpc.toFixed(2)}</td><td>{c.purchases.toLocaleString()}</td><td>{c.roas.toFixed(2)}</td><td>{c.cpp.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
