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

$.fn.cron = function (options, setValue) {
    'use strict';

    var el = this;

    if (options === 'value') {
        if (setValue !== undefined) {
            $(el).find('.cron-input').val(setValue).trigger('change');
        } else {
            return $(el).find('.cron-input').val();
        }
        return this;
    }

    var types = [
        'second',
        'minute',
        'hour',
        'day',
        'month',
        'week'
    ];

    var DATA = {
        MONTH: [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december'
        ],
        DOW: [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ]
    };

    var everyText = [
        'everyxseconds',
        'everyxminutes',
        'everyxhours',
        'everyxdays',
        'everyxmonths'
    ];

    var cronArr;
    var updateInput = false;

    if (options && typeof options.value === 'string') {
        if (!options.value) {
            $(el).find('.cron-checkbox-seconds').prop('checked', false);
            cronArr = null;
        } else {
            cronArr = options.value.split(' ');
            if (cronArr.length === 5) {
                $(el).find('.cron-checkbox-seconds').prop('checked', false);
                cronArr.unshift('*');
            } else {
                $(el).find('.cron-checkbox-seconds').prop('checked', true);
            }
        }
    } else {
        cronArr = ['*', '*', '*', '*', '*', '*'];
        $(el).find('.cron-checkbox-seconds').prop('checked', false);
    }

    $(el).find('.cron-main-tab').tabs();

    $(el).find('.cron-tabs').tabs({
        activate: function (event, ui) {
            if ($(el).find('.cron-input').is(':focus') || updateInput)
                return;

            cronArr = cronArr || ['*', '*', '*', '*', '*', '*'];
            switch ($(ui.newTab).attr('id')) {

                // Seconds
                case 'cron-button-second-every':
                    cronArr[0] = '*';
                    break;
                case 'cron-button-second-n':
                    cronArr[0] = '*/' + $(el).find('.cron-tab-second .cron-slider').slider('value');
                    break;
                case 'cron-button-second-each':
                    cronArr[0] = '*';
                    $(el).find('.cron-tabs-second-format').html('');
                    drawEachSecond();
                    break;

                    // Minutes
                case 'cron-button-minute-every':
                    cronArr[1] = '*';
                    break;
                case 'cron-button-minute-n':
                    cronArr[1] = '*/' + $(el).find('.cron-tab-minute .cron-slider').slider('value');
                    break;
                case 'cron-button-minute-each':
                    cronArr[1] = '*';
                    $(el).find('.cron-tabs-minute-format').html('');
                    drawEachMinute();
                    break;

                    // Hours
                case 'cron-button-hour-every':
                    cronArr[2] = '*';
                    break;
                case 'cron-button-hour-n':
                    cronArr[2] = '*/' + $(el).find('.cron-tab-hour .cron-slider').slider('value');
                    break;
                case 'cron-button-hour-each':
                    cronArr[2] = '*';
                    $(el).find('.cron-tabs-hour-format').html('');
                    drawEachHour();
                    break;

                    // Days
                case 'cron-button-day-every':
                    cronArr[3] = '*';
                    break;
                case 'cron-button-day-each':
                    cronArr[3] = '*';
                    $(el).find('.cron-tabs-day-format').html('');
                    drawEachDay();
                    break;

                    // Months
                case 'cron-button-month-every':
                    cronArr[4] = '*';
                    break;
                case 'cron-button-month-each':
                    cronArr[4] = '*';
                    $(el).find('.cron-tabs-month-format').html('');
                    drawEachMonth();
                    break;

                    // Weeks
                case 'cron-button-week-every':
                    cronArr[5] = '*';
                    break;
                case 'cron-button-week-each':
                    cronArr[5] = '*';
                    $(el).find('.cron-tabs-week-format').html('');
                    drawEachWeekday();
                    break;

            }

            drawCron();
        }
    });

    $(el).find('.cron-tab-second .cron-slider').slider({
        min: 1,
        max: 59,
        slide: function (event, ui) {
            processSlider(this, ui);
        }
    });

    $(el).find('.cron-tab-minute .cron-slider').slider({
        min: 1,
        max: 59,
        slide: function (event, ui) {
            processSlider(this, ui);
        }
    });

    $(el).find('.cron-tab-hour .cron-slider').slider({
        min: 1,
        max: 23,
        slide: function (event, ui) {
            processSlider(this, ui);
        }
    });

    $(el).find('.cron-checkbox-seconds').change(function () {
        if ($(this).prop('checked')) {
            $(el).find('.cron-main-tab').tabs('option', 'disabled', []);
            $(el).find('.cron-main-tab').tabs('option', 'active', 0);
        } else {
            $(el).find('.cron-main-tab').tabs('option', 'disabled', [0]);
            if ($(el).find('.cron-main-tab').tabs('option', 'active') === 0) {
                $(el).find('.cron-main-tab').tabs('option', 'active', 1);
            }
        }
        drawCron();
    });

    if (!$(el).find('.cron-checkbox-seconds').prop('checked')) {
        $(el).find('.cron-main-tab').tabs('option', 'disabled', [0]);
        if ($(el).find('.cron-main-tab').tabs('option', 'active') === 0) {
            $(el).find('.cron-main-tab').tabs('option', 'active', 1);
        }
    }

    $(el).find('.cron-input').change(function () {
        $(this).focus();
        cronArr = text2cron($(this).val());
        detectSettings($(this).val());
    }).keyup(function () {
        $(this).trigger('change');
    });

    function text2cron(value) {
        if (value === undefined) {
            value = $(el).find('.cron-input').val();
        }
        value = value.trim();
        if (!value) {
            $(el).find('.cron-checkbox-seconds').prop('checked', false);
            $(el).find('.cron-main-tab').tabs('option', 'disabled', [0]);
            return null;
        }

        var arr = value.split(' ');

        if (arr.length === 5) {
            arr.unshift('*');
            $(el).find('.cron-checkbox-seconds').prop('checked', false);
            $(el).find('.cron-main-tab').tabs('option', 'disabled', [0]);
            if ($(el).find('.cron-main-tab').tabs('option', 'active') === 0) {
                $(el).find('.cron-main-tab').tabs('option', 'active', 1);
            }
        } else {
            $(el).find('.cron-checkbox-seconds').prop('checked', true);
            $(el).find('.cron-main-tab').tabs('option', 'disabled', []);
        }

        return arr;
    }

    function cron2text(arr) {
        if (!arr)
            arr = cronArr;

        if (!arr) {
            return '';
        }

        arr = JSON.parse(JSON.stringify(arr || ['*', '*', '*', '*', '*', '*']));
        if (!$(el).find('.cron-checkbox-seconds').prop('checked')) {
            arr.shift();
        }
        for (var a = 0; a < arr.length; a++) {
            if (arr[a] === '*/1')
                arr[a] = '*';
        }

        return arr.join(' ');
    }

    function correctCasus(text, seconds) {
        text = text.replace('Каждую(ый) минуту', 'Каждую минуту');
        text = text.replace('Каждую(ый) минут(у)', 'Каждую минуту');
        text = text.replace('Каждую(ый) час', 'Каждый час');
        text = text.replace('Каждую(ый) секунду', 'Каждую секунду');
        text = text.replace(/ (\d{1,2}) числа/, ' $1го числа');

        text = text.replace(/ (\d{1,2}) в Январе/, ' $1го числа в Январе');
        text = text.replace(/ (\d{1,2}) в Феврале/, ' $1го числа в Феврале');
        text = text.replace(/ (\d{1,2}) в Марте/, ' $1го числа в Марте');
        text = text.replace(/ (\d{1,2}) в Апреле/, ' $1го числа в Апреле');
        text = text.replace(/ (\d{1,2}) в Майе/, ' $1го числа в Майе');
        text = text.replace(/ (\d{1,2}) в Июне/, ' $1го числа в Июне');
        text = text.replace(/ (\d{1,2}) в Июле/, ' $1го числа в Июле');
        text = text.replace(/ (\d{1,2}) в Августе/, ' $1го числа в Августе');
        text = text.replace(/ (\d{1,2}) в Сентябре/, ' $1го числа в Сентябре');
        text = text.replace(/ (\d{1,2}) в Октябре/, ' $1го числа в Октябре');
        text = text.replace(/ (\d{1,2}) в Ноябре/, ' $1го числа в Ноябре');
        text = text.replace(/ (\d{1,2}) в Декабре/, ' $1го числа в Декабре');

        text = text.replace('Каждую(ый) 0 минуту', 'Каждые ноль минут');
        text = text.replace(/Каждую\(ый\) ([\d\sи,]+) минуту/, 'Каждую $1 минуту');

        text = text.replace(/каждой\(го\) ([\d\sи,]+) минуту/, 'каждой $1 минуты');
        text = text.replace('каждой(го) минут(у)', 'каждой минуты');

        text = text.replace(' 0 часа(ов)', ' 0 часов');
        text = text.replace(' 1 часа(ов)', ' 1 час');
        text = text.replace(' 2 часа(ов)', ' 2 часа');
        text = text.replace(' 3 часа(ов)', ' 3 часа');
        text = text.replace(' 4 часа(ов)', ' 4 часа');
        text = text.replace(/ (\d{1,2}) часа\(ов\)/, ' $1 часов');

        text = text.replace('Jede(r) Sekunde', 'Jede Sekunde');
        text = text.replace(/Jede\(r\) ([\d\sund,]+) Sekunde/, 'Jede $1 Sekunde');
        text = text.replace('Jede(r) Minute', 'Jede Minute');
        text = text.replace('Jede Minuten', 'Jede Minute');
        text = text.replace('Jede Stunde', 'Jede Stunde');
        text = text.replace('Jede(r) Stunde', 'Jede Stunde');
        text = text.replace(/Jede\(r\) ([\d\sund,]+) Minute/, 'Jede $1 Minute');
        text = text.replace('Jede Sekunde in Minuten', 'Jede Sekunde in jeder Minute');

        return text;
    }

    function drawCron() {
        var newCron = cron2text();
        $(el).find('.cron-input').val(newCron);
        updateDescription(newCron);
    }

    function updateDescription(value) {
        if (!value) {
            $(el).find('.cron-text').html($.i18n('never'));
            return;
        }
        var text = cronToText(value, $(el).find('.cron-checkbox-seconds').prop('checked'), DATA);

        text = correctCasus(text, $(el).find('.cron-checkbox-seconds').prop('checked') ? cronArr[0] : null);

        $(el).find('.cron-text').html(text);
    }

    function detectSettings(value) {
        updateInput = true;
        cronArr = text2cron(value);

        for (var c = 0; c < (cronArr ? cronArr.length : 6); c++) {
            detect(cronArr, c);
        }

        updateDescription(value);
        updateInput = false;
    }

    // 5-7,9-11 => 5,6,7,9,10,11
    function convertMinusIntoArray(value) {
        var parts = value.toString().split(',');
        for (var p = 0; p < parts.length; p++) {
            var items = parts[p].trim().split('-');
            if (items.length > 1) {
                parts[p] = [];
                for (var i = parseInt(items[0], 10); i <= parseInt(items[1], 10); i++) {
                    parts[p].push(i);
                }
                parts[p] = parts[p].join(',');
            }
        }
        value = parts.join(',');
        var values = value.split(',');
        values.sort(function (a, b) {
            a = parseInt(a, 10);
            b = parseInt(b, 10);
            return a - b;
        });
        // remove double entries
        for (p = values.length - 1; p >= 0; p--) {
            if (values[p] === values[p + 1]) {
                values.splice(p + 1, 1);
            }
        }

        return values.join(',');
    }

    // 5,6,7,9,10,11 => 5-7,9-11
    function convertArrayIntoMinus(value) {
        value = convertMinusIntoArray(value);

        var parts = value.split(',');
        var newParts = [];
        var start = parts[0];
        var end = parts[0];
        for (var p = 1; p < parts.length; p++) {
            if (parts[p] - 1 !== parseInt(parts[p - 1], 10)) {
                if (start === end) {
                    newParts.push(start);
                } else if (end - 1 === start) {
                    newParts.push(start + ',' + end);
                } else {
                    newParts.push(start + '-' + end);
                }
                start = parts[p];
                end = parts[p];
            } else {
                end = parts[p];
            }
        }

        if (start === end) {
            newParts.push(start);
        } else if (end - 1 === start) {
            newParts.push(start + ',' + end);
        } else {
            newParts.push(start + '-' + end);
        }

        return newParts.join(',');
    }

    function detect(values, index) {
        var $tab = $(el).find('.cron-tab-' + types[index]);

        if (!values) {
            if ($tab.find('.cron-tabs').tabs('option', 'active') !== 0) {
                $tab.find('.cron-tabs').tabs('option', 'active', 0);
                changed = true;
            }
            return;
        }

        values[index] = values[index] || '*';
        var changed = true;

        if (values[index].indexOf('/') !== -1) {
            var parts_ = values[index].split('/');
            var value = parseInt(parts_[1], 10) || 1;
            if ($tab.find('.cron-slider').slider('value') !== value) {
                $tab.find('.cron-slider').slider('value', parseInt(parts_[1], 10) || 1);
                changed = true;
            }
            if ($tab.find('.cron-tabs').tabs('option', 'active') !== 1) {
                $tab.find('.cron-tabs').tabs('option', 'active', 1);
                changed = true;
            }
            $tab.find('.cron-preview-every').html($.i18n(everyText[index], parseInt(parts_[1], 10) || 1));
        } else if (values[index].indexOf('*') !== -1) {
            if ($tab.find('.cron-tabs').tabs('option', 'active') !== 0) {
                $tab.find('.cron-tabs').tabs('option', 'active', 0);
                changed = true;
            }
        } else {
            var parts = convertMinusIntoArray(values[index]).split(',');
            if ($tab.find('.cron-tabs li').length === 3) {
                if ($tab.find('.cron-tabs').tabs('option', 'active') !== 2) {
                    $tab.find('.cron-tabs').tabs('option', 'active', 2);
                    changed = true;
                }
            } else {
                if ($tab.find('.cron-tabs').tabs('option', 'active') !== 1) {
                    $tab.find('.cron-tabs').tabs('option', 'active', 1);
                    changed = true;
                }
            }
            var selected = false;

            $tab.find('.cron-tabs-format input[type="checkbox"]').each(function () {
                var index = $(this).data('index').toString();
                var value = parts.indexOf(index) !== -1;
                if (value !== $(this).prop('checked')) {
                    $(this).prop('checked', parts.indexOf(index) !== -1);
                    $(this).button('refresh');
                    changed = true;
                }
                if (value)
                    selected = true;
            });

            if (!selected) {
                if ($tab.find('.cron-tabs').tabs('option', 'active') !== 0) {
                    $tab.find('.cron-tabs').tabs('option', 'active', 0);
                    changed = true;
                }
            }
            if (changed)
                $(el).find('.cron-main-tab').tabs('option', 'active', index);
        }
    }

    function processSlider(elem, ui) {
        var arg = $(elem).data('arg');
        cronArr[arg] = '*/' + ui.value;
        $(el).find('.cron-tab-' + types[arg] + ' .cron-preview-every').html(ui.value === 1 ? $.i18n('cronevery ' + types[arg]) : $.i18n('cronevery') + ' ' + ui.value + ' ' + $.i18n('cron' + types[arg] + 's'));
        drawCron();
    }

    function processEachChange(elem) {
        var newItem = $(elem).data('index').toString();
        var arg = $(elem).data('arg');

        if (!cronArr)
            cronArr = ['*', '*', '*', '*', '*', '*'];

        if (cronArr[arg] === '*') {
            cronArr[arg] = newItem;
        } else {
            // if value already in list, toggle it off
            var list = convertMinusIntoArray(cronArr[arg]).split(',');
            if (list.indexOf(newItem) !== -1) {
                list.splice(list.indexOf(newItem), 1);
                cronArr[arg] = list.join(',');
            } else {
                // else toggle it on
                cronArr[arg] = cronArr[arg] + ',' + newItem;
            }
            cronArr[arg] = convertArrayIntoMinus(cronArr[arg]);
            if (cronArr[arg] === '')
                cronArr[arg] = '*';
        }
        drawCron();
    }

    function padded(val) {
        if (typeof val === 'string' && val.length === 1) {
            val = '0' + val;
        } else if (val < 10) {
            val = '0' + val;
        } else {
            val = val.toString();
        }
        return val;
    }

    function draw(type, drawFunc) {
        var $format = $(el).find('.cron-tab-' + type + ' .cron-tabs-format');
        $format.html(drawFunc());

        $format.find('input').button();
        $format.buttonset();

        $format.find('input[type="checkbox"]').click(function () {
            processEachChange(this);
        });
    }

    function drawEachSecond() {
        draw('second', function () {
            var text = '';
            // seconds
            for (var i = 0; i < 60; i++) {
                text += '<input type="checkbox" id="cron-second-check' + i + '" data-index="' + i + '" data-arg="0"><label for="cron-second-check' + i + '">' + padded(i) + '</label>';
                if (i !== 0 && ((i + 1) % 10 === 0))
                    text += '<br/>';
            }
            return text;
        });
    }

    function drawEachMinute() {
        draw('minute', function () {
            var text = '';
            // minutes
            for (var i = 0; i < 60; i++) {
                var padded = i;
                if (padded < 10)
                    padded = '0' + padded;

                text += '<input type="checkbox" id="cron-minute-check' + i + '" data-index="' + i + '" data-arg="1"><label for="cron-minute-check' + i + '">' + padded + '</label>';
                if (i !== 0 && (((i + 1) % 10) === 0))
                    text += '<br/>';
            }
            return text;
        });
    }

    function drawEachHour() {
        draw('hour', function () {
            var text = '';
            // hours
            for (var i = 0; i < 24; i++) {
                var padded = i;
                if (padded < 10)
                    padded = '0' + padded;

                text += '<input type="checkbox" id="cron-hour-check' + i + '" data-index="' + i + '" data-arg="2"><label for="cron-hour-check' + i + '">' + padded + '</label>';
                if (i !== 0 && (((i + 1) % 12) === 0))
                    text += '<br/>';
            }
            return text;
        });
    }

    function drawEachDay() {
        draw('day', function () {
            var text = '';
            // days
            for (var i = 1; i < 32; i++) {
                var padded = i;
                if (padded < 10)
                    padded = '0' + padded;

                text += '<input type="checkbox" id="cron-day-check' + i + '" data-index="' + i + '" data-arg="3"><label for="cron-day-check' + i + '">' + padded + '</label>';
                if (i !== 0 && ((i % 7) === 0))
                    text += '<br/>';
            }
            return text;
        });
    }

    function drawEachMonth() {
        draw('month', function () {
            var text = '';
            // months
            var months = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

            for (var i = 0; i < months.length; i++) {
                text += '<input type="checkbox" id="cron-month-check' + (i + 1) + '" data-index="' + (i + 1) + '" data-arg="4"><label for="cron-month-check' + (i + 1) + '">' + $.i18n(months[i]) + '</label>';
            }
            return text;
        });
    }

    function drawEachWeekday() {
        draw('week', function () {
            var text = '';
            // weeks
            var days = [
                {id: 1, name: 'Monday'},
                {id: 2, name: 'Tuesday'},
                {id: 3, name: 'Wednesday'},
                {id: 4, name: 'Thursday'},
                {id: 5, name: 'Friday'},
                {id: 6, name: 'Saturday'},
                {id: 0, name: 'Sunday'}
            ];

            for (var i = 0; i < days.length; i++) {
                text += '<input type="checkbox" id="cron-week-check' + days[i].id + '" data-index="' + days[i].id + '" data-arg="5"><label for="cron-week-check' + days[i].id + '">' + $.i18n(days[i].name) + '</label>';
            }
            return text;
        });
    }

    drawEachSecond();
    drawEachMinute();
    drawEachHour();
    drawEachDay();
    drawEachMonth();
    drawEachWeekday();
    drawCron();
};

/**
 * Given a cronspec, return the human-readable string.
 * @param {string} cronspec
 * @param withSeconds
 * @param {Object} DATA
 */
function cronToText(cronspec, withSeconds, DATA) {
    'use strict';

    // Constant array to convert valid names to values
    var NAMES = {
        JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8,
        SEP: 9, OCT: 10, NOV: 11, DEC: 12,
        SUN: 1, MON: 2, TUE: 3, WED: 4, THU: 5, FRI: 6, SAT: 7
    };

// Parsable replacements for common expressions
    var REPLACEMENTS = {
        '* * * * * *': '0/1 * * * * *',
        '@YEARLY': '0 0 1 1 *',
        '@ANNUALLY': '0 0 1 1 *',
        '@MONTHLY': '0 0 1 * *',
        '@WEEKLY': '0 0 * * 0',
        '@DAILY': '0 0 * * *',
        '@HOURLY': '0 * * * *'
    };

// Contains the index, min, and max for each of the constraints
    var FIELDS = {
        s: [0, 0, 59], // seconds
        m: [1, 0, 59], // minutes
        h: [2, 0, 23], // hours
        D: [3, 1, 31], // day of month
        M: [4, 1, 12], // month
        Y: [6, 1970, 2099], // year
        d: [5, 1, 7, 1] // day of week
    };

    /**
     * Returns the value + offset if value is a number, otherwise it
     * attempts to look up the value in the NAMES table and returns
     * that result instead.
     *
     * @param {Number,String} value :The value that should be parsed
     * @returns {Number|null}
     */
    function getValue(value) {
        var offset = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
        var max = arguments.length <= 2 || arguments[2] === undefined ? 9999 : arguments[2];

        return isNaN(value) ? NAMES[value] || null : Math.min(+value + offset, max);
    }

    /**
     * Returns a deep clone of a schedule skipping any day of week
     * constraints.
     *
     * @param {Object} sched :The schedule that will be cloned
     * @returns {Object}
     */
    function cloneSchedule(sched) {
        var clone = {},
                field;

        for (field in sched) {
            if (field !== 'dc' && field !== 'd') {
                clone[field] = sched[field].slice(0);
            }
        }

        return clone;
    }

    /**
     * Adds values to the specified constraint in the current schedule.
     *
     * @param {Object} sched : The schedule to add the constraint to
     * @param {String} name : Name of constraint to add
     * @param {Number} min : Minimum value for this constraint
     * @param {Number} max : Maximum value for this constraint
     */
    function add(sched, name, min, max) {
        var inc = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];

        var i = min;

        if (!sched[name]) {
            sched[name] = [];
        }

        while (i <= max) {
            if (sched[name].indexOf(i) < 0) {
                sched[name].push(i);
            }
            i += inc || 1;
        }

        sched[name].sort(function (a, b) {
            return a - b;
        });
    }

    /**
     * Adds a hash item (of the form x#y or xL) to the schedule.
     *
     * @param {Object} schedules : The current schedule array to add to
     * @param {Object} curSched : The current schedule to add to
     * @param {Number} value : The value to add (x of x#y or xL)
     * @param {Number} hash : The hash value to add (y of x#y)
     */
    function addHash(schedules, curSched, value, hash) {
        // if there are any existing day of week constraints that
        // aren't equal to the one we're adding, create a new
        // composite schedule
        if (curSched.d && !curSched.dc || curSched.dc && curSched.dc.indexOf(hash) < 0) {
            schedules.push(cloneSchedule(curSched));
            curSched = schedules[schedules.length - 1];
        }

        add(curSched, 'd', value, value);
        add(curSched, 'dc', hash, hash);
    }

    /**
     *
     * @param {Object} s : The existing set of schedules
     * @param {Object} curSched : The current schedule to add to
     * @param {Number} value
     */
    function addWeekday(s, curSched, value) {
        var except1 = {},
                except2 = {};
        if (value === 1) {
            // cron doesn't pass month boundaries, so if 1st is a
            // weekend then we need to use 2nd or 3rd instead
            add(curSched, 'D', 1, 3);
            add(curSched, 'd', NAMES.MON, NAMES.FRI);
            add(except1, 'D', 2, 2);
            add(except1, 'd', NAMES.TUE, NAMES.FRI);
            add(except2, 'D', 3, 3);
            add(except2, 'd', NAMES.TUE, NAMES.FRI);
        } else {
            // normally you want the closest day, so if v is a
            // Saturday, use the previous Friday.  If it's a
            // sunday, use the following Monday.
            add(curSched, 'D', value - 1, value + 1);
            add(curSched, 'd', NAMES.MON, NAMES.FRI);
            add(except1, 'D', value - 1, value - 1);
            add(except1, 'd', NAMES.MON, NAMES.THU);
            add(except2, 'D', value + 1, value + 1);
            add(except2, 'd', NAMES.TUE, NAMES.FRI);
        }
        s.exceptions.push(except1);
        s.exceptions.push(except2);
    }

    /**
     * Adds a range item (of the form x-y/z) to the schedule.
     *
     * @param {String} item : The cron expression item to add
     * @param {Object} curSched : The current schedule to add to
     * @param {String} name : The name to use for this constraint
     * @param {Number} min : The min value for the constraint
     * @param {Number} max : The max value for the constraint
     * @param {Number} offset : The offset to apply to the cron value
     */
    function addRange(item, curSched, name, min, max, offset) {
        // parse range/x
        var incSplit = item.split('/'),
                inc = +incSplit[1],
                range = incSplit[0];

        // parse x-y or * or 0
        if (range !== '*' && range !== '0') {
            var rangeSplit = range.split('-');
            min = getValue(rangeSplit[0], offset, max);

            // fix for issue #13, range may be single digit
            max = getValue(rangeSplit[1], offset, max) || max;
        }

        add(curSched, name, min, max, inc);
    }

    /**
     * Parses a particular item within a cron expression.
     *
     * @param {String} item : The cron expression item to parse
     * @param {Object} s : The existing set of schedules
     * @param {String} name : The name to use for this constraint
     * @param {Number} min : The min value for the constraint
     * @param {Number} max : The max value for the constraint
     * @param {Number} offset : The offset to apply to the cron value
     */
    function parse(item, s, name, min, max, offset) {
        var value,
                split,
                schedules = s.schedules,
                curSched = schedules[schedules.length - 1];

        // L just means min - 1 (this also makes it work for any field)
        if (item === 'L') {
            item = (min - 1).toString(10);
        }

        // parse x
        if ((value = getValue(item, offset, max)) !== null) {
            add(curSched, name, value, value);
        }
        // parse xW
        else if ((value = getValue(item.replace('W', ''), offset, max)) !== null) {
            addWeekday(s, curSched, value);
        }
        // parse xL
        else if ((value = getValue(item.replace('L', ''), offset, max)) !== null) {
            addHash(schedules, curSched, value, min - 1);
        }
        // parse x#y
        else if ((split = item.split('#')).length === 2) {
            value = getValue(split[0], offset, max);
            addHash(schedules, curSched, value, getValue(split[1]));
        }
        // parse x-y or x-y/z or */z or 0/z
        else {
            addRange(item, curSched, name, min, max, offset);
        }
    }

    /**
     * Returns true if the item is either of the form x#y or xL.
     *
     * @param {String} item : The expression item to check
     */
    function isHash(item) {
        return item.indexOf('#') > -1 || item.indexOf('L') > 0;
    }

    function itemSorter(a, b) {
        return isHash(a) && !isHash(b) ? 1 : a - b;
    }

    /**
     * Parses each of the fields in a cron expression.  The expression must
     * include the seconds field, the year field is optional.
     *
     * @param {String} expr : The cron expression to parse
     */
    function parseExpr(expr) {
        var schedule = {schedules: [{}], exceptions: []},
                components = expr.replace(/(\s)+/g, ' ').split(' '),
                field,
                f,
                component,
                items;

        for (field in FIELDS) {
            f = FIELDS[field];
            component = components[f[0]];
            if (component && component !== '*' && component !== '?') {
                // need to sort so that any #'s come last, otherwise
                // schedule clones to handle # won't contain all of the
                // other constraints
                items = component.split(',').sort(itemSorter);
                var i,
                        length = items.length;
                for (i = 0; i < length; i++) {
                    parse(items[i], schedule, field, f[1], f[2], f[3]);
                }
            }
        }

        return schedule;
    }

    /**
     * Make cron expression parsable.
     *
     * @param {String} expr : The cron expression to prepare
     */
    function prepareExpr(expr) {
        var prepared = expr.toUpperCase();
        return REPLACEMENTS[prepared] || prepared;
    }

    function parseCron(expr, hasSeconds) {
        var e = prepareExpr(expr);
        return parseExpr(hasSeconds ? e : '0 ' + e);
    }

    var schedule = parseCron(cronspec, withSeconds);

    function absFloor(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
                value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function ordinal(number) {
        var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? $i18n('ordth') :
                (b === 1) ? $i18n('ordst') :
                (b === 2) ? $i18n('ordnd') :
                (b === 3) ? $i18n('ordrd') : $i18n('ordth');
        return number + output;
    }

    /**
     * For an array of numbers, e.g. a list of hours in a schedule,
     * return a string listing out all of the values (complete with
     * "and" plus ordinal text on the last item).
     * @param {Number[]} numbers
     * @returns {string}
     */
    function numberList(numbers) {
        if (numbers.length < 2) {
            return ordinal(numbers);
        }

        var lastVal = numbers.pop();
        return numbers.join(', ') + ' ' + $i18n('and') + ' ' + ordinal(lastVal);
    }

    /**
     * Parse a number into day of week, or a month name;
     * used in dateList below.
     * @param {Number|String} value
     * @param {String} type
     * @returns {String}
     */
    function numberToDateName(value, type) {
        if (type === 'dow') {
            return DATA.DOW[value - 1];
        } else if (type === 'mon') {
            return DATA.MONTH[value - 1];
        }
    }

    /**
     * From an array of numbers corresponding to dates (given in type: either
     * days of the week, or months), return a string listing all the values.
     * @param {Number[]} numbers
     * @param {String} type
     * @returns {String}
     */
    function dateList(numbers, type) {
        if (numbers.length < 2) {
            return numberToDateName('' + numbers[0], type);
        }

        var lastVal = '' + numbers.pop();
        var outputText = '';

        for (var i = 0; i < numbers.length; i++) {
            var value = numbers[i];
            if (outputText.length > 0) {
                outputText += ', ';
            }
            outputText += numberToDateName(value, type);
        }
        return outputText + ' ' + $i18n('and') + ' ' + numberToDateName(lastVal, type);
    }

    /**
     * Pad to equivalent of sprintf('%02d').
     * @param {Number} x
     * @returns {string}
     */
    function zeroPad(x) {
        return (x < 10) ? '0' + x : x;
    }

    //----------------

    /**
     * Given a schedule, generate a friendly sentence description.
     * @param {Object} schedule
     * @param {boolean} withSeconds 
     * @returns {string}
     */
    function scheduleToSentence(schedule, withSeconds) {
        var outputText = $.i18n('every') + ' ';
        var hm, i, j, lastVal;

        if (schedule.h && schedule.m && schedule.h.length <= 2 && schedule.m.length <= 2 && withSeconds && schedule.s && schedule.s.length <= 2) {
            // If there are only one or two specified values for
            // hour or minute, print them in HH:MM:SS format

            hm = [];
            for (i = 0; i < schedule.h.length; i++) {
                for (j = 0; j < schedule.m.length; j++) {
                    for (var k = 0; k < schedule.s.length; k++) {
                        hm.push(zeroPad(schedule.h[i]) + ':' + zeroPad(schedule.m[j]) + ':' + zeroPad(schedule.s[k]));
                    }
                }
            }
            if (hm.length < 2) {
                outputText = $.i18n('at') + ' ' + hm[0];
            } else {
                lastVal = hm.pop();
                outputText = $.i18n('at') + ' ' + hm.join(', ') + ' ' + $.i18n('and') + ' ' + lastVal;
            }
            if (!schedule.d && !schedule.D) {
                outputText += ' ' + $.i18n('everyday') + ' ';
            }
        } else
        if (schedule.h && schedule.m && schedule.h.length <= 2 && schedule.m.length <= 2) {
            // If there are only one or two specified values for
            // hour or minute, print them in HH:MM format

            hm = [];
            for (i = 0; i < schedule.h.length; i++) {
                for (j = 0; j < schedule.m.length; j++) {
                    hm.push(zeroPad(schedule.h[i]) + ':' + zeroPad(schedule.m[j]));
                }
            }
            if (hm.length < 2) {
                outputText = $.i18n('at') + ' ' + hm[0];
            } else {
                lastVal = hm.pop();
                outputText = $.i18n('at') + ' ' + hm.join(', ') + ' ' + $.i18n('and') + ' ' + lastVal;
            }
            if (!schedule.d && !schedule.D) {
                outputText += ' ' + $.i18n('everyday') + ' ';
            }
        } else {
            // Otherwise, list out every specified hour/minute value.

            if (schedule.h) { // runs only at specific hours
                if (schedule.m) { // and only at specific minutes
                    if (withSeconds) {
                        if (!schedule.s || schedule.s.length === 60) {
                            outputText += $.i18n('secondofevery') + ' ' + numberList(schedule.m) + ' ' + $.i18n('minutepastthe') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                        } else {
                            outputText += numberList(schedule.s) + ' ' + $.i18n('secondofevery') + ' ' + numberList(schedule.m) + ' ' + $.i18n('minutepastthe') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                        }
                    } else {
                        outputText += numberList(schedule.m) + ' ' + $.i18n('minutepastthe') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                    }
                } else { // specific hours, but every minute
                    if (withSeconds) {
                        if (!schedule.s || schedule.s.length === 60) {
                            outputText += $.i18n('secondofevery') + ' ' + $.i18n('minuteof') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                        } else {
                            outputText += numberList(schedule.s) + ' ' + $.i18n('secondofevery') + ' ' + $.i18n('minuteof') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                        }
                    } else {
                        outputText += $.i18n('minuteof') + ' ' + numberList(schedule.h) + ' ' + $.i18n('hour');
                    }
                }
            } else if (schedule.m) { // every hour, but specific minutes
                if (withSeconds) {
                    if (!schedule.s || schedule.s.length === 60) {
                        outputText += $.i18n('secondofevery') + ' ' + numberList(schedule.m) + ' ' + $.i18n('minuteeveryhour');
                    } else {
                        outputText += numberList(schedule.s) + ' ' + $.i18n('secondofevery') + ' ' + numberList(schedule.m) + ' ' + $.i18n('minuteeveryhour');
                    }
                } else {
                    outputText += numberList(schedule.m) + ' ' + $.i18n('minuteeveryhour');
                }
            } else if (withSeconds) {
                if (!schedule.s || schedule.s.length === 60) {
                    outputText += $.i18n('second');
                } else {
                    outputText += numberList(schedule.s) + ' ' + $.i18n('second');
                }
            } else { // cronspec has "*" for both hour and minute
                outputText += $.i18n('minute');
            }
        }

        if (schedule.D) { // runs only on specific day(s) of month
            outputText += ($.i18n('onthe') ? ' ' + $.i18n('onthe') + ' ' : ' ') + numberList(schedule.D);
            if (!schedule.M) {
                outputText += ' ' + $.i18n('ofeverymonth');
            }
        }

        if (schedule.d) { // runs only on specific day(s) of week
            if (schedule.D) {
                // if both day fields are specified, cron uses both; superuser.com/a/348372
                outputText += ' ' + $.i18n('andevery') + ' ';
            } else {
                outputText += ' ' + $.i18n('on') + ' ';
            }
            outputText += dateList(schedule.d, 'dow');
        }

        if (schedule.M) {
            // runs only in specific months; put this output last
            outputText += ' ' + $.i18n('in') + ' ' + dateList(schedule.M, 'mon');
        }

        return outputText;
    }

    return scheduleToSentence(schedule.schedules[0], withSeconds);
}
