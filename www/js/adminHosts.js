function Hosts(main) {
    'use strict';

    var that = this;
    this.main = main;
    this.menuIcon = 'fa-server';
    this.list = [];

    this.prepare = function () {
        $('#menu-hosts-div').load("templates/hosts.html", function () {
            restartFunctions('menu-hosts-div');

            $('#btn-hosts-reload').click(function () {
                that.init(true);
            });

            $('#hosts-filter-clear').click(function () {
                $('#hosts-filter').val('').trigger('change');
            });

            $('#hosts-filter').change(function () {
                that.main.saveConfig('hostsFilter', $(this).val());
                applyFilter($(this).val());
            }).keyup(function () {
                if (that.filterTimeout) {
                    clearTimeout(that.filterTimeout);
                }
                that.filterTimeout = setTimeout(function () {
                    $('#hosts-filter').trigger('change');
                }, 300);
            });
            if (that.main.config.hostsFilter && that.main.config.hostsFilter[0] !== '{') {
                $('#hosts-filter').val(that.main.config.hostsFilter);
            }

        });
    };

    // ----------------------------- Hosts show and Edit ------------------------------------------------
    this.initList = function (isUpdate) {

        if (!that.main.objectsLoaded) {
            setTimeout(function () {
                that.initList(isUpdate);
            }, 250);
            return;
        }

        // fill the host list (select) on adapter tab
        var $selHosts = $('#host-adapters');
        var selHosts = $selHosts[0];
        var myOpts = selHosts.options;
        if (!isUpdate && $selHosts.data('inited'))
            return;

        $selHosts.data('inited', true);

        that.main.currentHost = that.main.currentHost || that.main.config.currentHost || '';

        var found;
        var j;
        // first remove non-existing hosts
        for (var i = 0; i < myOpts.length; i++) {
            found = false;
            for (j = 0; j < that.list.length; j++) {
                if (that.list[j] === myOpts[i].value) {
                    found = true;
                    break;
                }
            }
            if (!found)
                selHosts.remove(i);
        }

        for (i = 0; i < that.list.length; i++) {
            found = false;
            for (j = 0; j < myOpts.length; j++) {
                if (that.list[i].name === myOpts[j].value) {
                    found = true;
                    break;
                }
            }
            if (!found)
                $selHosts.append('<option value="' + that.list[i].name + '">' + that.list[i].name + '</option>');
        }

        if (that.main.currentHost) {
            $selHosts.val(that.main.currentHost);
            that.main.menus.adapters.init(true);
            that.main.menus.instances.init(true);
        } else if ($selHosts.val() !== that.main.currentHost) {
            that.main.currentHost = $selHosts.val();
            that.main.menus.adapters.init(true);
            that.main.menus.instances.init(true);
        }

        $selHosts.unbind('change').change(function () {
            if (!that.main.states['system.host.' + $(this).val() + '.alive'] ||
                    !that.main.states['system.host.' + $(this).val() + '.alive'].val ||
                    that.main.states['system.host.' + $(this).val() + '.alive'].val === 'null') {
                that.main.showMessage(_('Host %s is offline', $(this).val()));
                $(this).val(that.main.currentHost);
                return;
            }

            that.main.currentHost = $(this).val();

            that.main.saveConfig('currentHost', that.main.currentHost);
            that.main.tabs.adapters.init(true);
            that.main.tabs.instances.init(true);
        });
        that.init();
    };

    this.initButtons = function (id) {
        var selector = id ? '[data-host-id="' + id + '"]' : '';

        $('.host-update-submit' + selector).on('click', function () {
            that.main.cmdExec($(this).attr('data-host-name'), 'upgrade self', function (exitCode) {
                if (!exitCode)
                    that.init(true);
            });
        });

        $('.host-restart-submit' + selector).on('click', function () {
            main.waitForRestart = true;
            main.cmdExec($(this).attr('data-host-name'), '_restart');
        });

        $('.host-update-hint-submit' + selector).on('click', function () {

            var infoTimeout = setTimeout(function () {
                showUpdateInfo();
                infoTimeout = null;
            }, 1000);

            main.socket.emit('sendToHost', $(this).attr('data-host-name'), 'getLocationOnDisk', null, function (data) {
                if (infoTimeout)
                    clearTimeout(infoTimeout);
                infoTimeout = null;
                showUpdateInfo(data);
            });
        });
    };

    function showUpdateInfo(data) {
    }

    function applyFilter(filter) {
        filter = filter.toLowerCase().trim();
        var index = 0;
        if (!filter) {
            $('.hosts-host').each(function () {
                if (index & 1) {
                    $(this).removeClass('hosts-even').addClass('hosts-odd');
                } else {
                    $(this).removeClass('hosts-odd').addClass('hosts-even');
                }
                index++;
            });
        } else {
            $('.hosts-host').each(function () {
                var $this = $(this);
                var found = false;
                $this.find('td').each(function () {
                    var text = $(this).text();
                    if (text.toLowerCase().indexOf(filter) !== -1) {
                        found = true;
                        return false;
                    }
                });
                if (!found) {
                    $this.hide();
                } else {
                    $this.show();
                }
                if (index & 1) {
                    $(this).removeClass('hosts-even').addClass('hosts-odd');
                } else {
                    $(this).removeClass('hosts-odd').addClass('hosts-even');
                }
                index++;
            });
        }
    }

    function showOneHost(index) {
    }

    function showHosts() {
    }

    this.init = function (update, updateRepo, callback) {

        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update, updateRepo, callback)
            }, 250);
            return;
        }
        
        this.main.fillContent('#menu-hosts-div');

    };

    this.objectChange = function (id, obj) {
        // Update hosts
        if (id.match(/^system\.host\.[-\w]+$/)) {
            var found = false;
            var i;
            for (i = 0; i < this.list.length; i++) {
                if (this.list[i].id === id) {
                    found = true;
                    break;
                }
            }

            if (obj) {
                if (!found)
                    this.list.push({id: id, address: obj.common.address ? obj.common.address[0] : '', name: obj.common.name});
            } else {
                if (found)
                    this.list.splice(i, 1);
            }

            if (this.updateTimer)
                clearTimeout(this.updateTimer);

            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.init(true);
                that.initList(true);
            }, 200);
        }
    };
    this.stateChange = function (id, state) {
        if (id.match(/^system\.host\..+\.alive$/)) {
            id = id.substring(0, id.length - 6);
            if (state && state.val) {
                $('.hosts-led[data-host-id="' + id + '"]').removeClass('led-red').addClass('led-green');
            } else {
                $('.hosts-led[data-host-id="' + id + '"]').removeClass('led-green').addClass('led-red');
                $('.host-update-submit[data-host-id="' + id + '"]').hide();
                $('.host-update-hint-submit[data-host-id="' + id + '"]').hide();
                $('.host-restart-submit[data-host-id="' + id + '"]').hide();
            }
        } else if (id.match(/^system\.host\..+\.outputCount$/)) {
            id = id.substring(0, id.length - 12);

            $('.host-out[data-host-id="' + id + '"]').html('<span class="highlight">&#x21A6;' + state.val + '</span>');
        } else if (id.match(/^system\.host\..+\.inputCount$/)) {
            id = id.substring(0, id.length - 11);

            $('.host-in[data-host-id="' + id + '"]').html('<span class="highlight">&#x21A6;' + state.val + '</span>');
        }
    };
}

