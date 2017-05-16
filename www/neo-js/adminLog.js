function Logs(main) {
    'use strict';

    var that = this;
    this.main = main;

    this.menuIcon = 'fa-file-text-o';
    this.logLimit = 2000; //const

    this.logLinesCount = 0;
    this.logLinesStart = 0;
    this.errorCount = 0;
    this.logSize = 0;
    this.logHosts = [];
    this.logFilterTimeout = null;
    this.logFilterHost = '';
    this.logFilterSeverity = '';
    this.logFilterMessage = '';
    this.$logFilterSeverity = null;
    this.$logFilterMessage = null;

    this.logPauseList = [];
    this.logPauseMode = false;
    this.logPauseOverflow = false;
    this.logPauseCounterSpan = null;
    this.logPauseCounter = [];

    this.prepare = function () {

        $('#menu-logs-div').load("templates/log.html", function () {

            that.$logFilterSeverity = $('#log-filter-severity');
            that.$logFilterMessage = $('#log-filter-message');

            $('#log-filter-host').change(this.filter);
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
                that.main.confirmMessage($.i18n('logfileDeletedQuestion'), null, null, function (result) {
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

            new Clipboard('#log-copy').on('success', function (e) {
                alert($.i18n('log-copy-success'), 'success');
                e.clearSelection();
            }).on('error', function (e) {
                alert($.i18n('log-copy-error'), 'error');
            });

            $('#log-outer').find('[data-i18n]').i18n();
            $('#log-outer').bootstrapTable();

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
                var size = lines ? lines.pop() : -1;
                if (size !== -1) {
                    size = parseInt(size);
                    that.logSize = (size / (1024 * 1024)).toFixed(2);
                    $('#log-size').html($.i18n('logsize') + ': ' + (that.logSize + ' MB ').replace(/ /g, '&nbsp;'));
                }

                that.errorCount = 0;
                $(".errorLogInfo").remove();

                for (var i = 0; i < lines.length; i++) {
                    if (!lines[i]) {
                        continue;
                    }
                    var message = {message: '', severity: 'debug', from: '', ts: ''};
                    // 2014-12-05 14:47:10.739 - info: iobroker  ERR! network In most cases you are behind a proxy or have bad network settings.npm ERR! network
                    if (lines[i][4] === '-' && lines[i][7] === '-') {
                        lines[i] = lines[i].replace(/(\[[0-9]+m)/g, '');
                        message.ts = lines[i].substring(0, 23);
                        lines[i] = lines[i].substring(27);

                        var pos = lines[i].indexOf(':');
                        message.severity = lines[i].substring(0, pos);
                        if (message.severity.charCodeAt(message.severity.length - 1) === 27) {
                            message.severity = message.severity.substring(0, message.severity.length - 1);
                        }
                        if (message.severity.charCodeAt(0) === 27) {
                            message.severity = message.severity.substring(1);
                        }

                        lines[i] = lines[i].substring(pos + 2);
                        pos = lines[i].indexOf(' ');
                        message.from = lines[i].substring(0, pos);
                        message.message = lines[i].substring(pos);
                    } else {
                        message.message = lines[i];
                    }
                    that.add(message);
                }
                restartFunctions('#log_error_list');

                that.logFilterHost = $('#log-filter-host').val();
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
                    $('#log-pause').switchClass('btn-default', 'btn-danger').changeTooltip($.i18n('mboLosing'));
                    this.logPauseOverflow = true;
                }
                this.logPauseList.shift();
            }
            this.logPauseCounterSpan.html(this.logPauseCounter);
            return;
        }
        //message = {message: msg, severity: level, from: this.namespace, ts: (new Date()).getTime()}
        if (this.logLinesCount >= this.logLimit) {
            var line = document.getElementById('log-line-' + (this.logLinesStart + 1));
            if (line) {
                line.outerHTML = '';
            }
            this.logLinesStart++;
        } else {
            this.logLinesCount++;
        }

        if (message.from && this.logHosts.indexOf(message.from) === -1) {
            this.logHosts.push(message.from);
            this.logHosts.sort();

            if ($('#log-filter-host')) {
                $('#log-filter-host')
                        .append('<option value="' + message.from.replace(/\./g, '-') + '" ' + ((message.from === this.logFilterHost) ? 'selected' : '') + '>' + message.from + '</option>')
                        .selectpicker('refresh');
            }
        }
        var visible = '';
        var from = message.from ? message.from.replace(/\./g, '-') : '';

        if (this.logFilterHost && this.logFilterHost !== from) {
            visible = 'display: none';
        }

        if (!visible && this.logFilterSeverity) {
            if (this.logFilterSeverity === 'info' && message.severity === 'debug') {
                visible = 'display: none';
            } else if (this.logFilterSeverity === 'warn' && message.severity !== 'warn' && message.severity !== 'error') {
                visible = 'display: none';
            } else if (this.logFilterSeverity === 'error' && message.severity !== 'error') {
                visible = 'display: none';
            }
        }

        if (!visible && this.logFilterMessage && message.message.indexOf(that.logFilterMessage) === -1) {
            visible = 'display: none';
        }

        if (message.severity === 'error') {
            $('a[href="#tab-log"]').addClass('errorLog');
        }
        
        var text = '<tr id="log-line-' + (this.logLinesStart + this.logLinesCount) + '" class="log-line log-severity-' + message.severity + ' ' + (from ? 'log-from-' + from : '') + '" style="' + visible + '">';
        text += '<td class="log-column-1">' + (message.from || '') + '</td>';
        text += '<td class="log-column-2">' + this.main.formatDate(message.ts) + '</td>';
        text += '<td class="log-column-3">' + $.i18n(message.severity) + '</td>';
        text += '<td class="log-column-4" title="' + message.message.replace(/"/g, "'") + '">' + message.message.substring(0, 200) + '</td></tr>';

        if (message.severity === "error") {
            this.errorCount += 1;
            $('#log_error_count').text(this.errorCount);
            if (this.errorCount === 1) {
                $('#log_error_count').removeClass('bg-green').addClass('bg-red');
            }
            if (this.errorCount === 0) {
                $('#log_error_count').addClass('bg-green').removeClass('bg-red');
            }
            if (this.errorCount > 10) {
                $('#log_error_list li:nth-last-child(2)').remove();
            }
            var count = (message.from || '').length + message.message.length;
            $('#log_error_list')
                    .prepend('<li class="errorLogInfo" ' + (count > 30 ? 'title="' + message.message.substring(0, 200) + '" data-toggle="tooltip"' : '') + '><strong>' + (message.from || '') + '</strong> - ' + message.message.substring(0, 20) + (count > 30 ? '...' : '') + '</li>');
        }

        $('#log-table').prepend(text);
    };

    this.filter = function () {
        if (that.logFilterTimeout) {
            clearTimeout(that.logFilterTimeout);
            that.logFilterTimeout = null;
        }
        var $logOuter = $('#log-outer');

        that.logFilterHost = $('#log-filter-host').val();
        that.logFilterMessage = that.$logFilterMessage.val();
        that.logFilterSeverity = that.$logFilterSeverity.val();

        if (that.logFilterSeverity === 'error') {
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').hide();
            $logOuter.find('.log-severity-error').show();
        } else if (that.logFilterSeverity === 'warn') {
            $logOuter.find('.log-severity-debug').hide();
            $logOuter.find('.log-severity-info').hide();
            $logOuter.find('.log-severity-warn').show();
            $logOuter.find('.log-severity-error').show();
        } else if (that.logFilterSeverity === 'info') {
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
                } else if (that.logFilterMessage && $(this).html().indexOf(that.logFilterMessage) === -1) {
                    $(this).hide();
                }
            });
        }
    };

    this.clear = function (isReload) {
        if (isReload === undefined) {
            isReload = true;
        }
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
            restartFunctions('#log_error_list');
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