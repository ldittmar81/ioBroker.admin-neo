function Hosts(main) {
    'use strict';

    var that = this;
    this.main = main;
    this.menuIcon = 'fa-server';
    this.list = [];

    var $hostsTileTemplate, $hostsContainer;

    this.prepare = function () {
        $('#menu-hosts-div').load("templates/hosts.html", function () {

            $hostsTileTemplate = $('#hostsTemplateTile');
            $hostsContainer = $('#hosts-container');

            $('#btn-hosts-reload').click(function () {
                that.init(true);
            });

            $('.clearable').click(function () {
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
        if ($('.side-menu li.active').children('#menu-hosts').length === 0) {
            this.main.selectMenu('hosts', false);
        }

        // fill the host list (select) on adapter tab
        var $selHosts = $('#host-adapters');
        var selHosts = $selHosts[0];
        var myOpts = selHosts.options;
        if (!isUpdate && $selHosts.data('inited')) {
            return;
        }

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
            if (!found) {
                selHosts.remove(i);
            }
        }

        for (i = 0; i < that.list.length; i++) {
            found = false;
            for (j = 0; j < myOpts.length; j++) {
                if (that.list[i].name === myOpts[j].value) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                $selHosts.append('<option value="' + that.list[i].name + '">' + that.list[i].name + '</option>');
            }
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
                that.main.showMessage($.i18n('Host %s is offline', $(this).val()));
                $(this).val(that.main.currentHost);
                return;
            }

            that.main.currentHost = $(this).val();

            that.main.saveConfig('currentHost', that.main.currentHost);
            that.main.menus.adapters.init(true);
            that.main.menus.instances.init(true);
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
        if (filter === undefined) {
            filter = $('#host-filter').val();
        }
        filter = filter.toLowerCase().trim();

        if (filter) {
            $('.hosts-host').each(function () {
                var $this = $(this);
                var found = false;

                if ($this.find('.name').text().toLowerCase().indexOf(filter) !== -1) {
                    found = true;
                }
                if (!found && $this.find('.profile_img').data('i18n-tooltip').toLowerCase().indexOf(filter) !== -1) {
                    found = true;
                }

                if (!found) {
                    $this.hide();
                } else {
                    $this.show();
                }

            });
        } else {
            $('.hosts-host').show();
        }
    }

    function showOneHost(index) {
        var obj = main.objects[that.list[index].id];
        var alive = main.states[obj._id + '.alive'] && main.states[obj._id + '.alive'].val && main.states[obj._id + '.alive'].val !== 'null';

        var $hostTile = $hostsTileTemplate.children().clone(true, true);

        $hostTile.data('host-id', obj._id);
        $hostTile.find('.name').text(obj.common.hostname);
        $hostTile.find('.title').text(obj.common.title);
        $hostTile.find('.host-led').attr('src', 'img/leds/led_' + (alive ? 'green' : 'red') + '.png').attr('alt', alive);
        $hostTile.find('.host-restart-submit').prop('disabled', !alive).data('host-id', obj._id);
        $hostTile.find('.type').text(obj.common.type);
        $hostTile.find('.platform').text(obj.common.platform);
        var icon;
        switch (obj.native.os.platform) {
            case "linux":
                icon = "fa-linux";
                break;
            case "win32":
                icon = "fa-windows";
                break;
            case "darwin":
                icon = "fa-apple";
                break;
            default:
                icon = "fa-server";
        }
        $hostTile.find('.hosts-version-available').text(obj.common.installedVersion);
        $hostTile.find('.installed').text(obj.common.installedVersion);
        $hostTile.find('.profile_img').addClass(icon).attr('data-i18n-tooltip', obj.native.os.platform);

        if (that.main.states[obj._id + '.inputCount']) {
            $hostTile.find('.event-in').data("host-id", obj._id).text(that.main.states[obj._id + '.inputCount'].val);
            $hostTile.find('.event-out').data("host-id", obj._id).text(that.main.states[obj._id + '.outputCount'].val);
        } else {
            $hostTile.find('.event-in').data("host-id", obj._id);
            $hostTile.find('.event-out').data("host-id", obj._id);
        }

        $hostsContainer.append($hostTile);
    }

    this.init = function (update, updateRepo, callback) {

        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update, updateRepo, callback)
            }, 250);
            return;
        }

        $hostsContainer.html('');

        for (var i = 0; i < that.list.length; i++) {
            showOneHost(i);
        }

        applyFilter($('#hosts-filter').val());

        var timer = setTimeout(function () {
            console.warn('Timeout for repository');
            timer = null;
            that.initButtons();
        }, 2000);

        var host = that.main.currentHost;
        if (!host) {
            // find alive host
            for (var i = 0; i < that.list.length; i++) {
                if (that.main.states[that.list[i].id + '.alive'] && that.main.states[that.list[i].id + '.alive'].val) {
                    host = that.list[i].id;
                    break;
                }
            }
        }

        that.main.menus.adapters.getAdaptersInfo(host, update, updateRepo, function (repository, installedList) {
            if (!installedList || !installedList.hosts){
                return;
            }

            $('.hosts-host').each(function () {
                debugger;
                var id = $(this).data('host-id');
                var obj = that.main.objects[id];
                if (obj) {
                    var installedVersion = obj.common ? obj.common.installedVersion : '';
                    var availableVersion = obj.common ? (repository && repository[obj.common.type] ? repository[obj.common.type].version : '') : '';
                    if (installedVersion && availableVersion) {
                        if (!main.upToDate(availableVersion, installedVersion)) {
                            // show button
                            if (that.main.states[id + '.alive'] && that.main.states[id + '.alive'].val && that.main.states[id + '.alive'].val !== 'null') {
                                $(this).find('.host-update-submit').show();
                                $(this).find('.host-update-hint-submit').show();
                                $(this).find('.hosts-version-installed').addClass('updateReady');
                                $('a[href="#tab-hosts"]').addClass('updateReady');
                            }
                        }
                        $(this).find('.installed').text(availableVersion).removeClass('hidden');
                    }                    
                }
            });

            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            that.initButtons();
            if (callback)
                callback();
        });

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

