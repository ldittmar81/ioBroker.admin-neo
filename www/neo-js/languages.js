var availableLanguages = {'de': 'Deutsch', 'en': 'English', 'nl': 'Dutch', 'pt': 'Português', 'ru': 'русский'};

var systemLang = navigator.language || navigator.userLanguage;
if (!availableLanguages.hasOwnProperty(systemLang)) {
    systemLang = "en";
}
var i18n = $.i18n();
i18n.load('i18n/en/translations.json', 'en');