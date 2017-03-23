/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* global jQuery:false */
/* jslint browser:true */
/* jshint browser:true */
/* global availableLanguages */
/* global i18n */
/* global systemLang */

$(function () {   

    $('#submit').on('click', function () {
        $('#loginForm').submit();
    });

    i18n.locale = systemLang;
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