/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* global io:false */
/* global jQuery:false */
/* jslint browser:true */
/* jshint browser:true */
/* global systemLang */
/* global i18n */
/* global PNotify */

'use strict';

PNotify.prototype.options.styling = "fontawesome";

var CURRENT_URL = window.location.href.split('#')[0].split('?')[0],
        $BODY = $('body'),
        $MENU_TOGGLE = $('#menu_toggle'),
        $SIDEBAR_MENU = $('#sidebar-menu'),
        $SIDEBAR_FOOTER = $('.sidebar-footer'),
        $LEFT_COL = $('.left_col'),
        $RIGHT_COL = $('.right_col'),
        $NAV_MENU = $('.nav_menu'),
        $FOOTER = $('footer');

jQuery.fn.changeTooltip = function (newValue) {
    this.each(function () {
        $(this).tooltip('hide')
                .attr('data-original-title', newValue)
                .tooltip('fixTitle')
                .tooltip('show');
    });
    return this;
};

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

String.prototype.text2iconClass = function () {
    if(this.startsWith('fa-')){
        return this;
    }
    if (this.substr())
        switch (this) {
            case 'alert':
                return "fa-exclamation-triangle text-danger";
            case 'help':
                return "fa-question-circle text-info";
            case 'notice':
                return "fa-exclamation-circle text-info";
            default:
                return "fa-" + this;
        }
};

/**
 * Resize function without multiple trigger
 * 
 * Usage:
 * $(window).smartresize(function(){  
 *     // code here
 * });
 */
(function ($, sr) {
    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
        var timeout;

        return function debounced() {
            var obj = this, args = arguments;
            function delayed() {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            }

            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 100);
        };
    };

    // smartresize 
    jQuery.fn[sr] = function (fn) {
        return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr);
    };

})(jQuery, 'smartresize');

(function ($) {

    // Sidebar
    $(function () {
        // TODO: This is some kind of easy fix, maybe we can improve this
        var setContentHeight = function () {
            // reset height
            $RIGHT_COL.css('min-height', $(window).height());
            var bodyHeight = $BODY.outerHeight(),
                    footerHeight = $BODY.hasClass('footer_fixed') ? -10 : $FOOTER.height(),
                    leftColHeight = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(),
                    contentHeight = bodyHeight < leftColHeight ? leftColHeight : bodyHeight;
            // normalize content
            contentHeight -= $NAV_MENU.height() + footerHeight;
            $RIGHT_COL.css('min-height', contentHeight);
        };
        $SIDEBAR_MENU.find('a').on('click', function (ev) {
            var $li = $(this).parent();
            if ($li.is('.active')) {
                $li.removeClass('active active-sm');
                $('ul:first', $li).slideUp(function () {
                    setContentHeight();
                });
            } else {
                // prevent closing menu if we are on child menu
                if (!$li.parent().is('.child_menu')) {
                    $SIDEBAR_MENU.find('li').removeClass('active active-sm');
                    $SIDEBAR_MENU.find('li ul').slideUp();
                }

                $li.addClass('active');
                $('ul:first', $li).slideDown(function () {
                    setContentHeight();
                });
            }
        });
        // toggle small or large menu
        $MENU_TOGGLE.on('click', function () {
            if ($BODY.hasClass('nav-md')) {
                $SIDEBAR_MENU.find('li.active ul').hide();
                $SIDEBAR_MENU.find('li.active').addClass('active-sm').removeClass('active');
            } else {
                $SIDEBAR_MENU.find('li.active-sm ul').show();
                $SIDEBAR_MENU.find('li.active-sm').addClass('active').removeClass('active-sm');
            }

            $BODY.toggleClass('nav-md nav-sm');
            setContentHeight();
        });
        // check active menu
        $SIDEBAR_MENU.find('a[href="' + CURRENT_URL + '"]').parent('li').addClass('current-page');
        $SIDEBAR_MENU.find('a').filter(function () {
            return this.href == CURRENT_URL;
        }).parent('li').addClass('current-page').parents('ul').slideDown(function () {
            setContentHeight();
        }).parent().addClass('active');
        // recompute content when resizing
        $(window).smartresize(function () {
            setContentHeight();
        });
        setContentHeight();
        // fixed sidebar
        if ($.fn.mCustomScrollbar) {
            $('.menu_fixed').mCustomScrollbar({
                autoHideScrollbar: true,
                theme: 'minimal',
                mouseWheel: {preventDefault: true}
            });
        }
    });
    // /Sidebar

    // Panel toolbox
    $(function () {
        $(document.body).on('click', '.collapse-link', function () {
            var $BOX_PANEL = $(this).closest('.x_panel'),
                    $ICON = $(this).find('i'),
                    $BOX_CONTENT = $BOX_PANEL.find('.x_content');
            // fix for some div with hardcoded fix class
            if ($BOX_PANEL.attr('style')) {
                $BOX_CONTENT.slideToggle(200, function () {
                    $BOX_PANEL.removeAttr('style');
                });
            } else {
                $BOX_CONTENT.slideToggle(200);
                $BOX_PANEL.css('height', 'auto');
            }

            $ICON.toggleClass('fa-chevron-up fa-chevron-down');
        });
        $('.close-link').click(function () {
            var $BOX_PANEL = $(this).closest('.x_panel');
            $BOX_PANEL.remove();
        });
    });
    // /Panel toolbox

    // iCheck
    $(function () {
        $('input[type=checkbox], input[type=radio]').iCheck({
            checkboxClass: 'icheckbox_flat-green',
            radioClass: 'iradio_flat-green'
        });
    });
    // /iCheck

    // Accordion
    $(function () {
        $(".expand").on("click", function () {
            $(this).next().slideToggle(200);
            $expand = $(this).find(">:first-child");
            if ($expand.text() == "+") {
                $expand.text("-");
            } else {
                $expand.text("+");
            }
        });
    });
    // /Accordion

    // Bootstrap select
    $(function () {
        $('select').selectpicker();
    });
    // / Bootstrap select

    // Translation/Tooltip
    $(function () {
        i18n.locale = systemLang;
        i18n.load('i18n/' + i18n.locale + '/translations.json', i18n.locale).done(function () {
            $("[data-i18n]").i18n();
            $("[data-i18n-tooltip]").each(function () {
                var $this = $(this);
                $this.attr("title", $.i18n($this.data('i18n-tooltip'))).attr("data-toggle", "tooltip");
            });
            $('[data-toggle="tooltip"]').tooltip({
                container: 'body'
            });
        });
    });
    // / Translation/Tooltip

    // Others
    $(function () {
        $RIGHT_COL.css('padding-top', ($NAV_MENU.height() + 5) + 'px');
    });
    // / Others

})(jQuery);

function restartFunctions(id) {
    $('#' + id + ' input[type=checkbox], #' + id + ' input[type=radio]').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    });
    $('#' + id + ' select').selectpicker();
    $("#" + id + " [data-i18n]").i18n();
    $("#" + id + " [data-i18n-tooltip]").each(function () {
        var $this = $(this);
        $this.attr("title", $.i18n($this.data('i18n-tooltip'))).attr("data-toggle", "tooltip");
    });
    $('#' + id + ' [data-toggle="tooltip"]').tooltip({
        container: 'body'
    });
}