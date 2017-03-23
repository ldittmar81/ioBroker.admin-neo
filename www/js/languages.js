var availableLanguages = ['en', 'de', 'ru', 'pt'];

var systemLang = navigator.language || navigator.userLanguage;
if (!(systemLang in availableLanguages))
    systemLang = "en";
var i18n = $.i18n();