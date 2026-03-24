import re

with open('c:/Users/ADM/Downloads/lexprime-main/pages/Settings.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Target injection point: inside Settings component, after `handleBackupAll` function
injection_target = "    return (\n        <div className={`animate-fade-in"

classes_str = """    const isHybrid = theme === 'hybrid';
    const isSober = theme === 'sober';

    const classes = {
        container: `animate-fade-in pb-20 relative min-h-full flex flex-col ${isHybrid ? 'bg-[#222e35]' : ''}`,
        headerContainer: `sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${isHybrid ? 'bg-[#202c33] border-[#354751]' : (isSober ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')}`,
        pageTitle: `text-2xl md:text-3xl font-bold tracking-tight ${isHybrid ? 'text-[#e9edef]' : (isSober ? 'text-slate-900' : 'text-slate-900 dark:text-white')}`,
        pageSubtitle: `text-sm mt-1 ${isHybrid ? 'text-[#aebac1]' : (isSober ? 'text-slate-700' : 'text-slate-500 dark:text-slate-400')}`,
        
        panel: `rounded-xl shadow-sm border ${isHybrid ? 'bg-[#2a3942] border-[#354751]' : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-slate-700'}`,
        subPanel: `rounded-lg border ${isHybrid ? 'bg-[#202c33] border-[#354751]' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700'}`,
        
        textPrimary: isHybrid ? 'text-[#e9edef]' : 'text-slate-900 dark:text-white',
        textSecondary: isHybrid ? 'text-[#aebac1]' : 'text-slate-500 dark:text-slate-400',
        textMuted: isHybrid ? 'text-[#8696a0]' : 'text-slate-400',
        
        iconButton: `p-2 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#354751] hover:text-[#00a884]' : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`,
        iconButtonNormal: `p-2 rounded-lg transition-colors ${isHybrid ? 'text-[#aebac1] hover:bg-[#354751] hover:text-[#e9edef]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`,
        iconButtonDanger: `p-2 rounded-lg transition-colors ${isHybrid ? 'text-rose-500 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'}`,

        btnPrimary: `w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all shadow-lg disabled:opacity-50 ${isHybrid ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-[#00a884]/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'}`,
        btnSecondary: `w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all border ${isHybrid ? 'bg-[#202c33] text-[#e9edef] border-[#354751] hover:bg-[#354751]' : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-dark-700'}`,

        input: `w-full pl-10 pr-4 py-2 rounded-lg border outline-none text-sm transition-focus ${isHybrid ? 'bg-[#202c33] border-[#354751] text-[#e9edef] focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884] placeholder:text-[#aebac1]/50' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'}`,

        logItem: `flex gap-4 p-3 rounded-lg border transition-colors ${isHybrid ? 'border-[#354751] hover:bg-[#354751]' : 'border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-dark-900/50'}`,
        logAvatar: `w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isHybrid ? 'bg-[#354751] text-[#e9edef]' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-slate-400'}`,
    };

    return (
"""

idx = content.find(injection_target)
if idx == -1:
    print("Injection target not found!")
    exit(1)

new_content = content[:idx] + classes_str + content[idx + len("    return (\n"):]

# Split and perform replacements only in the suffix to avoid double replacements
prefix = new_content[:idx + len(classes_str)]
suffix = new_content[idx + len(classes_str):]


# 1. Container & Header
suffix = suffix.replace('className={`animate-fade-in pb-20 relative min-h-full flex flex-col ${theme === \'hybrid\' ? \'bg-[#222e35]\' : \'\'}`}', 'className={classes.container}')
suffix = suffix.replace('''className={`sticky top-0 z-40 md:z-50 px-4 md:px-8 pt-4 md:pt-6 pb-4 border-b transition-colors shadow-sm no-print ${theme === 'hybrid'
                ? 'bg-[#202c33] border-emerald-500/20'
                : (theme === 'sober' ? 'bg-slate-200 border-slate-300' : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-slate-800')
                }`}''', 'className={classes.headerContainer}')

suffix = suffix.replace('className={`text-2xl md:text-3xl font-bold tracking-tight ${theme === \'hybrid\' ? \'text-[#e9edef]\' : (theme === \'sober\' ? \'text-slate-900\' : \'text-slate-900 dark:text-white\')}`}', 'className={classes.pageTitle}')
suffix = suffix.replace('className={`text-sm mt-1 ${theme === \'hybrid\' ? \'text-[#aebac1]\' : (theme === \'sober\' ? \'text-slate-700\' : \'text-slate-500 dark:text-slate-400\')}`}', 'className={classes.pageSubtitle}')

# 2. Panels
suffix = suffix.replace('className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-6"', 'className={`p-6 flex items-center gap-6 ${classes.panel}`}')
suffix = suffix.replace('className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"', 'className={`p-6 ${classes.panel}`}')

# 3. Sub-panels & Rows
suffix = suffix.replace('className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-900 rounded-lg"', 'className={`flex items-center justify-between p-4 ${classes.subPanel}`}')
suffix = suffix.replace('className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-900 rounded-lg border border-slate-200 dark:border-slate-700"', 'className={`flex items-center justify-between p-4 ${classes.subPanel}`}')

# 4. Text variants
suffix = suffix.replace('className="text-xl font-bold text-slate-900 dark:text-white"', 'className={`text-xl font-bold ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-slate-500"', 'className={classes.textSecondary}')
suffix = suffix.replace('className="text-lg font-bold text-slate-900 dark:text-white mb-4"', 'className={`text-lg font-bold mb-4 ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"', 'className={`text-lg font-bold mb-4 flex items-center gap-2 ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between"', 'className={`text-lg font-bold mb-4 flex items-center justify-between ${classes.textPrimary}`}')

suffix = suffix.replace('className="font-medium text-slate-900 dark:text-white"', 'className={`font-medium ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-xs text-slate-500"', 'className={`text-xs ${classes.textSecondary}`}')

suffix = suffix.replace('className="inline-block mt-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 uppercase"', 'className={`inline-block mt-2 text-xs font-bold px-2 py-1 rounded uppercase ${isHybrid ? "bg-[#354751] text-[#e9edef]" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}')

# 5. Buttons
suffix = suffix.replace('className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"', 'className={classes.iconButton}')
suffix = suffix.replace('className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"', 'className={classes.iconButtonNormal}')
suffix = suffix.replace('className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"', 'className={classes.iconButtonDanger}')

suffix = suffix.replace('className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"', 'className={classes.btnPrimary}')
suffix = suffix.replace('className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-dark-700 transition-all"', 'className={classes.btnSecondary}')

# 6. Icons specifically hardcoded to primary-600 in team section etc
suffix = suffix.replace('className="text-primary-600"', 'className={isHybrid ? "text-[#00a884]" : "text-primary-600"}')

# 7. Lists text
suffix = suffix.replace('className="text-sm font-bold text-slate-800 dark:text-white"', 'className={`text-sm font-bold ${classes.textPrimary}`}')

# 8. Activity log specific parts
suffix = suffix.replace('className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm transition-focus outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"', 'className={classes.input}')

suffix = suffix.replace('className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors"', 'className={classes.logItem}')
suffix = suffix.replace('className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400"', 'className={classes.logAvatar}')
suffix = suffix.replace('className="text-sm font-bold text-slate-900 dark:text-white truncate"', 'className={`text-sm font-bold truncate ${classes.textPrimary}`}')
suffix = suffix.replace('className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-1 items-center"', 'className={`text-xs mt-1 flex flex-wrap gap-1 items-center ${classes.textSecondary}`}')
suffix = suffix.replace('className="font-medium text-slate-800 dark:text-slate-200"', 'className={`font-medium ${classes.textPrimary}`}')


with open('c:/Users/ADM/Downloads/lexprime-main/pages/Settings.tsx', 'w', encoding='utf-8') as f:
    f.write(prefix + suffix)

print("Patch applied to Settings.tsx")
