
import React from 'react';
import { useStore } from '../context/Store';
import { Briefcase, AlertCircle, CheckCircle2, TrendingUp, Clock, CalendarIcon, ChevronRight, Users, FileText, PieChart as PieChartIcon, BarChart3 } from '../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, Label, LabelList } from 'recharts';
import { CaseStatus } from '../types';

const StatCard = ({ title, value, icon: Icon, trend, color, subtext }: any) => (
  <div className="bg-white dark:bg-dark-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs font-medium">
      {trend && (
        <span className={`px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'} mr-2`}>
          {trend}
        </span>
      )}
      <span className="text-slate-400">{subtext}</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { cases, deadlines, appointments, currentUser, clients, setPendingAction } = useStore();

  // --- Metrics Calculation ---
  const activeCases = cases.filter(c => c.status === CaseStatus.Active).length;
  const archivedCases = cases.filter(c => c.status === CaseStatus.Archived).length;

  const pendingDeadlines = deadlines.filter(d => !d.isDone && d.status !== 'Canceled').length;
  const urgentDeadlines = deadlines.filter(d => !d.isDone && d.status !== 'Canceled' && d.priority === 'High').length;

  const today = new Date().toLocaleDateString('en-CA'); // Local YYYY-MM-DD
  const todayItems = [
    ...deadlines.filter(d => d.dueDate === today && !d.isDone && d.status !== 'Canceled'),
    ...appointments.filter(a => a.date.startsWith(today))
  ].length;
  const totalClients = clients.length;

  // --- Chart 1: Status (Active vs Archived only) ---
  const statusData = [
    { name: 'Ativos', value: activeCases, color: '#3b82f6' }, // Blue
    { name: 'Arquivados', value: archivedCases, color: '#94a3b8' }, // Slate
  ];

  // --- Chart 2: Cases by Area (New Suggestion) ---
  const areaCounts = cases.reduce((acc, curr) => {
    const area = curr.area || 'Outros';
    const currentCount = acc[area] || 0;
    acc[area] = currentCount + 1;
    return acc;
  }, {} as Record<string, number>);

  const areaData = Object.entries(areaCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a: any, b: any) => b.value - a.value) // Sort by highest count
    .slice(0, 5); // Take top 5 areas

  const AREA_COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

  // --- Upcoming Deadlines Logic ---
  const upcomingDeadlines = deadlines
    .filter(d => !d.isDone && d.status !== 'Canceled' && d.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 7);

  // --- Recent Activity Logic (Real Data) ---
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    .slice(0, 4); // Top 4

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-500 dark:text-slate-400">Hoje</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => setPendingAction('newCase')} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-between group transition-all transform hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Briefcase size={20} /></div>
            <span className="font-bold">Novo Processo</span>
          </div>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform opacity-80" />
        </button>
        <button onClick={() => setPendingAction('newClient')} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-between group transition-all transform hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Users size={20} /></div>
            <span className="font-bold">Novo Contato</span>
          </div>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform opacity-80" />
        </button>
        <button onClick={() => setPendingAction('newDeadline')} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-between group transition-all transform hover:scale-[1.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Clock size={20} /></div>
            <span className="font-bold">Novo Prazo</span>
          </div>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform opacity-80" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Processos Ativos"
          value={activeCases}
          icon={Briefcase}
          trend="Carteira"
          color="bg-blue-500 text-blue-600"
          subtext="Em andamento"
        />
        <StatCard
          title="Prazos Pendentes"
          value={pendingDeadlines}
          icon={AlertCircle}
          trend={urgentDeadlines > 0 ? `${urgentDeadlines} Urgentes` : 'Em dia'}
          color="bg-amber-500 text-amber-600"
          subtext="Próximos dias"
        />
        <StatCard
          title="Calendário Hoje"
          value={todayItems}
          icon={CalendarIcon}
          trend={todayItems > 0 ? 'Ocupado' : 'Livre'}
          color="bg-purple-500 text-purple-600"
          subtext="Compromissos e Prazos"
        />
        {/* Replaced Fees with Clients Metric */}
        <StatCard
          title="Total de Contatos"
          value={totalClients}
          icon={Users}
          trend="Base"
          color="bg-emerald-500 text-emerald-600"
          subtext="Clientes e partes"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Center Column (Charts & Activity) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Chart 1: Status Distribution */}
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <PieChartIcon size={16} className="text-slate-400" /> Status
                </h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
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
                                className="fill-slate-900 dark:fill-white font-bold"
                                style={{ fontSize: '26px' }}
                              >
                                {activeCases + archivedCases}
                              </text>
                              <text
                                x={cx}
                                y={cy + 15}
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="fill-slate-400 font-semibold"
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
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Areas Distribution (Horizontal Bar Chart) */}
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-slate-400" /> Áreas
                </h3>
              </div>
              <div className="h-48 w-full">
                {areaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={areaData}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        width={80}
                        interval={0}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                        {areaData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                        ))}
                        <LabelList dataKey="value" position="right" style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">Sem dados suficientes</div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity (Real Data) */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Últimas Movimentações</h3>
            <div className="space-y-6">
              {recentCases.map(c => (
                <div
                  key={c.id}
                  onClick={() => setPendingAction(`editCase:${c.id}`)}
                  className="flex gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-800/40 p-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                      <FileText size={14} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {c.clientName} vs {c.opposingParty}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{new Date(c.lastUpdate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                      <span>Processo: {c.number}</span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{c.court}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-dark-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{c.area}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${c.status === 'Ativo' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' :
                        c.status === 'Arquivado' ? 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-dark-900 dark:border-slate-700' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentCases.length === 0 && (
                <p className="text-slate-400 text-sm text-center italic py-4">Nenhuma atividade recente registrada.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-8">

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prazos Próximos</h3>
              <Clock size={18} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-slate-500 text-sm">Tudo em dia!</p>
                </div>
              ) : (
                upcomingDeadlines.map(deadline => {
                  const [y, m, d] = deadline.dueDate.split('-').map(Number);
                  const isUrgent = deadline.priority === 'High';
                  const isToday = deadline.dueDate === today;

                  const associatedCase = cases.find(c => c.id === deadline.caseId);
                  const clientName = associatedCase ? associatedCase.clientName : (deadline.customerName || 'Avulso');
                  const processNumber = associatedCase ? associatedCase.number : '';

                  return (
                    <div
                      key={deadline.id}
                      onClick={() => setPendingAction(`editDeadline:${deadline.id}`)}
                      className={`flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer hover:shadow-sm group border ${isToday
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-700/50 hover:border-primary-500/30'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 mt-2 rounded-full flex-shrink-0 ${isUrgent ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2 group-hover:text-primary-500" title={deadline.title}>
                            {deadline.title}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 line-clamp-2" title={clientName}>
                          {clientName}
                        </p>
                        {processNumber && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Nº {processNumber}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end min-w-[42px] flex-shrink-0 ml-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {isToday && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm shadow-amber-500/20">
                              Hoje
                            </span>
                          )}
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{d}/{m}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{(deadline.startTime || '09:00').slice(0, 5)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
