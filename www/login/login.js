/* global i18n, availableLanguages */

$(function () {   

    $('#submit').on('click', function () {
        $('#loginForm').submit();
    });

    var lang = navigator.language || navigator.userLanguage;
    if(!(lang in ['en', 'de', 'ru', 'pt'])){
        lang = "en";
    }
    i18n.locale = lang;
    i18n.load('i18n/' + i18n.locale + '/translations.json', i18n.locale).done(function () {
        $("#origin").val(window.location.search.replace('&error', ''));
        $('#username').attr("placeholder", $.i18n('username'));
        $('#password').attr("placeholder", $.i18n('password'));

        if (window.location.search.indexOf('error') != -1) {
            $('#error').val($.i18n('wrong_key')).show();
        }
        
        $("[data-i18n]").i18n();
    });

});