import re

with open('c:/Users/ADM/Downloads/lexprime-main/pages/Team.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

classes_str = r"""    const isHybrid = theme === 'hybrid';
    const isSober = theme === 'sober';

    const classes = {
        container: `animate-fade-in pb-20 relative min-h-full flex flex-col ${isHybrid ? 'bg-[#222e35]' : ''}`,
        headerContainer: `sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${isHybrid ? 'bg-[#202c33] border-emerald-500/20' : (isSober ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')}`,
        pageTitle: `text-2xl md:text-3xl font-bold tracking-tight ${isHybrid ? 'text-[#e9edef]' : (isSober ? 'text-slate-900' : 'text-slate-900 dark:text-white')}`,
        pageSubtitle: `text-sm mt-1 ${isHybrid ? 'text-[#aebac1]' : (isSober ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400')}`,
        panel: isHybrid ? 'bg-[#2a3942] border-[#202c33]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700',
        input: isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-[#00a884]/50 focus:border-[#00a884]' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 focus:ring-primary-500 text-slate-900 dark:text-white',
        inputIcon: isHybrid ? 'text-[#aebac1]' : 'text-slate-400',
        tableHeader: isHybrid ? 'border-[#354751] bg-[#202c33]' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50',
        tableHeaderCell: `p-4 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors select-none ${isHybrid ? 'text-[#aebac1] hover:bg-[#2a3942]' : 'text-slate-500'}`,
        tableHeaderCellNoHover: `p-4 text-xs font-semibold uppercase tracking-wider ${isHybrid ? 'text-[#aebac1]' : 'text-slate-500'}`,
        tableDivider: isHybrid ? 'divide-[#354751]' : 'divide-slate-100 dark:divide-slate-700',
        tableRow: `transition-colors group ${isHybrid ? 'hover:bg-[#202c33]' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`,
        textPrimary: isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white',
        textSecondary: isHybrid ? 'text-[#aebac1]' : 'text-slate-600 dark:text-slate-300',
        textMuted: isHybrid ? 'text-[#8696a0]' : 'text-slate-400',
        badge: `px-2 py-1 rounded text-xs font-medium ${isHybrid ? 'bg-[#202c33] text-[#e9edef]' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`,
        iconButton: `p-2 rounded-lg transition-colors ${isHybrid ? 'hover:bg-[#202c33] text-[#8696a0] hover:text-[#00a884]' : 'hover:bg-slate-100 dark:hover:bg-dark-600 text-slate-400 hover:text-primary-600'}`,
        modalOverlay: isHybrid ? 'bg-black/80' : 'bg-black/60',
        modalContent: `w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isHybrid ? 'bg-[#2a3942]' : 'bg-white dark:bg-dark-800'}`,
        modalHeader: `p-6 border-b flex justify-between items-center ${isHybrid ? 'border-[#354751] bg-[#202c33]' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50'}`,
        modalFooter: `p-6 border-t flex gap-3 shrink-0 ${isHybrid ? 'border-[#354751] bg-[#202c33]' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50'}`,
        modalBorder: isHybrid ? 'border-[#354751]' : 'border-slate-100 dark:border-slate-700',
        modalHeaderIcon: isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white',
        buttonCancel: `flex-1 py-3 rounded-lg border font-medium transition-colors ${isHybrid ? 'border-[#354751] text-[#e9edef] hover:bg-[#354751]' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white'}`,
        label: `block text-sm font-medium mb-1 ${isHybrid ? 'text-[#aebac1]' : 'text-slate-700 dark:text-slate-300'}`,
        sectionTitle: `text-xs font-bold uppercase tracking-wider flex items-center gap-2 pb-2 border-b ${isHybrid ? 'text-[#8696a0] border-[#354751]' : 'text-slate-400 border-slate-100 dark:border-slate-700'}`,
        avatarContainer: `flex flex-col md:flex-row items-center gap-6 mb-8 p-6 rounded-2xl border ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-50 dark:bg-dark-900/50 border-slate-100 dark:border-slate-800'}`,
        avatarBase: `relative w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed cursor-pointer overflow-hidden transition-colors shadow-inner ${isHybrid ? 'bg-[#2a3942] border-[#354751] hover:border-[#00a884]' : 'bg-slate-100 dark:bg-dark-700 border-slate-300 dark:border-slate-600 hover:border-primary-500'}`,
        buttonCamera: `p-2 rounded-full shadow-lg border transition-transform ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#00a884] hover:scale-110' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700 text-primary-600 hover:scale-110'}`,
        buttonTrash: `p-2 rounded-full shadow-lg border transition-all ${isHybrid ? 'bg-[#202c33] border-[#354751] text-rose-500 hover:scale-110 hover:bg-rose-500/20' : 'bg-white dark:bg-dark-800 border-rose-200 dark:border-rose-900/50 text-rose-600 hover:scale-110 hover:bg-rose-50'}`,
        errorBox: `p-4 rounded-lg flex items-start gap-3 border ${isHybrid ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`,
        errorText: `text-sm ${isHybrid ? 'text-rose-400' : 'text-rose-700 dark:text-rose-300'}`,
        btnSearch: `px-3 rounded-lg disabled:opacity-50 ${isHybrid ? 'bg-[#202c33] text-[#00a884] hover:bg-[#2a3942]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`,
        btnDanger: `px-4 py-2 rounded-lg ${isHybrid ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'}`,
    };

    return (
"""

target_pattern = "    return (\n        <div className={`animate-fade-in"
target_idx = content.find(target_pattern)

if target_idx == -1:
    print("Could not find the target main return block.")
    exit(1)

new_content = content[:target_idx] + classes_str + content[target_idx + len("    return (\n"):]

# Replace strings starting from target_idx to avoid messing up earlier parts.
# To be safe, we will just replace globally, but we already have new_content.
# But wait! We need to ensure we don't duplicate `className...` replacements.
# Let's apply replacements strictly to the latter half.

prefix = new_content[:target_idx + len(classes_str)]
suffix = new_content[target_idx + len(classes_str):]

suffix = suffix.replace('className={`animate-fade-in pb-20 relative min-h-full flex flex-col ${theme === \'hybrid\' ? \'bg-[#222e35]\' : \'\'}`}', 'className={classes.container}')
suffix = suffix.replace('''className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
                ? 'bg-[#202c33] border-emerald-500/20'
                : (theme === 'sober' ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')
                }`}''', 'className={classes.headerContainer}')

suffix = suffix.replace('className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === \'hybrid\' ? \'text-[#e9edef]\' : (theme === \'sober\' ? \'text-slate-900\' : \'text-slate-900 dark:text-white\')}`}', 'className={classes.pageTitle}')
suffix = suffix.replace('className={`text-sm mt-1 ${theme === \'hybrid\' ? \'text-[#aebac1]\' : (theme === \'sober\' ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\')}`}', 'className={classes.pageSubtitle}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 p-2 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 md:mb-6 flex gap-2 md:gap-4 shadow-sm"', 'className={`p-2 md:p-4 rounded-xl border mb-3 md:mb-6 flex gap-2 md:gap-4 shadow-sm ${classes.panel}`}')
suffix = suffix.replace('className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"', 'className={`absolute left-3 top-1/2 -translate-y-1/2 ${classes.inputIcon}`}')
suffix = suffix.replace('className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white transition-all text-sm"', 'className={`w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 rounded-lg border outline-none transition-all text-sm ${classes.input}`}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col"', 'className={`rounded-xl shadow-sm border overflow-hidden flex-1 flex flex-col ${classes.panel}`}')
suffix = suffix.replace('className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-dark-900/50"', 'className={`border-b ${classes.tableHeader}`}')
suffix = suffix.replace('className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors select-none"', 'className={classes.tableHeaderCell}')
suffix = suffix.replace('className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"', 'className={classes.tableHeaderCellNoHover}')
suffix = suffix.replace('className="divide-y divide-slate-100 dark:divide-slate-700"', 'className={`divide-y ${classes.tableDivider}`}')
suffix = suffix.replace('className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"', 'className={classes.tableRow}')
suffix = suffix.replace('className="font-bold text-slate-900 dark:text-white text-sm"', 'className={`font-bold text-sm ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5"', 'className={`text-sm space-y-1.5 ${classes.textSecondary}`}')
suffix = suffix.replace('className="text-slate-400"', 'className={classes.textMuted}')
suffix = suffix.replace('className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"', 'className={classes.badge}')
suffix = suffix.replace('className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono"', 'className={`p-4 text-sm font-mono ${classes.textSecondary}`}')
suffix = suffix.replace('className="p-4 text-sm text-slate-600 dark:text-slate-300"', 'className={`p-4 text-sm ${classes.textSecondary}`}')
suffix = suffix.replace('className="p-2 hover:bg-slate-100 dark:hover:bg-dark-600 rounded-lg text-slate-400 hover:text-primary-600 transition-colors"', 'className={classes.iconButton}')
suffix = suffix.replace('className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"', 'className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in ${classes.modalOverlay}`}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"', 'className={classes.modalContent}')
suffix = suffix.replace('className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-dark-900/50"', 'className={classes.modalHeader}')
suffix = suffix.replace('className="text-lg font-bold text-slate-900 dark:text-white"', 'className={`text-lg font-bold ${classes.modalHeaderIcon}`}')
suffix = suffix.replace('className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3"', 'className={classes.errorBox}')
suffix = suffix.replace('className="text-sm text-rose-700 dark:text-rose-300"', 'className={classes.errorText}')
suffix = suffix.replace('className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-slate-50 dark:bg-dark-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800"', 'className={classes.avatarContainer}')
suffix = suffix.replace('className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-dark-700 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer overflow-hidden hover:border-primary-500 transition-colors shadow-inner"', 'className={classes.avatarBase}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 p-2 rounded-full shadow-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:scale-110 hover:bg-rose-50 transition-all"', 'className={classes.buttonTrash}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-primary-600 hover:scale-110 transition-transform"', 'className={classes.buttonCamera}')
suffix = suffix.replace('className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"', 'className={`block text-xs font-bold uppercase tracking-widest mb-2 ${classes.textMuted}`}')
suffix = suffix.replace('className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"', 'className={`block text-xs font-bold uppercase tracking-widest mb-1 ${classes.textMuted}`}')
suffix = suffix.replace('className="w-full md:w-32 p-2 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500 uppercase text-center font-bold tracking-tighter"', 'className={`w-full md:w-32 p-2 rounded-lg border outline-none uppercase text-center font-bold tracking-tighter ${classes.input}`}')
suffix = suffix.replace('className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700"', 'className={classes.sectionTitle}')
suffix = suffix.replace('className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"', 'className={classes.label}')
suffix = suffix.replace('className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white focus:ring-2 focus:ring-primary-500"', 'className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}')
suffix = suffix.replace('className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 outline-none dark:text-white"', 'className={`w-full p-2.5 rounded-lg border outline-none ${classes.input}`}')
suffix = suffix.replace('className="px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50"', 'className={classes.btnSearch}')
suffix = suffix.replace('className="p-6 border-t border-slate-100 dark:border-slate-700 flex gap-3 bg-slate-50 dark:bg-dark-900/50 shrink-0"', 'className={classes.modalFooter}')
suffix = suffix.replace('className="px-4 py-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40"', 'className={classes.btnDanger}')
suffix = suffix.replace('className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-white font-medium transition-colors"', 'className={classes.buttonCancel}')

with open('c:/Users/ADM/Downloads/lexprime-main/pages/Team.tsx', 'w', encoding='utf-8') as f:
    f.write(prefix + suffix)

print('Updated Team.tsx successfully!')
