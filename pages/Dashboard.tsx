
import React from 'react';
import { useStore } from '../context/Store';
import { supabase } from '../utils/supabaseClient';
import { Briefcase, AlertCircle, CheckCircle2, TrendingUp, Clock, CalendarIcon, ChevronRight, Users, FileText, PieChart as PieChartIcon, BarChart3, Newspaper } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label, LabelList } from 'recharts';
import { CaseStatus } from '../types';

const StatCard = ({ title, value, icon: Icon, trend, trendTone, color, accentBorder, subtext, onClick }: any) => {
  const { theme } = useStore();
  const trendClasses =
    trendTone === 'danger'
      ? (theme === 'hybrid' ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400')
      : trend?.startsWith('+')
        ? (theme === 'hybrid' ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
        : (theme === 'hybrid' ? 'bg-[#354751] text-[#e9edef]' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400');

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl shadow-sm border border-l-4 ${accentBorder || 'border-l-blue-500'} hover:shadow-md transition-all duration-200 group ${
        onClick ? 'cursor-pointer' : ''
      } ${
        theme === 'hybrid'
          ? 'bg-[#2a3942] border-y-[#354751] border-r-[#354751] hover:border-y-[#425866] hover:border-r-[#425866]'
          : 'bg-white dark:bg-dark-800 border-y-slate-200 border-r-slate-200 dark:border-y-slate-700 dark:border-r-slate-700'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>{title}</p>
          <h3 className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 group-hover:scale-105 transition-transform`}>
          <Icon size={20} className={theme === 'hybrid' && color.includes('bg-slate') ? 'text-[#aebac1]' : color.replace('bg-', 'text-')} />
        </div>
      </div>
      <div className="mt-3 flex items-center text-xs font-medium">
        {trend && (
          <span className={`px-2 py-0.5 rounded-full ${trendClasses} mr-2`}>
            {trend}
          </span>
        )}
        <span className={`truncate ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>{subtext}</span>
      </div>
    </div>
  );
};

const decodeHTMLEntities = (text: string) => {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

const LegalNewsCard = () => {
  const [news, setNews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { cases, theme } = useStore(); // Just to trigger a re-render if needed, but we'll import supabase below

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/conjur-rss?q=site:conjur.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419');
        
        if (!response.ok) {
          console.error("RSS fetch failed:", response.status, response.statusText);
          return;
        }

        const xmlText = await response.text();
        
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const items = [];
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xmlText)) !== null && count < 6) {
            const itemContent = match[1];

            const titleRaw = itemContent.match(/<title>(.*?)<\/title>/)?.[1] || "";
            const linkRaw = itemContent.match(/<link>(.*?)<\/link>/)?.[1] || "";
            const pubDateRaw = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

            if (titleRaw && linkRaw) {
                // Clean CDATA and whitespace
                let cleanTitle = titleRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
                cleanTitle = cleanTitle.replace(/ - Consultor Jurídico$/, '');
                const cleanLink = linkRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();

                let formattedTime = '';
                if (pubDateRaw) {
                    try {
                        const dateObj = new Date(pubDateRaw);
                        if (!isNaN(dateObj.getTime())) {
                            formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                        }
                    } catch (e) { }
                }

                items.push({
                    title: cleanTitle,
                    link: cleanLink,
                    time: formattedTime || "--:--"
                });
                count++;
            }
        }
        
        setNews(items);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className={`rounded-xl shadow-sm border p-4 md:p-5 flex flex-col overflow-hidden ${
      theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex justify-between items-center mb-3.5">
        <h3 className={`text-base font-bold flex items-center gap-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>
          <Newspaper size={18} className={theme === 'hybrid' ? 'text-[#00a884]' : 'text-primary-500'} /> Notícias Jurídicas
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${theme === 'hybrid' ? 'bg-[#111b21] text-[#aebac1]' : 'bg-slate-100 dark:bg-dark-900 text-slate-400'}`}>ConJur RSS</span>
      </div>

      <div className="space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-slate-400">
            <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${theme === 'hybrid' ? 'border-[#00a884]' : 'border-primary-500'}`}></div>
            <span className="text-sm">Carregando notícias...</span>
          </div>
        ) : news.length > 0 ? (
          news.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block group p-3 -mx-2 rounded-lg transition-all border border-transparent ${
                theme === 'hybrid' 
                  ? 'hover:bg-[#354751] hover:border-[#425866]'
                  : 'hover:bg-slate-50 dark:hover:bg-dark-900/50 hover:border-slate-100 dark:hover:border-slate-800'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium transition-colors leading-snug ${
                    theme === 'hybrid' 
                      ? 'text-[#d1d7db] group-hover:text-[#00a884]' 
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }`}>
                    <span className={`text-[10px] font-bold mr-2 tabular-nums ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>{item.time} —</span>
                    {decodeHTMLEntities(item.title)}
                  </p>
                </div>
                <ChevronRight size={14} className={`transition-all self-center shrink-0 group-hover:translate-x-1 ${theme === 'hybrid' ? 'text-[#aebac1] group-hover:text-[#00a884]' : 'text-slate-300 group-hover:text-primary-400'}`} />
              </div>
            </a>
          ))
        ) : (
          <div className={`text-center py-8 italic text-xs ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>Não foi possível carregar as notícias.</div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC<{ setPage?: (page: string) => void }> = ({ setPage }) => {
  const { theme, isDarkMode, currentUser, setPendingAction, cases, clients, deadlines, appointments } = useStore();

  // --- Metrics Calculation ---
  const activeCases = cases.filter(c => c.status === CaseStatus.Active).length;
  const archivedCases = cases.filter(c => c.status === CaseStatus.Archived).length;
  const totalCasesCount = activeCases + archivedCases;

  const openDeadlines = deadlines.filter(d => !d.isDone && d.status !== 'Canceled');
  const pendingDeadlines = openDeadlines.length;
  const urgentDeadlines = openDeadlines.filter(d => d.priority === 'High').length;

  const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeek = nextWeekDate.toLocaleDateString('en-CA');

  const overdueDeadlinesCount = openDeadlines.filter(d => d.dueDate < today).length;
  const todayDeadlinesCount = openDeadlines.filter(d => d.dueDate === today).length;
  const weekDeadlinesCount = openDeadlines.filter(d => d.dueDate > today && d.dueDate <= nextWeek).length;

  const todayItems = [
    ...openDeadlines.filter(d => d.dueDate === today),
    ...appointments.filter(a => a.date.startsWith(today))
  ].length;
  const totalClients = clients.length;

  // --- Chart 1: Status (Active vs Archived only) ---
  const statusData = [
    { name: 'Ativos', value: activeCases, color: '#3b82f6' }, // Blue
    { name: 'Arquivados', value: archivedCases, color: '#94a3b8' }, // Slate
  ];

  // --- Chart 2: Cases by Area (All areas) ---
  const areaCounts = cases.reduce((acc, curr) => {
    const area = curr.area || 'Outros';
    const currentCount = acc[area] || 0;
    acc[area] = currentCount + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAreasCases = cases.length || 1;
  const areaData = Object.entries(areaCounts)
    .map(([name, value]) => ({
      name,
      value: Number(value),
      label: `${value} (${Math.round((Number(value) / totalAreasCases) * 100)}%)`,
    }))
    .sort((a, b) => b.value - a.value);

  const AREA_COLORS = [
    '#3b82f6',
    '#10b981',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
    '#6366f1',
    '#14b8a6',
    '#f97316',
    '#64748b',
  ];

  const tooltipContentStyle = theme === 'hybrid'
    ? {
        backgroundColor: '#111b21',
        borderRadius: '8px',
        border: '1px solid #354751',
        color: '#e9edef',
        fontSize: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }
    : {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        fontSize: '12px',
        boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.1)'
      };

  // --- Upcoming Deadlines Logic ---
  const upcomingDeadlines = deadlines
    .filter(d => !d.isDone && d.status !== 'Canceled' && d.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 12);

  // --- Recent Activity Logic (Real Data) ---
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 5); // Increased to 5 for better alignment

    return (
        <div className={`animate-fade-in pb-20 relative min-h-full flex flex-col ${theme === 'hybrid' ? 'bg-[#222e35]' : ''}`}>
      {/* Header - Sticky */}
      <div className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
          ? 'bg-[#202c33] border-emerald-500/20'
          : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800'
          }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>Dashboard</h1>
            <p className={`text-sm mt-1 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400'}`}>Bem-vindo(a).</p>
          </div>
          <div className="text-left md:text-right">
            <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>Hoje</p>
            <p className={`text-lg font-bold capitalize leading-tight ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:px-7 pt-4 pb-10 flex-1 flex flex-col">

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <button onClick={() => setPendingAction('newCase')} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-between group transition-all transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg"><Briefcase size={18} /></div>
              <span className="font-bold text-sm">Novo Processo</span>
            </div>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform opacity-80" />
          </button>
          <button onClick={() => setPendingAction('newClient')} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl shadow-md shadow-emerald-500/15 flex items-center justify-between group transition-all transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg"><Users size={18} /></div>
              <span className="font-bold text-sm">Novo Contato</span>
            </div>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform opacity-80" />
          </button>
          <button onClick={() => setPendingAction('newDeadline')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-4 rounded-xl shadow-md shadow-amber-500/15 flex items-center justify-between group transition-all transform hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-lg"><Clock size={18} /></div>
              <span className="font-bold text-sm">Novo Prazo</span>
            </div>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform opacity-80" />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <StatCard
            title="Processos Ativos"
            value={activeCases}
            icon={Briefcase}
            trend="Carteira"
            color="bg-blue-500 text-blue-600"
            accentBorder="border-l-blue-500"
            subtext="Em andamento"
            onClick={() => setPage?.('cases')}
          />
          <StatCard
            title="Prazos Pendentes"
            value={pendingDeadlines}
            icon={AlertCircle}
            trend={overdueDeadlinesCount > 0 ? `${overdueDeadlinesCount} Atrasados` : (urgentDeadlines > 0 ? `${urgentDeadlines} Urgentes` : 'Em dia')}
            trendTone={overdueDeadlinesCount > 0 ? 'danger' : undefined}
            color={overdueDeadlinesCount > 0 ? 'bg-rose-500 text-rose-600' : 'bg-amber-500 text-amber-600'}
            accentBorder={overdueDeadlinesCount > 0 ? 'border-l-rose-500' : 'border-l-amber-500'}
            subtext={todayDeadlinesCount > 0 ? `${todayDeadlinesCount} vencem hoje` : 'Próximos dias'}
            onClick={() => setPage?.('deadlines')}
          />
          <StatCard
            title="Calendário Hoje"
            value={todayItems}
            icon={CalendarIcon}
            trend={todayItems > 0 ? 'Ocupado' : 'Livre'}
            color="bg-purple-500 text-purple-600"
            accentBorder="border-l-purple-500"
            subtext="Compromissos e Prazos"
            onClick={() => setPage?.('calendario')}
          />
          <StatCard
            title="Total de Contatos"
            value={totalClients}
            icon={Users}
            trend="Base"
            color="bg-emerald-500 text-emerald-600"
            accentBorder="border-l-emerald-500"
            subtext="Clientes e partes"
            onClick={() => setPage?.('clients')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Center Column (Charts & Activity) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Chart 1: Status Distribution */}
              <div className={`rounded-xl shadow-sm border p-4 md:p-5 flex flex-col ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>
                    <PieChartIcon size={16} className={theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'} /> Status dos Processos
                  </h3>
                </div>
                <div className="h-52 w-full my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="48%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label
                          content={({ viewBox }: any) => {
                            const { cx, cy } = viewBox;
                            return (
                              <g>
                                <text
                                  x={cx}
                                  y={cy - 10}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  className={`font-bold ${theme === 'hybrid' ? 'fill-[#e9edef]' : 'fill-slate-900 dark:fill-white'}`}
                                  style={{ fontSize: '26px' }}
                                >
                                  {totalCasesCount}
                                </text>
                                <text
                                  x={cx}
                                  y={cy + 15}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  className={`font-semibold ${theme === 'hybrid' ? 'fill-[#aebac1]' : 'fill-slate-400'}`}
                                  style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                >
                                  Total
                                </text>
                              </g>
                            );
                          }}
                        />
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={{ color: theme === 'hybrid' ? '#e9edef' : '#0f172a' }}
                        formatter={(value: any, name: any) => {
                          const pct = totalCasesCount > 0 ? Math.round((Number(value) / totalCasesCount) * 100) : 0;
                          return [`${value} (${pct}%)`, name];
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        iconType="circle"
                        formatter={(value: string) => {
                          const item = statusData.find(d => d.name === value);
                          const val = item ? item.value : 0;
                          const pct = totalCasesCount > 0 ? Math.round((val / totalCasesCount) * 100) : 0;
                          return (
                            <span className={`text-[11px] font-semibold ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-600 dark:text-slate-400'}`}>
                              {value} ({val} • {pct}%)
                            </span>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Areas Distribution (All Areas Horizontal Bar Chart) */}
              <div className={`rounded-xl shadow-sm border p-4 md:p-5 flex flex-col ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>
                    <BarChart3 size={16} className={theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'} /> Áreas ({areaData.length})
                  </h3>
                </div>
                <div className="w-full" style={{ height: Math.max(208, areaData.length * 25) }}>
                  {areaData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={areaData}
                        layout="vertical"
                        margin={{ top: 2, right: 58, left: 0, bottom: 2 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.12} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: theme === 'hybrid' ? '#d1d7db' : '#64748b', fontSize: 11, fontWeight: 600 }}
                          width={94}
                          interval={0}
                        />
                        <Tooltip
                          cursor={{ fill: theme === 'hybrid' ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)' }}
                          contentStyle={tooltipContentStyle}
                          itemStyle={{ color: theme === 'hybrid' ? '#e9edef' : '#0f172a' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(value: any, _name: any, props: any) => [props.payload.label, props.payload.name]}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={15}>
                          {areaData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                          ))}
                          <LabelList
                            dataKey="label"
                            position="right"
                            style={{ fill: theme === 'hybrid' ? '#aebac1' : '#64748b', fontSize: 10, fontWeight: 700 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem dados suficientes</div>
                  )}
                </div>
              </div>
            </div>

            {/* Legal News Widget */}
            <LegalNewsCard />

            {/* Recent Activity (Real Data) */}
            <div className={`rounded-xl shadow-sm border p-4 md:p-5 ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex justify-between items-center mb-3.5">
                <h3 className={`text-base font-bold ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>Últimas Movimentações</h3>
                {setPage && (
                  <button
                    type="button"
                    onClick={() => setPage('cases')}
                    className={`text-xs font-semibold inline-flex items-center gap-1 transition-colors ${theme === 'hybrid' ? 'text-[#00a884] hover:text-[#25d366]' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Ver todos <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {recentCases.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setPendingAction(`editCase:${c.id}`)}
                    className={`flex gap-4 group cursor-pointer p-2 -mx-2 rounded-lg transition-colors ${
                      theme === 'hybrid' ? 'hover:bg-[#354751]' : 'hover:bg-slate-50 dark:hover:bg-dark-800/40'
                    }`}
                  >
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                        theme === 'hybrid' 
                          ? 'bg-[#111b21] border-[#354751] text-[#00a884] group-hover:bg-[#202c33]' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                      }`}>
                        <FileText size={14} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold truncate transition-colors ${
                          theme === 'hybrid' 
                            ? 'text-[#e9edef] group-hover:text-[#00a884]' 
                            : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        }`}>
                          {c.clientName} vs {c.opposingParty}
                        </p>
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>{new Date(c.lastUpdate).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate flex items-center gap-1.5 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500'}`}>
                        <span>Processo: {c.number}</span>
                        <span className={theme === 'hybrid' ? 'text-[#354751]' : 'text-slate-300 dark:text-slate-600'}>•</span>
                        <span>{c.court}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          theme === 'hybrid' 
                            ? 'bg-[#111b21] text-[#8696a0] border-[#354751]' 
                            : 'bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>{c.area}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          c.status === 'Ativo' 
                            ? (theme === 'hybrid' ? 'bg-[#00a884]/10 text-[#00a884] border-[#00a884]/20' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800') 
                            : c.status === 'Arquivado' 
                              ? (theme === 'hybrid' ? 'bg-[#354751] text-[#8696a0] border-[#425866]' : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-dark-900 dark:border-slate-700') 
                              : (theme === 'hybrid' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100')
                          }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {recentCases.length === 0 && (
                  <p className={`text-sm text-center italic py-4 ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'}`}>Nenhuma atividade recente registrada.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="space-y-5">

            {/* Upcoming Deadlines Widget */}
            <div className={`rounded-xl shadow-sm border p-4 md:p-5 ${theme === 'hybrid' ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-base font-bold flex items-center gap-2 ${theme === 'hybrid' ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white'}`}>
                  <Clock size={17} className={theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-400'} /> Prazos Próximos
                </h3>
                {setPage && (
                  <button
                    type="button"
                    onClick={() => setPage('deadlines')}
                    className={`text-xs font-semibold inline-flex items-center gap-1 transition-colors ${theme === 'hybrid' ? 'text-[#00a884] hover:text-[#25d366]' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    Ver todos <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {(overdueDeadlinesCount > 0 || todayDeadlinesCount > 0 || weekDeadlinesCount > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {overdueDeadlinesCount > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme === 'hybrid' ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
                      {overdueDeadlinesCount} atrasado{overdueDeadlinesCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {todayDeadlinesCount > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme === 'hybrid' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                      {todayDeadlinesCount} hoje
                    </span>
                  )}
                  {weekDeadlinesCount > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme === 'hybrid' ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-blue-100 text-blue-700'}`}>
                      {weekDeadlinesCount} próx. 7 dias
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      theme === 'hybrid' ? 'bg-[#00a884]/10 text-[#00a884]' : 'bg-green-50 dark:bg-green-900/20 text-green-500'
                    }`}>
                      <CheckCircle2 size={24} />
                    </div>
                    <p className={`text-sm ${theme === 'hybrid' ? 'text-[#aebac1]' : 'text-slate-500'}`}>Tudo em dia!</p>
                  </div>
                ) : (
                  upcomingDeadlines.map(deadline => {
                    const [y, m, d] = deadline.dueDate.split('-').map(Number);
                    const isUrgent = deadline.priority === 'High';
                    const isToday = deadline.dueDate === today;

                    const associatedCase = cases.find(c => c.id === deadline.caseId);
                    const clientName = associatedCase ? associatedCase.clientName : (deadline.customerName || 'Avulso');
                    const processNumber = associatedCase ? associatedCase.number : '';

                    const renderContent = (isActive: boolean) => (
                      <>
                        <div className={`w-1.5 h-1.5 mt-2 rounded-full flex-shrink-0 ${isUrgent ? 'bg-rose-500' : (theme === 'hybrid' && !isActive ? 'bg-[#00a884]' : 'bg-amber-500')}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-bold truncate pr-2 transition-colors ${
                              theme === 'hybrid' && !isActive
                                ? 'text-[#e9edef] group-hover:text-[#00a884]' 
                                : (theme === 'hybrid' && isActive ? 'text-slate-900 group-hover:text-amber-600' : 'text-slate-900 dark:text-white group-hover:text-primary-500')
                            }`} title={deadline.title}>
                              {deadline.title}
                            </p>
                          </div>
                          <p className={`text-xs font-semibold mt-1 line-clamp-2 ${theme === 'hybrid' && !isActive ? 'text-[#d1d7db]' : (theme === 'hybrid' && isActive ? 'text-slate-600' : 'text-slate-600 dark:text-slate-400')}`} title={clientName}>
                            {clientName}
                          </p>
                          {processNumber && (
                            <p className={`text-[11px] mt-0.5 truncate ${theme === 'hybrid' && !isActive ? 'text-[#aebac1]' : (theme === 'hybrid' && isActive ? 'text-slate-500' : 'text-slate-400')}`}>
                              Nº {processNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end min-w-[42px] flex-shrink-0 ml-1">
                          {isToday && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm mb-1 ${isActive ? 'bg-amber-500 text-white shadow-amber-500/20' : 'opacity-0'}`}>
                              Hoje
                            </span>
                          )}
                          <p className={`text-xs font-bold ${theme === 'hybrid' && !isActive ? 'text-[#e9edef]' : (theme === 'hybrid' && isActive ? 'text-slate-700' : 'text-slate-700 dark:text-slate-300')}`}>{d}/{m}</p>
                          <p className={`text-[10px] font-medium mt-0.5 ${theme === 'hybrid' && !isActive ? 'text-[#aebac1]' : (theme === 'hybrid' && isActive ? 'text-slate-500' : 'text-slate-400')}`}>{(deadline.startTime || '09:00').slice(0, 5)}</p>
                        </div>
                      </>
                    );

                    return (
                      <div
                        key={deadline.id}
                        onClick={() => setPendingAction(`editDeadline:${deadline.id}`)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer group border transition-colors ${
                          isToday
                            ? (theme === 'hybrid'
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800')
                            : (theme === 'hybrid'
                                ? 'bg-[#354751] border-[#00a884]/30 hover:border-[#00a884]/50'
                                : 'bg-slate-50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-700/50 hover:border-primary-500/30')
                        }`}
                      >
                        {renderContent(isToday)}
                      </div>
                    );
                  })
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};
