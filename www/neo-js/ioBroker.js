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

jQuery.fn.progressbar = function (a, b) {
    var $this = $(this);
    if ($this.hasClass('meter')) {
        if (a === "error" || b === "error") {
            $this.removeClass('orange').addClass('red').addClass('nostripes');
        } else if (a === "warning" || b === "warning") {
            $this.removeClass('red').addClass('orange').removeClass('nostripes');
        } else {
            $this.removeClass('red').removeClass('orange').removeClass('nostripes');
        }

        var $span = $this.find('span');

        var value;
        var orgval = 100 * $span.width() / $span.offsetParent().width();
        if (a === "auto" || b === "auto") {
            if (orgval < 10) {
                value = orgval + 3;
            } else if (orgval < 30) {
                value = orgval + 1;
            } else if (orgval < 40) {
                value = orgval + 2;
            } else if (orgval < 60) {
                value = orgval + 0.5;
            } else if (orgval < 80) {
                value = orgval + 1;
            } else if (orgval < 90) {
                value = orgval + 0.2;
            } else {
                value = orgval;
            }
        } else if (typeof a === "string" && a.startsWith("+")) {
            value = parseInt(a.substr(1));
            value = a.startsWith("+") ? (orgval + value) : (orgval - value);
            if (value > 90) {
                value = orgval;
            }
        } else if (typeof b === "string" && b.startsWith("+")) {
            value = parseInt(b.substr(1));
            value = orgval + value;
            if (value > 90) {
                value = orgval;
            }
        } else {
            value = parseInt(a) || parseInt(b);
        }

        if (!isNaN(value)) {
            if (value > 100) {
                value = 100;
            }
            if (value === 100) {
                $this.addClass('nostripes');
            }
            $span.width(value + "%");
        }
    }
    return this;
};

jQuery.fn.switchClass = function (a, b) {
    this.each(function () {
        var t = $(this).hasClass(a);
        $(this).addClass(t ? b : a).removeClass(t ? a : b);
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

    jQuery.fn.tooltip.Constructor.prototype.init = function (type, element, options) {
        this.enabled = true;
        this.type = type;
        this.$element = $(element);
        this.options = this.getOptions(options);
        this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport));
        this.inState = {click: false, hover: false, focus: false};

        if (this.$element[0] instanceof document.constructor && !this.options.selector) {
            throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!');
        }

        var triggers = this.options.trigger.split(' ');

        for (var i = triggers.length; i--; ) {
            var trigger = triggers[i];

            if (trigger === 'click') {
                this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
            } else if (trigger !== 'manual') {

                var eventIn = trigger === 'hover' ? 'mouseenter' : 'focusin';
                var eventOut = trigger === 'hover' ? 'mouseleave' : 'focusout';

                this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
                this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));

                if (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
                    this.$element.on('taphold.' + this.type, this.options.selector, function (event) {
                        event.stopPropagation();
                        $.proxy(this.enter, this);
                    });
                    $(document.body).one('tap.' + this.type, this.options.selector, $.proxy(this.leave, this));
                }

            }
        }

        this.options.selector ?
                (this._options = $.extend({}, this.options, {trigger: 'manual', selector: ''})) :
                this.fixTitle();
    }

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
        $("body").tooltip({
            selector: '[data-toggle="tooltip"]:not(:disabled)'
        });
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
    });
}

function restartFunctions(selector) {
    if (isClockOn && selector !== '#menu-home-div') {
        stopClock();
    }
    if (selector === '#menu-enums-div') {
        $('ol.orbit').orbitlist({
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
        $this.attr("title", $.i18n($this.data('i18n-tooltip'))).attr("data-toggle", "tooltip");
    });
}

function requestCrossDomain(site, callback) {
    if (!site) {
        alert('No site was passed.');
        return false;
    }

    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from xml where url="' + site + '"') + '&format=xml&callback=?';

    $.getJSON(yql, cbFunc);

    function cbFunc(data) {
        if (data.results[0]) {
            if (typeof callback === 'function') {
                callback(data);
            }
        } else {
            throw new Error('Nothing returned from getJSON.');
        }
    }
}

// Scroll to Top
$(window).scroll(function () {
    if ($(this).scrollTop() >= 300) {
        $('#return-to-top').fadeIn(200);
    } else {
        $('#return-to-top').fadeOut(200);
    }
});
$('#return-to-top').click(function () {
    $('body,html').animate({
        scrollTop: 0
    }, 500);
});
// / Scroll to Top