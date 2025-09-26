// main.js - Updated with per-lesson subject features
document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // PWA SERVICE WORKER REGISTRATION
    // =================================================================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }

    // =================================================================================
    // CONFIGURATION & STATE
    // =================================================================================

    const originalDocTitle = document.title;
    const lessonTypes = {
        "main": { label: "Main Lesson", color: "#f59e0b" },
        "revision": { label: "Revision", color: "#3b82f6" },
        "notes": { label: "Notes", color: "#10b981" },
        "pastPaper": { label: "Past Paper", color: "#ff1a1aff" },
        "dailyMcq": { label: "Daily MCQ", color: "#8b5cf6" }
    };

    const appState = {
        totalDays: 30,
        startDate: new Date().toISOString().split('T')[0],
        daysCompleted: [],
        collapsedDays: [],
        customSubjects: {},
        studyGoals: { weekly_hours: 0, monthly_papers: 0 },
        currentEditingLesson: { day: null, id: null },
        draggedLessonInfo: { id: null, day: null, element: null },
        currentMonthOffset: 0,
        // Chart States
        subjectPieChart: null,
        weeklyBarChart: null,
        dailyTimeChart: null, 
        performanceChart: null,
        lessonTypePerformanceChart: null,
        efficiencyRatioChart: null, 
        pastPaperTrendChart: null, 
        productivityHeatmapChart: null,
        timeOfDayChart: null,
        // End Chart States
        activeTimer: {
            day: null,
            lessonId: null,
            startTime: null, 
            accumulatedSeconds: 0,
            intervalId: null
        },
        modalFocus: {
            triggerElement: null,
            untrapFocus: () => {}
        },
        currentLessonBankSubject: null,
        pipWindow: null, // State for the Picture-in-Picture window
        analyticsFilters: {
            dateRange: 'all',
            subjects: [],
            lessonTypes: []
        }
    };

    // =================================================================================
    // DOM ELEMENTS
    // =================================================================================
    
    const dayList = document.getElementById('dayList');
    const daysRemainingEl = document.getElementById('daysRemaining');
    const totalDaysInput = document.getElementById('totalDaysInput');
    const startDateInput = document.getElementById('startDateInput');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const studyStreakEl = document.getElementById('studyStreak');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const monthlyView = document.getElementById('monthlyView');
    const analyticsView = document.getElementById('analyticsView');
    const showDailyViewBtn = document.getElementById('showDailyViewBtn');
    const showMonthlyViewBtn = document.getElementById('showMonthlyViewBtn');
    const showAnalyticsViewBtn = document.getElementById('showAnalyticsViewBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthTitle = document.getElementById('currentMonthTitle');
    const searchInput = document.getElementById('searchInput');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const toastContainer = document.getElementById('toast-container');
    const quickActionsContainer = document.getElementById('quickActionsContainer');
    const goToTodayBtn = document.getElementById('goToTodayBtn');
    const kanbanView = document.getElementById('kanbanView');
    const showKanbanViewBtn = document.getElementById('showKanbanViewBtn');
    const kanbanBoard = document.getElementById('kanbanBoard');

    // Chart Canvases
    const subjectPieChartCtx = document.getElementById('subjectPieChart').getContext('2d');
    const weeklyBarChartCtx = document.getElementById('weeklyBarChart').getContext('2d');
    const dailyTimeChartCtx = document.getElementById('dailyTimeChart').getContext('2d');
    const performanceChartCtx = document.getElementById('performanceChart').getContext('2d');
    const lessonTypePerformanceChartCtx = document.getElementById('lessonTypePerformanceChart').getContext('2d');
    const efficiencyRatioChartCtx = document.getElementById('efficiencyRatioChart').getContext('2d'); 
    const pastPaperTrendChartCtx = document.getElementById('pastPaperTrendChart').getContext('2d'); 
    const productivityHeatmapChartCtx = document.getElementById('productivityHeatmapChart').getContext('2d');
    const timeOfDayChartCtx = document.getElementById('timeOfDayChart').getContext('2d');
    
    // Goal Elements
    const manageGoalsBtn = document.getElementById('manageGoalsBtn');
    const goalsModal = document.getElementById('goalsModal');
    const closeGoalsModalBtn = document.getElementById('closeGoalsModalBtn');
    const saveGoalsBtn = document.getElementById('saveGoalsBtn');
    const weeklyHoursGoalInput = document.getElementById('weeklyHoursGoalInput');
    const monthlyPapersGoalInput = document.getElementById('monthlyPapersGoalInput');
    const weeklyHoursProgressText = document.getElementById('weeklyHoursProgressText');
    const weeklyHoursProgressBar = document.getElementById('weeklyHoursProgressBar');
    const monthlyPapersProgressText = document.getElementById('monthlyPapersProgressText');
    const monthlyPapersProgressBar = document.getElementById('monthlyPapersProgressBar');

    // KPI Card Elements
    const kpiTotalTime = document.getElementById('kpiTotalTime');
    const kpiAvgTime = document.getElementById('kpiAvgTime');
    const kpiTopSubject = document.getElementById('kpiTopSubject');
    const kpiEfficiency = document.getElementById('kpiEfficiency');
    const kpiConsistency = document.getElementById('kpiConsistency');
    const kpiAvgSession = document.getElementById('kpiAvgSession');
    const kpiProductiveDay = document.getElementById('kpiProductiveDay');
    const kpiAvgScore = document.getElementById('kpiAvgScore');

    // Analytics Filters
    const filterDateRange = document.getElementById('filterDateRange');
    const filterSubjects = document.getElementById('filterSubjects');
    const filterLessonTypes = document.getElementById('filterLessonTypes');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    // Settings Modal Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

    // Subject Management Elements
    const manageSubjectsBtn = document.getElementById('manageSubjectsBtn');
    const subjectsModal = document.getElementById('subjectsModal');
    const closeSubjectsModalBtn = document.getElementById('closeSubjectsModalBtn');
    const subjectNameInput = document.getElementById('subjectNameInput');
    const subjectColorInput = document.getElementById('subjectColorInput');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const subjectsList = document.getElementById('subjectsList');
    const subjectFileInput = document.getElementById('subjectFileInput');

    // Subject Files Modal Elements
    const subjectFilesModal = document.getElementById('subjectFilesModal');
    const subjectFilesModalTitle = document.getElementById('subjectFilesModalTitle');
    const subjectFilesList = document.getElementById('subjectFilesList');
    const closeSubjectFilesModalBtn = document.getElementById('closeSubjectFilesModalBtn');

    // Lesson Modal Elements
    const lessonModal = document.getElementById('lessonModal');
    const lessonModalTitle = document.getElementById('lessonModalTitle');
    const lessonSubjectSelect = document.getElementById('lessonSubjectSelect'); // New
    const lessonTextarea = document.getElementById('lessonTextarea');
    const lessonTypeSelect = document.getElementById('lessonTypeSelect');
    const closeLessonModalBtn = document.getElementById('closeLessonModalBtn');
    const saveLessonBtn = document.getElementById('saveLessonBtn');
    const estimatedTimeInput = document.getElementById('estimatedTimeInput');
    const checklistEditorList = document.getElementById('checklistEditorList');
    const checklistItemInput = document.getElementById('checklistItemInput');
    const addChecklistItemBtn = document.getElementById('addChecklistItemBtn');
    const addFromBankBtn = document.getElementById('addFromBankBtn');

    // Past Paper DOM Elements
    const pastPaperFields = document.getElementById('pastPaperFields');
    const pastPaperYearInput = document.getElementById('pastPaperYearInput');
    const pastPaperPartSelect = document.getElementById('pastPaperPartSelect');
    const pastPaperPartIFields = document.getElementById('pastPaperPartIFields');
    const pastPaperMarksObtainedInput = document.getElementById('pastPaperMarksObtainedInput');
    const pastPaperPartIIFields = document.getElementById('pastPaperPartIIFields');
    const pastPaperQuestionsList = document.getElementById('pastPaperQuestionsList');
    const addPastPaperQuestionBtn = document.getElementById('addPastPaperQuestionBtn');
    const pastPaperTotalMarksInput = document.getElementById('pastPaperTotalMarksInput');

    // Daily MCQ DOM Elements
    const dailyMcqFields = document.getElementById('dailyMcqFields');
    const dailyMcqCountInput = document.getElementById('dailyMcqCountInput');
    const dailyMcqMarksObtainedInput = document.getElementById('dailyMcqMarksObtainedInput');
    
    // Confirmation Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalText = document.getElementById('confirmModalText');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmOkBtn = document.getElementById('confirmOkBtn');

    // Lesson Bank Modal Elements
    const lessonBankModal = document.getElementById('lessonBankModal');
    const closeLessonBankModalBtn = document.getElementById('closeLessonBankModalBtn');
    const manageLessonsBtn = document.getElementById('manageLessonsBtn');
    const lessonBankSubjectsContainer = document.getElementById('lessonBankSubjectsContainer');
    const lessonBankCurrentSubjectTitle = document.getElementById('lessonBankCurrentSubjectTitle');
    const addLessonToBankInput = document.getElementById('addLessonToBankInput');
    const addLessonToBankBtn = document.getElementById('addLessonToBankBtn');
    const lessonBankLessonsList = document.getElementById('lessonBankLessonsList');
    
    // Lesson Bank Picker Modal Elements
    const lessonBankPickerModal = document.getElementById('lessonBankPickerModal');
    const closeLessonBankPickerModalBtn = document.getElementById('closeLessonBankPickerModalBtn');
    const lessonBankPickerList = document.getElementById('lessonBankPickerList');
    

    // =================================================================================
    // INITIALIZATION
    // =================================================================================
    
    function initializeState() {
        appState.totalDays = localStorage.getItem('totalDays') ? parseInt(localStorage.getItem('totalDays')) : 30;
        appState.startDate = localStorage.getItem('startDate') || new Date().toISOString().split('T')[0];
        appState.daysCompleted = localStorage.getItem('daysCompleted') ? JSON.parse(localStorage.getItem('daysCompleted')) : [];
        appState.collapsedDays = localStorage.getItem('collapsedDays') ? JSON.parse(localStorage.getItem('collapsedDays')) : [];
        appState.studyGoals = JSON.parse(localStorage.getItem('studyGoals')) || { weekly_hours: 0, monthly_papers: 0 };

        let subjects = JSON.parse(localStorage.getItem('customSubjects')) || {
            "ICT": "#2dd4bf", "BS": "#38bdf8", "ECON": "#fb923c"
        };
        
        let needsUpdate = false;
        Object.keys(subjects).forEach(key => {
            if (typeof subjects[key] === 'string') {
                subjects[key] = { color: subjects[key], files: [], lessons: [] };
                needsUpdate = true;
            } else {
                 if (!subjects[key].files) {
                    subjects[key].files = [];
                    needsUpdate = true;
                }
                if (!subjects[key].lessons) {
                    subjects[key].lessons = [];
                    needsUpdate = true;
                }
            }
        });
        
        appState.customSubjects = subjects;
        if (needsUpdate) {
            saveSubjects();
        }
        
        // This block initializes the Kanban board data if it doesn't exist
        if (!localStorage.getItem('kanbanData')) {
            const defaultKanbanData = {
                "Backlog": [],
                "In Progress": [],
                "Completed": []
            };
            localStorage.setItem('kanbanData', JSON.stringify(defaultKanbanData));
        }
        
        totalDaysInput.value = appState.totalDays;
        startDateInput.value = appState.startDate;
        
        updateGoalProgressDisplay();
        initializeTheme();
        initializeAnalyticsFilters();
    }

    // =================================================================================
    // UTILITY FUNCTIONS
    // =================================================================================
    
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('File path copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy path:', err);
            showToast('Failed to copy path.', 'error');
        }
    }

    // =================================================================================
    // RENDER & UI FUNCTIONS
    // =================================================================================

    function calculateStudyStreak() {
        if (!appState.startDate || appState.daysCompleted.length === 0) {
            return 0;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(appState.startDate);
        startDate.setHours(0, 0, 0, 0);

        const todayDayNum = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

        let streak = 0;
        let currentDayToCheck = todayDayNum;
        const completedDaysSet = new Set(appState.daysCompleted);

        if (!completedDaysSet.has(todayDayNum)) {
            currentDayToCheck--;
        }

        while (currentDayToCheck > 0) {
            if (completedDaysSet.has(currentDayToCheck)) {
                streak++;
                currentDayToCheck--;
            } else {
                break; 
            }
        }
        return streak;
    }

    function updateProgress() {
        const completedCount = appState.daysCompleted.length;
        const remainingCount = appState.totalDays - completedCount;
        const progressPercentage = appState.totalDays > 0 ? (completedCount / appState.totalDays) * 100 : 0;

        daysRemainingEl.textContent = remainingCount;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${Math.round(progressPercentage)}% Complete`;
        studyStreakEl.textContent = calculateStudyStreak();
        updateGoalProgressDisplay();
    }
    
    function formatTime(minutes, showSeconds = false) {
        if (isNaN(minutes) || minutes < 0) minutes = 0;
        if (showSeconds) {
            const totalSeconds = Math.floor(minutes * 60);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            let parts = [];
            if (h > 0) parts.push(String(h).padStart(2, '0'));
            parts.push(String(m).padStart(2, '0'));
            parts.push(String(s).padStart(2, '0'));
            return parts.join(':');
        } else {
            const h = Math.floor(minutes / 60);
            const m = Math.round(minutes % 60);
            if (h > 0 && m > 0) return `${h}h ${m}m`;
            if (h > 0) return `${h}h`;
            return `${m}m`;
        }
    }

    const templates = {
        lesson: (note, day) => {
            const isRunning = appState.activeTimer.day == day && appState.activeTimer.lessonId == note.id;
            const timerButtonText = isRunning ? "Pause" : (note.actualTime > 0 ? "Resume" : "Start");
            const timerButtonClass = isRunning ? "pause-btn" : "start-btn";
            const pipButtonSupported = 'documentPictureInPicture' in window;
            
            // New: Subject-related variables
            const subjectData = appState.customSubjects[note.subject];
            const subjectColor = subjectData?.color || '#9ca3af';
            const subjectName = note.subject || 'Unassigned';
            const hasFiles = subjectData && subjectData.files && subjectData.files.length > 0;

            const pipButtonHtml = isRunning && pipButtonSupported ? `
                <button class="pip-btn" data-action="enter-pip" data-day="${day}" data-lesson-id="${note.id}" title="Picture-in-Picture">
                    <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2zm-6-5h4m4 5h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2v4z"></path></svg>
                </button>
            ` : '';

            let checklistHtml = '';
            if (note.checklist && note.checklist.length > 0) {
                const completedCount = note.checklist.filter(item => item.completed).length;
                const totalCount = note.checklist.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                
                const itemsHtml = note.checklist.map(item => `
                    <li class="flex items-center space-x-2 text-sm ${item.completed ? 'opacity-60' : ''}">
                        <input type="checkbox" class="checklist-item-checkbox w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400" data-day="${day}" data-lesson-id="${note.id}" data-checklist-id="${item.id}" ${item.completed ? 'checked' : ''}>
                        <label class="${item.completed ? 'line-through' : ''}">${escapeHtml(item.text)}</label>
                    </li>
                `).join('');

                checklistHtml = `
                    <div class="mt-3 pt-2 border-t">
                        <div class="w-full progress-bar-bg rounded-full h-1.5 mb-2">
                            <div class="bg-green-500 h-1.5 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <ul class="space-y-1">${itemsHtml}</ul>
                    </div>
                `;
            }

            let pastPaperDetailsHtml = '';
            if (note.type === 'pastPaper' && note.pastPaperData) {
                const { year, part, questions = [], totalMarks, marksObtained } = note.pastPaperData;
                let resultHtml = '';
                let mainTitle = `${year || ''} ${part || ''}`.trim();

                if (part === 'Part I') {
                    if (marksObtained && totalMarks) {
                       resultHtml = `<span class="font-bold block mt-1">${marksObtained} / ${totalMarks}</span>`;
                    }
                } else if (part === 'Part II') {
                    const obtainedMarks = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
                    if (questions.length > 0) {
                        const questionMarksStr = questions.map(q => `${q.number}. ${q.marks || '0'}`).join(' ');
                        mainTitle += ` - ${questionMarksStr}`;
                    }
                    if(totalMarks) {
                        resultHtml = `<span class="font-bold block mt-1">Total = ${obtainedMarks.toFixed(2)} / ${totalMarks}</span>`;
                    }
                }
                
                pastPaperDetailsHtml = `<div class="font-semibold">${escapeHtml(mainTitle)}${resultHtml}</div>`;
            }
            
            let mcqDetailsHtml = '';
            if (note.type === 'dailyMcq' && note.mcqData) {
                const { count, marks } = note.mcqData;
                if (count && marks) {
                    mcqDetailsHtml = `<div class="font-semibold">${marks} / ${count} MCQs</div>`;
                }
            }

            let revisionSourceHtml = '';
            if (note.type === 'revision' && note.sourceLesson) {
                revisionSourceHtml = `<p class="text-xs opacity-60 mt-1">From: Day ${note.sourceLesson.day} Lesson</p>`;
            }
            
            // New: View Files button per lesson
            const viewFilesButton = hasFiles 
                ? `<button class="btn-files p-1 rounded-full" data-action="view-files" data-subject="${note.subject}" title="View Files for ${note.subject}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg></button>` 
                : '';

            return `
                <div class="lesson-entry p-3" style="border-left-color: ${subjectColor}; border-left-width: 4px;" data-day="${day}" data-lesson-id="${note.id}" draggable="true">
                    <div class="flex items-start justify-between">
                        <div class="flex-grow">
                             <span class="text-xs font-semibold block" style="color: ${lessonTypes[note.type]?.color || '#ffffff'};">${lessonTypes[note.type]?.label || 'Standard'}</span>
                             <div class="flex items-center gap-2">
                                <span class="font-bold text-sm" style="color: ${subjectColor};">${escapeHtml(subjectName)}</span>
                                ${viewFilesButton}
                             </div>
                        </div>
                    </div>
                    
                    ${pastPaperDetailsHtml}
                    ${mcqDetailsHtml}
                    <p class="mt-1">${escapeHtml(note.text)}</p>
                    ${revisionSourceHtml}
                    ${checklistHtml}
                    
                    <div class="flex items-center justify-between text-sm opacity-70 mt-2">
                        <span>Est: ${formatTime(note.estimatedTime)}</span>
                        <span class="actual-time-display" data-day="${day}" data-lesson-id="${note.id}">Act: ${formatTime(note.actualTime)}</span>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <div class="flex-grow flex space-x-2">
                            <button class="timer-button w-full text-white font-bold py-1 px-2 rounded-lg ${timerButtonClass}" data-action="toggle-timer" data-day="${day}" data-lesson-id="${note.id}">${timerButtonText}</button>
                            ${note.actualTime > 0 ? `<button class="timer-button w-full text-white font-bold py-1 px-2 rounded-lg reset-btn" data-action="reset-timer" data-day="${day}" data-lesson-id="${note.id}">Reset</button>` : ''}
                        </div>
                        <div class="flex space-x-2 flex-shrink-0 ml-4">
                            ${pipButtonHtml}
                            <button class="edit-lesson-btn hover:text-sky-400" data-action="edit" data-day="${day}" data-lesson-id="${note.id}" title="Edit" aria-label="Edit lesson"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                            <button class="delete-lesson-btn hover:text-red-500" data-action="delete" data-day="${day}" data-lesson-id="${note.id}" title="Delete" aria-label="Delete lesson"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    function renderDays() {
        dayList.innerHTML = '';
        const baseDate = new Date(appState.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= appState.totalDays; i++) {
            const dayNotes = JSON.parse(localStorage.getItem(`dayNotes-${i}`) || '[]');
            const dayNotesText = localStorage.getItem(`dayNotesText-${i}`) || '';
            const isCompleted = appState.daysCompleted.includes(i);
            const isCollapsed = appState.collapsedDays.includes(i);
            
            const totalEstimatedTime = dayNotes.reduce((sum, note) => sum + (note.estimatedTime || 0), 0);
            const totalActualTime = dayNotes.reduce((sum, note) => sum + (note.actualTime || 0), 0);
            
            const currentDate = new Date(baseDate);
            currentDate.setDate(baseDate.getDate() + i - 1);
            const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            const isToday = currentDate.getTime() === today.getTime();
            
            const dayCard = document.createElement('div');
            
            let cardClassList = ['card', 'p-4', 'rounded-xl', 'flex', 'flex-col', 'space-y-4'];
            if (isCompleted) cardClassList.push('completed');
            if (isToday) cardClassList.push('border-2', 'border-cyan-400');
            dayCard.className = cardClassList.join(' ');
            dayCard.dataset.dayId = i;
            dayCard.dataset.collapsed = isCollapsed;
            dayCard.style.animationDelay = `${(i % 3) * 100}ms`;
            
            const notesHtml = dayNotes.map(note => templates.lesson(note, i)).join('');
            const todayBadge = isToday ? `<span class="bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">Today</span>` : '';
            const collapseIconSVG = `<svg class="w-6 h-6 collapse-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;

            // New: Generate summary of subjects for the day
            const daySubjects = [...new Set(dayNotes.map(n => n.subject).filter(Boolean))];
            const subjectsSummaryHtml = daySubjects.map(subjectName => {
                const subjectColor = appState.customSubjects[subjectName]?.color || '#9ca3af';
                return `<span class="font-semibold text-xs py-1 px-2 rounded-full text-white" style="background-color: ${subjectColor}">${subjectName}</span>`;
            }).join(' ');

            dayCard.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center flex-grow cursor-pointer" data-action="toggle-collapse" data-day="${i}">
                         ${collapseIconSVG}
                        <h3 class="day-title text-xl font-bold ml-2">Day ${i} <span class="text-sm font-normal opacity-70">${formattedDate}</span>${todayBadge}</h3>
                    </div>
                    <div class="flex items-center">
                        <label class="inline-flex items-center cursor-pointer ml-2">
                            <input type="checkbox" data-day="${i}" class="sr-only peer" ${isCompleted ? 'checked' : ''}>
                            <div class="relative w-11 h-6 bg-gray-400 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-500"></div>
                        </label>
                    </div>
                </div>
                <div class="collapsed-summary">
                    <div class="flex justify-between items-center text-sm p-2 rounded-lg">
                        <div class="flex flex-wrap gap-2">${subjectsSummaryHtml || 'No Subjects'}</div>
                        <div class="flex space-x-4 flex-shrink-0 ml-2">
                            <span>Est: <b>${formatTime(totalEstimatedTime)}</b></span>
                            <span>Act: <b>${formatTime(totalActualTime)}</b></span>
                        </div>
                    </div>
                </div>
                <div class="collapsible-content flex flex-col space-y-4">
                    <div class="text-xs opacity-80 border-t border-b py-1 flex justify-between">
                        <span>Total Estimated: <b>${formatTime(totalEstimatedTime)}</b></span>
                        <span>Total Actual: <b>${formatTime(totalActualTime)}</b></span>
                    </div>
                    <div class="lessons-container space-y-2 min-h-[50px]" data-day="${i}">${notesHtml}</div>
                    <button data-day="${i}" data-action="add" class="add-lesson-btn w-full btn btn-primary">+ Add Lesson</button>
                    <div class="day-notes-container mt-2 border-t pt-2">
                        <textarea class="day-notes-textarea w-full p-2 text-sm border-none rounded glass-input" rows="2" placeholder="Notes for the day...">${escapeHtml(dayNotesText)}</textarea>
                    </div>
                </div>
            `;
            
            dayList.appendChild(dayCard);
        }
        updateProgress();
    }

    function renderKanbanView() {
        kanbanBoard.innerHTML = '';
        const kanbanData = JSON.parse(localStorage.getItem('kanbanData'));

        for (const columnName in kanbanData) {
            const columnEl = document.createElement('div');
            columnEl.className = 'kanban-column glass-card';
            
            const lessonsHtml = kanbanData[columnName].map(note => templates.lesson(note, columnName)).join('');

            columnEl.innerHTML = `
                <div class="kanban-column-header">${columnName} (${kanbanData[columnName].length})</div>
                <div class="kanban-cards space-y-3" data-column-name="${columnName}">${lessonsHtml}</div>
                <button data-column-name="${columnName}" data-action="add-kanban" class="add-lesson-btn w-full btn btn-primary">+ Add Lesson</button>
            `;
            kanbanBoard.appendChild(columnEl);
        }
    }

    function renderMonthlyView() {
        const monthlyCalendar = monthlyView.querySelector('.monthly-calendar');
        monthlyCalendar.innerHTML = '';
        
        const displayDate = new Date();
        displayDate.setDate(1); 
        displayDate.setMonth(displayDate.getMonth() + appState.currentMonthOffset);
        
        const year = displayDate.getFullYear();
        const month = displayDate.getMonth();
        
        currentMonthTitle.textContent = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dayNames.forEach(day => {
            const headerCell = document.createElement('div');
            headerCell.className = 'monthly-day-header';
            headerCell.textContent = day;
            monthlyCalendar.appendChild(headerCell);
        });
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            const padCell = document.createElement('div');
            padCell.className = 'monthly-day-cell other-month';
            monthlyCalendar.appendChild(padCell);
        }
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            const currentDate = new Date(year, month, i);
            currentDate.setHours(0,0,0,0);
            const planStartDate = new Date(appState.startDate);
            planStartDate.setHours(0,0,0,0);

            const dayNumber = Math.floor((currentDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            let dayContent = `<div class="day-number">${i}</div>`;
            let cellClass = 'monthly-day-cell';
            
            if (dayNumber >= 1 && dayNumber <= appState.totalDays) {
                cellClass += ' plan-day';
                const dayNotes = JSON.parse(localStorage.getItem(`dayNotes-${dayNumber}`) || '[]');
                if (appState.daysCompleted.includes(dayNumber)) cellClass += ' completed';
                
                const daySubjects = [...new Set(dayNotes.map(n => n.subject).filter(Boolean))];
                if (daySubjects.length > 0) {
                     dayContent += `<div class="flex flex-wrap gap-1 mt-1">${daySubjects.map(s => `<div class="subject-tag-small" style="background-color: ${appState.customSubjects[s]?.color || '#9ca3af'};" title="${s}"></div>`).join('')}</div>`;
                }

                if (dayNotes.length > 0) {
                    dayContent += `<div class="lesson-count mt-auto">${dayNotes.length} Lessons</div>`;
                }

                dayCell.onclick = () => {
                    setView('daily');
                    setTimeout(() => {
                        const targetCard = dayList.querySelector(`[data-day-id="${dayNumber}"]`);
                        targetCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                };
            } else {
                 cellClass += ' other-month';
            }
            
            dayCell.className = cellClass;
            dayCell.innerHTML = dayContent;
            monthlyCalendar.appendChild(dayCell);
        }
    }
    
    function setView(view) {
        [dayList, monthlyView, analyticsView, kanbanView, noResultsMessage].forEach(el => el.classList.add('hidden')); // Add kanbanView
        [showDailyViewBtn, showMonthlyViewBtn, showAnalyticsViewBtn, showKanbanViewBtn].forEach(btn => { // Add showKanbanViewBtn
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });

        const activateButton = (btn) => {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        };
        
        if (view === 'daily') {
            dayList.classList.remove('hidden');
            activateButton(showDailyViewBtn);
            renderDays();
            handleSearch();
        } else if (view === 'monthly') {
            monthlyView.classList.remove('hidden');
            activateButton(showMonthlyViewBtn);
            renderMonthlyView();
        } else if (view === 'analytics') {
            analyticsView.classList.remove('hidden');
            activateButton(showAnalyticsViewBtn);
            renderAnalytics();
        } else if (view === 'kanban') { // ADD THIS ELSE IF BLOCK
            kanbanView.classList.remove('hidden');
            activateButton(showKanbanViewBtn);
            renderKanbanView();
        }
    }

    // =================================================================================
    // ANALYTICS LOGIC (REFACTORED)
    // =================================================================================

    function getFilteredStudyData(filters) {
        let lessons = [];
        let sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        const planStartDate = new Date(appState.startDate);

        let startDate = new Date(-8640000000000000); // Far past
        let endDate = new Date(8640000000000000); // Far future

        if (filters.dateRange !== 'all') {
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            startDate = new Date();
            startDate.setDate(endDate.getDate() - (parseInt(filters.dateRange) -1) );
            startDate.setHours(0, 0, 0, 0);
        }
        
        for (let i = 1; i <= appState.totalDays; i++) {
            const dayDate = new Date(planStartDate);
            dayDate.setDate(planStartDate.getDate() + i - 1);

            if (dayDate >= startDate && dayDate <= endDate) {
                const dayNotes = JSON.parse(localStorage.getItem(`dayNotes-${i}`) || '[]');
                
                dayNotes.forEach(note => {
                    // Updated: Match subject from the note itself
                    const subjectMatch = filters.subjects.length === 0 || filters.subjects.includes(note.subject);
                    const typeMatch = filters.lessonTypes.length === 0 || filters.lessonTypes.includes(note.type);

                    if (subjectMatch && typeMatch) {
                        lessons.push({ ...note, day: i, date: dayDate }); // note.subject is already part of note
                    }
                });
            }
        }
        
        const filteredSessions = sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return sessionDate >= startDate && sessionDate <= endDate;
        });

        return { lessons, sessions: filteredSessions };
    }

    function renderAnalytics() {
        Object.keys(appState).forEach(key => {
            if (key.endsWith('Chart') && appState[key]) {
                appState[key].destroy();
                appState[key] = null;
            }
        });

        const { lessons, sessions } = getFilteredStudyData(appState.analyticsFilters);

        const isDarkMode = document.documentElement.classList.contains('dark');
        const chartTextColor = isDarkMode ? '#c9d1d9' : '#1e293b';
        const chartGridColor = isDarkMode ? 'rgba(139, 148, 158, 0.2)' : 'rgba(30, 41, 59, 0.1)';
        
        // --- Render KPIs ---
        renderKpiCards(lessons, sessions);

        // --- Render Charts ---
        const timeOfDayData = getTimeOfDayData(sessions);
        appState.timeOfDayChart = new Chart(timeOfDayChartCtx, {
            type: 'radar',
            data: { labels: timeOfDayData.labels, datasets: [{ label: 'Study Time', data: timeOfDayData.data, backgroundColor: 'rgba(0, 224, 198, 0.3)', borderColor: 'rgb(0, 224, 198)', pointBackgroundColor: 'rgb(0, 224, 198)' }] },
            options: { scales: { r: { beginAtZero: true, ticks: { color: chartTextColor, backdropColor: 'transparent', callback: v => formatTime(v) }, grid: { color: chartGridColor }, pointLabels: { color: chartTextColor } } }, plugins: { legend: { display: false } } }
        });

        const heatmapData = getHeatmapData(sessions);
        appState.productivityHeatmapChart = new Chart(productivityHeatmapChartCtx, {
            type: 'bubble',
            data: { 
                datasets: [{ 
                    label: 'Study Time', 
                    data: heatmapData.data, 
                    backgroundColor: heatmapData.colors, 
                    borderColor: 'transparent',
                    pointStyle: 'rect'
                }] 
            },
            options: {
                aspectRatio: 3.4,
                plugins: { legend: false, tooltip: { callbacks: { label: (ctx) => `${heatmapData.dayLabels[ctx.raw.y]}, ${ctx.raw.x}:00: ${formatTime(ctx.raw.v)}` } } },
                scales: {
                    x: { 
                        type: 'category', 
                        labels: Array.from({ length: 24 }, (_, i) => i), 
                        ticks: { color: chartTextColor, callback: (v, i) => i % 2 === 0 ? v : '', autoSkip: false }, 
                        grid: { color: chartGridColor },
                        title: { display: true, text: 'Hour of Day', color: chartTextColor }
                    },
                    y: { 
                        type: 'category', 
                        labels: heatmapData.dayLabels, 
                        ticks: { color: chartTextColor }, 
                        grid: { color: chartGridColor },
                        title: { display: true, text: 'Day of Week', color: chartTextColor }
                    }
                }
            }
        });

        const pastPaperData = getPastPaperTrendData(lessons);
        appState.pastPaperTrendChart = new Chart(pastPaperTrendChartCtx, {
            type: 'line',
            data: { labels: pastPaperData.labels, datasets: [{ label: 'Score %', data: pastPaperData.data, borderColor: '#2dd4bf', backgroundColor: 'rgba(45, 212, 191, 0.2)', fill: true, tension: 0.1 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { color: chartTextColor, callback: (v) => `${v}%` }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } } }
        });

        const efficiencyData = getEfficiencyData(lessons);
        appState.efficiencyRatioChart = new Chart(efficiencyRatioChartCtx, {
            type: 'bar',
            data: { labels: efficiencyData.labels, datasets: [{ label: 'Efficiency Ratio', data: efficiencyData.data, backgroundColor: efficiencyData.colors }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: chartTextColor, callback: (v) => `${(v * 100).toFixed(0)}%` }, grid: { color: chartGridColor }, title: { display: true, text: 'Actual / Estimated', color: chartTextColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } } }
        });

        const subjectData = getSubjectData(lessons);
        appState.subjectPieChart = new Chart(subjectPieChartCtx, {
            type: 'pie',
            data: { labels: subjectData.labels, datasets: [{ data: subjectData.data, backgroundColor: subjectData.colors }] },
            options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: chartTextColor } } } }
        });

        const weeklyData = getWeeklyData(lessons);
        appState.weeklyBarChart = new Chart(weeklyBarChartCtx, {
            type: 'bar',
            data: { labels: weeklyData.labels, datasets: [{ label: 'Lessons Completed', data: weeklyData.data, backgroundColor: '#38bdf8', borderRadius: 5 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: chartTextColor }, grid: { color: chartGridColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } } }
        });

        const dailyTimeData = getDailySubjectTimeData(lessons);
        appState.dailyTimeChart = new Chart(dailyTimeChartCtx, {
            type: 'bar',
            data: { labels: dailyTimeData.labels, datasets: dailyTimeData.datasets },
            options: {
                responsive: true, plugins: { legend: { position: 'top', labels: { color: chartTextColor } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: ${formatTime(c.parsed.y)}` } } },
                scales: { x: { stacked: true, ticks: { color: chartTextColor }, grid: { color: chartGridColor } }, y: { stacked: true, beginAtZero: true, ticks: { color: chartTextColor, callback: (v) => formatTime(v) }, grid: { color: chartGridColor }, title: { display: true, text: 'Total Time Studied', color: chartTextColor } } }
            }
        });

        const performanceData = getPerformanceData(lessons);
        appState.performanceChart = new Chart(performanceChartCtx, {
            type: 'bar',
            data: { labels: performanceData.labels, datasets: [ { label: 'Estimated Time', data: performanceData.estimatedData, backgroundColor: 'rgba(56, 189, 248, 0.6)', borderRadius: 5 }, { label: 'Actual Time', data: performanceData.actualData, backgroundColor: 'rgba(56, 189, 248, 1)', borderRadius: 5 } ] },
            options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: chartTextColor } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: ${formatTime(c.parsed.y)}` } } }, scales: { y: { beginAtZero: true, ticks: { color: chartTextColor, callback: (v) => formatTime(v) }, grid: { color: chartGridColor }, title: { display: true, text: 'Total Time', color: chartTextColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } } }
        });

        const lessonTypePerformanceData = getLessonTypePerformanceData(lessons);
        appState.lessonTypePerformanceChart = new Chart(lessonTypePerformanceChartCtx, {
            type: 'bar',
            data: { labels: lessonTypePerformanceData.labels, datasets: [ { label: 'Estimated Time', data: lessonTypePerformanceData.estimatedData, backgroundColor: 'rgba(251, 146, 60, 0.6)', borderRadius: 5 }, { label: 'Actual Time', data: lessonTypePerformanceData.actualData, backgroundColor: 'rgba(251, 146, 60, 1)', borderRadius: 5 } ] },
            options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: chartTextColor } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label || ''}: ${formatTime(c.parsed.y)}` } } }, scales: { y: { beginAtZero: true, ticks: { color: chartTextColor, callback: (v) => formatTime(v) }, grid: { color: chartGridColor }, title: { display: true, text: 'Total Time', color: chartTextColor } }, x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } } } }
        });
    }

    // =================================================================================
    // DATA & STATE LOGIC
    // =================================================================================

    function scheduleRevisionsForDay(dayNumber) {
        const lessons = JSON.parse(localStorage.getItem(`dayNotes-${dayNumber}`) || '[]');
        const mainLessons = lessons.filter(l => l.type === 'main');
        if (mainLessons.length === 0) return;
        const revisionIntervals = [1, 7, 16, 35];
        const dayDate = new Date(appState.startDate);
        dayDate.setDate(dayDate.getDate() + dayNumber - 1);
        let scheduledCount = 0;
        mainLessons.forEach(lesson => {
            revisionIntervals.forEach(interval => {
                const targetDate = new Date(dayDate);
                targetDate.setDate(dayDate.getDate() + interval);
                const planStartDate = new Date(appState.startDate);
                const targetDayNumber = Math.floor((targetDate - planStartDate) / (1000 * 60 * 60 * 24)) + 1;
                if (targetDayNumber > 0 && targetDayNumber <= appState.totalDays) {
                    let targetDayNotes = JSON.parse(localStorage.getItem(`dayNotes-${targetDayNumber}`) || '[]');
                    const alreadyExists = targetDayNotes.some(n => n.sourceLesson && n.sourceLesson.id === lesson.id);
                    if (!alreadyExists) {
                        targetDayNotes.push({ id: Date.now() + interval, text: `Revision: ${lesson.text}`, subject: lesson.subject, type: 'revision', estimatedTime: Math.max(15, Math.round((lesson.estimatedTime || 30) / 2)), actualTime: 0, checklist: [], sourceLesson: { day: dayNumber, id: lesson.id } });
                        localStorage.setItem(`dayNotes-${targetDayNumber}`, JSON.stringify(targetDayNotes));
                        scheduledCount++;
                    }
                }
            });
        });
        if (scheduledCount > 0) showToast(`${scheduledCount} revision session(s) scheduled.`, 'success');
    }

    // --- KPI AND CHART DATA FUNCTIONS (REFACTORED) ---
    
    function renderKpiCards(lessons, sessions) {
        const totalAct = lessons.reduce((sum, l) => sum + (l.actualTime || 0), 0);
        kpiTotalTime.textContent = formatTime(totalAct) || '0m';

        const uniqueDays = new Set(lessons.map(l => l.day));
        const avgTime = uniqueDays.size > 0 ? totalAct / uniqueDays.size : 0;
        kpiAvgTime.textContent = formatTime(avgTime) || '0m';

        const totalEst = lessons.reduce((sum, l) => sum + (l.estimatedTime || 0), 0);
        const efficiency = totalEst > 0 ? (totalAct / totalEst) * 100 : 0;
        kpiEfficiency.textContent = efficiency > 0 ? `${efficiency.toFixed(0)}%` : 'N/A';
        
        // Updated: Top subject calculation
        const timeData = {};
        lessons.forEach(l => {
            if (l.subject) {
                timeData[l.subject] = (timeData[l.subject] || 0) + (l.actualTime || 0);
            }
        });
        let topSubject = 'N/A';
        let maxTime = 0;
        Object.entries(timeData).forEach(([subject, time]) => {
            if (time > maxTime) {
                maxTime = time;
                topSubject = subject;
            }
        });
        kpiTopSubject.textContent = topSubject;

        const totalPlannedDays = uniqueDays.size;
        const studiedDays = new Set(sessions.map(s => new Date(s.startTime).toDateString())).size;
        const consistency = totalPlannedDays > 0 ? (studiedDays / totalPlannedDays) * 100 : 0;
        kpiConsistency.textContent = consistency > 0 ? `${consistency.toFixed(0)}%` : 'N/A';

        const avgSession = sessions.length > 0 ? (sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length) : 0;
        kpiAvgSession.textContent = formatTime(avgSession) || '0m';
        
        const dayTimes = sessions.reduce((acc, s) => {
            const day = new Date(s.startTime).toLocaleString('en-us', { weekday: 'short' });
            acc[day] = (acc[day] || 0) + s.duration;
            return acc;
        }, {});
        const productiveDay = Object.keys(dayTimes).length > 0 ? Object.keys(dayTimes).reduce((a, b) => dayTimes[a] > dayTimes[b] ? a : b) : 'N/A';
        kpiProductiveDay.textContent = productiveDay;

        const pastPapers = lessons.filter(l => l.type === 'pastPaper');
        let totalScore = 0, paperCount = 0;
        pastPapers.forEach(pp => {
            const { part, marksObtained, totalMarks, questions } = pp.pastPaperData || {};
            let obtained = 0;
            let total = parseFloat(totalMarks);
            if(total > 0) {
                 if (part === 'Part I' && marksObtained) obtained = parseFloat(marksObtained);
                 else if (part === 'Part II' && questions) obtained = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
                 if(obtained > 0) {
                    totalScore += (obtained / total) * 100;
                    paperCount++;
                 }
            }
        });
        const avgScore = paperCount > 0 ? totalScore / paperCount : 0;
        kpiAvgScore.textContent = avgScore > 0 ? `${avgScore.toFixed(0)}%` : 'N/A';
    }

    function getSubjectData(lessons) {
        const subjectCounts = {};
        lessons.forEach(l => {
            if (l.subject) {
                subjectCounts[l.subject] = (subjectCounts[l.subject] || 0) + 1;
            }
        });
        if (Object.keys(subjectCounts).length === 0) return { labels: ['No Data'], data: [1], colors: ['#4b5563'] };
        const labels = Object.keys(subjectCounts);
        const data = labels.map(label => subjectCounts[label]);
        const colors = labels.map(label => appState.customSubjects[label]?.color || '#9ca3af');
        return { labels, data, colors };
    }

    function getWeeklyData(lessons) {
        const lessonsPerWeek = {};
        lessons.forEach(l => {
            const weekNumber = Math.floor((l.day - 1) / 7);
            lessonsPerWeek[weekNumber] = (lessonsPerWeek[weekNumber] || 0) + 1;
        });
        const labels = Object.keys(lessonsPerWeek).map(week => `Week ${parseInt(week) + 1}`);
        const data = Object.values(lessonsPerWeek);
        return { labels, data };
    }

    function getDailySubjectTimeData(lessons) {
        const dailyData = {};
        lessons.forEach(l => {
            const dayLabel = `Day ${l.day}`;
            if (!dailyData[dayLabel]) dailyData[dayLabel] = {};
            if(l.subject) {
                dailyData[dayLabel][l.subject] = (dailyData[dayLabel][l.subject] || 0) + (l.actualTime || 0);
            }
        });

        const labels = Object.keys(dailyData).sort((a,b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
        const subjectTimeData = {};
        Object.keys(appState.customSubjects).forEach(sub => {
            subjectTimeData[sub] = labels.map(day => dailyData[day][sub] || 0);
        });

        const datasets = Object.keys(subjectTimeData).map(subject => ({
            label: subject, data: subjectTimeData[subject], backgroundColor: appState.customSubjects[subject]?.color || '#9ca3af',
        }));

        return { labels, datasets };
    }

    function getPerformanceData(lessons) {
        const timeData = {};
        Object.keys(appState.customSubjects).forEach(sub => timeData[sub] = { est: 0, act: 0 });
        lessons.forEach(note => {
            if (note.subject && timeData[note.subject]) {
                timeData[note.subject].est += note.estimatedTime || 0;
                timeData[note.subject].act += note.actualTime || 0;
            }
        });
        const labels = Object.keys(timeData);
        const estimatedData = labels.map(sub => timeData[sub].est);
        const actualData = labels.map(sub => timeData[sub].act);
        return { labels, estimatedData, actualData };
    }
    
    function getLessonTypePerformanceData(lessons) {
        const timeData = {};
        Object.keys(lessonTypes).forEach(type => timeData[type] = { est: 0, act: 0 });
        lessons.forEach(note => {
            if (note.type && timeData[note.type]) {
                timeData[note.type].est += note.estimatedTime || 0;
                timeData[note.type].act += note.actualTime || 0;
            }
        });
        const labels = Object.keys(timeData).map(type => lessonTypes[type].label);
        const estimatedData = Object.values(timeData).map(data => data.est);
        const actualData = Object.values(timeData).map(data => data.act);
        return { labels, estimatedData, actualData };
    }

    function getEfficiencyData(lessons) {
        const { labels, estimatedData, actualData } = getPerformanceData(lessons);
        const efficiencyLabels = [], data = [], colors = [];
        labels.forEach((subject, i) => {
             if (estimatedData[i] > 0) {
                const ratio = actualData[i] / estimatedData[i];
                efficiencyLabels.push(subject);
                data.push(ratio);
                colors.push(ratio > 1 ? '#ef4444' : '#22c55e');
            }
        });
        return { labels: efficiencyLabels, data, colors };
    }

    function getPastPaperTrendData(lessons) {
        const scores = lessons
            .filter(note => note.type === 'pastPaper' && note.pastPaperData)
            .map(note => {
                const { part, marksObtained, totalMarks, questions } = note.pastPaperData;
                let obtained = 0;
                let total = parseFloat(totalMarks);
                if (part === 'Part I' && marksObtained && total > 0) obtained = parseFloat(marksObtained);
                else if (part === 'Part II' && questions && total > 0) obtained = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);
                if (total > 0 && obtained > 0) {
                    return { date: note.date, score: (obtained / total) * 100 };
                }
                return null;
            })
            .filter(s => s !== null)
            .sort((a, b) => a.date - b.date);

        const labels = scores.map(s => s.date.toLocaleDateString('en-CA'));
        const data = scores.map(s => s.score.toFixed(2));
        return { labels, data };
    }

    function getHeatmapData(sessions) {
        const grid = Array(7).fill(0).map(() => Array(24).fill(0));
        let maxTime = 0;
        sessions.forEach(session => {
            const date = new Date(session.startTime);
            const dayOfWeek = date.getDay();
            const hour = date.getHours();
            grid[dayOfWeek][hour] += session.duration;
            if (grid[dayOfWeek][hour] > maxTime) maxTime = grid[dayOfWeek][hour];
        });
        const data = [], colors = [], baseColor = '0, 224, 198';
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 24; x++) {
                const value = grid[y][x];
                const alpha = 0.1 + 0.9 * (value / (maxTime || 1));
                data.push({ x, y, v: value, r: 10 });
                colors.push(`rgba(${baseColor}, ${alpha})`);
            }
        }
        return { data, colors, dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
    }
    
    function getTimeOfDayData(sessions) {
        const timeSlots = { "Morning (6-12)": 0, "Afternoon (12-17)": 0, "Evening (17-21)": 0, "Night (21-6)": 0 };
        sessions.forEach(session => {
            const hour = new Date(session.startTime).getHours();
            if (hour >= 6 && hour < 12) timeSlots["Morning (6-12)"] += session.duration;
            else if (hour >= 12 && hour < 17) timeSlots["Afternoon (12-17)"] += session.duration;
            else if (hour >= 17 && hour < 21) timeSlots["Evening (17-21)"] += session.duration;
            else timeSlots["Night (21-6)"] += session.duration;
        });
        return { labels: Object.keys(timeSlots), data: Object.values(timeSlots) };
    }


    // =================================================================================
    // EVENT HANDLERS
    // =================================================================================

    function handleControlsChange() {
        const newTotalDays = parseInt(totalDaysInput.value);
        if (!isNaN(newTotalDays) && newTotalDays > 0) {
            appState.totalDays = newTotalDays;
            localStorage.setItem('totalDays', appState.totalDays);
            appState.daysCompleted = appState.daysCompleted.filter(d => d <= appState.totalDays);
            localStorage.setItem('daysCompleted', JSON.stringify(appState.daysCompleted));
        }
        const newStartDate = startDateInput.value;
        if (newStartDate) {
            appState.startDate = newStartDate;
            localStorage.setItem('startDate', appState.startDate);
        }
        renderDays();
    }
    
    function handleDayNotesChange(e) {
        if (e.target.classList.contains('day-notes-textarea')) {
            const dayId = e.target.closest('.card[data-day-id]').dataset.dayId;
            localStorage.setItem(`dayNotesText-${dayId}`, e.target.value);
        }
    }
    
    function handleDayListChange(e) {
        const target = e.target;
        if (target.matches('input[type="checkbox"]:not(.checklist-item-checkbox)')) {
            const day = parseInt(target.dataset.day);
            const wasCompleted = appState.daysCompleted.includes(day);

            if (target.checked) {
                if (!wasCompleted) {
                    appState.daysCompleted.push(day);
                    scheduleRevisionsForDay(day); // Trigger revision scheduling
                }
            } else {
                appState.daysCompleted = appState.daysCompleted.filter(d => d !== day);
            }
            
            localStorage.setItem('daysCompleted', JSON.stringify(appState.daysCompleted));
            renderDays();
        } else if (target.classList.contains('checklist-item-checkbox')) {
            const day = parseInt(target.dataset.day);
            const lessonId = parseInt(target.dataset.lessonId);
            const checklistId = parseInt(target.dataset.checklistId);
            
            const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
            const lesson = notes.find(n => n.id === lessonId);
            if (lesson && lesson.checklist) {
                const item = lesson.checklist.find(ci => ci.id === checklistId);
                if (item) {
                    item.completed = target.checked;
                    localStorage.setItem(`dayNotes-${day}`, JSON.stringify(notes));
                    renderDays(); 
                }
            }
        }
    }
    
    function handleDayListClick(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const day = button.dataset.day;
        const lessonId = parseInt(button.dataset.lessonId);
        const action = button.dataset.action;

        const openLessonModal = (isEditing = false) => {
            checklistEditorList.innerHTML = '';
            pastPaperQuestionsList.innerHTML = '';
            // Reset all fields
            [pastPaperYearInput, pastPaperTotalMarksInput, lessonTextarea, pastPaperMarksObtainedInput, dailyMcqCountInput, dailyMcqMarksObtainedInput].forEach(i => i.value = '');
            pastPaperPartSelect.value = 'Part I';
            toggleLessonTypeFields();

            // Populate subject and type dropdowns
            const subjectOptions = Object.keys(appState.customSubjects).map(sub => `<option value="${sub}">${sub}</option>`).join('');
            lessonSubjectSelect.innerHTML = subjectOptions || '<option>No subjects created</option>';
            lessonTypeSelect.innerHTML = Object.keys(lessonTypes).map(type => `<option value="${type}">${lessonTypes[type].label}</option>`).join('');
            
            if (isEditing) {
                const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
                const lesson = notes.find(note => note.id === lessonId);
                if (lesson) {
                    appState.currentEditingLesson = { day, id: lessonId };
                    lessonModalTitle.textContent = "Edit Lesson";
                    lessonTextarea.value = lesson.text;
                    lessonSubjectSelect.value = lesson.subject;
                    lessonTypeSelect.value = lesson.type;
                    estimatedTimeInput.value = lesson.estimatedTime || 30;
                    if (lesson.checklist) {
                       lesson.checklist.forEach(item => addChecklistItemToEditor(item));
                    }
                    if (lesson.type === 'pastPaper' && lesson.pastPaperData) {
                        pastPaperYearInput.value = lesson.pastPaperData.year || '';
                        pastPaperPartSelect.value = lesson.pastPaperData.part || 'Part I';
                        pastPaperTotalMarksInput.value = lesson.pastPaperData.totalMarks || '';
                        pastPaperMarksObtainedInput.value = lesson.pastPaperData.marksObtained || '';
                        if (lesson.pastPaperData.questions) {
                            lesson.pastPaperData.questions.forEach(q => addQuestionToEditor(q.number, q.marks));
                        }
                    }
                    if (lesson.type === 'dailyMcq' && lesson.mcqData) {
                        dailyMcqCountInput.value = lesson.mcqData.count || '';
                        dailyMcqMarksObtainedInput.value = lesson.mcqData.marks || '';
                    }
                    toggleLessonTypeFields();
                }
            } else {
                appState.currentEditingLesson = { day, id: null };
                lessonModalTitle.textContent = "Add Lesson";
                lessonTypeSelect.value = 'main';
                estimatedTimeInput.value = 30;
                pastPaperTotalMarksInput.value = 50;
                toggleLessonTypeFields();
            }
            showModal(lessonModal);
            setTimeout(() => lessonSubjectSelect.focus(), 50);
        };

        switch (action) {
            case 'add': openLessonModal(); break;
            case 'edit': openLessonModal(true); break;
            case 'delete':
                showConfirmation('Delete Lesson', 'Are you sure you want to delete this lesson?', () => {
                    let notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
                    notes = notes.filter(note => note.id !== lessonId);
                    localStorage.setItem(`dayNotes-${day}`, JSON.stringify(notes));
                    renderDays();
                    showToast('Lesson deleted.', 'info');
                });
                break;
            case 'toggle-timer': toggleTimer(day, lessonId); break;
            case 'reset-timer': 
                showConfirmation('Reset Timer', 'This will reset the actual time to zero. Continue?', () => {
                    resetTimer(day, lessonId);
                });
                break;
            case 'enter-pip': enterPip(day, lessonId); break;
            case 'toggle-collapse': {
                const dayToToggle = parseInt(day);
                const dayIndex = appState.collapsedDays.indexOf(dayToToggle);

                if (dayIndex > -1) {
                    appState.collapsedDays.splice(dayIndex, 1);
                } else {
                    appState.collapsedDays.push(dayToToggle);
                }
                localStorage.setItem('collapsedDays', JSON.stringify(appState.collapsedDays));
                renderDays();
                break;
            }
            case 'view-files':
                const subjectName = button.dataset.subject;
                showSubjectFiles(subjectName);
                break;
        }
    }
    
    function handleDragAndDrop(e) {
        const lessonEntry = e.target.closest('.lesson-entry');
        const targetDayContainer = e.target.closest('.lessons-container[data-day]');
        const targetKanbanContainer = e.target.closest('.kanban-cards[data-column-name]');

        const allDropContainers = document.querySelectorAll('.lessons-container, .kanban-cards');

        switch (e.type) {
            case 'dragstart':
                if (lessonEntry) {
                    const sourceDay = lessonEntry.closest('.lessons-container')?.dataset.day;
                    const sourceColumn = lessonEntry.closest('.kanban-cards')?.dataset.columnName;

                    appState.draggedLessonInfo = {
                        id: parseInt(lessonEntry.dataset.lessonId),
                        day: sourceDay,
                        column: sourceColumn,
                        element: lessonEntry
                    };
                    setTimeout(() => lessonEntry.classList.add('dragging'), 0);
                }
                break;
            case 'dragover':
                e.preventDefault();
                break;
            case 'dragenter':
                if (targetDayContainer) targetDayContainer.classList.add('drag-over');
                if (targetKanbanContainer) targetKanbanContainer.classList.add('drag-over');
                break;
            case 'dragleave':
                if (targetDayContainer) targetDayContainer.classList.remove('drag-over');
                if (targetKanbanContainer) targetKanbanContainer.classList.remove('drag-over');
                break;
            case 'drop':
                e.preventDefault();
                allDropContainers.forEach(container => container.classList.remove('drag-over'));
                if (!appState.draggedLessonInfo.id) return;

                const { id: draggedId, day: sourceDay, column: sourceColumn } = appState.draggedLessonInfo;
                const targetDay = targetDayContainer?.dataset.day;
                const targetColumn = targetKanbanContainer?.dataset.columnName;

                if (!targetDay && !targetColumn) return; // Dropped outside a valid zone

                // 1. Find and remove the dragged item from its source
                let draggedItem = null;
                if (sourceDay) {
                    let sourceNotes = JSON.parse(localStorage.getItem(`dayNotes-${sourceDay}`) || '[]');
                    const itemIndex = sourceNotes.findIndex(note => note.id === draggedId);
                    if (itemIndex > -1) {
                        [draggedItem] = sourceNotes.splice(itemIndex, 1);
                        localStorage.setItem(`dayNotes-${sourceDay}`, JSON.stringify(sourceNotes));
                    }
                } else if (sourceColumn) {
                    let kanbanData = JSON.parse(localStorage.getItem('kanbanData'));
                    const itemIndex = kanbanData[sourceColumn].findIndex(note => note.id === draggedId);
                    if (itemIndex > -1) {
                        [draggedItem] = kanbanData[sourceColumn].splice(itemIndex, 1);
                        localStorage.setItem('kanbanData', JSON.stringify(kanbanData));
                    }
                }
                if (!draggedItem) return;

                // 2. Add the item to its new destination
                if (targetDay) {
                    let targetNotes = JSON.parse(localStorage.getItem(`dayNotes-${targetDay}`) || '[]');
                    targetNotes.push(draggedItem);
                    localStorage.setItem(`dayNotes-${targetDay}`, JSON.stringify(targetNotes));
                } else if (targetColumn) {
                    let kanbanData = JSON.parse(localStorage.getItem('kanbanData'));
                    kanbanData[targetColumn].push(draggedItem);
                    localStorage.setItem('kanbanData', JSON.stringify(kanbanData));
                }
                
                // 3. Re-render the affected views
                if(sourceDay || targetDay) renderDays();
                if(sourceColumn || targetColumn) renderKanbanView();

                break;
            case 'dragend':
                allDropContainers.forEach(container => container.classList.remove('drag-over'));
                if (appState.draggedLessonInfo.element) {
                    appState.draggedLessonInfo.element.classList.remove('dragging');
                }
                appState.draggedLessonInfo = { id: null, day: null, column: null, element: null };
                break;
        }
    }

    // =================================================================================
    // TIMER LOGIC
    // =================================================================================

    function toggleTimer(day, lessonId) {
        const { intervalId, day: activeDay, lessonId: activeLessonId } = appState.activeTimer;
        if (intervalId && (activeDay != day || activeLessonId != lessonId)) {
            pauseTimer(); 
        }

        if (appState.activeTimer.intervalId) {
            pauseTimer();
        } else {
            startTimer(day, lessonId);
        }
        renderDays();
    }

    function startTimer(day, lessonId) {
        const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
        const lesson = notes.find(n => n.id == lessonId);
        if (!lesson) return;

        appState.activeTimer = {
            day: day,
            lessonId: lessonId,
            startTime: Date.now(),
            accumulatedSeconds: (lesson.actualTime || 0) * 60,
            intervalId: setInterval(updateActiveTimerUI, 1000)
        };
        updateActiveTimerUI();
    }
    
    function pauseTimer() {
        const { intervalId, startTime, accumulatedSeconds, day, lessonId } = appState.activeTimer;
        if (!intervalId) return;
        clearInterval(intervalId);

        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const totalSeconds = accumulatedSeconds + elapsedSeconds;
        
        const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
        const lesson = notes.find(n => n.id == lessonId);
        if (lesson) {
            lesson.actualTime = totalSeconds / 60; 
            localStorage.setItem(`dayNotes-${day}`, JSON.stringify(notes));
            
            if (elapsedSeconds > 1) { 
                const studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
                studySessions.push({ startTime: startTime, endTime: Date.now(), duration: elapsedSeconds / 60, dayNumber: day, lessonId: lessonId });
                localStorage.setItem('studySessions', JSON.stringify(studySessions));
            }
        }
        
        document.title = originalDocTitle;
        appState.activeTimer = { day: null, lessonId: null, startTime: null, accumulatedSeconds: 0, intervalId: null };
        updateGoalProgressDisplay();
        exitPip();
    }

    function resetTimer(day, lessonId) {
        const { day: activeDay, lessonId: activeLessonId } = appState.activeTimer;
        if (activeDay == day && activeLessonId == lessonId) {
            pauseTimer();
        }
        const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
        const lesson = notes.find(n => n.id == lessonId);
        if (lesson) {
            lesson.actualTime = 0;
            localStorage.setItem(`dayNotes-${day}`, JSON.stringify(notes));
        }
        renderDays();
        showToast('Timer has been reset.', 'info');
    }

    function updateActiveTimerUI() {
        const { intervalId, day, lessonId, startTime, accumulatedSeconds } = appState.activeTimer;
        if (!intervalId) return;
        
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const totalSeconds = accumulatedSeconds + elapsedSeconds;
        const formattedTime = formatTime(totalSeconds / 60, true);
        
        const displayEl = document.querySelector(`.actual-time-display[data-day="${day}"][data-lesson-id="${lessonId}"]`);
        if (displayEl) {
            displayEl.innerHTML = `Act: <b class="text-green-500 dark:text-green-400">${formattedTime}</b>`;
        }
        
        document.title = `${formattedTime} - Studying...`;
        updatePipWindow(formattedTime);
    }

    // =================================================================================
    // PICTURE-IN-PICTURE (PIP) LOGIC
    // =================================================================================

    async function enterPip(day, lessonId) {
        if (appState.pipWindow) {
            await exitPip();
        }

        const notes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
        const lesson = notes.find(n => n.id == lessonId);
        if (!lesson) return;
        
        const subject = lesson.subject || 'No Subject';
        const subjectColor = appState.customSubjects[subject]?.color || '#9ca3af';

        try {
            const pipWindow = await documentPictureInPicture.requestWindow({ width: 360, height: 180 });
            appState.pipWindow = pipWindow;
            const isDarkMode = document.documentElement.classList.contains('dark');
            const pipStyles = `
                body { font-family: 'Poppins', sans-serif; margin: 0; background-color: ${isDarkMode ? '#161b22' : '#ffffff'}; color: ${isDarkMode ? '#c9d1d9' : '#1e293b'}; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; border-top: 5px solid ${subjectColor}; }
                h1 { margin: 0; font-size: 1.25rem; } p { margin: 0.25rem 0; opacity: 0.8; } .pip-timer { font-size: 2.5rem; font-weight: 700; color: #2dd4bf; }
            `;
            const style = pipWindow.document.createElement('style');
            style.textContent = pipStyles;
            pipWindow.document.head.appendChild(style);
            pipWindow.document.body.innerHTML = `<p id="pip-subject">${escapeHtml(subject)}</p><h1 id="pip-title">${escapeHtml(lesson.text)}</h1><div id="pip-timer" class="pip-timer">00:00:00</div>`;
            pipWindow.addEventListener('pagehide', () => { appState.pipWindow = null; });
        } catch (error) {
            showToast('Picture-in-Picture window could not be opened.', 'error');
            console.error(error);
        }
    }

    function updatePipWindow(formattedTime) {
        if (appState.pipWindow && !appState.pipWindow.closed) {
            const timerEl = appState.pipWindow.document.getElementById('pip-timer');
            if (timerEl) timerEl.textContent = formattedTime;
        }
    }

    function exitPip() {
        if (appState.pipWindow) {
            appState.pipWindow.close();
            appState.pipWindow = null;
        }
    }

    // =================================================================================
    // MODAL HANDLERS
    // =================================================================================

    function addChecklistItemToEditor(item) {
        const text = (typeof item === 'string') ? item : item.text;
        if (!text.trim()) return;
        const itemEl = document.createElement('div');
        itemEl.className = 'checklist-editor-item flex items-center justify-between p-1 rounded';
        if (typeof item === 'object' && item.id) {
            itemEl.dataset.id = item.id;
            itemEl.dataset.completed = item.completed;
        }
        itemEl.innerHTML = `
            <span class="flex-grow px-2">${escapeHtml(text)}</span>
            <button type="button" data-action="delete-checklist-item" class="text-red-500 hover:text-red-700 p-1" aria-label="Delete sub-task"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
        `;
        checklistEditorList.appendChild(itemEl);
    }
    
    function addQuestionToEditor(number = '', marks = '') {
        const itemEl = document.createElement('div');
        itemEl.className = 'pp-question-item flex items-center space-x-2';
        itemEl.innerHTML = `
            <input type="text" class="question-number w-1/3 p-1 border-none rounded text-sm glass-input" placeholder="Q#" value="${escapeHtml(number)}">
            <input type="number" step="0.25" class="question-marks w-1/3 p-1 border-none rounded text-sm glass-input" placeholder="Marks" value="${escapeHtml(marks)}">
            <button type="button" data-action="delete-pp-question" class="text-red-500 hover:text-red-700 p-1" aria-label="Delete question"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
        `;
        pastPaperQuestionsList.appendChild(itemEl);
    }

    function toggleLessonTypeFields() {
        const lessonType = lessonTypeSelect.value;
        const isPastPaper = lessonType === 'pastPaper';
        const isDailyMcq = lessonType === 'dailyMcq';

        // Past Paper Fields
        pastPaperFields.classList.toggle('hidden', !isPastPaper);
        if (isPastPaper) {
            const isPartI = pastPaperPartSelect.value === 'Part I';
            pastPaperPartIFields.classList.toggle('hidden', !isPartI);
            pastPaperPartIIFields.classList.toggle('hidden', isPartI);
        } else {
            pastPaperPartIFields.classList.add('hidden');
            pastPaperPartIIFields.classList.add('hidden');
        }

        // Daily MCQ Fields
        dailyMcqFields.classList.toggle('hidden', !isDailyMcq);
    }

    function handleSaveLesson() {
        const lessonText = lessonTextarea.value.trim();
        const lessonType = lessonTypeSelect.value;
        const lessonSubject = lessonSubjectSelect.value;
        
        if (!lessonSubject) { showToast('Please select a subject.', 'error'); return; }
        if (lessonType !== 'pastPaper' && lessonType !== 'dailyMcq' && !lessonText) { showToast('Lesson description cannot be empty.', 'error'); return; }
        if (lessonType === 'pastPaper' && !pastPaperYearInput.value) { showToast('Past Paper Year is required.', 'error'); return; }

        const { day, id, column } = appState.currentEditingLesson;
        
        const newChecklist = [];
        checklistEditorList.querySelectorAll('.checklist-editor-item').forEach(itemEl => {
            newChecklist.push({ id: parseInt(itemEl.dataset.id) || Date.now() + newChecklist.length, text: itemEl.querySelector('span').textContent, completed: itemEl.dataset.completed === 'true' });
        });
        
        let pastPaperData = null;
        if (lessonType === 'pastPaper') {
            pastPaperData = { year: pastPaperYearInput.value, part: pastPaperPartSelect.value, totalMarks: pastPaperTotalMarksInput.value };
            if (pastPaperData.part === 'Part I') {
                pastPaperData.marksObtained = pastPaperMarksObtainedInput.value;
            } else {
                const questions = [];
                pastPaperQuestionsList.querySelectorAll('.pp-question-item').forEach(item => {
                    const number = item.querySelector('.question-number').value.trim();
                    const marks = item.querySelector('.question-marks').value;
                    if (number) questions.push({ number, marks });
                });
                pastPaperData.questions = questions;
            }
        }
        
        let mcqData = null;
        if (lessonType === 'dailyMcq') {
            mcqData = {
                count: dailyMcqCountInput.value,
                marks: dailyMcqMarksObtainedInput.value
            };
        }
        
        if (column) { 
            const kanbanData = JSON.parse(localStorage.getItem('kanbanData'));
            if (!kanbanData[column]) return;

            const newLesson = {
                 id: Date.now(), text: lessonText, type: lessonType, subject: lessonSubject,
                 estimatedTime: parseInt(estimatedTimeInput.value) || 0, actualTime: 0,
                 checklist: newChecklist, pastPaperData: pastPaperData, mcqData: mcqData
            };
            
            if (id) {
                const lessonIndex = kanbanData[column].findIndex(n => n.id === id);
                if (lessonIndex > -1) {
                    kanbanData[column][lessonIndex] = { ...kanbanData[column][lessonIndex], ...newLesson, id: id };
                }
            } else {
                kanbanData[column].push(newLesson);
            }
            localStorage.setItem('kanbanData', JSON.stringify(kanbanData));
            renderKanbanView();
        } else if (day) {
            const existingNotes = JSON.parse(localStorage.getItem(`dayNotes-${day}`) || '[]');
            if (id) {
                const note = existingNotes.find(n => n.id === id);
                if (note) {
                    note.text = lessonText;
                    note.type = lessonType;
                    note.subject = lessonSubject;
                    note.estimatedTime = parseInt(estimatedTimeInput.value) || 0;
                    note.checklist = newChecklist;
                    note.pastPaperData = pastPaperData;
                    note.mcqData = mcqData;
                }
            } else {
                existingNotes.push({
                    id: Date.now(),
                    text: lessonText,
                    type: lessonType,
                    subject: lessonSubject,
                    estimatedTime: parseInt(estimatedTimeInput.value) || 0,
                    actualTime: 0,
                    checklist: newChecklist,
                    pastPaperData: pastPaperData,
                    mcqData: mcqData
                });
            }
            localStorage.setItem(`dayNotes-${day}`, JSON.stringify(existingNotes));
            renderDays();
        }

        closeModal(lessonModal);
    }

    kanbanBoard.addEventListener('click', e => {
        const button = e.target.closest('[data-action="add-kanban"]');
        if (button) {
            const columnName = button.dataset.columnName;
            // Clear and setup lesson modal for Kanban context
            lessonModalTitle.textContent = `Add Lesson to ${columnName}`;
            appState.currentEditingLesson = { day: null, column: columnName, id: null };
            
            // Re-use the modal opening logic, reset fields
            lessonTextarea.value = '';
            estimatedTimeInput.value = 30;
            lessonTypeSelect.value = 'main';
            checklistEditorList.innerHTML = '';
            pastPaperFields.classList.add('hidden');
            dailyMcqFields.classList.add('hidden');
            const subjectOptions = Object.keys(appState.customSubjects).map(sub => `<option value="${sub}">${sub}</option>`).join('');
            lessonSubjectSelect.innerHTML = subjectOptions || '<option>No subjects created</option>';
            lessonTypeSelect.innerHTML = Object.keys(lessonTypes).map(type => `<option value="${type}">${lessonTypes[type].label}</option>`).join('');
            
            showModal(lessonModal);
            setTimeout(() => lessonSubjectSelect.focus(), 50);
        }
    });
    
    function trapFocus(element) {
        const focusableEls = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableEls.length === 0) return () => {};
        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) { if (document.activeElement === firstFocusableEl) { lastFocusableEl.focus(); e.preventDefault(); }
            } else { if (document.activeElement === lastFocusableEl) { firstFocusableEl.focus(); e.preventDefault(); } }
        };
        element.addEventListener('keydown', handleKeyDown);
        return () => element.removeEventListener('keydown', handleKeyDown);
    }
    
    function showModal(modalElement) {
        appState.modalFocus.triggerElement = document.activeElement;
        modalElement.classList.remove('hidden');
        if (!modalElement.hasAttribute('tabindex')) modalElement.setAttribute('tabindex', '-1');
        modalElement.focus();
        appState.modalFocus.untrapFocus = trapFocus(modalElement);
    }

    function closeModal(modalElement) {
        modalElement.classList.add('hidden');
        appState.modalFocus.untrapFocus();
        appState.modalFocus.triggerElement?.focus();
    }
    
    function showConfirmation(title, text, onConfirm) {
        confirmModalTitle.textContent = title;
        confirmModalText.textContent = text;
        const handleOk = () => { if (typeof onConfirm === 'function') onConfirm(); cleanup(); };
        const handleCancel = () => cleanup();
        const cleanup = () => { closeModal(confirmModal); confirmOkBtn.removeEventListener('click', handleOk); confirmCancelBtn.removeEventListener('click', handleCancel); };
        confirmOkBtn.addEventListener('click', handleOk);
        confirmCancelBtn.addEventListener('click', handleCancel);
        showModal(confirmModal);
    }
    
    // =================================================================================
    // DATA IMPORT/EXPORT
    // =================================================================================

    function exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            data[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `study-plan-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Data exported successfully!', 'success');
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                showConfirmation('Import Data', 'This will overwrite your current plan. Are you sure?', () => {
                    localStorage.clear();
                    Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                    initializeState();
                    setView('daily');
                    showToast('Data imported successfully!', 'success');
                });
            } catch (error) { showToast('Invalid file format.', 'error'); }
        };
        reader.readAsText(file);
        e.target.value = ''; 
    }

    function clearData() {
        showConfirmation('Clear All Data', 'DANGER: This will permanently delete all your study data. This action cannot be undone. Are you absolutely sure?', () => {
            localStorage.clear();
            initializeState();
            setView('daily');
            showToast('All data has been cleared.', 'success');
        });
    }

    // =================================================================================
    // SUBJECT MANAGEMENT
    // =================================================================================

    function saveSubjects() {
        localStorage.setItem('customSubjects', JSON.stringify(appState.customSubjects));
    }
    
    function handleAddFileClick(subjectName) {
        if (!subjectFileInput) { showToast('File input element not found.', 'error'); return; }
        const onChange = (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) { subjectFileInput.value = ''; subjectFileInput.removeEventListener('change', onChange); return; }
            const fileUrl = URL.createObjectURL(file);
            if (appState.customSubjects[subjectName]) {
                appState.customSubjects[subjectName].files.push({ id: Date.now(), name: file.name, path: fileUrl });
                saveSubjects();
                renderSubjectList();
                showToast(`Added "${file.name}" to ${subjectName}`, 'success');
            }
            subjectFileInput.value = '';
            subjectFileInput.removeEventListener('change', onChange);
        };
        subjectFileInput.addEventListener('change', onChange);
        subjectFileInput.click();
    }

    function renderSubjectList() {
        if (!subjectsList) return;
        subjectsList.innerHTML = '';
        Object.keys(appState.customSubjects).forEach(subjectName => {
            const subject = appState.customSubjects[subjectName];
            const wrapper = document.createElement('div');
            wrapper.className = "flex items-center justify-between p-2 rounded mb-2 glass-card";
            wrapper.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 rounded-full" style="background:${subject.color}"></div>
                    <div class="font-semibold">${subjectName}</div>
                    <div class="text-xs opacity-70 ml-2">${subject.files && subject.files.length ? `${subject.files.length} file(s)` : ''}</div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="btn btn-info btn-add-file text-sm py-1 px-2" data-subject="${subjectName}">+ File</button>
                    <button class="btn btn-secondary btn-view-files text-sm py-1 px-2" data-subject="${subjectName}">View</button>
                    <button class="btn btn-danger btn-delete-subject text-sm py-1 px-2" data-subject="${subjectName}">Delete</button>
                </div>
            `;
            subjectsList.appendChild(wrapper);
        });
    }

    function showSubjectFiles(subjectName) {
        const subject = appState.customSubjects[subjectName];
        if (!subject || !subject.files) return;
        subjectFilesModalTitle.textContent = `${subjectName} Files`;
        subjectFilesList.innerHTML = '';
        if (subject.files.length === 0) {
            subjectFilesList.innerHTML = `<p class="opacity-70">No files have been added for this subject.</p>`;
        } else {
            subject.files.forEach((file, idx) => {
                const fileEl = document.createElement('div');
                fileEl.className = 'file-item flex items-center justify-between p-2 rounded mb-2 glass-card';
                fileEl.innerHTML = `
                    <div class="flex-grow">
                        <a href="${file.path}" target="_blank" rel="noopener noreferrer" class="file-link font-semibold block">${escapeHtml(file.name)}</a>
                        <input type="text" readonly value="${file.path}" class="w-full text-xs p-1 mt-1 border-none rounded glass-input">
                    </div>
                    <div class="flex items-center space-x-2">
                        <button data-path="${file.path}" data-action="copy-path" class="ml-2 p-2 btn btn-secondary text-sm" title="Copy Path"><svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
                        <button data-subject="${subjectName}" data-file-id="${file.id}" data-action="remove-file" class="ml-2 p-2 btn btn-danger text-sm" title="Remove File">Remove</button>
                    </div>`;
                subjectFilesList.appendChild(fileEl);
            });
        }
        showModal(subjectFilesModal);
    }
    
    function handleSubjectManagementDelegated(e) {
        const button = e.target.closest('button');
        if (!button) return;
        const subjectName = button.dataset.subject;
        if (!subjectName) return;
        if (button.classList.contains('btn-add-file')) handleAddFileClick(subjectName);
        else if (button.classList.contains('btn-view-files')) showSubjectFiles(subjectName);
        else if (button.classList.contains('btn-delete-subject')) {
            showConfirmation('Delete Subject', `Delete "${subjectName}"? This will remove the subject from all lessons.`, () => {
                delete appState.customSubjects[subjectName];
                saveSubjects();
                for (let i = 1; i <= appState.totalDays; i++) {
                    let notes = JSON.parse(localStorage.getItem(`dayNotes-${i}`) || '[]');
                    let changed = false;
                    notes.forEach(note => {
                        if (note.subject === subjectName) {
                            delete note.subject;
                            changed = true;
                        }
                    });
                    if (changed) localStorage.setItem(`dayNotes-${i}`, JSON.stringify(notes));
                }
                renderSubjectList();
                setView('daily');
            });
        }
    }
    
    function handleSubjectFilesModalClick(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'copy-path') copyToClipboard(button.dataset.path);
        else if (action === 'remove-file') {
            const subjectName = button.dataset.subject;
            const fileId = parseInt(button.dataset.fileId);
            const subject = appState.customSubjects[subjectName];
            if(subject) {
                const fileName = subject.files.find(f => f.id === fileId)?.name || 'this file';
                showConfirmation('Remove File', `Are you sure you want to remove "${fileName}"?`, () => {
                    subject.files = subject.files.filter(f => f.id !== fileId);
                    saveSubjects();
                    showSubjectFiles(subjectName);
                    renderSubjectList();
                });
            }
        }
    }

    // =================================================================================
    // LESSON BANK LOGIC
    // =================================================================================

    function openLessonBankModal() {
        renderLessonBankSubjects();
        const firstSubject = Object.keys(appState.customSubjects)[0];
        if (firstSubject) {
            appState.currentLessonBankSubject = firstSubject;
            renderLessonBankForSubject(firstSubject);
        } else {
            lessonBankCurrentSubjectTitle.textContent = 'No Subjects Created';
            lessonBankLessonsList.innerHTML = '<p class="text-center opacity-70">Please create a subject first in "Manage Subjects".</p>';
        }
        showModal(lessonBankModal);
    }

    function renderLessonBankSubjects() {
        lessonBankSubjectsContainer.innerHTML = '';
        const subjectNames = Object.keys(appState.customSubjects);
        if (subjectNames.length === 0) {
            lessonBankSubjectsContainer.innerHTML = '<p class="text-sm opacity-70">No subjects found.</p>';
            return;
        }
        subjectNames.forEach(name => {
            const btn = document.createElement('button');
            btn.dataset.subject = name;
            btn.className = 'w-full text-left p-2 rounded-md transition-colors duration-200';
            btn.textContent = name;
            lessonBankSubjectsContainer.appendChild(btn);
        });
        updateLessonBankSubjectSelection();
    }

    function updateLessonBankSubjectSelection() {
        const { currentLessonBankSubject } = appState;
        const buttons = lessonBankSubjectsContainer.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.dataset.subject === currentLessonBankSubject) {
                btn.classList.add('bg-cyan-500', 'text-white', 'font-semibold');
                btn.classList.remove('hover:bg-slate-200', 'dark:hover:bg-slate-700');
            } else {
                btn.classList.remove('bg-cyan-500', 'text-white', 'font-semibold');
                btn.classList.add('hover:bg-slate-200', 'dark:hover:bg-slate-700');
            }
        });
    }

    function renderLessonBankForSubject(subjectName) {
        appState.currentLessonBankSubject = subjectName;
        updateLessonBankSubjectSelection();
        lessonBankCurrentSubjectTitle.textContent = `Lessons for ${subjectName}`;
        const subject = appState.customSubjects[subjectName];
        if (!subject || !subject.lessons || subject.lessons.length === 0) {
            lessonBankLessonsList.innerHTML = '<p class="text-center opacity-70 mt-4">No lessons added for this subject yet. Add one above!</p>';
            return;
        }
        lessonBankLessonsList.innerHTML = subject.lessons.map(lesson => `
            <div class="lesson-bank-item p-3 rounded-lg glass-card" data-lesson-id="${lesson.id}">
                <div class="flex items-center justify-between mb-2">
                    <h5 class="lesson-title font-bold text-lg">${escapeHtml(lesson.title)}</h5>
                    <div class="flex items-center space-x-2">
                        <button data-action="edit-lesson" class="hover:text-sky-400 p-1" title="Edit Lesson"><svg class="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                        <button data-action="delete-lesson" class="hover:text-red-500 p-1" title="Delete Lesson"><svg class="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                    </div>
                </div>
                <div class="subtopics-list space-y-1.5 pl-2 border-l-2">${lesson.subtopics.map(subtopic => `
                    <div class="subtopic-item flex items-center justify-between p-1.5 rounded" data-subtopic-id="${subtopic.id}">
                         <div class="flex items-center flex-grow">
                            <input type="checkbox" data-action="toggle-subtopic" class="w-4 h-4 rounded text-cyan-500 mr-2" ${subtopic.completed ? 'checked' : ''}>
                            <span class="subtopic-text ${subtopic.completed ? 'line-through opacity-60' : ''}">${escapeHtml(subtopic.text)}</span>
                         </div>
                         <div class="flex items-center space-x-2">
                            <button data-action="edit-subtopic" class="hover:text-sky-400 text-xs p-1" title="Edit"><svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                            <button data-action="delete-subtopic" class="hover:text-red-500 text-xs p-1" title="Delete"><svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                         </div>
                    </div>`).join('')}
                </div>
                <div class="mt-2 flex items-center">
                    <input type="text" class="add-subtopic-input w-full p-1 border-none rounded-l-md text-sm glass-input" placeholder="New subtopic...">
                    <button data-action="add-subtopic" class="btn btn-success rounded-l-none rounded-r-md py-1 text-sm flex-shrink-0">+ Add</button>
                </div>
            </div>`).join('');
    }

    function handleLessonBankSubjectSelect(e) {
        const button = e.target.closest('button[data-subject]');
        if (button) renderLessonBankForSubject(button.dataset.subject);
    }

    function handleAddLessonToBank() {
        const { currentLessonBankSubject } = appState;
        const lessonTitle = addLessonToBankInput.value.trim();
        if (!currentLessonBankSubject) { showToast('Please select a subject first.', 'error'); return; }
        if (!lessonTitle) { showToast('Lesson title cannot be empty.', 'error'); return; }
        const subject = appState.customSubjects[currentLessonBankSubject];
        if (subject) {
            subject.lessons.push({ id: Date.now(), title: lessonTitle, subtopics: [] });
            saveSubjects();
            renderLessonBankForSubject(currentLessonBankSubject);
            addLessonToBankInput.value = '';
            addLessonToBankInput.focus();
        }
    }

    function handleLessonBankActions(e) {
        const target = e.target;
        const action = target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        const lessonItem = target.closest('.lesson-bank-item');
        const subtopicItem = target.closest('.subtopic-item');
        const subjectName = appState.currentLessonBankSubject;
        if (!subjectName || !lessonItem) return;
        const lessonId = parseInt(lessonItem.dataset.lessonId);
        const subject = appState.customSubjects[subjectName];
        const lesson = subject.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        const reRender = () => renderLessonBankForSubject(subjectName);
        switch (action) {
            case 'delete-lesson':
                showConfirmation('Delete Lesson', `Are you sure you want to delete "${lesson.title}"?`, () => {
                    subject.lessons = subject.lessons.filter(l => l.id !== lessonId);
                    saveSubjects(); reRender();
                });
                break;
            case 'edit-lesson': {
                const newTitle = prompt('Enter new lesson title:', lesson.title);
                if (newTitle && newTitle.trim()) { lesson.title = newTitle.trim(); saveSubjects(); reRender(); }
                break;
            }
            case 'add-subtopic': {
                const input = lessonItem.querySelector('.add-subtopic-input');
                const subtopicText = input.value.trim();
                if (subtopicText) { lesson.subtopics.push({ id: Date.now(), text: subtopicText, completed: false }); saveSubjects(); reRender(); } 
                else { showToast('Subtopic cannot be empty.', 'error'); }
                break;
            }
            case 'toggle-subtopic': case 'edit-subtopic': case 'delete-subtopic': {
                if (!subtopicItem) return;
                const subtopicId = parseInt(subtopicItem.dataset.subtopicId);
                const subtopic = lesson.subtopics.find(s => s.id === subtopicId);
                if (!subtopic) return;
                if (action === 'toggle-subtopic') {
                    subtopic.completed = target.checked;
                    saveSubjects();
                    subtopicItem.querySelector('.subtopic-text').classList.toggle('line-through');
                    subtopicItem.querySelector('.subtopic-text').classList.toggle('opacity-60');
                } else if (action === 'edit-subtopic') {
                    const newText = prompt('Enter new subtopic text:', subtopic.text);
                    if (newText && newText.trim()) { subtopic.text = newText.trim(); saveSubjects(); reRender(); }
                } else if (action === 'delete-subtopic') {
                     showConfirmation('Delete Subtopic', `Are you sure you want to delete "${subtopic.text}"?`, () => {
                        lesson.subtopics = lesson.subtopics.filter(s => s.id !== subtopicId);
                        saveSubjects(); reRender();
                    });
                }
                break;
            }
        }
    }

    function openLessonBankPickerModal() {
        lessonBankPickerList.innerHTML = '';
        const subjects = Object.entries(appState.customSubjects);
        if (subjects.length === 0) {
            lessonBankPickerList.innerHTML = `<p>No subjects found. Please add subjects first.</p>`;
        } else {
            let content = '';
            subjects.forEach(([name, subject]) => {
                if(subject.lessons && subject.lessons.length > 0) {
                    content += `<h4 class="text-lg font-bold mt-4 mb-2 border-b">${name}</h4><div class="space-y-2">`;
                    subject.lessons.forEach(lesson => {
                        const subtopicsHtml = lesson.subtopics.map(subtopic => `
                            <label>
                                <input type="checkbox" class="subtopic-checkbox" data-subject="${name}" data-lesson-id="${lesson.id}" data-lesson-title="${escapeHtml(lesson.title)}" data-subtopic-text="${escapeHtml(subtopic.text)}">
                                <span>${escapeHtml(subtopic.text)}</span>
                            </label>
                        `).join('');

                        content += `
                            <div class="lesson-picker-item" data-subject="${name}" data-lesson-id="${lesson.id}">
                                <div class="lesson-header">
                                    <span class="font-semibold">${escapeHtml(lesson.title)}</span>
                                    <label class="select-all-label flex items-center space-x-1 cursor-pointer" onclick="event.stopPropagation()">
                                        <span>All</span>
                                        <input type="checkbox" class="select-all-checkbox">
                                    </label>
                                </div>
                                <div class="subtopic-picker-list space-y-1">
                                    ${subtopicsHtml || '<p class="text-xs opacity-60 p-2">No subtopics in this lesson.</p>'}
                                </div>
                            </div>`;
                    });
                    content += '</div>';
                }
            });
            lessonBankPickerList.innerHTML = content || `<p>No lessons found in the lesson bank.</p>`;
        }
        showModal(lessonBankPickerModal);
    }

    function handleLessonBankPickerClick(e) {
        const lessonHeader = e.target.closest('.lesson-header');
        const selectAllCheckbox = e.target.closest('.select-all-checkbox');

        if (selectAllCheckbox) { // Handle "Select All" click
            const subtopicList = selectAllCheckbox.closest('.lesson-header').nextElementSibling;
            const subtopicCheckboxes = subtopicList.querySelectorAll('.subtopic-checkbox');
            subtopicCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
            return;
        }

        if (lessonHeader) { // Handle accordion toggle
            const subtopicList = lessonHeader.nextElementSibling;
            subtopicList.classList.toggle('open');
        }
    }

    function handleConfirmSubtopicSelection() {
        const selectedCheckboxes = lessonBankPickerList.querySelectorAll('.subtopic-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            showToast('No subtopics were selected.', 'info');
            return;
        }

        // Use the first selected item to set the lesson title and subject
        const firstItem = selectedCheckboxes[0].dataset;
        lessonTextarea.value = firstItem.lessonTitle;
        lessonSubjectSelect.value = firstItem.subject;

        // Clear existing checklist and add all selected subtopics
        checklistEditorList.innerHTML = '';
        selectedCheckboxes.forEach(cb => {
            addChecklistItemToEditor(cb.dataset.subtopicText);
        });

        showToast(`${selectedCheckboxes.length} subtopic(s) added.`, 'success');
        closeModal(lessonBankPickerModal);
    }

    // =================================================================================
    // SEARCH, THEME, FILTERS
    // =================================================================================

    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;
        const dayCards = dayList.querySelectorAll('.card[data-day-id]');
        dayCards.forEach(card => {
            const dayId = card.dataset.dayId;
            const notes = JSON.parse(localStorage.getItem(`dayNotes-${dayId}`) || '[]');
            const hasMatch = notes.some(note => 
                note.text.toLowerCase().includes(query) || 
                (note.subject && note.subject.toLowerCase().includes(query)) ||
                (lessonTypes[note.type]?.label.toLowerCase().includes(query)) || 
                (note.pastPaperData?.year && note.pastPaperData.year.includes(query))
            );
            card.classList.toggle('hidden', !(hasMatch || query === ''));
            if(hasMatch || query === '') visibleCount++;
        });
        noResultsMessage.classList.toggle('hidden', visibleCount > 0);
    }
    
    function initializeTheme() {
        const isDarkMode = localStorage.getItem('theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDarkMode);
        updateThemeIcon(isDarkMode);
    }
    
    function toggleTheme() {
        const isDarkMode = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        updateThemeIcon(isDarkMode);
        if (!analyticsView.classList.contains('hidden')) renderAnalytics();
    }

    function updateThemeIcon(isDarkMode) {
         themeIcon.innerHTML = isDarkMode
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />`
            : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />`;
    }

    function initializeAnalyticsFilters() {
        const createMultiSelect = (element, options, type) => {
            const placeholder = element.querySelector('.placeholder');
            const optionsContainer = element.querySelector('.options');
            optionsContainer.innerHTML = '';
            
            Object.entries(options).forEach(([value, label]) => {
                const optionEl = document.createElement('div');
                optionEl.className = 'option';
                optionEl.innerHTML = `<input type="checkbox" value="${value}" class="pointer-events-none"> <label>${label}</label>`;
                optionsContainer.appendChild(optionEl);
            });
    
            element.addEventListener('click', (e) => {
                if (e.target.closest('.option')) {
                    e.stopPropagation();
                    const checkbox = e.target.closest('.option').querySelector('input');
                    checkbox.checked = !checkbox.checked;
                    updateSelection();
                    renderAnalytics();
                } else {
                    optionsContainer.classList.toggle('hidden');
                }
            });
    
            function updateSelection() {
                const selected = [];
                optionsContainer.querySelectorAll('input:checked').forEach(input => selected.push(input.value));
                appState.analyticsFilters[type] = selected;
                placeholder.textContent = selected.length > 0 ? `${selected.length} selected` : `All ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
        };
    
        const subjectOptions = Object.keys(appState.customSubjects).reduce((obj, key) => ({...obj, [key]: key}), {});
        const lessonTypeOptions = Object.entries(lessonTypes).reduce((obj, [key, val]) => ({...obj, [key]: val.label}), {});
        createMultiSelect(filterSubjects, subjectOptions, 'subjects');
        createMultiSelect(filterLessonTypes, lessonTypeOptions, 'lessonTypes');

        document.addEventListener('click', (e) => {
            if (!filterSubjects.contains(e.target)) filterSubjects.querySelector('.options').classList.add('hidden');
            if (!filterLessonTypes.contains(e.target)) filterLessonTypes.querySelector('.options').classList.add('hidden');
        });
    }

    function showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }
    
    // =================================================================================
    // GOAL SETTING LOGIC
    // =================================================================================

    function openGoalsModal() {
        weeklyHoursGoalInput.value = appState.studyGoals.weekly_hours || '';
        monthlyPapersGoalInput.value = appState.studyGoals.monthly_papers || '';
        showModal(goalsModal);
    }

    function handleSaveGoals() {
        const weeklyHours = parseInt(weeklyHoursGoalInput.value) || 0;
        const monthlyPapers = parseInt(monthlyPapersGoalInput.value) || 0;
        appState.studyGoals = { weekly_hours: weeklyHours, monthly_papers: monthlyPapers };
        localStorage.setItem('studyGoals', JSON.stringify(appState.studyGoals));
        updateGoalProgressDisplay();
        closeModal(goalsModal);
        showToast('Goals saved successfully!', 'success');
    }

    function updateGoalProgressDisplay() {
        const { weekly_hours, monthly_papers } = appState.studyGoals;
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        let weeklyMinutes = 0;
        for (let i = 0; i < 7; i++) {
            const dayToCheck = new Date(startOfWeek);
            dayToCheck.setDate(startOfWeek.getDate() + i);
            const planDayNum = Math.floor((dayToCheck - new Date(appState.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            if (planDayNum > 0 && planDayNum <= appState.totalDays) {
                const dayNotes = JSON.parse(localStorage.getItem(`dayNotes-${planDayNum}`) || '[]');
                weeklyMinutes += dayNotes.reduce((sum, note) => sum + (note.actualTime || 0), 0);
            }
        }
        
        const goalMinutes = weekly_hours * 60;
        const weeklyProgress = goalMinutes > 0 ? (weeklyMinutes / goalMinutes) * 100 : 0;
        weeklyHoursProgressText.textContent = `${formatTime(weeklyMinutes)} / ${weekly_hours}h`;
        weeklyHoursProgressBar.style.width = `${Math.min(100, weeklyProgress)}%`;

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        let papersCount = 0;
        for (let i = 1; i <= appState.totalDays; i++) {
            const dayDate = new Date(appState.startDate);
            dayDate.setDate(dayDate.getDate() + i - 1);
            if (dayDate >= startOfMonth && dayDate <= endOfMonth && appState.daysCompleted.includes(i)) {
                const dayNotes = JSON.parse(localStorage.getItem(`dayNotes-${i}`) || '[]');
                papersCount += dayNotes.filter(note => note.type === 'pastPaper').length;
            }
        }
        const monthlyProgress = monthly_papers > 0 ? (papersCount / monthly_papers) * 100 : 0;
        monthlyPapersProgressText.textContent = `${papersCount} / ${monthly_papers}`;
        monthlyPapersProgressBar.style.width = `${Math.min(100, monthlyProgress)}%`;
    }

    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    
    totalDaysInput.addEventListener('change', handleControlsChange);
    startDateInput.addEventListener('change', handleControlsChange);
    searchInput.addEventListener('input', handleSearch);
    themeToggleBtn.addEventListener('click', toggleTheme);
    goToTodayBtn.addEventListener('click', () => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const startDate = new Date(appState.startDate); startDate.setHours(0, 0, 0, 0);
        const todayDayNum = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (todayDayNum < 1 || todayDayNum > appState.totalDays) { showToast("Today's date is outside of the current plan.", 'info'); return; }
        const scrollToToday = () => {
            const todayCard = dayList.querySelector(`[data-day-id="${todayDayNum}"]`);
            if (todayCard) {
                if (todayCard.dataset.collapsed === 'true') {
                    appState.collapsedDays = appState.collapsedDays.filter(d => d !== todayDayNum);
                    localStorage.setItem('collapsedDays', JSON.stringify(appState.collapsedDays));
                    renderDays();
                    setTimeout(() => dayList.querySelector(`[data-day-id="${todayDayNum}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                } else todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };
        if (dayList.classList.contains('hidden')) { setView('daily'); setTimeout(scrollToToday, 100); } 
        else scrollToToday();
    });

    // Analytics Filters
    filterDateRange.addEventListener('change', (e) => {
        appState.analyticsFilters.dateRange = e.target.value;
        renderAnalytics();
    });
    resetFiltersBtn.addEventListener('click', () => {
        appState.analyticsFilters = { dateRange: 'all', subjects: [], lessonTypes: [] };
        filterDateRange.value = 'all';
        document.querySelectorAll('#filterSubjects input, #filterLessonTypes input').forEach(cb => cb.checked = false);
        document.querySelector('#filterSubjects .placeholder').textContent = 'All Subjects';
        document.querySelector('#filterLessonTypes .placeholder').textContent = 'All Types';
        renderAnalytics();
    });

    settingsBtn.addEventListener('click', () => showModal(settingsModal));
    closeSettingsModalBtn.addEventListener('click', () => closeModal(settingsModal));
    settingsModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(settingsModal));
    manageGoalsBtn.addEventListener('click', openGoalsModal);
    closeGoalsModalBtn.addEventListener('click', () => closeModal(goalsModal));
    saveGoalsBtn.addEventListener('click', handleSaveGoals);
    goalsModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(goalsModal));
    showDailyViewBtn.addEventListener('click', () => setView('daily'));
    showMonthlyViewBtn.addEventListener('click', () => setView('monthly'));
    showAnalyticsViewBtn.addEventListener('click', () => setView('analytics'));
    prevMonthBtn.addEventListener('click', () => { appState.currentMonthOffset--; renderMonthlyView(); });
    nextMonthBtn.addEventListener('click', () => { appState.currentMonthOffset++; renderMonthlyView(); });
    dayList.addEventListener('change', handleDayListChange);
    dayList.addEventListener('input', handleDayNotesChange);
    dayList.addEventListener('click', handleDayListClick);
    ['dragstart', 'dragover', 'drop', 'dragend', 'dragenter', 'dragleave'].forEach(evt => {
        dayList.addEventListener(evt, handleDragAndDrop);
        kanbanBoard.addEventListener(evt, handleDragAndDrop);
    });
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
    clearDataBtn.addEventListener('click', clearData);
    saveLessonBtn.addEventListener('click', handleSaveLesson);
    closeLessonModalBtn.addEventListener('click', () => closeModal(lessonModal));
    lessonModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(lessonModal));
    manageSubjectsBtn.addEventListener('click', () => { renderSubjectList(); showModal(subjectsModal); setTimeout(() => subjectNameInput.focus(), 50); });
    closeSubjectsModalBtn.addEventListener('click', () => closeModal(subjectsModal));
    subjectsModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(subjectsModal));
    addSubjectBtn.addEventListener('click', () => {
        const name = subjectNameInput.value.trim();
        if (!name) { showToast('Subject name cannot be empty.', 'error'); return; }
        if (appState.customSubjects[name]) { showToast('Subject with this name already exists.', 'error'); return; }
        appState.customSubjects[name] = { color: subjectColorInput.value, files: [], lessons: [] };
        saveSubjects(); renderSubjectList(); subjectNameInput.value = '';
    });
    subjectsList.addEventListener('click', handleSubjectManagementDelegated);
    closeSubjectFilesModalBtn.addEventListener('click', () => closeModal(subjectFilesModal));
    subjectFilesModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(subjectFilesModal));
    subjectFilesList.addEventListener('click', handleSubjectFilesModalClick);
    manageLessonsBtn.addEventListener('click', openLessonBankModal);
    closeLessonBankModalBtn.addEventListener('click', () => closeModal(lessonBankModal));
    lessonBankModal.addEventListener('click', (e) => e.currentTarget === e.target && closeModal(lessonBankModal));
    lessonBankSubjectsContainer.addEventListener('click', handleLessonBankSubjectSelect);
    addLessonToBankBtn.addEventListener('click', handleAddLessonToBank);
    lessonBankLessonsList.addEventListener('click', handleLessonBankActions);
    addFromBankBtn.addEventListener('click', openLessonBankPickerModal);
    showKanbanViewBtn.addEventListener('click', () => setView('kanban'));
    const confirmSubtopicSelectionBtn = document.getElementById('confirmSubtopicSelectionBtn');

    lessonBankPickerModal.addEventListener('click', (e) => {
        if (e.currentTarget === e.target) {
            closeModal(lessonBankPickerModal);
        } else {
            handleLessonBankPickerClick(e);
        }
    });

    confirmSubtopicSelectionBtn.addEventListener('click', handleConfirmSubtopicSelection);
    addChecklistItemBtn.addEventListener('click', () => { addChecklistItemToEditor(checklistItemInput.value); checklistItemInput.value = ''; checklistItemInput.focus(); });
    checklistItemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItemBtn.click(); } });
    checklistEditorList.addEventListener('click', e => { const deleteBtn = e.target.closest('button[data-action="delete-checklist-item"]'); if (deleteBtn) deleteBtn.closest('.checklist-editor-item').remove(); });
    lessonTypeSelect.addEventListener('change', toggleLessonTypeFields);
    pastPaperPartSelect.addEventListener('change', toggleLessonTypeFields);
    addPastPaperQuestionBtn.addEventListener('click', () => addQuestionToEditor());
    pastPaperQuestionsList.addEventListener('click', e => { const deleteBtn = e.target.closest('button[data-action="delete-pp-question"]'); if (deleteBtn) deleteBtn.closest('.pp-question-item').remove(); });
    window.addEventListener('beforeunload', () => { if (appState.activeTimer.intervalId) pauseTimer(); exitPip(); });
    
    initializeState();
    setView('daily');
});