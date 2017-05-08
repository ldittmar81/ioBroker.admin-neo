/* global systemLang */
/* global semver */
/* global bootbox */

function Adapters(main) {
    'use strict';
    var that = this;
    var $adapterTableTemplate, $adapterGroupTemplate, $adapterTemplate, $adapterNewTemplate, $adapterTemplateInside, $adapterContainer;
    this.curRepository = null;
    this.curRepoLastUpdate = null;
    this.curInstalled = null;
    this.menuIcon = 'fa-plug';
    this.list = [];
    this.main = main;
    this.tree = [];
    this.data = {};
    this.urls = {};
    this.groupImages = {
        'alarm_group': 'img/groups/alarm.png',
        'camera_group': 'img/groups/camera.png',
        'climate-control': 'img/groups/climate-control.png',
        'communication_group': 'img/groups/communication.png',
        'date_and_time_group': 'img/groups/date_and_time.png',
        'energy_group': 'img/groups/energy.png',
        'garden_group': 'img/groups/garden.png',
        'general_group': 'img/groups/general.png',
        'geoposition_group': 'img/groups/geoposition.png',
        'hardware_group': 'img/groups/hardware.png',
        'household_group': 'img/groups/household.png',
        'infrastructure_group': 'img/groups/infrastructure.png',
        'iot-systems_group': 'img/groups/iot-systems.png',
        'lighting_group': 'img/groups/lighting.png',
        'logic_group': 'img/groups/logic.png',
        'messaging_group': 'img/groups/messaging.png',
        'misc-data_group': 'img/groups/misc-data.png',
        'multimedia_group': 'img/groups/multimedia.png',
        'network_group': 'img/groups/network.png',
        'protocols_group': 'img/groups/protocols.png',
        'storage_group': 'img/groups/storage.png',
        'utility_group': 'img/groups/utility.png',
        'visualization_group': 'img/groups/visualization.png',
        'visualization-icons_group': 'img/groups/visualization-icons.png',
        'visualization-widgets_group': 'img/groups/visualization-widgets.png',
        'weather_group': 'img/groups/weather.png',
        'unknown_group': 'img/groups/unknown.png'
    };
    this.isList = false;
    this.filterVals = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.isCollapsed = {};
    this.prepare = function () {
        $('#menu-adapters-div').load("templates/adapters.html", function () {

            $adapterContainer = $('#adapter-container');
            $adapterTableTemplate = $('#adapterTemplateTable');
            $adapterGroupTemplate = $('#adapterTemplateGroup');
            $adapterTemplate = $('#adapterTemplateAdapter');
            $adapterNewTemplate = $('#adapterTemplateNewAdapter');
            $adapterTemplateInside = $('#adapterTemplateAdapterInside');

            $('#btn_collapse_adapters').click(function () {
                $('.collapse-link').each(function () {
                    var $ICON = $(this).find('i');
                    if ($ICON.hasClass('fa-chevron-up')) {
                        var $BOX_PANEL = $(this).closest('.x_panel');
                        var $BOX_CONTENT = $BOX_PANEL.find('.x_content');
                        $BOX_CONTENT.slideToggle(200);
                        $BOX_PANEL.css('height', 'auto');
                        $ICON.toggleClass('fa-chevron-up fa-chevron-down');
                    }

                });
            });
            $('#btn_expand_adapters').click(function () {
                $('.collapse-link').each(function () {
                    var $ICON = $(this).find('i');
                    if ($ICON.hasClass('fa-chevron-down')) {
                        var $BOX_PANEL = $(this).closest('.x_panel');
                        var $BOX_CONTENT = $BOX_PANEL.find('.x_content');
                        $BOX_CONTENT.slideToggle(200);
                        $BOX_PANEL.css('height', 'auto');
                        $ICON.toggleClass('fa-chevron-up fa-chevron-down');
                    }

                });
            });
            $('#btn_list_adapters').click(function () {
                that.isList = !that.isList;
                if (that.isList) {
                    $('#btn_list_adapters i').switchClass('fa-list', 'fa-window-maximize');
                    $('#btn_expand_adapters').hide();
                    $('#btn_collapse_adapters').hide();
                    $(this).changeTooltip($.i18n('list'));
                } else {
                    $('#btn_list_adapters i').switchClass('fa-list', 'fa-window-maximize');
                    $('#btn_expand_adapters').show();
                    $('#btn_collapse_adapters').show();
                    $(this).changeTooltip($.i18n('tiles'));
                }
                that.main.saveConfig('adaptersIsList', that.isList);
                setTimeout(function () {
                    that.init(true);
                }, 200);
            });
            $('#btn_filter_adapters').click(function () {
                that.onlyInstalled = !that.onlyInstalled;
                if (that.onlyInstalled) {
                    $('#btn_filter_adapters').addClass('btn-primary').removeClass('btn-default');
                } else {
                    $('#btn_filter_adapters').addClass('btn-default').removeClass('btn-primary');
                }
                that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);
                setTimeout(function () {
                    that.init(true);
                }, 200);
            });
            $('#btn_filter_updates').click(function () {
                that.onlyUpdatable = !that.onlyUpdatable;
                if (that.onlyUpdatable) {
                    $('#btn_filter_updates').addClass('btn-primary').removeClass('btn-default');
                    $('#btn_upgrade_all').show();
                } else {
                    $('#btn_filter_updates').addClass('btn-default').removeClass('btn-primary');
                    $('#btn_upgrade_all').hide();
                }
                that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);
                setTimeout(function () {
                    that.init(true);
                }, 200);
            });
            $('#btn_upgrade_all').click(function () {
                that.main.confirmMessage($.i18n('updateAllAdapters'), $.i18n('question'), 'help', function (result) {
                    if (result) {
                        that.main.cmdExec(null, 'upgrade', function (exitCode) {
                            if (!exitCode) {
                                that.init(true);
                            }
                        });
                    }
                });
            });
            $('#btn-adapters-expert-mode').click(function () {
                that.main.config.expertMode = !that.main.config.expertMode;
                that.main.saveConfig('expertMode', that.main.config.expertMode);
                that.updateExpertMode();
            });
            if (that.main.config.expertMode) {
                $('#btn-adapters-expert-mode').removeClass('btn-default').addClass('btn-primary');
            } else {
                $('#btn-adapters-expert-mode').removeClass('btn-primary').addClass('btn-default');
            }

            // save last selected adapter
            $('#install-github-link').change(function () {
                that.main.saveConfig('adaptersGithub', $(this).val());
            });
            $('#install-url-link').keyup(function (event) {
                if (event.which === 13) {
                    $('#dialog-install-url-button').trigger('click');
                }
            });
            // Load settings
            that.isList = that.main.config.adaptersIsList || false;
            that.onlyInstalled = that.main.config.adaptersOnlyInstalled || false;
            that.onlyUpdatable = that.main.config.adaptersOnlyUpdatable || false;
            that.currentFilter = that.main.config.adaptersCurrentFilter || '';
            that.isCollapsed = that.main.config.adaptersIsCollapsed ? JSON.parse(that.main.config.adaptersIsCollapsed) : {};
            $('#adapters-filter').val(that.currentFilter);
            if (that.isList) {
                $('#btn_list_adapters').attr('title', $.i18n('tree')).switchClass('btn-default', 'btn-primary');
                $('#btn_expand_adapters').hide();
                $('#btn_collapse_adapters').hide();
            }

            if (that.onlyInstalled) {
                $('#btn_filter_adapters').switchClass('btn-default', 'btn-primary');
            }

            if (that.onlyUpdatable || that.main.config.expertMode) {
                if (that.onlyUpdatable) {
                    $('#btn_filter_updates').switchClass('btn-default', 'btn-primary');
                }
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_upgrade_all').hide();
            }

            $('#btn_refresh_adapters').click(function () {
                that.init(true, true);
            });
            // add filter processing
            $('#adapters-filter').keyup(function () {
                $(this).trigger('change');
            }).on('change', function () {
                if (that.filterTimer) {
                    clearTimeout(that.filterTimer);
                }
                that.filterTimer = setTimeout(function () {
                    that.filterTimer = null;
                    that.currentFilter = $('#adapters-filter').val().toLowerCase();
                    that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                    //that.$grid.fancytree('getTree').filterNodes(customFilter, false);
                }, 400);
            });
            $(document.body).on('click', '.adapter-issue-submit', function () {
                var adapter_name = $(this).data('adapter-name');
                $.getJSON($(this).data('issue-url'), function (data) {
                    var $table = $('#issueTable').children().clone(true, true);
                    $table.find('.adapter-name').text(adapter_name);
                    var bug = false;
                    for (var i in data) {
                        if (i === "remove") {
                            break;
                        }
                        bug = true;
                        var issue = data[i];
                        var $issueElement = $('#issueTableElement').children().clone(true, true);
                        $issueElement.find('.title').text(issue.title).attr('href', issue.html_url);
                        $issueElement.find('.user').text(issue.user.login);
                        $issueElement.find('.description').text(issue.body);
                        $issueElement.find('.created').text(main.formatDate(new Date(issue.created_at), false, true));
                        if (issue.labels.length > 0) {
                            for (var k in issue.labels) {
                                if (k === "remove") {
                                    break;
                                }
                                $issueElement.find('.tags').append('<a data-toggle="tooltip" class="tag" style="background:#' + issue.labels[k].color + ';" title="' + issue.labels[k].name + '"><span>' + issue.labels[k].name + '</span></a>');
                            }
                        }

                        $table.find('.timeline').append($issueElement);
                    }

                    if (!bug) {
                        $table.find('.timeline').append($('<li><h2>' + $.i18n('noBug') + '</h2></li>'));
                    }

                    bootbox.confirm({
                        size: 'large',
                        backdrop: true,
                        message: $table.toString(),
                        buttons: {
                            cancel: {
                                label: $.i18n('close'),
                                className: 'btn-default'
                            },
                            confirm: {
                                label: $.i18n('addIssue'),
                                className: 'btn-success'
                            }
                        },
                        callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/
                            if (!result) {
                                //TODO create issue
                            }
                        }
                    }).off("shown.bs.modal");
                });
            });
            $(document.body).on('click', '.adapter-install-submit', function () {
                var adapter = $(this).attr('data-adapter-name');
                that.getAdaptersInfo(that.main.currentHost, false, false, function (repo, installed) {
                    var obj = repo[adapter];

                    if (!obj) {
                        obj = installed[adapter];
                    }

                    if (!obj) {
                        return;
                    }

                    if (obj.license && obj.license !== 'MIT') {
                        // Show license dialog!
                        showLicenseDialog(adapter, function (isAgree) {
                            if (isAgree) {
                                that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                                    if (!exitCode) {
                                        that.init(true);
                                    }
                                });
                            }
                        });
                    } else {
                        that.main.cmdExec(null, 'add ' + adapter, function (exitCode) {
                            if (!exitCode) {
                                that.init(true);
                            }
                        });
                    }
                });
            });

            $(document.body).on('click', '.adapter-delete-submit', function () {
                var name = $(this).attr('data-adapter-name');
                that.main.confirmMessage($.i18n('areyousure'), $.i18n('question'), 'help', function (result) {
                    if (result) {
                        that.main.cmdExec(null, 'del ' + name, function (exitCode) {
                            if (!exitCode) {
                                that.init(true);
                            }
                        });
                    }
                });
            });
        });
    };
    this.updateExpertMode = function () {
        that.init(true);
    };

    function customFilter(node) {

        if (that.currentFilter) {
            if (!that.data[node.key]) {
                return false;
            }

            if ((that.data[node.key].name && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].title && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].desc && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) !== -1)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }

    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!host) {
            return;
        }

        if (!callback) {
            throw 'Callback cannot be null or undefined';
        }
        if (update) {
            // Do not update too often
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled = null;
            }
        }

        if (this.curRunning) {
            this.curRunning.push(callback);
            return;
        }

        if (!this.curRepository) {
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                if (_repository === 'permissionError') {
                    console.error('May not read "getRepository"');
                    _repository = {};
                }

                that.curRepository = _repository || {};
                if (that.curRepository && that.curInstalled && that.curRunning) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }
        if (!this.curInstalled) {
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                if (_installed === 'permissionError') {
                    console.error('May not read "getInstalled"');
                    _installed = {};
                }

                that.curInstalled = _installed || {};
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }

        if (this.curInstalled && this.curRepository) {
            setTimeout(function () {
                if (that.curRunning) {
                    for (var c = 0; c < that.curRunning.length; c++) {
                        that.curRunning[c](that.curRepository, that.curInstalled);
                    }
                    that.curRunning = null;
                }
                if (callback)
                    callback(that.curRepository, that.curInstalled);
            }, 0);
        } else {
            this.curRunning = [callback];
        }
    };

    this.getNews = function (actualVersion, adapter) {
        var text = '';
        if (adapter.news) {
            for (var v in adapter.news) {
                if (systemLang === v)
                    text += (text ? '\n' : '') + adapter.news[v];
                if (v === 'en' || v === 'ru' || v === 'de')
                    continue;
                if (v === actualVersion)
                    break;
                text += (text ? '\n' : '') + (adapter.news[v][systemLang] || adapter.news[v].en);
            }
        }
        return text;
    };

    function checkDependencies(dependencies) {
        if (!dependencies)
            return '';
        // like [{"js-controller": ">=0.10.1"}]
        var adapters;
        if (dependencies instanceof Array) {
            adapters = {};
            for (var a = 0; a < dependencies.length; a++) {
                if (typeof dependencies[a] === 'string')
                    continue;
                for (var b in dependencies[a])
                    adapters[b] = dependencies[a][b];
            }
        } else {
            adapters = dependencies;
        }

        for (var adapter in adapters) {
            if (adapter === 'js-controller') {
                if (!semver.satisfies(that.main.objects['system.host.' + that.main.currentHost].common.installedVersion, adapters[adapter])) {
                    return $.i18n('Invalid version of $1. Required $2', adapter, adapters[adapter]);
                }
            } else {
                if (!that.main.objects['system.adapter.' + adapter] || !that.main.objects['system.adapter.' + adapter].common || !that.main.objects['system.adapter.' + adapter].common.installedVersion) {
                    return $.i18n('No version of $1', adapter);
                }
                if (!semver.satisfies(that.main.objects['system.adapter.' + adapter].common.installedVersion, adapters[adapter])) {
                    return $.i18n('Invalid version of $1', adapter);
                }
            }
        }
        return '';
    }

    function fillData(list, installedList, repository, isInstalled) {
        var now = new Date();
        for (var i = 0; i < list.length; i++) {

            var adapter = list[i];
            var obj = isInstalled ? (installedList ? installedList[adapter] : null) : repository[adapter];

            if (obj && isInstalled) {
                that.urls[adapter] = installedList[adapter].readme || installedList[adapter].extIcon || installedList[adapter].licenseUrl;
                if (!that.urls[adapter]) {
                    delete that.urls[adapter];
                }
            }

            if (!obj || obj.controller || (isInstalled && adapter === 'hosts')) {
                continue;
            }

            var isNew = false;
            if (repository[adapter] && repository[adapter].published && (now - new Date(repository[adapter].published)) < 3600000 * 24 * 31) {
                isNew = true;
            }

            var version = '';
            if (repository[adapter] && repository[adapter].version) {
                version = repository[adapter].version;
            }

            var issue = '';
            var icon = '';
            if (repository[adapter] && repository[adapter].extIcon) {
                icon = repository[adapter].extIcon;
                var tmp = icon.split('/');
                issue = 'https://api.github.com/repos/' + tmp[3] + "/" + tmp[4] + "/issues";
            }
            if (isInstalled) {
                icon = obj.icon;
            }

            var installed;
            if (!isInstalled) {
                installed = "";
            } else {
                installed = {};
                installed.instances = 0;
                installed.active = 0;
                installed.news = "";
                installed.version = obj.version;
                installed.updatable = false;
                installed.updatableError = "";
            }

            if (isInstalled && obj.version) {
                var updatable = false;
                if (!that.main.upToDate(version, obj.version)) {
                    installed.news = that.getNews(obj.version, repository[adapter]);
                    // check if version is compatible with current adapters and js-controller
                    updatable = true;
                    installed.updatableError = checkDependencies(repository[adapter].dependencies);
                }
                installed.updatable = updatable;
                var _instances = 0;
                var _enabled = 0;
                // Show information about installed and enabled instances
                for (var z = 0; z < that.main.instances.length; z++) {
                    if (main.objects[that.main.instances[z]].common.name === adapter) {
                        _instances++;
                        if (main.objects[that.main.instances[z]].common.enabled)
                            _enabled++;
                    }
                }
                if (_instances) {
                    installed.instances = _instances;
                    if (_enabled) {
                        installed.active = _enabled;
                    }
                }

                if (!updatable && that.onlyUpdatable) {
                    continue;
                }
            }

            var group = (obj.type || 'common adapters') + '_group';
            if (!(group in that.groupImages)) {
                group = 'unknown_group';
            }
            var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
            desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);
            if (obj.readme) {
                obj.readme = obj.readme.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
            }
            if (obj.licenseUrl) {
                obj.licenseUrl = obj.licenseUrl.replace('https://github.com', 'https://raw.githubusercontent.com').replace('blob/', '');
            }

            that.data[adapter] = {
                image: icon ? icon : '',
                name: adapter,
                title: (obj.title || '').replace('ioBroker Visualisation - ', ''),
                desc: desc,
                keywords: obj.keywords ? obj.keywords.join(' ') : '',
                bold: obj.highlight || false,
                version: version,
                readme: obj.readme,
                issue: issue,
                installed: installed,
                platform: obj.platform,
                group: group,
                license: obj.license || '',
                licenseUrl: obj.licenseUrl || '',
                authors: obj.authors,
                newAdapter: isNew
            };
            if (!obj.type) {
                console.log('"' + adapter + '": "common adapters",');
            }
            if (obj.type && that.types && that.types[adapter]) {
                console.log('Adapter "' + adapter + '" has own type. Remove from admin.');
            }

            if (!that.isList) {
                var igroup = -1;
                for (var j = 0; j < that.tree.length; j++) {
                    if (that.tree[j].key === that.data[adapter].group) {
                        igroup = j;
                        break;
                    }
                }
                if (igroup < 0) {
                    that.tree.push({
                        title: $.i18n(that.data[adapter].group),
                        key: that.data[adapter].group,
                        expanded: !that.isCollapsed[that.data[adapter].group],
                        children: [],
                        icon: that.groupImages[that.data[adapter].group]
                    });
                    igroup = that.tree.length - 1;
                }
                that.tree[igroup].children.push(adapter);
            } else {
                that.tree.push({
                    icon: that.data[adapter].image,
                    title: that.data[adapter].name,
                    desc: that.data[adapter].desc,
                    group: $.i18n(that.data[adapter].group),
                    version: that.data[adapter].version,
                    license: that.data[adapter].license
                });
            }
        }
    }

// ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (that.main.config.expertMode) {
            $('#btn-adapters-expert-mode').removeClass('btn-default').addClass('btn-primary');
            $('#btn_upgrade_all').show();
        } else {
            $('#btn-adapters-expert-mode').addClass('btn-default').removeClass('btn-primary');
            if (that.onlyUpdatable) {
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_upgrade_all').hide();
            }
        }

        $adapterContainer.html('');

        this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {
            var listInstalled = [];
            var listUnsinstalled = [];

            if (installedList) {
                for (var adapter in installedList) {
                    if (!installedList.hasOwnProperty(adapter)) {
                        continue;
                    }
                    var obj = installedList[adapter];
                    if (!obj || obj.controller || adapter === 'hosts') {
                        continue;
                    }
                    listInstalled.push(adapter);
                }
                listInstalled.sort();
            }

            that.urls = {};

            // List of adapters from repository
            for (var adapter in repository) {
                if (!repository.hasOwnProperty(adapter)) {
                    continue;
                }

                that.urls[adapter] = repository[adapter].meta;
                var obj = repository[adapter];
                if (!obj || obj.controller) {
                    continue;
                }
                if (installedList && installedList[adapter]) {
                    continue;
                }
                listUnsinstalled.push(adapter);
            }
            listUnsinstalled.sort();

            that.tree = [];
            that.data = {};

            // list of the installed adapters
            fillData(listInstalled, installedList, repository, installedList);

            if (!that.onlyInstalled && !that.onlyUpdatable) {
                fillData(listUnsinstalled, installedList, repository, null);
            }

            if (that.isList) {
                that.createAdapterTable();
            } else {
                that.createAdapterTiles();
            }

        });

        this.main.fillContent('#menu-adapters-div');
    };
    this.createAdapterTiles = function () {
        for (var i in this.tree) {
            if (i === "remove") {
                break;
            }
            var group = this.tree[i];
            var $tempGroup = $adapterGroupTemplate.children().clone(true, true);
            $tempGroup.find('.group_title').text(group.title);
            $tempGroup.find('.group_img').attr('src', group.icon).attr('alt', group.title);

            for (var z in group.children) {
                var adapter = that.data[group.children[z]];
                if (adapter) {
                    var $tempAdapterBorder;
                    var $tempAdapterInner = $adapterTemplateInside.children().clone(true, true);
                    $tempAdapterInner.find('.profile_img').attr('src', adapter.image);
                    $tempAdapterInner.find('.name').text(adapter.name);
                    $tempAdapterInner.find('.description').text(adapter.desc);
                    var bgColor = '';
                    var state = '';
                    if (adapter.version) {
                        var tmp = adapter.version.split('.');
                        if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                            state = "planned";
                            bgColor = "bg-info";
                        } else if (tmp[0] === '0' && tmp[1] === '0') {
                            state = "alpha";
                            bgColor = "bg-danger";
                        } else if (tmp[0] === '0') {
                            state = "beta";
                            bgColor = "bg-warning";
                        } else if (adapter.version === 'npm error') {
                            state = "error";
                            bgColor = "";
                            adapter.version = $.i18n('npm error');
                        } else {
                            state = "stable";
                            bgColor = "bg-success";
                        }

                        if (adapter.newAdapter || (adapter.installed && adapter.version !== adapter.installed.version)) {
                            $tempAdapterBorder = $adapterNewTemplate.children().clone(true, true);
                            if (adapter.newAdapter) {
                                $tempAdapterBorder.find('.ui-ribbon').text($.i18n('newAdapter')).addClass('x_new_adapter');
                            } else {
                                $tempAdapterBorder.find('.ui-ribbon').text($.i18n('update')).addClass('x_update_adapter');
                            }
                        } else {
                            $tempAdapterBorder = $adapterTemplate.children().clone(true, true);
                        }

                    } else {
                        $tempAdapterBorder = $adapterTemplate.children().clone(true, true);
                    }

                    if (adapter.version) {
                        $tempAdapterInner.find('.version').text(adapter.version).parent().removeClass('bg-info').addClass(bgColor);
                    }
                    $tempAdapterInner.find('.adapter-install-submit').attr('data-adapter-name', adapter.name);
                    $tempAdapterInner.find('.adapter-delete-submit').attr('data-adapter-name', adapter.name);
                    if (adapter.readme) {
                        $tempAdapterInner.find('.adapter-readme-submit').attr('data-md-url', adapter.readme);
                    } else {
                        $tempAdapterInner.find('.adapter-readme-submit').addClass('disabled').prop('disabled', true);
                    }
                    if (adapter.issue) {
                        $tempAdapterInner.find('.adapter-issue-submit').attr('data-issue-url', adapter.issue).attr('data-adapter-name', adapter.name);
                    } else {
                        $tempAdapterInner.find('.adapter-issue-submit').prop('disabled', true);
                    }
                    if (adapter.license) {
                        $tempAdapterInner.find('.license').text(adapter.license);
                    } else {
                        $tempAdapterInner.find('.license').parent().html('&nbsp;');
                    }
                    if (adapter.licenseUrl) {
                        $tempAdapterInner.find('.license').attr('data-md-url', adapter.licenseUrl);
                    } else {
                        $tempAdapterInner.find('.license').addClass('disabled').prop('disabled', true);
                    }
                    if (adapter.installed) {
                        $tempAdapterInner.find('.adapter-delete-submit').prop('disabled', false);
                        $tempAdapterInner.find('.installedInstanceSpan').removeClass('hidden');
                        $tempAdapterInner.find('.installedInstances').text(adapter.installed.instances);
                        $tempAdapterInner.find('.activeInstances').text(adapter.installed.active);
                        if (adapter.installed.version !== adapter.version) {
                            $tempAdapterInner.find('.installedVersion').removeClass('hidden').text(adapter.installed.version);
                            if (adapter.installed.news) {
                                $tempAdapterInner.find('.notesVersion').removeClass('hidden').attr('title', adapter.installed.news);
                            }
                            if (adapter.installed.updatable) {
                                $tempAdapterInner.find('.adapter-update-submit').prop('disabled', false);
                            }
                            if (adapter.installed.updatableError) {
                                $tempAdapterInner.find('.adapter-update-submit').attr('title', adapter.installed.updatableError);
                            }
                        }
                    }

                    if (adapter.authors) {
                        var authors = "";
                        for (var i in adapter.authors) {
                            if (i === "remove") {
                                break;
                            }
                            var author = adapter.authors[i];
                            var mail = "";
                            if (author.indexOf('<') > -1 && author.indexOf('>') > -1 && author.indexOf('@') > -1) {
                                mail = author.substring(author.lastIndexOf("<") + 1, author.lastIndexOf(">"));
                                authors += "<a href='mailto:" + mail + "'>" + author.substring(0, author.lastIndexOf("<") - 1) + "</a>, ";
                            } else {
                                authors += author + ", ";
                            }
                        }
                        $tempAdapterInner.find('.authors').html(authors ? authors.slice(0, -2) : '');
                    }

                    $tempAdapterBorder.find('.x_content').append($tempAdapterInner);
                    $tempGroup.find('.adapterList').append($tempAdapterBorder);
                }
            }

            $adapterContainer.append($tempGroup);

        }
    };
    this.createAdapterTable = function () {
        var $tempTable = $adapterTableTemplate.children().clone(true, true);

        $tempTable.find('.adapterTable').bootstrapTable({
            columns: [{
                    field: 'icon',
                    formatter: iconFormatter
                }, {
                    field: 'title',
                    title: $.i18n('name'),
                    sortable: true
                }, {
                    field: 'desc',
                    title: $.i18n('desc')
                }, {
                    field: 'group',
                    title: $.i18n('group'),
                    sortable: true
                }, {
                    field: 'version',
                    title: $.i18n('version')
                }, {
                    field: 'license',
                    title: $.i18n('license')
                }],
            data: that.tree
        });

        $adapterContainer.append($tempTable);
    };

    function iconFormatter(value) {
        return '<img style="height: 20px;" src="' + value + '"/>';
    }

    function showLicenseDialog(adapter, callback) {

    }

    this.objectChange = function (id, obj) {
    };

    function showUploadProgress(group, adapter, percent) {

    }

    this.stateChange = function (id, state) {

    };
}