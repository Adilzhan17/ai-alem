import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'ru' | 'en' | 'kk';

interface Translations {
    [key: string]: {
        [lang in Language]: string;
    };
}

const translations: Translations = {
    dashboard: { ru: 'Дашборд', en: 'Dashboard', kk: 'Бақылау тақтасы' },
    search: { ru: 'Поиск', en: 'Search', kk: 'Іздеу' },
    projects: { ru: 'Проекты', en: 'Projects', kk: 'Жобалар' },
    estimates: { ru: 'Сметы', en: 'Estimates', kk: 'Сметалар' },
    blueprints: { ru: 'Чертежи', en: 'Blueprints', kk: 'Сызбалар' },
    materials: { ru: 'Материалы', en: 'Materials', kk: 'Материалдар' },
    contractors: { ru: 'Подрядчики', en: 'Contractors', kk: 'Мердігерлер' },
    settings: { ru: 'Настройки', en: 'Settings', kk: 'Параметрлер' },
    analyze: { ru: 'Анализировать', en: 'Analyze', kk: 'Талдау' },
    heroTitle: { ru: 'AI Командный Центр', en: 'AI Command Center', kk: 'AI Басқару Орталығы' },
    heroSub: { ru: 'Доступ к интеллекту вашего портфеля и рыночным данным.', en: 'Access your portfolio intelligence and market data instantly.', kk: 'Портфель интеллектісіне және нарық деректеріне жылдам қол жеткізіңіз.' },
    placeholder: { ru: 'Спросите что угодно о вашем портфеле...', en: 'Ask anything about your portfolio...', kk: 'Портфеліңіз туралы кез келген нәрсені сұраңыз...' },
    langRu: { ru: 'Русский', en: 'Russian', kk: 'Орысша' },
    langEn: { ru: 'English', en: 'English', kk: 'Ағылшынша' },
    langKk: { ru: 'Қазақша', en: 'Kazakh', kk: 'Қазақша' },
    budgetHealth: { ru: 'Здоровье бюджета', en: 'Budget Health', kk: 'Бюджет денсаулығы' },
    onTrack: { ru: 'В графике', en: 'On Track', kk: 'Кестеде' },
    underBudget: { ru: 'ниже бюджета', en: 'under budget', kk: 'бюджеттен төмен' },
    daysLeft: { ru: 'дней осталось', en: 'days left', kk: 'күн қалды' },
    projectTimeline: { ru: 'Сроки проекта', en: 'Project Timeline', kk: 'Жоба мерзімі' },
    viewGantt: { ru: 'Открыть Гантт', en: 'View Gantt', kk: 'Гантт ашу' },
    financialRiskAi: { ru: 'Финансовые риски AI', en: 'Financial & Risk AI', kk: 'Қаржылық тәуекелдер AI' },
    riskAssessment: { ru: 'АНАЛИЗ РИСКОВ AI', en: 'AI RISK ASSESSMENT', kk: 'ТӘУЕКЕЛДЕРДІ ТАЛДАУ AI' },
    highProbability: { ru: 'ВЫСОКАЯ', en: 'HIGH', kk: 'ЖОҒАРЫ' },
    probability: { ru: 'Вероятность', en: 'Probability', kk: 'Ықтималдық' },
    viewMitigation: { ru: 'План минимизации', en: 'View Mitigation Strategy', kk: 'Тәуекелдерді азайту жоспары' },
    activityFiles: { ru: 'Активность и файлы', en: 'Activity & Files', kk: 'Белсенділік пен файлдар' },
    recentActivity: { ru: 'Последние действия', en: 'Recent Activity', kk: 'Соңғы әрекеттер' },
    recentActivityDesc: { ru: 'Ваши последние объявления и обновления.', en: 'Your latest listings and project updates.', kk: 'Сіздің соңғы хабарландыруларыңыз бен жаңартуларыңыз.' },
    files: { ru: 'Файлы', en: 'Files', kk: 'Файлдар' },
    currentQuery: { ru: 'Текущий запрос', en: 'Current Query', kk: 'Ағымдағы сұрау' },
    refinePrompt: { ru: 'Уточнить запрос', en: 'Refine Prompt', kk: 'Сұрауды нақтылау' },
    aiReasoning: { ru: 'AI Анализ', en: 'AI Reasoning', kk: 'AI Талдау' },
    strategicMatch: { ru: 'Стратегическое совпадение', en: 'Strategic Match', kk: 'Стратегиялық сәйкестік' },
    activeFilters: { ru: 'Активные фильтры', en: 'Active Filters', kk: 'Белсенді сүзгілер' },
    priceRange: { ru: 'Диапазон цен', en: 'Price Range', kk: 'Баға диапазоны' },
    minCapRate: { ru: 'Мин. Cap Rate', en: 'Min Cap Rate', kk: 'Мин. Cap Rate' },
    buildingClass: { ru: 'Класс здания', en: 'Building Class', kk: 'Ғимарат класы' },
    propertiesFound: { ru: 'Найдено объектов', en: 'Properties Found', kk: 'Табылған нысандар' },
    property: { ru: 'Объект', en: 'Property', kk: 'Нысан' },
    price: { ru: 'Цена', en: 'Price', kk: 'Баға' },
    capRate: { ru: 'Cap Rate', en: 'Cap Rate', kk: 'Cap Rate' },
    size: { ru: 'Площадь', en: 'Size', kk: 'Ауданы' },
    score: { ru: 'Оценка', en: 'Score', kk: 'Баға' },
    map: { ru: 'Карта', en: 'Map', kk: 'Карта' },
    details: { ru: 'Детали', en: 'Details', kk: 'Мәліметтер' },
    runFinancialModel: { ru: 'Запустить фин. модель', en: 'Run Financial Model', kk: 'Қаржы моделін қосу' },
    save: { ru: 'Сохранить', en: 'Save', kk: 'Сақтау' },
    share: { ru: 'Поделиться', en: 'Share', kk: 'Бөлісу' },
    technicalEstimate: { ru: 'Техническая смета и BOQ', en: 'Technical Estimate & BOQ', kk: 'Техникалық смета және BOQ' },
    draft: { ru: 'Черновик', en: 'Draft', kk: 'Жоба' },
    lastUpdated: { ru: 'Последнее обновление', en: 'Last updated', kk: 'Соңғы жаңарту' },
    export: { ru: 'Экспорт', en: 'Export', kk: 'Экспорт' },
    requestQuotes: { ru: 'Запросить расценки', en: 'Request Contractor Quotes', kk: 'Мердігер бағаларын сұрау' },
    totalEstCost: { ru: 'Общая оц. стоимость', en: 'Total Est. Cost', kk: 'Жалпы бағалау құны' },
    costSqFt: { ru: 'Стоимость / кв.м', en: 'Cost / Sq.Ft', kk: 'Құны / ш.м' },
    itemsCount: { ru: 'Кол-во позиций', en: 'Items Count', kk: 'Позициялар саны' },
    aiConfidence: { ru: 'Уверенность AI', en: 'AI Confidence', kk: 'AI Сенімділігі' },
    itemDescription: { ru: 'Описание позиции', en: 'Item Description', kk: 'Позиция сипаттамасы' },
    qty: { ru: 'Кол-во', en: 'Qty', kk: 'Саны' },
    unit: { ru: 'Ед. изм.', en: 'Unit', kk: 'Өлш. бірл.' },
    rate: { ru: 'Ставка', en: 'Rate', kk: 'Ставка' },
    total: { ru: 'Итого', en: 'Total', kk: 'Жалпы' },
    grandTotalEstimate: { ru: 'Итоговая смета', en: 'Grand Total Estimate', kk: 'Жалпы смета' },
    marketAdjustments: { ru: 'Рыночные корректировки', en: 'Market Adjustments', kk: 'Нарықтық түзетулер' },
    selectMaterialTier: { ru: 'Выберите класс материалов', en: 'Select Material Tier', kk: 'Материал класын таңдаңыз' },
    valueEngineering: { ru: 'Возможности оптимизации', en: 'Value Engineering Opportunities', kk: 'Оңтайландыру мүмкіндіктері' },
    apply: { ru: 'Применить', en: 'Apply', kk: 'Қолдану' },
    dismiss: { ru: 'Скрыть', en: 'Dismiss', kk: 'Жасыру' },
    contractorNetwork: { ru: 'Сеть подрядчиков', en: 'Contractor Network', kk: 'Мердігерлер желісі' },
    contractorSubtitle: { ru: 'Управляйте партнерами и запрашивайте предложения.', en: 'Manage your trusted partners and request competitive quotes.', kk: 'Серіктестерді басқарыңыз және баға ұсыныстарын сұраңыз.' },
    filter: { ru: 'Фильтр', en: 'Filter', kk: 'Сүзгі' },
    inviteContractor: { ru: 'Пригласить подрядчика', en: 'Invite Contractor', kk: 'Мердігерді шақыру' },
    activeContractors: { ru: 'Активные подрядчики', en: 'Active Contractors', kk: 'Белсенді мердігерлер' },
    quotesReceived: { ru: 'Получено предложений', en: 'Quotes Received', kk: 'Алынған ұсыныстар' },
    pendingReview: { ru: 'На рассмотрении', en: 'Pending Review', kk: 'Қарастырылуда' },
    avgSavings: { ru: 'Средняя экономия', en: 'Avg. Savings', kk: 'Орташа үнемдеу' },
    shortlistedContractors: { ru: 'Избранные подрядчики', en: 'Shortlisted Contractors', kk: 'Таңдалған мердігерлер' },
    searchContractors: { ru: 'Поиск подрядчиков...', en: 'Search contractors...', kk: 'Мердігерлерді іздеу...' },
    contractor: { ru: 'Подрядчик', en: 'Contractor', kk: 'Мердігер' },
    speciality: { ru: 'Специализация', en: 'Speciality', kk: 'Мамандануы' },
    rating: { ru: 'Рейтинг', en: 'Rating', kk: 'Рейтинг' },
    status: { ru: 'Статус', en: 'Status', kk: 'Мәртебе' },
    quote: { ru: 'Предложение', en: 'Quote', kk: 'Ұсыныс' },
    actions: { ru: 'Действия', en: 'Actions', kk: 'Әрекеттер' },
    showingContractors: { ru: 'Показано', en: 'Showing', kk: 'Көрсетілуде' },
    generateRFQ: { ru: 'Создать RFQ', en: 'Generate RFQ Document', kk: 'RFQ құжатын жасау' },
    compareQuotes: { ru: 'Сравнить', en: 'Compare Quotes', kk: 'Салыстыру' },
    awardContract: { ru: 'Заключить контракт', en: 'Award Contract', kk: 'Келісімшарт жасау' },
    dragDropBlueprints: { ru: 'Загрузите чертежи', en: 'Drag & Drop Blueprints', kk: 'Сызбаларды жүктеңіз' },
    uploadDesc: { ru: 'Загрузите планы этажей для AI анализа.', en: 'Upload architectural floor plans for AI-driven zone detection.', kk: 'AI талдау үшін қабат жоспарларын жүктеңіз.' },
    browseFiles: { ru: 'Выбрать файлы', en: 'Browse Files', kk: 'Файлдарды таңдау' },
    maxFileSize: { ru: 'Макс. размер файла 50MB', en: 'Max file size 50MB per file', kk: 'Файлдың макс. өлшемі 50MB' },
    aiAnalysis: { ru: 'AI Анализ', en: 'AI Analysis', kk: 'AI Талдау' },
    measurements: { ru: 'Измерения', en: 'Measurements', kk: 'Өлшемдер' },
    fastProcessing: { ru: 'Быстрая обработка', en: 'Fast Processing', kk: 'Жылдам өңдеу' },
    analysisQueue: { ru: 'Очередь анализа', en: 'Analysis Queue', kk: 'Талдау кезегі' },
    clearAll: { ru: 'Очистить все', en: 'Clear All', kk: 'Барлығын тазалау' },
    analysing: { ru: 'Анализ...', en: 'Analysing', kk: 'Талдау...' },
    ready: { ru: 'Готово', en: 'Ready', kk: 'Дайын' },
    needsReview: { ru: 'Требует проверки', en: 'Needs Review', kk: 'Тексеру қажет' },
    totalProcessedArea: { ru: 'Общая обработанная площадь', en: 'Total Processed Area', kk: 'Жалпы өңделген аудан' },
    confirmAnalysis: { ru: 'Подтвердить анализ', en: 'Confirm Analysis', kk: 'Талдауды растау' },
    recalculate: { ru: 'Пересчитать', en: 'Recalculate', kk: 'Қайта санау' },
    exportBOQ: { ru: 'Экспорт BOQ', en: 'Export BOQ', kk: 'BOQ экспорты' },
    suggestedQueries: { ru: 'Рекомендуемые запросы', en: 'Suggested Queries', kk: 'Ұсынылатын сұраулар' },
    helpCenter: { ru: 'Центр помощи', en: 'Help Center', kk: 'Көмек орталығы' },
    privacyPolicy: { ru: 'Политика конфиденциальности', en: 'Privacy Policy', kk: 'Құпиялылық саясаты' },
    lastLogin: { ru: 'Последний вход: Сегодня в 09:42', en: 'Last login: Today at 09:42 AM', kk: 'Соңғы кіру: Бүгін 09:42' },
    dataVersion: { ru: 'Версия данных: v2.4.1 (Live)', en: 'Data Version: v2.4.1 (Live)', kk: 'Деректер нұсқасы: v2.4.1 (Live)' },
    appTitle: { ru: 'Qal.ai', en: 'Qal.ai', kk: 'Qal.ai' },
    roleClient: { ru: 'Роль: Клиент', en: 'Role: Client', kk: 'Рөлі: Клиент' },
    systemOnline: { ru: 'Система онлайн', en: 'System Online', kk: 'Жүйе онлайн' },
    notifications: { ru: 'Уведомления', en: 'Notifications', kk: 'Хабарламалар' },
    highRoiFocus: { ru: 'Высокий ROI', en: 'High ROI Focus', kk: 'Жоғары ROI' },
    zoneAOnly: { ru: 'Только зона А', en: 'Zone A Only', kk: 'Тек А аймағы' },
    prev: { ru: 'Пред.', en: 'Prev', kk: 'Алдыңғы' },
    next: { ru: 'След.', en: 'Next', kk: 'Келесі' },
    selected: { ru: 'Выбрано', en: 'Selected', kk: 'Таңдалды' },
    highRoiPotential: { ru: 'Потенциал высокого ROI', en: 'High ROI Potential', kk: 'Жоғары ROI әлеуеті' },
    requiresReno: { ru: 'Требует ремонта', en: 'Requires Reno', kk: 'Жөндеуді қажет етеді' },
    showingResults: { ru: 'Показано', en: 'Showing', kk: 'Көрсетілуде' },
    of: { ru: 'из', en: 'of', kk: '-дан' },
    resultsText: { ru: 'результатов', en: 'results', kk: 'нәтижелер' },
    aiReasoningText: { ru: 'На основе текущих трендов рынка идентифицировано <strong className="text-white">14 объектов</strong>. Выбор приоритетно включает развивающиеся районы.', en: 'Based on current market trends, <strong className="text-white">14 properties</strong> were identified. The selection prioritizes emerging neighborhoods.', kk: 'Нарықтағы ағымдағы трендтерге сүйене отырып, <strong className="text-white">14 нысан</strong> анықталды. Таңдау дамушы аудандарға басымдық береді.' },

    // Sidebar & Navigation
    platform: { ru: 'Платформа', en: 'Platform', kk: 'Платформа' },
    commandCenter: { ru: 'Командный центр', en: 'Command Center', kk: 'Басқару орталығы' },
    mapView: { ru: 'Карта', en: 'Map View', kk: 'Карта көрінісі' },
    management: { ru: 'Управление', en: 'Management', kk: 'Басқару' },
    myListings: { ru: 'Мои объекты', en: 'My Listings', kk: 'Менің нысандарым' },
    account: { ru: 'Аккаунт', en: 'Account', kk: 'Аккаунт' },
    profile: { ru: 'Профиль', en: 'Profile', kk: 'Профиль' },
    administration: { ru: 'Администрирование', en: 'Administration', kk: 'Әкімшілік' },
    moderation: { ru: 'Модерация', en: 'Moderation', kk: 'Модерация' },
    users: { ru: 'Пользователи', en: 'Users', kk: 'Пайдаланушылар' },
    listings: { ru: 'Объявления', en: 'Listings', kk: 'Хабарландырулар' },
    support: { ru: 'Поддержка', en: 'Support', kk: 'Қолдау' },
    feedback: { ru: 'Обратная связь', en: 'Feedback', kk: 'Кері байланыс' },

    // User Menu
    upgradeToPro: { ru: 'Улучшить до Pro', en: 'Upgrade to Pro', kk: 'Pro-ға дейін жаңарту' },
    billing: { ru: 'Оплата', en: 'Billing', kk: 'Төлем' },
    logOut: { ru: 'Выйти', en: 'Log out', kk: 'Шығу' },
    guestUser: { ru: 'Гость', en: 'Guest User', kk: 'Қонақ' },

    // Dashboard Quick Actions & Stats
    totalListings: { ru: 'Всего объектов', en: 'Total Listings', kk: 'Барлық нысандар' },
    activePending: { ru: 'активных, на проверке', en: 'active, pending', kk: 'белсенді, тексерілуде' },
    portfolioValue: { ru: 'Стоимость портфеля', en: 'Portfolio Value', kk: 'Портфель құны' },
    fromLastMonth: { ru: 'с прошлого месяца', en: 'from last month', kk: 'өткен айдан бері' },
    noActiveContracts: { ru: 'Нет активных контрактов', en: 'No active contracts', kk: 'Белсенді келісімшарттар жоқ' },
    systemHealth: { ru: 'Здоровье системы', en: 'System Health', kk: 'Жүйе денсаулығы' },
    operational: { ru: 'Работает', en: 'Operational', kk: 'Жұмыс істеуде' },
    welcomeBack: { ru: 'С возвращением', en: 'Welcome back', kk: 'Қайта оралуыңызбен' },
    heresWhatsHappening: { ru: 'Вот что происходит с вашими проектами.', en: "Here's what's happening with your projects.", kk: 'Міне, сіздің жобаларыңызбен не болып жатыр.' },
    today: { ru: 'Сегодня', en: 'Today', kk: 'Бүгін' },
    newProject: { ru: 'Новый проект', en: 'New Project', kk: 'Жаңа жоба' },
    quickActions: { ru: 'Быстрые действия', en: 'Quick Actions', kk: 'Жылдам әрекеттер' },
    commonTasks: { ru: 'Основные задачи и инструменты.', en: 'Common tasks and tools.', kk: 'Негізгі тапсырмалар мен құралдар.' },
    createListing: { ru: 'Создать объявление', en: 'Create Listing', kk: 'Хабарландыру құру' },
    createListingDesc: { ru: 'Добавить новый объект', en: 'Add new property', kk: 'Жаңа нысан қосу' },
    marketAnalysis: { ru: 'Анализ рынка', en: 'Market Analysis', kk: 'Нарықты талдау' },
    marketAnalysisDesc: { ru: 'AI-интеллект', en: 'AI-powered intel', kk: 'AI-интеллект' },
    costEstimation: { ru: 'Оценка стоимости', en: 'Cost Estimation', kk: 'Құнын бағалау' },
    costEstimationDesc: { ru: 'Создать смету (BOQ)', en: 'Generate BOQ', kk: 'Сметаны құру (BOQ)' },
    findContractors: { ru: 'Найти подрядчиков', en: 'Find Contractors', kk: 'Мердігерлерді табу' },
    findContractorsDesc: { ru: 'Каталог профи', en: 'Browse pros', kk: 'Кәсіби мамандар каталогы' },
    viewAll: { ru: 'Смотреть все', en: 'View All', kk: 'Барлығын көру' },
    noRecentActivity: { ru: 'Нет недавней активности.', en: 'No recent activity.', kk: 'Соңғы белсенділік жоқ.' },
    createFirstListing: { ru: 'Создать первое объявление', en: 'Create your first listing', kk: 'Алғашқы хабарландыруды құру' },
    activeState: { ru: 'активных', en: 'active', kk: 'белсенді' },
    pendingState: { ru: 'на проверке', en: 'pending', kk: 'тексерілуде' },
    aiBroker: { ru: 'AI Брокер', en: 'AI Broker', kk: 'AI Брокер' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('ru');

    const t = (key: string) => {
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
