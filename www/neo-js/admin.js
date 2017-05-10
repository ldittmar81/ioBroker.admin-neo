/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* global io:false */
/* global jQuery:false */
/* jslint browser:true */
/* jshint browser:true */
/* global bootbox */
/* global systemLang */
/* global storage */
/* global i18n */
/* global availableLanguages */
/* global toggleFullScreen, $BODY, $LEFT_COL, $SIDEBAR_FOOTER, $FOOTER, $NAV_MENU */
/* global showdown */

'use strict';

Array.prototype.remove = function () {
    var what;
    var a = arguments;
    var L = a.length;
    var ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

var $iframeDialog = null; // used in adapter settings window
var defaults = {};
var adapterRedirect = function (redirect, timeout) {
    if (redirect) {
        setTimeout(function () {
            redirect += document.location.pathname;
            redirect += document.location.hash;
            document.location.href = redirect;
        }, timeout || 5000);
    }
};

(function ($) {
    $(function () {
        var main = {
            objects: {},
            states: {},
            currentHost: '',
            socket: io.connect('/', {path: location.pathname + 'socket.io'}),
            systemConfig: null,
            instances: null,
            objectsLoaded: false,
            waitForRestart: false,
            iframemenu: false,
            menus: null,
            selectId: null,
            config: {},
            glyph_opts: {
                map: {
                    doc: "fa fa-file-o",
                    docOpen: "fa fa-file-o",
                    checkbox: "fa fa-square-o",
                    checkboxSelected: "fa fa-check-square-o",
                    checkboxUnknown: "fa fa-square",
                    dragHelper: "fa fa-arrow-right",
                    dropMarker: "fa fa-long-arrow-right",
                    error: "fa fa-warning",
                    expanderClosed: "fa fa-caret-right",
                    expanderLazy: "fa fa-angle-right",
                    expanderOpen: "fa fa-caret-down",
                    folder: "fa fa-folder-o",
                    folderOpen: "fa fa-folder-open-o",
                    loading: "fa fa-spinner fa-pulse"
                }
            },
            addEventMessage: function (id, state, rowData) {
                menus.events.addEventMessage(id, state, rowData);
            },
            saveConfig: function (attr, value) {
                if (attr) {
                    main.config[attr] = value;
                }

                if (typeof storage !== 'undefined') {
                    storage.set('adminConfig', JSON.stringify(main.config));
                }
            },
            // Helper methods
            upToDate: function (_new, old) {
                _new = _new.split('.');
                old = old.split('.');
                _new[0] = parseInt(_new[0], 10);
                old[0] = parseInt(old[0], 10);
                if (_new[0] > old[0]) {
                    return false;
                } else if (_new[0] === old[0]) {
                    _new[1] = parseInt(_new[1], 10);
                    old[1] = parseInt(old[1], 10);
                    if (_new[1] > old[1]) {
                        return false;
                    } else if (_new[1] === old[1]) {
                        _new[2] = parseInt(_new[2], 10);
                        old[2] = parseInt(old[2], 10);
                        if (_new[2] > old[2]) {
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }
                } else {
                    return true;
                }
            },
            // Methods
            cmdExec: function (host, cmd, callback) {
                host = host || main.currentHost;
                $stdout.val('');
                var title = cmd;
                if(title.startsWith('add')){
                    var tmp = title.split(' ');
                    title = $.i18n('addCommandTitle', tmp[1]);
                }
                $('#modal-command-label').text(title);
                $('#modal-command').modal();
                stdout = '$ ./iobroker ' + cmd;
                $stdout.val(stdout);
                // genereate the unique id to coordinate the outputs
                activeCmdId = Math.floor(Math.random() * 0xFFFFFFE) + 1;
                cmdCallback = callback;
                main.socket.emit('cmdExec', host, activeCmdId, cmd, function (err) {
                    if (err) {
                        stdout += '\n' + $.i18n(err);
                        $stdout.val(stdout);
                        cmdCallback = null;
                        callback(err);
                    } else {
                        if (callback) {
                            callback();
                        }
                    }
                });
            },
            confirmMessage: function (message, title, icon, buttons, callback) {
                if (icon && $.type(icon) === "string") {
                    message = "<i class='fa " + icon.text2iconClass + "'></i>&nbsp;" + message;
                }
                if (typeof buttons === 'function') {
                    callback = buttons;

                    bootbox.confirm({
                        title: title || $.i18n('message'),
                        message: message,
                        buttons: {
                            confirm: {
                                label: $.i18n('ok'),
                                className: 'btn-primary'
                            },
                            cancel: {
                                label: $.i18n('cancel'),
                                className: 'btn-default'
                            }
                        },
                        callback: function (result) { /* result is a boolean; true = OK, false = Cancel*/
                            if (typeof callback === 'function') {
                                callback(result);
                            }
                        }
                    });

                } else if (typeof buttons === 'object') {

                    var btn = [];
                    for (var b = 0; b < buttons.length; b++) {
                        btn[b] = {
                            label: buttons[b],
                            class: "btn-default",
                            callback: function () {
                                callback(b);
                            }
                        };
                    }

                    bootbox.dialog(message, btn, {
                        title: title || $.i18n('message')
                    });

                }
            },
            showMessage: function (message, title, icon, btnlabel, btnclass) {
                if (icon && $.type(icon) === "string") {
                    message = "<i class='fa " + icon.text2iconClass + "'></i>&nbsp;" + message;
                }
                bootbox.alert({
                    title: title || $.i18n('message'),
                    message: message,
                    buttons: {
                        ok: {
                            label: btnlabel || $.i18n('ok'),
                            className: btnclass || 'btn-primary'
                        }
                    }
                });
            },
            showError: function (error) {
                main.showMessage($.i18n(error), $.i18n('error'), 'alert');
            },
            formatDate: function (dateObj, justTime, noMilli) {
                if (!dateObj) {
                    return '';
                }
                var text = typeof dateObj;
                if (text === 'string') {
                    if (justTime) {
                        return dateObj.substring(8);
                    } else {
                        return dateObj;
                    }
                }
                // if less 2000.01.01 00:00:00
                if (text !== 'object') {
                    dateObj = dateObj < 946681200000 ? new Date(dateObj * 1000) : new Date(dateObj);
                }

                var v;
                if (!justTime) {
                    text = dateObj.getFullYear();
                    v = dateObj.getMonth() + 1;
                    if (v < 10) {
                        text += '-0' + v;
                    } else {
                        text += '-' + v;
                    }

                    v = dateObj.getDate();
                    if (v < 10) {
                        text += '-0' + v;
                    } else {
                        text += '-' + v;
                    }
                } else {
                    v = dateObj.getDate();
                    if (v < 10) {
                        text = '0' + v;
                    } else {
                        text = v;
                    }
                }

                v = dateObj.getHours();
                if (v < 10) {
                    text += ' 0' + v;
                } else {
                    text += ' ' + v;
                }
                v = dateObj.getMinutes();
                if (v < 10) {
                    text += ':0' + v;
                } else {
                    text += ':' + v;
                }

                v = dateObj.getSeconds();
                if (v < 10) {
                    text += ':0' + v;
                } else {
                    text += ':' + v;
                }

                if (!noMilli) {
                    v = dateObj.getMilliseconds();
                    if (v < 10) {
                        text += '.00' + v;
                    } else if (v < 100) {
                        text += '.0' + v;
                    } else {
                        text += '.' + v;
                    }
                }

                return text;
            },
            _delObject: function (idOrList, callback) {
                var id;
                if (typeof idOrList === 'object') {
                    if (!idOrList || !idOrList.length) {
                        if (callback) {
                            callback(null);
                        }
                        return;
                    }
                    id = idOrList.pop();
                } else {
                    id = idOrList;
                }

                if (main.objects[id] && main.objects[id].common && main.objects[id].common['object-non-deletable']) {
                    main.showMessage($.i18n('delete_not_allowed', id), '', 'notice');
                    if (typeof idOrList === 'object') {
                        setTimeout(function () {
                            this._delObject(idOrList, callback);
                        }.bind(this), 0);
                    } else {
                        if (callback) {
                            setTimeout(function () {
                                callback(null, idOrList);
                            }, 0);
                        }
                    }
                } else {
                    var obj = main.objects[id];
                    main.socket.emit('delObject', id, function (err) {
                        if (err && err !== 'Not exists') {
                            main.showError(err);
                            return;
                        }
                        if (obj && obj.type === 'state') {
                            main.socket.emit('delState', id, function (err) {
                                if (err && err !== 'Not exists') {
                                    main.showError(err);
                                    return;
                                }
                                if (typeof idOrList === 'object') {
                                    setTimeout(function () {
                                        this._delObject(idOrList, callback);
                                    }.bind(this), 0);
                                } else {
                                    if (callback) {
                                        setTimeout(function () {
                                            callback(null, idOrList);
                                        }, 0);
                                    }
                                }
                            }.bind(this));
                        } else {
                            if (typeof idOrList === 'object') {
                                setTimeout(function () {
                                    this._delObject(idOrList, callback);
                                }.bind(this), 0);
                            } else {
                                if (callback) {
                                    setTimeout(function () {
                                        callback(null, idOrList);
                                    }, 0);
                                }
                            }
                        }
                    }.bind(this));
                }
            },
            _delObjects: function (rootId, isAll, callback) {
                if (!isAll) {
                    this._delObject(rootId, callback);
                } else {
                    var list = [];
                    for (var id in main.objects) {
                        if (id.substring(0, rootId.length + 1) === rootId + '.') {
                            list.push(id);
                        }
                    }
                    list.push(rootId);
                    list.sort();
                    this._delObject(list, function () {
                        if (callback) {
                            callback();
                        }
                    });
                }
            },
            __delObject: function ($tree, id, callback) {
                var leaf = $tree ? $tree.selectId('getTreeInfo', id) : null;
                //var leaf = treeFindLeaf(id);
                if (leaf && leaf.children) {
                    for (var e = 0; e < leaf.children.length; e++) {
                        main.delObject($tree, leaf.children[e], function () {
                            main.delObject($tree, id, callback, true);
                        }, true);
                        break;
                    }
                } else {
                    if (main.objects[id] && main.objects[id].common && main.objects[id].common['object-non-deletable']) {
                        main.showMessage($.i18n('delete_not_allowed', id), '', 'notice');
                        if (callback)
                            callback(null, id);
                    } else {
                        main.socket.emit('delObject', id, function (err) {
                            if (err && err !== 'Not exists') {
                                main.showError(err);
                                return;
                            }
                            main.socket.emit('delState', id, function (err) {
                                if (err && err !== 'Not exists') {
                                    main.showError(err);
                                    return;
                                }
                                if (callback) {
                                    setTimeout(function () {
                                        callback(null, id);
                                    }, 0);
                                }
                            });
                        });
                    }
                }
            },
            delObject: function ($tree, id, callback) {
                var leaf = $tree ? $tree.selectId('getTreeInfo', id) : null;
                if (main.objects[id]) {
                    if (leaf && leaf.children) {
                        // ask if only object must be deleted or just this one
                        main.confirmMessage($.i18n('delete_one_all', id), null, 'help', [$.i18n('all'), $.i18n('only_one'), $.i18n('cancel')], function (result) {
                            // If all
                            if (result === 0) {
                                main._delObjects(id, true, callback);
                            } else if (result === 1) {
                                // if only one object
                                main._delObjects(id, false, callback);
                            } // else do nothing
                        });
                    } else {
                        main.confirmMessage($.i18n('delete_sure', id), null, 'help', function (result) {
                            // If all
                            if (result) {
                                main._delObjects(id, true, callback);
                            }
                        });
                    }
                } else if (leaf && leaf.children) {
                    main.confirmMessage($.i18n('delete_all_children_sure', id), null, 'help', function (result) {
                        // If all
                        if (result) {
                            main._delObjects(id, true, callback);
                        }
                    });
                } else {
                    main.showMessage($.i18n('object_not_exists', id), null, 'help', function (result) {
                        // If all
                        if (result) {
                            main._delObjects(id, true, callback);
                        }
                    });
                }
            },
            initSelectId: function () {
                if (main.selectId) {
                    return main.selectId;
                }
                main.selectId = $('#dialog-select-member').selectId('init', {
                    objects: main.objects,
                    states: main.states,
                    filter: {type: 'state'},
                    name: 'admin-select-member',
                    texts: {
                        select: $.i18n('select'),
                        cancel: $.i18n('cancel'),
                        all: $.i18n('all'),
                        id: $.i18n('id'),
                        name: $.i18n('name'),
                        role: $.i18n('role'),
                        room: $.i18n('room'),
                        value: $.i18n('value'),
                        selectid: $.i18n('select_id'),
                        from: $.i18n('from'),
                        lc: $.i18n('lastchanged'),
                        ts: $.i18n('timestamp'),
                        wait: $.i18n('processing'),
                        ack: $.i18n('acknowledged')
                    },
                    columns: ['image', 'name', 'role', 'room', 'value']
                });
                return main.selectId;
            },
            fillContent: function (selector) {
                if ($pageContent.children().length > 0) {
                    $pageContent.children(":first").appendTo($hiddenObjects);
                }
                $(selector).prependTo($pageContent, restartFunctions(selector));
            },
            getMenuTitle: function (id, noSingletonCount) {
                var menuTitle = "";
                if (id.indexOf('.') !== -1) {
                    var instanz = id.substring(id.lastIndexOf('.') + 1, id.length);
                    var adapter = id.substring(0, id.lastIndexOf('.'));
                    if (noSingletonCount[adapter] === 1) {
                        menuTitle = adapter;
                    } else {
                        menuTitle = adapter + " (" + instanz + ")";
                    }
                } else {
                    menuTitle = id;
                }
                return menuTitle;
            },
            selectMenu: function (id, init) {
                if (init !== false) {
                    if ($('#custom-' + id + '-menu').length) {
                        main.iframemenu = true;
                        main.fillContent('#custom-' + id + '-menu');
                        resizeIFrame();

                        var $panel = $('#custom-' + id + '-menu');
                        var link = $panel.data('src');
                        if (link && link.indexOf('%') === -1) {
                            var $iframe = $panel.find('iframe');
                            if ($iframe.length && !$iframe.attr('src')) {
                                $iframe.attr('src', link);
                            }
                        } else {
                            alert('problem-link');
                        }
                    } else {
                        main.iframemenu = false;
                        menus[id].init();
                    }
                }

                $("#menu-title").text($('#menutitle-' + id).text());
                $('.side-menu li.active').removeClass('active');
                $('#menuitem-' + id).parent().addClass('active');
            },
            updateWizard: function () {
                var $wizard = $('#link-wizard');
                if (main.objects['system.adapter.discovery.0']) {
                    if (!$wizard.data('inited')) {
                        $wizard.data('inited', true);
                        $wizard.click(function () {
                            // open configuration dialog
                            main.menus.instances.showConfigDialog('system.adapter.discovery.0');
                        });
                    }
                    $wizard.show();

                    // Show wizard dialog
                    if (!main.systemConfig.common.wizard && main.systemConfig.common.licenseConfirmed) {
                        $wizard.click();
                    }
                } else {
                    $wizard.hide();
                }
            }
        };

        var menus = {
            home: new Home(main),
            adapters: new Adapters(main),
            instances: new Instances(main),
            logs: new Logs(main),
            states: new States(main),
            objects: new Objects(main),
            events: new Events(main),
            hosts: new Hosts(main),
            enums: new Enums(main)
        };

        main.instances = menus.instances.list;
        main.menus = menus;
        main.systemDialog = new System(main);
        main.infoDialog = new Info(main);
        main.usersDialog = new Users(main);
        main.groupsDialog = new Groups(main);

        var children = {};

        var cmdCallback = null;
        var stdout;
        var activeCmdId = null;

        var $pageContent = $('#pageContent');
        var $hiddenObjects = $('#hiddenObjects');

        var $stdout = null;

        var firstConnect = true;

        // Read all positions, selected widgets for every view,
        // Selected view, selected menu page,
        // Selected widget or view page
        // Selected filter
        if (typeof storage !== 'undefined') {
            try {
                main.config = storage.get('adminConfig');
                if (main.config) {
                    main.config = JSON.parse(main.config);
                } else {
                    main.config = {};
                }
            } catch (e) {
                console.log('Cannot load edit config');
                main.config = {};
            }
        }

        function initHtmlMenus(showMenus) {

            if (showMenus) {
                $('#menus-show').html('<option value="" data-i18n="show">' + $.i18n('show') + '</option>' + showMenus).selectpicker().show();

                $('#menus-show').on('change', function () {
                    if ($(this).val()) {
                        main.systemConfig.common.menus.push($(this).val());
                        // save
                        main.socket.emit('setObject', 'system.config', main.systemConfig, function (err) {
                            if (err) {
                                main.showError(err);
                                return;
                            }
                        });
                        initMenus();
                    }
                });
            } else {
                $('#menus-show').html('').hide();
            }

            main.updateWizard();

            if (!main.editTabs) {
                $('.menu-close').hide();
                $('#menus-show-button').hide();
            } else {
                $('#button-edit-menus').addClass('text-danger');
            }

            main.systemDialog.init();

            navigation();

            main.socket.emit('authEnabled', function (auth, user) {
                if (!auth) {
                    $('#button-logout').remove();
                }
                $('#current-user').html(user ? user[0].toUpperCase() + user.substring(1).toLowerCase() : '');
            });

            $('#events_threshold').click(function () {
                main.socket.emit('eventsThreshold', false);
            });

        }

        function initMenus() {

            initAllDialogs();

            // extract all additional instances
            var text = '';
            var list = [];
            var showMenus = '';

            var addMenus = [];
            var otherMenus = [];
            var urlList = [];
            var noSingleton = {};
            for (var i = 0; i < main.instances.length; i++) {
                var object = main.objects[main.instances[i]];
                if (!object.common) {
                    continue;
                }

                if (object.common.adminTab && object.common.adminTab.singleton) {
                    var isFound = false;
                    var inst1 = main.instances[i].replace(/\.(\d+)$/, '.');
                    for (var j = 0; j < addMenus.length; j++) {
                        var inst2 = addMenus[j].replace(/\.(\d+)$/, '.');
                        if (inst1 === inst2) {
                            isFound = true;
                            break;
                        }
                    }
                    if (!isFound) {
                        addMenus.push(main.instances[i]);
                    }
                } else if (object.common.adminTab) {
                    if(noSingleton[object.common.name]){
                        noSingleton[object.common.name] += 1;
                    }else{
                        noSingleton[object.common.name] = 1;
                    }
                    addMenus.push(main.instances[i]);
                } else {
                    var tmp = main.instances[i].split('.');
                    var adapter = tmp[2];
                    if (adapter === "admin-neo") {
                        continue;
                    }
                    var instance = tmp[3];
                    var link = object.common.localLinks || object.common.localLink || '';
                    var url = link ? main.menus.instances.replaceInLink(link, adapter, instance) : '';
                    if (typeof url === 'object') {
                        url = url.__first;
                    }
                    if (!url) {
                        continue;
                    }
                    if (urlList.indexOf(url) !== -1) {
                        continue;
                    }
                    urlList.push(url);
                    otherMenus.push({title: adapter, instance: instance, url: url});
                }
            }

            // Build the standard menus together
            $("#hiddenObjects div[id^='menu']").each(function () {
                var id = $(this).attr('id').substring(5, $(this).attr('id').length - 4);
                list.push(id);
                if (!main.systemConfig.common.menus || main.systemConfig.common.menus.indexOf(id) !== -1) {
                    text += '<li class="text-nowrap">';
                    text += '<a class="main-menu" href="#' + id + '" id="menuitem-' + id + '">';
                    text += '<i id="menuicon-' + id + '" class="fa ' + menus[id].menuIcon + '"></i> <span id="menutitle-' + id + '">' + $.i18n(id) + '</span></a>';
                    text += '<a class="menu-close"><i class="fa fa-times"></i></a></li>';
                } else {
                    showMenus += '<option value="' + id + '">' + $.i18n(id) + '</option>';
                }
            });

            // Look for adapter menus
            for (var a = 0; a < addMenus.length; a++) {
                var name = main.objects[addMenus[a]].common.name;
                var link = main.objects[addMenus[a]].common.adminTab.link || '/adapter/' + main.objects[addMenus[a]].common.name + '/tab.html';
                var parts = addMenus[a].split('.');
                var buttonName;

                if (main.objects[addMenus[a]].common.adminTab.name) {
                    if (typeof main.objects[addMenus[a]].common.adminTab.name === 'object') {
                        if (main.objects[addMenus[a]].common.adminTab.name[systemLang]) {
                            buttonName = main.objects[addMenus[a]].common.adminTab.name[systemLang];
                        } else if (main.objects[addMenus[a]].common.adminTab.name.en) {
                            buttonName = $.i18n(main.objects[addMenus[a]].common.adminTab.name.en);
                        } else {
                            buttonName = $.i18n(main.objects[addMenus[a]].common.name);
                        }
                    } else {
                        buttonName = $.i18n(main.objects[addMenus[a]].common.adminTab.name);
                    }
                } else {
                    buttonName = $.i18n(main.objects[addMenus[a]].common.name);
                }

                if (!main.objects[addMenus[a]].common.adminTab.singleton) {
                    if (link.indexOf('?') !== -1) {
                        link += '&instance=' + parts[3];
                    } else {
                        link += '?instance=' + parts[3];
                    }
                    buttonName += '.' + parts[3];
                    name += '-' + parts[3];
                } else {
                    parts[3] = 0;
                }

                list.push(name);

                if (!main.systemConfig.common.menus || main.systemConfig.common.menus.indexOf(name) !== -1) {
                    var isReplace = false;
                    if (!link) {
                        link = '/adapter/' + parts[2] + '/tab.html';
                    } else {
                        isReplace = link.indexOf('%') !== -1;
                    }

                    buttonName = main.getMenuTitle(buttonName, noSingleton);

                    var icon = main.objects[addMenus[a]].common.adminTab['fa-icon'] || 'fa-cog';
                    text += '<li class="text-nowrap">';
                    text += '<a class="main-menu" href="#' + name + '" id="menuitem-' + name + '">';
                    text += '<i id="menuicon-' + name + '" class="fa ' + icon + '"></i> <span style="text-transform: capitalize;" id="menutitle-' + name + '">' + buttonName + '</span></a>';
                    text += '<a class="menu-close"><i class="fa fa-times"></i></a></li>';

                    //noinspection JSJQueryEfficiency
                    if (!$('#' + name).length) {
                        var div = '<div id="custom-' + name + '-menu" class="tab-custom ' + (isReplace ? 'link-replace' : '') + '" data-adapter="' + parts[2] + '" data-instance="' + parts[3] + '" data-src="' + link + '">' +
                                '<iframe class="iframe-in-tab" style="border: 0; solid #FFF; display:block; left: 0; top: 0; width: 100%;"></iframe></div>';
                        $(div).appendTo($('#hiddenObjects'));
                    }
                } else {
                    $('#' + name).hide().appendTo($('body'));
                    showMenus += '<option value="' + name + '">' + buttonName + '</option>';
                }
            }

            // Look for other menus
            if (otherMenus.length > 0) {
                $('#child_others_parentmenu').removeClass("hidden");
                for (var a = 0; a < otherMenus.length; a++) {
                    var name = otherMenus[a].title + '-' + otherMenus[a].instance;
                    var link = otherMenus[a].url;

                    var child = '<li>';
                    child += '<a class="main-menu" href="#' + name + '" id="menuitem-' + name + '">';
                    child += '<span id="menutitle-' + name + '" style="text-transform: capitalize;">' + otherMenus[a].title + '</span></a></li>';
                    $('#child_others_menu').append(child);

                    var div = '<div id="custom-' + name + '-menu" class="tab-custom" data-adapter="' + otherMenus[a].title + '" data-instance="' + otherMenus[a].instance + '" data-src="' + link + '">' +
                            '<iframe class="iframe-in-tab" style="border: 0; solid #FFF; display:block; left: 0; top: 0; width: 100%;"></iframe></div>';
                    $(div).appendTo($('#hiddenObjects'));

                    list.push(name);
                }
            }

            $('.tab-custom').each(function () {
                var name = $(this).attr('id').substring(7, $(this).attr('id').length - 5);
                if (list.indexOf(name) === -1) {
                    $(this).remove();
                }
            });

            if (!main.systemConfig.common.menus) {
                main.systemConfig.common.menus = list;
            }

            $('.side-menu').prepend(text);

            $('.menu-close').click(function () {
                var pos = main.systemConfig.common.menus.indexOf($(this).data('tab'));
                if (pos !== -1) {
                    main.systemConfig.common.menus.splice(pos, 1);
                    // save
                    main.socket.emit('setObject', 'system.config', main.systemConfig, function (err) {
                        if (err) {
                            main.showError(err);
                            return;
                        }
                    });
                }
                initMenus();
            });

            if ($('.link-replace').length) {
                var countLink = 0;

                // If some objects cannot be read => go by timeout
                var loadTimeout = setTimeout(function () {
                    loadTimeout = null;
                    initHtmlMenus(showMenus);
                }, 1000);

                $('.link-replace').each(function () {
                    // convert "http://%ip%:%port%" to "http://localhost:1880"
                    countLink++;
                    main.menus.instances._replaceLinks($(this).data('src'), $(this).data('adapter'), $(this).data('instance'), $(this).attr('id'), function (link, adapter, instance, arg) {
                        $('#' + arg).data('src', link).removeClass('link-replace');
                        if (!--countLink) {
                            if (loadTimeout) {
                                clearTimeout(loadTimeout);
                                loadTimeout = null;
                            }
                            initHtmlMenus(showMenus);
                        }
                    });
                });
            } else {
                initHtmlMenus(showMenus);
            }
        }

        function initAllDialogs() {

            $('#dialog-license').load("templates/dialogs.html #modal-license", function () {
                restartFunctions('#dialog-license');

                for (var lang in availableLanguages) {
                    $('#license_language')
                            .append('<option value="' + lang + '" ' + (systemLang === lang ? "selected" : "") + '>' + availableLanguages[lang] + '</option>');
                }

                $('#license_diag').change(function () {
                    if ($(this).prop('checked')) {
                        $('#license_agree').prop('disable', false);
                    } else {
                        $('#license_agree').prop('disable', true);
                    }
                });

                $('#license_language').change(function () {
                    var language = $(this).val();
                    changeLanguage(language);
                });

            });

            $('#dialog-command').load("templates/dialogs.html #modal-command", function () {
                restartFunctions('#dialog-command');
                $stdout = $('#stdout');
            });

            $('#dialog-cron').load("templates/dialogs.html #modal-cron", function () {
                restartFunctions('#dialog-cron');
            });

            $('#dialog-config').load("templates/dialogs.html #modal-config", function () {
                restartFunctions('#dialog-config');
            });

        }

        menus.logs.prepare();

        // ----------------------------- Objects show and Edit ------------------------------------------------
        function getObjects(callback) {
            main.socket.emit('getObjects', function (err, res) {
                setTimeout(function () {
                    var obj;
                    main.objects = res;
                    for (var id in main.objects) {
                        if (id.slice(0, 7) === '_design'){
                            continue;
                        }

                        obj = main.objects[id];

                        switch (obj.type) {
                            case 'instance':
                                main.instances.push(id);
                                break;
                            case 'enum':
                                menus.enums.list.push(id);
                                break;
                            case 'user':
                                main.usersDialog.list.push(id);
                                break;
                            case 'group':
                                main.groupsDialog.list.push(id);
                                break;
                            case 'adapter':
                                menus.adapters.list.push(id);
                                break;
                            case 'host':
                                var addr = null;
                                // Find first non internal IP and use it as identifier
                                if (obj.native.hardware && obj.native.hardware.networkInterfaces) {
                                    for (var eth in obj.native.hardware.networkInterfaces) {
                                        for (var num = 0; num < obj.native.hardware.networkInterfaces[eth].length; num++) {
                                            if (!obj.native.hardware.networkInterfaces[eth][num].internal) {
                                                addr = obj.native.hardware.networkInterfaces[eth][num].address;
                                                break;
                                            }
                                        }
                                        if (addr) {
                                            break;
                                        }
                                    }
                                }
                                if (addr) {
                                    menus.hosts.list.push({name: obj.common.hostname, address: addr, id: obj._id});
                                } else {
                                    menus.hosts.list.push({name: obj.common.hostname, address: '127.0.0.1', id: obj._id});
                                }
                                break;
                        }

                        // convert obj.history into obj.custom
                        if (obj.common && obj.common.history) {
                            obj.common.custom = JSON.parse(JSON.stringify(obj.common.history));
                            delete obj.common.history;
                        }
                    }
                    main.objectsLoaded = true;

                    initMenus();

                    // If customs enabled
                    menus.objects.checkCustoms();

                    // Show if update available
                    menus.hosts.initList();

                    if (typeof callback === 'function'){
                        callback();
                    }
                }, 0);
            });
        }
        // ----------------------------- States show and Edit ------------------------------------------------

        function getStates(callback) {
            menus.states.clear();
            main.socket.emit('getStates', function (err, res) {
                main.states = res;
                if (typeof callback === 'function') {
                    setTimeout(function () {
                        callback();
                    }, 0);
                }
            });
        }

        function stateChange(id, state) {
            id = id ? id.replace(/ /g, '_') : '';

            if (id && id.match(/\.messagebox$/)) {
                main.addEventMessage(id, state);
            } else {
                menus.states.stateChange(id, state);
                menus.objects.stateChange(id, state);
                menus.hosts.stateChange(id, state);

                if (main.selectId){
                    main.selectId.selectId('state', id, state);
                }
            }

            // Update alive and connected of main.instances
            menus.instances.stateChange(id, state);
            menus.objects.stateChangeHistory(id, state);
            menus.adapters.stateChange(id, state);
        }

        function objectChange(id, obj) {
            //var changed = false;
            //var oldObj = null;
            var isNew = false;

            // update main.objects cache
            if (obj) {
                if (obj._rev && main.objects[id]){
                    main.objects[id]._rev = obj._rev;
                }
                if (!main.objects[id]) {
                    isNew = true;
                    //treeInsert(id);
                }
                if (isNew || JSON.stringify(main.objects[id]) !== JSON.stringify(obj)) {
                    main.objects[id] = obj;
                    //changed = true;
                }
            } else if (main.objects[id]) {
                //changed = true;
                //oldObj = {_id: id, type: main.objects[id].type};
                delete main.objects[id];
            }

            // update to event table
            main.addEventMessage(id, null, null, obj);

            menus.objects.objectChange(id, obj);

            if (main.selectId){
                main.selectId.selectId('object', id, obj);
            }

            menus.enums.objectChange(id, obj);

            // If system config updated
            if (id === 'system.config') {
                // Check language
                if (main.systemConfig.common.language !== obj.common.language) {
                    window.location.reload();
                }

                main.systemConfig = obj;
                initMenus();
            }

            if (id === 'system.adapter.discovery.0')
                main.updateWizard();

            //menus.adapters.objectChange(id, obj);
            menus.instances.objectChange(id, obj);

            if (obj && id.match(/^system\.adapter\.[\w-]+\.[0-9]+$/)) {
                if (obj.common &&
                        obj.common.adminTab &&
                        !obj.common.adminTab.ignoreConfigUpdate
                        ) {
                    initMenus();
                }

                if (obj && obj.type === 'instance') {
                    if (obj.common.supportCustoms ||
                            id.match(/^system\.adapter\.history\.[0-9]+$/) ||
                            id.match(/^system\.adapter\.influxdb\.[0-9]+$/) ||
                            id.match(/^system\.adapter\.sql\.[0-9]+$/)) {
                        // Update all states if customs enabled or disabled
                        menus.objects.reinit();
                    }
                }
            }

            menus.hosts.objectChange(id, obj);

            // Update groups
            main.groupsDialog.objectChange(id, obj);

            // Update users
            main.usersDialog.objectChange(id, obj);
        }

        function monitor() {
            if (main._timer)
                return;
            var ts = (new Date()).getTime();
            if (ts - main._lastTimer > 30000) {
                // It seems, that PC was in a sleep => Reload page to request authentication anew
                location.reload();
            } else {
                main._lastTimer = ts;
            }
            main._timer = setTimeout(function () {
                main._timer = null;
                monitor();
            }, 10000);
        }

        // ---------------------------- Socket.io methods ---------------------------------------------
        main.socket.on('log', function (message) {
            menus.logs.add(message);
            restartFunctions('#log_error_list');
        });
        main.socket.on('error', function (error) {
            console.log(error);
        });
        main.socket.on('permissionError', function (err) {
            main.showMessage($.i18n('Has no permission to $1 $2 $3', err.operation, err.type, (err.id || '')));
        });
        main.socket.on('stateChange', function (id, obj) {
            setTimeout(stateChange, 0, id, obj);
        });
        main.socket.on('objectChange', function (id, obj) {
            setTimeout(objectChange, 0, id, obj);
        });
        main.socket.on('cmdStdout', function (_id, text) {
            if (activeCmdId === _id) {
                stdout += '\n' + text;
                $('#adapter-meter').progressbar("+1");
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
            }
        });
        main.socket.on('cmdStderr', function (_id, text) {
            if (activeCmdId === _id) {
                stdout += '\nERROR: ' + text;
                $('#adapter-meter').progressbar("+1");
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
            }
        });
        main.socket.on('cmdExit', function (_id, exitCode) {
            if (activeCmdId === _id) {
                exitCode = parseInt(exitCode, 10);
                stdout += '\n' + (exitCode !== 0 ? 'ERROR: ' : '') + 'process exited with code ' + exitCode;
                $stdout.val(stdout);
                $stdout.scrollTop($stdout[0].scrollHeight - $stdout.height());
                $('#adapter-install-close-btn').text($.i18n('close'));
                if (!exitCode) {
                    $('#adapter-meter').progressbar(100);
                    setTimeout(function () {
                        $('#modal-command').modal('hide');
                    }, 1500);
                } else {
                    $('#adapter-meter').progressbar(90, "error");
                }
                if (cmdCallback) {

                    $('#adapter-install-close-btn').text($.i18n('close'));
                    cmdCallback(exitCode);
                    cmdCallback = null;
                }
            }
        });
        main.socket.on('eventsThreshold', function (isActive) {
            if (isActive) {
                $('#events_threshold').show();
            } else {
                $('#events_threshold').hide();
            }
        });
        main.socket.on('connect', function () {
            $('#connecting').hide();
            if (firstConnect) {
                firstConnect = false;

                main.socket.emit('authEnabled', function (auth, user) {
                    if (!auth) {
                        $('#link-logout').remove();
                        $('#button-logout').remove();
                        $('#button-info').removeClass('hidden');
                    }
                    $('#current-user').html(user ? user[0].toUpperCase() + user.substring(1).toLowerCase() : '');
                    if (auth) {
                        main._lastTimer = (new Date()).getTime();
                        monitor();
                    }
                });
                main.socket.emit('getUserPermissions', function (err, acl) {
                    main.acl = acl;
                    // Read system configuration
                    main.socket.emit('getObject', 'system.config', function (errConfig, data) {
                        main.systemConfig = data;
                        main.socket.emit('getObject', 'system.repositories', function (errRepo, repo) {
                            main.systemDialog.systemRepos = repo;
                            main.socket.emit('getObject', 'system.certificates', function (errCerts, certs) {
                                setTimeout(function () {
                                    main.systemDialog.systemCerts = certs;
                                    if (errConfig === 'permissionError') {
                                        main.systemConfig = {common: {language: systemLang}, error: 'permissionError'};
                                    } else {
                                        if (!errConfig && main.systemConfig && main.systemConfig.common) {
                                            if (main.systemConfig.common.language !== systemLang) {
                                                systemLang = main.systemConfig.common.language || systemLang;
                                                changeLanguage(systemLang);
                                            }
                                            main.systemConfig.common.city = main.systemConfig.common.city || '';
                                            main.systemConfig.common.country = main.systemConfig.common.country || '';
                                            main.systemConfig.common.longitude = main.systemConfig.common.longitude || '';
                                            main.systemConfig.common.latitude = main.systemConfig.common.latitude || '';

                                            if (!main.systemConfig.common.licenseConfirmed) {
                                                // Show license agreement
                                                $('#modal-license').modal();
                                            }
                                        } else {
                                            main.systemConfig = {
                                                type: 'config',
                                                common: {
                                                    name: 'system.config',
                                                    city: '', // City for weather
                                                    country: '', // Country for weather
                                                    longitude: '', // longitude for javascript
                                                    latitude: '', // longitude for javascript
                                                    language: '', // Default language for adapters. Adapters can use different values.
                                                    tempUnit: '°C', // Default temperature units.
                                                    currency: '', // Default currency sign.
                                                    dateFormat: 'DD.MM.YYYY', // Default date format.
                                                    isFloatComma: true, // Default float divider ('.' - false, ',' - true)
                                                    licenseConfirmed: false, // If license agreement confirmed,
                                                    defaultHistory: '', // Default history instance
                                                    menus: [// Show by default only these menus
                                                        'tab-adapters',
                                                        'tab-instances',
                                                        'tab-objects',
                                                        'tab-log',
                                                        'tab-scenes',
                                                        'tab-javascript',
                                                        'tab-text2command-0'
                                                    ]
                                                }
                                            };
                                            main.systemConfig.common.language = systemLang;
                                        }
                                    }

                                    // Here we go!
                                    menus.hosts.prepare();
                                    menus.objects.prepare();
                                    menus.states.prepare();
                                    menus.adapters.prepare();
                                    menus.instances.prepare();
                                    menus.enums.prepare();
                                    menus.objects.prepareCustoms();
                                    menus.events.prepare();
                                    menus.home.prepare();

                                    main.usersDialog.prepare();
                                    main.groupsDialog.prepare();
                                    main.systemDialog.prepare();
                                    main.infoDialog.prepare();

                                    getStates(getObjects);
                                }, 0);
                            });
                        });
                    });
                });
            }
            if (main.waitForRestart) {
                location.reload();
            }
        });
        main.socket.on('disconnect', function () {
            $('#connecting').show();
        });
        main.socket.on('reconnect', function () {
            $('#connecting').hide();
            if (main.waitForRestart) {
                location.reload();
            }
        });
        main.socket.on('repoUpdated', function () {
            setTimeout(function () {
                menus.adapters.init(true);
            }, 0);
        });
        main.socket.on('reauthenticate', function () {
            location.reload();
        });

        // open links        
        $('#link-logs').on("click", function () {
            $('#menu-logs').click();
            $('.side-menu').find('a[href="#logs"]').parent().addClass('active');
        });
        $('#link-users').on("click", function () {
            main.usersDialog.init();
        });
        $('#link-groups').on("click", function () {
            main.groupsDialog.init();
        });
        // / open links

        $('#button-edit-menus').on("click", function () {
            if (main.editTabs) {
                $('.menu-close').hide();
                $('#menus-show-button').hide();
                main.editTabs = false;
                $(this).removeClass('ui-state-error');
            } else {
                $('.menu-close').show();
                $('#menus-show-button').show();
                $(this).addClass('ui-state-error');
                main.editTabs = true;
            }
        });

        $(document.body).on("click", ".main-menu", function () {
            var id = $(this).attr('id').slice(9);
            main.selectMenu(id);
        });

        $(document.body).on('click', '.show-md', function () {
            var url = $(this).data('md-url');
            $.get(url, function (data) {
                var link = url.match(/([^/]*\/){6}/);
                var html = new showdown.Converter().makeHtml(data).replace(/src="(?!http)/g, 'class="img-responsive" src="' + link[0]);
                bootbox.alert({
                    size: 'large',
                    backdrop: true,
                    message: html
                }).off("shown.bs.modal");
            });
        });

        $(document.body).on('hidden.bs.modal', '#modal-command', function () {
            $('#adapter-meter').progressbar(1);
        });

        // Fullscreen
        var fullscreenElement;
        $('#button-fullscreen ,#button-content-fullscreen').on("click", function () {
            if ($(this).attr('id') === 'button-fullscreen') {
                fullscreenElement = document;
            } else {
                fullscreenElement = document.getElementById('pageContent');
            }

            if (!fullscreenElement.fullscreenElement && // alternative standard method
                    !fullscreenElement.mozFullScreenElement && !fullscreenElement.webkitFullscreenElement && !fullscreenElement.msFullscreenElement) {  // current working methods
                if (fullscreenElement === document) {
                    fullscreenElement = document.documentElement;
                } else {
                    $(fullscreenElement).switchClass('right_col', 'no_right_col');
                }

                if (fullscreenElement.requestFullscreen) {
                    fullscreenElement.requestFullscreen();
                } else if (fullscreenElement.msRequestFullscreen) {
                    fullscreenElement.msRequestFullscreen();
                } else if (fullscreenElement.mozRequestFullScreen) {
                    fullscreenElement.mozRequestFullScreen();
                } else if (fullscreenElement.webkitRequestFullscreen) {
                    fullscreenElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }

                if (fullscreenElement !== document.documentElement) {
                    setTimeout(function () {
                        document.addEventListener("fullscreenchange", handleFullscreenContent, false);
                        document.addEventListener("mozfullscreenchange", handleFullscreenContent, false);
                        document.addEventListener("webkitfullscreenchange", handleFullscreenContent, false);
                        document.addEventListener("MSFullscreenChange", handleFullscreenContent, false);
                    }, 100);
                }

            } else {
                if (fullscreenElement.exitFullscreen) {
                    fullscreenElement.exitFullscreen();
                } else if (fullscreenElement.msExitFullscreen) {
                    fullscreenElement.msExitFullscreen();
                } else if (fullscreenElement.mozCancelFullScreen) {
                    fullscreenElement.mozCancelFullScreen();
                } else if (fullscreenElement.webkitExitFullscreen) {
                    fullscreenElement.webkitExitFullscreen();
                }
            }
        });

        function handleFullscreenContent() {
            if (!fullscreenElement.fullscreen) {
                fullscreenPageContentExit();
            } else if (!fullscreenElement.mozFullScreen) {
                fullscreenPageContentExit();
            } else if (!fullscreenElement.webkitIsFullScreen) {
                fullscreenPageContentExit();
            } else if (fullscreenElement.msFullscreenElement === null) {
                fullscreenPageContentExit();
            }
        }

        function fullscreenPageContentExit() {
            $('#pageContent').switchClass('no_right_col', 'right_col');
            document.removeEventListener("fullscreenchange", handleFullscreenContent);
            document.removeEventListener("mozfullscreenchange", handleFullscreenContent);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenContent);
            document.removeEventListener("MSFullscreenChange", handleFullscreenContent);
        }

        // / Fullscreen

        function navigation() {
            var id;
            if (window.location.hash) {
                id = window.location.hash.slice(1);
            } else {
                id = "home";
            }
            main.selectMenu(id, menus);
        }

        function resizeIFrame() {
            if (main.iframemenu) {
                var bodyHeight = $BODY.outerHeight(),
                        footerHeight = $BODY.hasClass('footer_fixed') ? -10 : $FOOTER.height(),
                        leftColHeight = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(),
                        contentHeight = bodyHeight < leftColHeight ? leftColHeight : bodyHeight;
                contentHeight -= ($NAV_MENU.height() + footerHeight + 70);
                $('#pageContent').children('div:first').height(contentHeight).children('iframe:first').height(contentHeight);

            }
        }

        $(window).smartresize(resizeIFrame);
    });
})(jQuery);

function assign(obj, prop, value) {
    if (typeof prop === "string") {
        prop = prop.split(".");
    }

    if (prop.length > 1) {
        var e = prop.shift();
        assign(obj[e] =
                Object.prototype.toString.call(obj[e]) === "[object Object]"
                ? obj[e]
                : {},
                prop,
                value);
    } else {
        obj[prop[0]] = value;
    }
}

function convertToEnumTree(obj, key) {
    var converted = [];
    var elem = key === null ? obj : obj[key];
    for (var k in elem) {

        if (k !== '_id' && k !== 'acl' && k !== 'common' && k !== 'type') {
            var treeElement = {};
            var common;
            var thisElement = elem[k];
            if (Object.prototype.toString.call(thisElement) === '[object Object]') {
                common = thisElement['common'];
            }

            treeElement['title'] = common ? common['name'] : k;
            treeElement['desc'] = common ? common['desc'] : '';
            treeElement['object-non-deletable'] = common ? (common['object-non-deletable'] === undefined ? false : common['object-non-deletable']) : false;
            treeElement['key'] = k;
            treeElement['folder'] = true;

            if (common && common.members) {
                if (common.members.length > 0) {
                    treeElement['members'] = common.members.length;
                }
                treeElement['children'] = convertToEnumTree(elem, k);
            }

            converted.push(treeElement);
        }
    }
    return converted;
}

function convertToObjectTree(obj, key) {
    var converted = [];
    var elem = key === undefined ? obj : obj[key];
    for (var k in elem) {
        if (k.match(/^system\.|^iobroker\.|^_|^[\w-]+$|^enum\.|^[\w-]+\.admin|^script\./)) {
            var treeElement = {};
            treeElement['title'] = k;
            treeElement['key'] = k;
            if (Object.prototype.toString.call(elem[k]) === '[object Object]') {
                treeElement['folder'] = true;
                treeElement['children'] = convertToObjectTree(elem, k);
            } else {
                treeElement['folder'] = false;
            }
            converted.push(treeElement);
        }
    }
    return converted;
}