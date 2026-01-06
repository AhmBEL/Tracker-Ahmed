import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calendar, TrendingDown, Flame, Droplet, Dumbbell, Pill, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Footprints, Clock } from 'lucide-react';

const TransformationTracker = () => {
  const [currentView, setCurrentView] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    morning: true,
    evening: true,
    meal: true
  });
  const [progressMetric, setProgressMetric] = useState('weight');

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.storage.get('transformation-data');
        if (result && result.value) {
          setData(JSON.parse(result.value));
        }
      } catch (error) {
        console.log('No existing data, starting fresh');
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save data to storage
  useEffect(() => {
    if (!isLoading && Object.keys(data).length > 0) {
      window.storage.set('transformation-data', JSON.stringify(data));
    }
  }, [data, isLoading]);

  const getTodayData = () => {
    return data[selectedDate] || {
      supplements: { morning: {}, evening: {}, meal: {} },
      training: null,
      steps: '',
      hydration: false,
      weight: '',
      fasting: null,
      comments: '',
      mood: []
    };
  };

  const updateTodayData = (field, value) => {
    setData(prev => ({
      ...prev,
      [selectedDate]: {
        ...getTodayData(),
        [field]: value
      }
    }));
  };

  const toggleSupplement = (time, supplement) => {
    const today = getTodayData();
    const supplements = { ...today.supplements };
    supplements[time] = { ...supplements[time] };
    supplements[time][supplement] = !supplements[time][supplement];
    updateTodayData('supplements', supplements);
  };

  const toggleAllSupplements = (time) => {
    const today = getTodayData();
    const supplements = { ...today.supplements };
    const timeSupps = supplementsList[time];
    const allChecked = timeSupps.every(supp => supplements[time]?.[supp]);
    
    supplements[time] = {};
    timeSupps.forEach(supp => {
      supplements[time][supp] = !allChecked;
    });
    updateTodayData('supplements', supplements);
  };

  const toggleMood = (moodEmoji) => {
    const today = getTodayData();
    const moods = [...(today.mood || [])];
    const index = moods.indexOf(moodEmoji);
    if (index > -1) {
      moods.splice(index, 1);
    } else {
      moods.push(moodEmoji);
    }
    updateTodayData('mood', moods);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDayStatus = (date) => {
    const dayData = data[date];
    if (!dayData) return 'empty';
    
    const morningSupps = Object.values(dayData.supplements?.morning || {});
    const eveningSupps = Object.values(dayData.supplements?.evening || {});
    const mealSupps = Object.values(dayData.supplements?.meal || {});
    const hasTraining = !!dayData.training;
    const hasHydration = dayData.hydration;
    const hasFasting = !!dayData.fasting;
    
    const totalChecks = [...morningSupps, ...eveningSupps, ...mealSupps, hasTraining, hasHydration, hasFasting];
    const completedChecks = totalChecks.filter(Boolean).length;
    const totalRequired = totalChecks.length;
    
    if (completedChecks === totalRequired) return 'complete';
    if (completedChecks > totalRequired * 0.6) return 'partial';
    return 'incomplete';
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 100; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (getDayStatus(dateStr) === 'complete') {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getMonthDates = () => {
    const dates = [];
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    
    // Get first day of month (Monday = 1)
    const firstDay = targetMonth.getDay();
    const offset = firstDay === 0 ? -6 : 1 - firstDay;
    
    // Start from Monday before or on the 1st
    const startDate = new Date(targetMonth);
    startDate.setDate(offset);
    
    // Get 35 or 42 days to fill grid
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getProgressData = () => {
    const sorted = Object.entries(data)
      .filter(([_, value]) => {
        if (progressMetric === 'weight') return value.weight && value.weight !== '';
        if (progressMetric === 'steps') return value.steps && value.steps !== '';
        if (progressMetric === 'training') return value.training;
        if (progressMetric === 'fasting') return value.fasting;
        return false;
      })
      .sort(([a], [b]) => new Date(a) - new Date(b));

    if (progressMetric === 'weight') {
      return sorted.map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        value: parseFloat(value.weight)
      }));
    }
    
    if (progressMetric === 'steps') {
      return sorted.map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        value: parseInt(value.steps)
      }));
    }

    if (progressMetric === 'training') {
      const trainingCount = {};
      sorted.forEach(([date, value]) => {
        const week = new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        trainingCount[week] = (trainingCount[week] || 0) + 1;
      });
      return Object.entries(trainingCount).map(([date, count]) => ({
        date,
        value: count
      }));
    }

    if (progressMetric === 'fasting') {
      const fastingTypes = {};
      sorted.forEach(([date, value]) => {
        fastingTypes[value.fasting] = (fastingTypes[value.fasting] || 0) + 1;
      });
      return Object.entries(fastingTypes).map(([type, count]) => ({
        date: type,
        value: count
      }));
    }

    return [];
  };

  const exportData = () => {
    const csv = ['Date,Poids,Training,Pas,Hydratation,Jeûne,Mood,Compléments Matin,Compléments Soir,Compléments Repas,Commentaires'];
    Object.entries(data).forEach(([date, value]) => {
      const morningSupps = Object.entries(value.supplements?.morning || {})
        .filter(([_, checked]) => checked)
        .map(([supp]) => supp)
        .join(';');
      const eveningSupps = Object.entries(value.supplements?.evening || {})
        .filter(([_, checked]) => checked)
        .map(([supp]) => supp)
        .join(';');
      const mealSupps = Object.entries(value.supplements?.meal || {})
        .filter(([_, checked]) => checked)
        .map(([supp]) => supp)
        .join(';');
      csv.push([
        date,
        value.weight || '',
        value.training || '',
        value.steps || '',
        value.hydration ? 'Oui' : 'Non',
        value.fasting || '',
        (value.mood || []).join(';'),
        morningSupps,
        eveningSupps,
        mealSupps,
        (value.comments || '').replace(/,/g, ';')
      ].join(','));
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transformation-ahmed-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const moods = [
    { emoji: '😊', label: 'Très bien' },
    { emoji: '💪', label: 'Fort' },
    { emoji: '😴', label: 'Fatigué' },
    { emoji: '🤕', label: 'Mal de tête' },
    { emoji: '😰', label: 'Faible' },
    { emoji: '🥵', label: 'Chaud' }
  ];

  const supplementsList = {
    morning: ['NAC 1200mg', 'Vitamine C 1000mg', 'Magnésium 200mg', 'Électrolytes 500ml'],
    evening: ['NAC 1200mg', 'Vitamine C 500mg', 'Électrolytes 500ml'],
    meal: ['Créatine 5g', 'Magnésium 200mg', 'Zinc 30mg']
  };

  const trainings = ['Séance A (Squat/Poussée)', 'Séance B (Deadlift/Traction)', 'Séance C (Mixte)'];
  
  const fastingTypes = ['16/8', 'OMAD', 'OMAD Sec', 'Jeûne Total 24h', 'Jeûne Sec Total'];

  const today = getTodayData();
  const isMonday = new Date(selectedDate).getDay() === 1;
  const weekDates = getWeekDates();
  const monthDates = getMonthDates();
  const progressData = getProgressData();
  const streak = getStreak();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl font-bold">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-emerald-400" style={{ fontFamily: "'Outfit', sans-serif" }}>
                TRANSFORMATION
              </h1>
              <p className="text-zinc-500 text-sm mt-1">130kg → 90kg · Phase 1</p>
            </div>
            <div className="flex items-center gap-4">
              {streak > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-orange-400">
                    <Flame className="w-5 h-5" />
                    <span className="text-2xl font-bold">{streak}</span>
                  </div>
                  <p className="text-xs text-zinc-500">jours</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['today', 'week', 'month', 'progress', 'history'].map(view => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  currentView === view
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {view === 'today' && 'Aujourd\'hui'}
                {view === 'week' && 'Semaine'}
                {view === 'month' && 'Mois'}
                {view === 'progress' && 'Progression'}
                {view === 'history' && 'Historique'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* TODAY VIEW */}
        {currentView === 'today' && (
          <div className="space-y-4">
            {/* Date selector */}
            <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <button
                onClick={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() - 1);
                  setSelectedDate(date.toISOString().split('T')[0]);
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {selectedDate === new Date().toISOString().split('T')[0] && (
                  <p className="text-xs text-emerald-400 mt-1">Aujourd'hui</p>
                )}
              </div>
              <button
                onClick={() => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() + 1);
                  if (date <= new Date()) {
                    setSelectedDate(date.toISOString().split('T')[0]);
                  }
                }}
                className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Supplements Morning - Collapsible */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                onClick={() => toggleSection('morning')}
                className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/50 transition rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">Compléments Matin (7h15)</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      {Object.values(today.supplements.morning || {}).filter(Boolean).length}/{supplementsList.morning.length} pris
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllSupplements('morning');
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      supplementsList.morning.every(s => today.supplements.morning?.[s])
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    Tout cocher
                  </button>
                  {expandedSections.morning ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              {expandedSections.morning && (
                <div className="px-6 pb-6 space-y-3">
                  {supplementsList.morning.map(supp => (
                    <button
                      key={supp}
                      onClick={() => toggleSupplement('morning', supp)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        today.supplements.morning?.[supp]
                          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          today.supplements.morning?.[supp] ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                        }`}>
                          {today.supplements.morning?.[supp] && <span className="text-zinc-950 font-bold">✓</span>}
                        </div>
                        <span className="font-medium">{supp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Supplements Evening - Collapsible */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                onClick={() => toggleSection('evening')}
                className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/50 transition rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-6 h-6 text-indigo-400" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">Compléments Soir (18h)</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      {Object.values(today.supplements.evening || {}).filter(Boolean).length}/{supplementsList.evening.length} pris
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllSupplements('evening');
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      supplementsList.evening.every(s => today.supplements.evening?.[s])
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    Tout cocher
                  </button>
                  {expandedSections.evening ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              {expandedSections.evening && (
                <div className="px-6 pb-6 space-y-3">
                  {supplementsList.evening.map(supp => (
                    <button
                      key={supp}
                      onClick={() => toggleSupplement('evening', supp)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        today.supplements.evening?.[supp]
                          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          today.supplements.evening?.[supp] ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                        }`}>
                          {today.supplements.evening?.[supp] && <span className="text-zinc-950 font-bold">✓</span>}
                        </div>
                        <span className="font-medium">{supp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Supplements Meal - Collapsible */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800">
              <button
                onClick={() => toggleSection('meal')}
                className="w-full p-6 flex items-center justify-between hover:bg-zinc-800/50 transition rounded-t-xl"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-6 h-6 text-violet-400" />
                  <div className="text-left">
                    <h2 className="text-xl font-bold">Avec Repas (18h-19h)</h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      {Object.values(today.supplements.meal || {}).filter(Boolean).length}/{supplementsList.meal.length} pris
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllSupplements('meal');
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      supplementsList.meal.every(s => today.supplements.meal?.[s])
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    Tout cocher
                  </button>
                  {expandedSections.meal ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>
              {expandedSections.meal && (
                <div className="px-6 pb-6 space-y-3">
                  {supplementsList.meal.map(supp => (
                    <button
                      key={supp}
                      onClick={() => toggleSupplement('meal', supp)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        today.supplements.meal?.[supp]
                          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          today.supplements.meal?.[supp] ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                        }`}>
                          {today.supplements.meal?.[supp] && <span className="text-zinc-950 font-bold">✓</span>}
                        </div>
                        <span className="font-medium">{supp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Training */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Dumbbell className="w-6 h-6 text-rose-400" />
                <h2 className="text-xl font-bold">Training Salle</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {trainings.map(training => (
                  <button
                    key={training}
                    onClick={() => updateTodayData('training', today.training === training ? null : training)}
                    className={`px-4 py-3 rounded-lg transition-all text-left ${
                      today.training === training
                        ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'
                        : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        today.training === training ? 'bg-rose-500 border-rose-500' : 'border-zinc-600'
                      }`}>
                        {today.training === training && <span className="text-zinc-950 font-bold">●</span>}
                      </div>
                      <span className="font-medium">{training}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps / Walking */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Footprints className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold">Marche & Pas Quotidiens</h2>
              </div>
              <input
                type="number"
                step="100"
                value={today.steps}
                onChange={(e) => updateTodayData('steps', e.target.value)}
                placeholder="10000"
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg px-4 py-4 text-2xl font-bold text-center focus:border-blue-500 focus:outline-none transition"
              />
              <p className="text-center text-zinc-500 text-sm mt-2">Nombre de pas aujourd'hui</p>
            </div>

            {/* Fasting Type */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold">Type de Jeûne</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {fastingTypes.map(fasting => (
                  <button
                    key={fasting}
                    onClick={() => updateTodayData('fasting', today.fasting === fasting ? null : fasting)}
                    className={`px-4 py-3 rounded-lg transition-all text-left ${
                      today.fasting === fasting
                        ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                        : 'bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        today.fasting === fasting ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'
                      }`}>
                        {today.fasting === fasting && <span className="text-zinc-950 font-bold">●</span>}
                      </div>
                      <span className="font-medium">{fasting}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hydration */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplet className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-xl font-bold">Hydratation 3-4L</h2>
                    <p className="text-sm text-zinc-500">Électrolytes toute la journée</p>
                  </div>
                </div>
                <button
                  onClick={() => updateTodayData('hydration', !today.hydration)}
                  className={`w-16 h-16 rounded-full transition-all ${
                    today.hydration
                      ? 'bg-cyan-500 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                  }`}
                >
                  <span className="text-3xl">{today.hydration ? '✓' : '○'}</span>
                </button>
              </div>
            </div>

            {/* Weight (Monday only) */}
            {isMonday && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold">Poids du Lundi</h2>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={today.weight}
                  onChange={(e) => updateTodayData('weight', e.target.value)}
                  placeholder="130.0"
                  className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg px-4 py-4 text-2xl font-bold text-center focus:border-emerald-500 focus:outline-none transition"
                />
                <p className="text-center text-zinc-500 text-sm mt-2">kg · À jeun le matin</p>
              </div>
            )}

            {/* Mood */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-bold mb-4">Comment tu te sens ?</h2>
              <div className="grid grid-cols-3 gap-3">
                {moods.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => toggleMood(emoji)}
                    className={`p-4 rounded-xl transition-all ${
                      today.mood?.includes(emoji)
                        ? 'bg-amber-500/20 border-2 border-amber-500 scale-105'
                        : 'bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-4xl mb-2">{emoji}</div>
                    <div className="text-xs text-zinc-400">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-bold mb-4">Notes & Commentaires</h2>
              <textarea
                value={today.comments}
                onChange={(e) => updateTodayData('comments', e.target.value)}
                placeholder="Remarques, ressentis, observations du jour..."
                rows="4"
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none transition resize-none"
              />
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {currentView === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-xl font-bold">Semaine du {new Date(weekDates[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
              </div>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDates.map(date => {
                const status = getDayStatus(date);
                const dayData = data[date] || {};
                const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
                const dayNum = new Date(date).getDate();
                
                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setCurrentView('today');
                    }}
                    className={`aspect-square rounded-xl p-3 border-2 transition-all ${
                      status === 'complete' ? 'bg-emerald-500/20 border-emerald-500' :
                      status === 'partial' ? 'bg-amber-500/20 border-amber-500' :
                      status === 'incomplete' ? 'bg-rose-500/20 border-rose-500' :
                      'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="text-xs text-zinc-500 uppercase">{dayName}</div>
                    <div className="text-2xl font-bold mt-1">{dayNum}</div>
                    {dayData.weight && (
                      <div className="text-xs text-zinc-400 mt-1">{dayData.weight}kg</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="font-bold mb-4">Légende</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 border-2 border-emerald-500"></div>
                  <span>Vert : Tout fait ✓</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-amber-500/20 border-2 border-amber-500"></div>
                  <span>Orange : Partiel (quelque chose manque)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-rose-500/20 border-2 border-rose-500"></div>
                  <span>Rouge : Peu fait</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-zinc-900 border-2 border-zinc-800"></div>
                  <span>Gris : Pas de données</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MONTH VIEW */}
        {currentView === 'month' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <button
                onClick={() => setMonthOffset(monthOffset - 1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <p className="text-xl font-bold">
                  {new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
                    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setMonthOffset(monthOffset + 1)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition disabled:opacity-50"
                disabled={monthOffset >= 0}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthDates.slice(0, 35).map(date => {
                const status = getDayStatus(date);
                const dayData = data[date] || {};
                const dayNum = new Date(date).getDate();
                const isCurrentMonth = new Date(date).getMonth() === new Date().getMonth() + monthOffset;
                
                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setCurrentView('today');
                    }}
                    className={`aspect-square rounded-xl p-2 border-2 transition-all ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    } ${
                      status === 'complete' ? 'bg-emerald-500/20 border-emerald-500' :
                      status === 'partial' ? 'bg-amber-500/20 border-amber-500' :
                      status === 'incomplete' ? 'bg-rose-500/20 border-rose-500' :
                      'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="text-lg font-bold">{dayNum}</div>
                    {dayData.weight && isCurrentMonth && (
                      <div className="text-xs text-zinc-400">{dayData.weight}</div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="font-bold mb-4">Légende</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 border-2 border-emerald-500"></div>
                  <span>Vert : Tout fait ✓</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-amber-500/20 border-2 border-amber-500"></div>
                  <span>Orange : Partiel (quelque chose manque)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-rose-500/20 border-2 border-rose-500"></div>
                  <span>Rouge : Peu fait</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-zinc-900 border-2 border-zinc-800"></div>
                  <span>Gris : Pas de données</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS VIEW */}
        {currentView === 'progress' && (
          <div className="space-y-4">
            {/* Metric Selector */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <label className="text-sm font-semibold text-zinc-400 mb-2 block">Afficher la progression de :</label>
              <select
                value={progressMetric}
                onChange={(e) => setProgressMetric(e.target.value)}
                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-lg px-4 py-3 focus:border-emerald-500 focus:outline-none transition text-lg font-semibold"
              >
                <option value="weight">Poids (kg)</option>
                <option value="steps">Nombre de pas</option>
                <option value="training">Séances de training</option>
                <option value="fasting">Jours de jeûne par type</option>
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <Flame className="w-5 h-5" />
                  <span className="text-sm font-semibold">Streak</span>
                </div>
                <p className="text-4xl font-black">{streak}</p>
                <p className="text-xs text-zinc-500 mt-1">jours consécutifs</p>
              </div>
              
              {progressMetric === 'weight' && progressData.length >= 2 && (
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-sm font-semibold">Perte</span>
                  </div>
                  <p className="text-4xl font-black">
                    {(progressData[0].value - progressData[progressData.length - 1].value).toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">kg perdus</p>
                </div>
              )}

              {progressMetric === 'steps' && progressData.length > 0 && (
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Footprints className="w-5 h-5" />
                    <span className="text-sm font-semibold">Moyenne</span>
                  </div>
                  <p className="text-4xl font-black">
                    {Math.round(progressData.reduce((sum, d) => sum + d.value, 0) / progressData.length)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">pas / jour</p>
                </div>
              )}

              {progressMetric === 'training' && progressData.length > 0 && (
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center gap-2 text-rose-400 mb-2">
                    <Dumbbell className="w-5 h-5" />
                    <span className="text-sm font-semibold">Total</span>
                  </div>
                  <p className="text-4xl font-black">
                    {progressData.reduce((sum, d) => sum + d.value, 0)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">séances</p>
                </div>
              )}

              {progressMetric === 'fasting' && progressData.length > 0 && (
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-semibold">Total</span>
                  </div>
                  <p className="text-4xl font-black">
                    {progressData.reduce((sum, d) => sum + d.value, 0)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">jours de jeûne</p>
                </div>
              )}
            </div>

            {/* Chart */}
            {progressData.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h2 className="text-xl font-bold mb-6">
                  {progressMetric === 'weight' && 'Évolution du poids'}
                  {progressMetric === 'steps' && 'Nombre de pas quotidiens'}
                  {progressMetric === 'training' && 'Séances par semaine'}
                  {progressMetric === 'fasting' && 'Distribution des jeûnes'}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  {(progressMetric === 'training' || progressMetric === 'fasting') ? (
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#fafafa'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={progressMetric === 'training' ? '#f43f5e' : '#a855f7'}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#71717a"
                        domain={progressMetric === 'weight' ? ['dataMin - 2', 'dataMax + 2'] : ['auto', 'auto']}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          borderRadius: '8px',
                          color: '#fafafa'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={progressMetric === 'weight' ? '#10b981' : '#3b82f6'}
                        strokeWidth={3}
                        dot={{ fill: progressMetric === 'weight' ? '#10b981' : '#3b82f6', r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {progressData.length === 0 && (
              <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
                <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Aucune donnée pour ce metric encore.</p>
                <p className="text-zinc-600 text-sm mt-2">Continue à tracker tes progrès !</p>
              </div>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {currentView === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Historique</h2>
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-400 transition"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(data)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, dayData]) => {
                  const status = getDayStatus(date);
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setCurrentView('today');
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        status === 'complete' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        status === 'partial' ? 'bg-amber-500/10 border-amber-500/30' :
                        status === 'incomplete' ? 'bg-rose-500/10 border-rose-500/30' :
                        'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold">
                            {new Date(date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400 flex-wrap">
                            {dayData.weight && <span>⚖️ {dayData.weight}kg</span>}
                            {dayData.training && <span>💪 {dayData.training.split('(')[0]}</span>}
                            {dayData.steps && <span>👣 {dayData.steps} pas</span>}
                            {dayData.fasting && <span>⏰ {dayData.fasting}</span>}
                            {dayData.hydration && <span>💧 Hydraté</span>}
                            {dayData.mood && dayData.mood.length > 0 && (
                              <span>{dayData.mood.join(' ')}</span>
                            )}
                          </div>
                          {dayData.comments && (
                            <p className="text-xs text-zinc-500 mt-2 italic">"{dayData.comments.substring(0, 80)}{dayData.comments.length > 80 ? '...' : ''}"</p>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'complete' ? 'bg-emerald-500' :
                          status === 'partial' ? 'bg-amber-500' :
                          status === 'incomplete' ? 'bg-rose-500' :
                          'bg-zinc-700'
                        }`}></div>
                      </div>
                    </button>
                  );
                })}
            </div>

            {Object.keys(data).length === 0 && (
              <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
                <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Aucune donnée encore.</p>
                <p className="text-zinc-600 text-sm mt-2">Commence à tracker dès aujourd'hui !</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformationTracker;
