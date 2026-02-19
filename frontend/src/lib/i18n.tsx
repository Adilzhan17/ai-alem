import { useLanguage } from '../LanguageContext';

export function useI18n() {
    const { language, setLanguage, t } = useLanguage();
    return {
        lang: language,
        setLang: setLanguage,
        t
    };
}
