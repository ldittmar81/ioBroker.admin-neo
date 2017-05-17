/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* jslint browser:true */
/* jslint devel:true */
/* jshint browser:true */
/* jshint devel:true */
/* jshint jquery:true */
/* global io:false */
/* global jQuery:false */
/* global $:false */
/* global i18n, systemLang */

$(function () {
    'use strict';

    $('#submit').on('click', function () {
        $('#loginForm').submit();
    });

    i18n.locale = systemLang;
    i18n.load('i18n/' + i18n.locale + '/translations.json', i18n.locale).done(function () {
        $("#origin").val(window.location.search.replace('&error', ''));
        $('#username').attr("placeholder", $.i18n('username'));
        $('#password').attr("placeholder", $.i18n('password'));

        if (window.location.search.indexOf('error') !== -1) {
            $('#error').val($.i18n('wrong_key')).show();
        }

        $("[data-i18n]").i18n();
    });

});