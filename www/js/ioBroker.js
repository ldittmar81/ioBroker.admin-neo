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

jQuery.fn.toString = function () {
    var out;
    out = [];
    $.each(this, function (k, v) {
        return out.push($(v)[0].outerHTML);
    });
    return out.join("\n");
};

jQuery.fn.switchClass = function (a, b) {
    this.each(function () {
        var t = $(this).hasClass(a);
        $(this).addClass(t ? b : a).removeClass(t ? a : b);
    });
    return this;
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

String.prototype.text2iconClass = function () {
    if (this.startsWith('fa-')) {
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

    // Alert
    $(function () {
        var _alert;
        function consume_alert() {
            if (_alert) {
                return;
            }
            _alert = window.alert;
            window.alert = function (message, type, title) {
                if (!type || (type !== 'error' && type !== 'info' && type !== 'success')) {
                    type = "notice";
                }
                if (!title) {
                    title = $.i18n(type);
                }
                var opts = {
                    title: title,
                    text: message,
                    type: type,
                    animate: {
                        animate: true,
                        in_class: "rubberBand",
                        out_class: "bounceOut"
                    }
                };
                switch (type) {
                    case 'error':
                        opts.icon = "fa fa-exclamation-triangle";
                        break;
                    case 'info':
                        opts.icon = "fa fa-info-circle";
                        break;
                    case 'success':
                        opts.icon = "fa fa-check-circle";
                        break;
                    default:
                        opts.icon = "fa fa-sticky-note";
                }
                new PNotify(opts);
            };
        }
        consume_alert();
    });
    // / Alert

    // Panel toolbox
    $(function () {
        $(document.body).on('click', '.x_panel .x_title', function () {
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
            if ($expand.text() === "+") {
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
        changeLanguage(systemLang);
    });
    // / Translation/Tooltip

    // Clearable input
    function tog(v) {
        return v ? 'addClass' : 'removeClass';
    }
    $(document).on('input', '.clearable', function () {
        $(this)[tog(this.value)]('x');
    }).on('mousemove', '.x', function (e) {
        $(this)[tog(this.offsetWidth - 18 < e.clientX - this.getBoundingClientRect().left)]('onX');
    }).on('touchstart click', '.onX', function (ev) {
        ev.preventDefault();
        $(this).removeClass('x onX').val('').change();
    });
    // / Clearable input


    // Others
    $(function () {
        $RIGHT_COL.css('padding-top', ($NAV_MENU.height() + 5) + 'px');
    });
    // / Others

})(jQuery);

// Clock
var secInterval, hourInterval, minInterval, isClockOn = false;

function stopClock() {
    isClockOn = false;
    clearInterval(secInterval);
    clearInterval(hourInterval);
    clearInterval(minInterval);
    $(window).off('resize');
}
// / Clock

function changeLanguage(lang) {
    i18n.locale = lang;
    i18n.load('i18n/' + i18n.locale + '/translations.json', i18n.locale).done(function () {
        $("[data-i18n]").i18n();
        $("[data-i18n-attr]").each(function () {
            var $this = $(this);
            var data = $this.data('i18n-attr').split("|");
            $this.attr(data[1], $.i18n(data[0]));
        });
        $("[data-i18n-tooltip]").each(function () {
            var $this = $(this);
            $this.attr("title", $.i18n($this.data('i18n-tooltip'))).attr("data-toggle", "tooltip");
        });
        $('[data-toggle="tooltip"]').tooltip({
            container: 'body'
        });
    });
}

function restartFunctions(selector) {
    if (isClockOn && selector !== '#menu-home-div') {
        stopClock();
    }
    if (selector === '#menu-enums-div') {
        $('ul.orbit').orbitlist({
            onhover: false
        });
    }
    $(selector).find('input[type=checkbox],input[type=radio]').iCheck({
        checkboxClass: 'icheckbox_flat-green',
        radioClass: 'iradio_flat-green'
    });
    $(selector).find('select').selectpicker();
    $(selector).find('[data-i18n]').i18n();
    $(selector).find('[data-i18n-attr]').each(function () {
        var $this = $(this);
        var data = $this.data('i18n-attr').split("|");
        $this.attr(data[1], $.i18n(data[0]));
    });
    $(selector).find('[data-i18n-tooltip]').each(function () {
        var $this = $(this);
        $this.attr("title", $.i18n($this.data('i18n-tooltip'))).tooltip({
            title: $.i18n($this.data('i18n-tooltip')),
            container: selector
        });
    });
    $(selector).find('[data-toggle="tooltip"]').tooltip({
        container: selector
    });
}