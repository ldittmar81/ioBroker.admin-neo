function Logs(main) {
    'use strict';

    var that = this;
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
                if (that.logFilterTimeout)
                    clearTimeout(that.logFilterTimeout);
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

            $('#log-pause').attr('title', $.i18n('Pause output')).click(function () {
                that.pause();
            });

            this.logPauseCounterSpan = $('#log-pause .ui-button-text');

            $('#log-clear').click(function () {
                that.clear(false);
            });

            $('#log-copy-text').click(function () {
                $('#log-copy-text').hide().html('');
                $('#tabs').show();
            });

            $('#log-copy').click(function () {
                var text = '<span class="error">' + $.i18n('copy note') + '</span>';
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

    function installColResize() {
    }

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function () {
    };

    this.add = function (message) {
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
    };

    this.pause = function () {
    };
}
