function Logs(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-file-text-o';
    this.main = main;
    this.logLimit = 2000; //const

    this.logLinesCount = 0;
    this.logLinesStart = 0;
    this.logHosts = [];
    this.logFilterTimeout = null;
    this.logFilterHost = '';
    this.logFilterSeverity = '';
    this.logFilterMessage = '';
    this.$logFilterHost = null;
    this.$logFilterSeverity = null;
    this.$logFilterMessage = null;

    this.logPauseList = [];
    this.logPauseMode = false;
    this.logPauseOverflow = false;
    this.logPauseCounterSpan = null;
    this.logPauseCounter = [];

    this.prepare = function () {

        $('#menu-logs-div').load("templates/log.html", function () {
            restartFunctions('menu-logs-div');

            that.$logFilterSeverity = $('#log-filter-severity');
            that.$logFilterHost = $('#log-filter-host');
            that.$logFilterMessage = $('#log-filter-message');

            that.$logFilterHost.change(this.filter);
            that.$logFilterSeverity.change(this.filter);

            that.$logFilterMessage.change(function () {
                if (that.logFilterTimeout) {
                    clearTimeout(that.logFilterTimeout);
                }
                that.logFilterTimeout = setTimeout(that.filter, 600);
            }).keyup(function (e) {
                if (e.which === 13) {
                    that.filter();
                } else {
                    $(this).trigger('change');
                }
            });

            $('#log-filter-message-clear').click(function () {
                var $log_filter = $('#log-filter-message');
                if ($log_filter.val() !== '') {
                    $log_filter.val('').trigger('change');
                }
            });

            $('#log-clear-on-disk').click(function () {
                that.main.confirmMessage($.i18n('Log file will be deleted. Are you sure?'), null, null, function (result) {
                    if (result) {
                        that.main.socket.emit('sendToHost', main.currentHost, 'delLogs', null, function (err) {
                            if (err) {
                                that.main.showError(err);
                            } else {
                                that.clear();
                            }
                        });
                    }
                });
            });

            $('#log-refresh').click(function () {
                that.clear();
            });

            $('#log-pause').click(function () {
                that.pause();
            });

            this.logPauseCounterSpan = $('#log-pause .fa');

            $('#log-clear').click(function () {
                that.clear(false);
            });

            $('#log-copy-text').click(function () {
                $('#log-copy-text').hide().html('');
                $('#tabs').show();
            });

            $('#log-copy').click(function () {
                var text = '<span class="text-danger">' + $.i18n('copy note') + '</span>';
                $('#tabs').hide();
                $('#log-copy-text').show().html(text + '<br><table style="width: 100%; font-size:12px" id="log-copy-table">' + $('#log-table').html() + '</table>');
                var lines = $('#log-copy-table .log-column-4');
                for (var t = 0; t < lines.length; t++) {
                    var q = $(lines[t]);
                    q.html(q.attr('title'));
                    q.attr('title', '');
                }
            })

        });

    };

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function () {
        if (!this.main.currentHost) {
            setTimeout(function () {
                that.init();
            }, 500);
            return;
        }

        $('#log-table').html('');
        this.main.socket.emit('sendToHost', this.main.currentHost, 'getLogs', 200, function (lines) {
            setTimeout(function () {
                var message = {message: '', severity: 'debug', from: '', ts: ''};
                var size = lines ? lines.pop() : -1;
                if (size !== -1) {
                    size = parseInt(size);
                    $('#log-size').html(($.i18n('logsize') + ': ' + ((size / (1024 * 1024)).toFixed(2) + ' MB ')).replace(/ /g, '&nbsp;'));
                }
                for (var i = 0; i < lines.length; i++) {
                    if (!lines[i])
                        continue;
                    // 2014-12-05 14:47:10.739 - info: iobroker  ERR! network In most cases you are behind a proxy or have bad network settings.npm ERR! network
                    if (lines[i][4] === '-' && lines[i][7] === '-') {
                        lines[i] = lines[i].replace(/(\[[0-9]+m)/g, '');
                        message.ts = lines[i].substring(0, 23);
                        lines[i] = lines[i].substring(27);

                        var pos = lines[i].indexOf(':');
                        message.severity = lines[i].substring(0, pos);
                        if (message.severity.charCodeAt(message.severity.length - 1) === 27)
                            message.severity = message.severity.substring(0, message.severity.length - 1);
                        if (message.severity.charCodeAt(0) === 27)
                            message.severity = message.severity.substring(1);

                        lines[i] = lines[i].substring(pos + 2);
                        pos = lines[i].indexOf(' ');
                        message.from = lines[i].substring(0, pos);
                        message.message = lines[i].substring(pos);
                    } else {
                        message.message = lines[i];
                    }
                    that.add(message);
                }

                that.logFilterHost = that.$logFilterHost.val();
                that.logFilterMessage = that.$logFilterMessage.val();
                that.logFilterSeverity = that.$logFilterSeverity.val();
            }, 0);
        });
        this.main.fillContent('#menu-logs-div');
    };

    this.add = function (message) {
        // remove instance name from text
        if (message.message.substring(0, message.from.length) === message.from) {
            message.message = message.message.substring(message.from.length + 1);
        }

        if (this.logPauseMode) {
            this.logPauseList.push(message);
            this.logPauseCounter++;

            if (this.logPauseCounter > this.logLimit) {
                if (!this.logPauseOverflow) {
                    $('#log-pause')
                            .removeClass('btn-default')
                            .addClass('btn-danger')
                            .changeTooltip($.i18n('mboLosing'));
                    this.logPauseOverflow = true;
                }
                this.logPauseList.shift();
            }
            this.logPauseCounterSpan.html(this.logPauseCounter);
            return;
        }
    };

    this.filter = function () {
        if (that.logFilterTimeout) {
            clearTimeout(that.logFilterTimeout);
            that.logFilterTimeout = null;
        }
        var $logOuter = $('#log-outer');

        that.logFilterHost = that.$logFilterHost.val();
        that.logFilterMessage = that.$logFilterMessage.val();
        that.logFilterSeverity = that.$logFilterSeverity.val();

        if (that.logFilterSeverity === 'error') {
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').hide();
            $logOuter.find('.log-severity-error').show();
        } else
        if (that.logFilterSeverity === 'warn') {
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else
        if (that.logFilterSeverity === 'info') {
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').show();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else {
            $logOuter.find('.log-severity-debug').show();
            $logOuter.find('.log-severity-info').show();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        }
        if (that.logFilterHost || that.logFilterMessage) {
            $logOuter.find('.log-line').each(function () {
                if (that.logFilterHost && !$(this).hasClass('log-from-' + that.logFilterHost)) {
                    $(this).hide();
                } else
                if (that.logFilterMessage && $(this).html().indexOf(that.logFilterMessage) === -1) {
                    $(this).hide();
                }
            });
        }
    };

    this.clear = function (isReload) {
        if (isReload === undefined)
            isReload = true;
        $('#log-table').html('');
        this.logLinesCount = 0;
        this.logLinesStart = 0;
        $('#menu-logs').removeClass('text-danger');

        if (isReload) {
            setTimeout(function () {
                that.init();
            }, 0);
        }
    };

    this.pause = function () {
        var $logPause = $('#log-pause');
        if (!this.logPauseMode) {
            $logPause
                    .addClass('active')
                    .find('.fa')
                    .removeClass('fa-pause')
                    .html('0');

            this.logPauseCounter = 0;
            this.logPauseMode = true;
        } else {
            this.logPauseMode = false;
            for (var i = 0; i < this.logPauseList.length; i++) {
                this.add(this.logPauseList[i]);
            }
            this.logPauseOverflow = false;
            this.logPauseList = [];
            this.logPauseCounter = 0;

            $logPause
                    .removeClass('active')
                    .removeClass('btn-danger')
                    .addClass('btn-default');
        }
    };
}