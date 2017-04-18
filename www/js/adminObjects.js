function Objects(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-gears';

    var $objectsTemplate, $objectsContainer, $objectsTable;

    this.main = main;
    this.customEnabled = null;
    this.currentCustoms = null; // Id of the currently shown customs dialog
    this.treeOptions = {
        extensions: ["edit", "glyph", "table"],
        glyph: that.main.glyph_opts,
        table: {
            indentation: 20 // indent 20px per node level
        },
        renderColumns: that.renderColumns
    };

    this.prepare = function () {
        $('#menu-objects-div').load("templates/objects.html", function () {

            $('#modal-object').prependTo('#dialog-object');

            $objectsTemplate = $('#objectsTemplate');
            $objectsContainer = $('#objects-container');
            $objectsTable = $('#objectstreetable');

        });
    };

    function loadObjectFields(htmlId, object, part, objectType) {
        var text = '';
        for (var attr in object) {
            text += '<tr><td>' + attr + '</td><td>';
            if (objectType === 'state' && part === 'common' && attr === 'type') {
                text += '<select class="object-tab-edit-string" data-attr="' + attr + '">' +
                        '<option value="boolean" ' + (object[attr] === 'boolean' ? 'selected' : '') + '>' + $.i18n('boolean') + '</option>' +
                        '<option value="string"  ' + (object[attr] === 'string' ? 'selected' : '') + '>' + $.i18n('string') + '</option>' +
                        '<option value="number"  ' + (object[attr] === 'number' ? 'selected' : '') + '>' + $.i18n('number') + '</option>' +
                        '<option value="array"   ' + (object[attr] === 'array' ? 'selected' : '') + '>' + $.i18n('array') + '</option>' +
                        '<option value="object"  ' + (object[attr] === 'object' ? 'selected' : '') + '>' + $.i18n('object') + '</option>' +
                        '<option value="mixed"   ' + (object[attr] === 'mixed' ? 'selected' : '') + '>' + $.i18n('mixed') + '</option>' +
                        '</select>';
            } else if (typeof object[attr] === 'string') {
                text += '<input type="text" class="object-tab-edit-string" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] === 'number') {
                text += '<input type="text" class="object-tab-edit-number" style="width: 100%" data-attr="' + attr + '" value="' + object[attr] + '" />';
            } else if (typeof object[attr] === 'boolean') {
                text += '<input type="checkbox" class="object-tab-edit-boolean" data-attr="' + attr + '" ' + (object[attr] ? 'checked' : '') + ' />';
            } else {
                text += '<textarea class="object-tab-edit-object"  style="width: 100%" rows="3" data-attr="' + attr + '">' + JSON.stringify(object[attr], null, 2) + '</textarea>';
            }
            text += '</td><td><button class="object-tab-field-delete" data-attr="' + attr + '" data-part="' + part + '"></button></td></tr>';
        }

        $('#' + htmlId).html(text);
    }

    function saveObjectFields(htmlId, object) {
        var $htmlId = $('#' + htmlId);
        $htmlId.find('.object-tab-edit-string').each(function () {
            object[$(this).data('attr')] = $(this).val();
        });
        $htmlId.find('.object-tab-edit-number').each(function () {
            object[$(this).data('attr')] = parseFloat($(this).val());
        });
        $htmlId.find('.object-tab-edit-boolean').each(function () {
            object[$(this).data('attr')] = $(this).prop('checked');
        });
        var err = null;
        $htmlId.find('.object-tab-edit-object').each(function () {
            try {
                object[$(this).data('attr')] = JSON.parse($(this).val());
            } catch (e) {
                err = $(this).data('attr');
                return false;
            }
        });

        if (object.write !== undefined) {
            if (object.write === 'false' || object.write === '0' || object.write === 0)
                object.write = false;
            if (object.write === 'true' || object.write === '1' || object.write === 1)
                object.write = true;
        }

        if (object.read !== undefined) {
            if (object.read === 'false' || object.read === '0' || object.read === 0)
                object.read = false;
            if (object.read === 'true' || object.read === '1' || object.read === 1)
                object.read = true;
        }

        if (object.min !== undefined) {
            var f = parseFloat(object.min);
            if (f.toString() === object.min.toString())
                object.min = f;

            if (object.min === 'false')
                object.min = false;
            if (object.min === 'true')
                object.min = true;
        }
        if (object.max !== undefined) {
            var m = parseFloat(object.max);
            if (m.toString() === object.max.toString())
                object.max = m;

            if (object.max === 'false')
                object.max = false;
            if (object.max === 'true')
                object.max = true;
        }
        if (object.def !== undefined) {
            var d = parseFloat(object.def);
            if (d.toString() === object.def.toString())
                object.def = d;

            if (object.def === 'false')
                object.def = false;
            if (object.def === 'true')
                object.def = true;
        }

        return err;
    }

    this.stateChange = function (id, state) {
    };

    this.objectChange = function (id, obj) {
    };

    this.reinit = function () {
    };

    function _syncEnum(id, enumIds, newArray, cb) {
        if (!enumIds || !enumIds.length) {
            cb && cb();
            return;
        }

        var enumId = enumIds.pop();
        if (that.main.objects[enumId] && that.main.objects[enumId].common) {
            var count = 0;
            if (that.main.objects[enumId].common.members && that.main.objects[enumId].common.members.length) {
                var pos = that.main.objects[enumId].common.members.indexOf(id);
                if (pos !== -1 && newArray.indexOf(enumId) === -1) {
                    // delete from members
                    that.main.objects[enumId].common.members.splice(pos, 1);
                    count++;
                    main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
                        if (err) {
                            that.main.showError(err);
                        }
                        if (!--count) {
                            setTimeout(function () {
                                _syncEnum(id, enumIds, newArray, cb);
                            }, 0);
                        }
                    });
                }
            }

            // add to it
            if (newArray.indexOf(enumId) !== -1 && (!that.main.objects[enumId].common.members || that.main.objects[enumId].common.members.indexOf(id) === -1)) {
                // add to object
                that.main.objects[enumId].common.members = that.main.objects[enumId].common.members || [];
                that.main.objects[enumId].common.members.push(id);
                count++;
                main.socket.emit('setObject', enumId, that.main.objects[enumId], function (err) {
                    if (err) {
                        that.main.showError(err);
                    }
                    if (!--count) {
                        setTimeout(function () {
                            _syncEnum(id, enumIds, newArray, cb);
                        }, 0);
                    }
                });
            }
        }

        if (!count) {
            setTimeout(function () {
                _syncEnum(id, enumIds, newArray, cb);
            }, 0);
        }
    }

    function syncEnum(id, enumName, newArray) {
    }

    this.init = function (update) {
        if (!main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        $objectsContainer.html('');

        if (this.customEnabled === null) {
            this.checkCustoms();
        }

        this.assignObjectsMembers();

        $objectsTable.fancytable(treeOptions);
        $objectsTable.reload(that.objs);

        this.main.fillContent('#menu-objects-div');
    };

    this.renderColumns = function (event, data) {
        var node = data.node;
        var $tdList = $(node.tr).find(">td");
        $tdList.eq(1).text(node.getIndexHier()).addClass("alignRight");
        $tdList.eq(3).text(node.key);
        $tdList.eq(4).html("<input type='checkbox' name='like' value='" + node.key + "'>");
    };

    this.assignObjectsMembers = function () {
        that.objs = {};
        that.enums = {};
        for (var key in main.objects) {
            assign(key.startsWith('enum.') ? that.enums : that.objs, key, main.objects[key]);
        }
    };

    this.edit = function (id, callback) {
    };

    this.load = function (obj) {
        if (!obj) {
            return;
        }
        obj.common = obj.common || {};
        obj.native = obj.native || {};
        obj.acl = obj.acl || {};
        $('#edit-object-id').val(obj._id);
        $('#edit-object-name').val(obj.common ? obj.common.name : obj._id);
        $('#edit-object-type').val(obj.type);
        $('#object-tab-acl-owner').val(obj.acl.owner || 'system.user.admin');
        $('#object-tab-acl-group').val(obj.acl.ownerGroup || 'system.group.administrator');

        loadObjectFields('object-tab-common-table', obj.common || {}, 'common', obj.type);
        loadObjectFields('object-tab-native-table', obj.native || {}, 'native', obj.type);

        $('.object-tab-field-delete').click(function () {
            var part = $(this).data('part');
            var field = $(this).data('attr');
            that.main.confirmMessage($.i18n('Are you sure?'), $.i18n('Delete attribute'), 'alert', function (result) {
                if (result) {
                    var _obj = that.saveFromTabs();
                    delete _obj[part][field];
                    that.load(_obj);
                }
            });
        });

        obj.acl = obj.acl || {};
        if (obj.acl.object === undefined) {
            obj.acl.object = 0x666;
        }

        $('#object-tab-acl-obj-owner-read').prop('checked', obj.acl.object & 0x400);
        $('#object-tab-acl-obj-owner-write').prop('checked', obj.acl.object & 0x200);
        $('#object-tab-acl-obj-group-read').prop('checked', obj.acl.object & 0x40);
        $('#object-tab-acl-obj-group-write').prop('checked', obj.acl.object & 0x20);
        $('#object-tab-acl-obj-every-read').prop('checked', obj.acl.object & 0x4);
        $('#object-tab-acl-obj-every-write').prop('checked', obj.acl.object & 0x2);

        if (obj.type !== 'state') {
            $('#object-tab-acl-state').hide();
        } else {
            $('#object-tab-acl-state').show();
            if (obj.acl.state === undefined) {
                obj.acl.state = 0x666;
            }

            $('#object-tab-acl-state-owner-read').prop('checked', obj.acl.state & 0x400);
            $('#object-tab-acl-state-owner-write').prop('checked', obj.acl.state & 0x200);
            $('#object-tab-acl-state-group-read').prop('checked', obj.acl.state & 0x40);
            $('#object-tab-acl-state-group-write').prop('checked', obj.acl.state & 0x20);
            $('#object-tab-acl-state-every-read').prop('checked', obj.acl.state & 0x4);
            $('#object-tab-acl-state-every-write').prop('checked', obj.acl.state & 0x2);
        }

        var _obj = JSON.parse(JSON.stringify(obj));
        that.editor.setValue(JSON.stringify(_obj, null, 2));
        if (_obj._id) {
            delete _obj._id;
        }
        if (_obj.common) {
            delete _obj.common;
        }
        if (_obj.type) {
            delete _obj.type;
        }
        if (_obj.native) {
            delete _obj.native;
        }
        if (_obj.acl) {
            delete _obj.acl;
        }
        $('#view-object-rest').val(JSON.stringify(_obj, null, '  '));
    };

    this.saveFromTabs = function () {
        var obj;
        try {
            obj = $('#view-object-rest').val();
            if (!obj) {
                obj = {};
            } else {
                obj = JSON.parse(obj);
            }
        } catch (e) {
            that.main.showMessage($.i18n('Cannot parse.'), 'Error in ' + e, 'alert');
            return false;
        }

        obj.common = {};
        obj.native = {};
        obj.acl = {};
        obj._id = $('#edit-object-id').val();
        obj.common.name = $('#edit-object-name').val();
        obj.type = $('#edit-object-type').val();
        var err = saveObjectFields('object-tab-common-table', obj.common);
        if (err) {
            that.main.showMessage($.i18n('Cannot parse.'), 'Error in ' + err, 'alert');
            return false;
        }
        err = saveObjectFields('object-tab-native-table', obj.native);
        if (err) {
            that.main.showMessage($.i18n('Cannot parse.'), 'Error in ' + err, 'alert');
            return false;
        }
        obj.acl.object = 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-read').prop('checked') ? 0x400 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-owner-write').prop('checked') ? 0x200 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-read').prop('checked') ? 0x40 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-group-write').prop('checked') ? 0x20 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-read').prop('checked') ? 0x4 : 0;
        obj.acl.object |= $('#object-tab-acl-obj-every-write').prop('checked') ? 0x2 : 0;

        obj.acl.owner = $('#object-tab-acl-owner').val();
        obj.acl.ownerGroup = $('#object-tab-acl-group').val();

        if (obj.type === 'state') {
            obj.acl.state = 0;
            obj.acl.state |= $('#object-tab-acl-state-owner-read').prop('checked') ? 0x400 : 0;
            obj.acl.state |= $('#object-tab-acl-state-owner-write').prop('checked') ? 0x200 : 0;
            obj.acl.state |= $('#object-tab-acl-state-group-read').prop('checked') ? 0x40 : 0;
            obj.acl.state |= $('#object-tab-acl-state-group-write').prop('checked') ? 0x20 : 0;
            obj.acl.state |= $('#object-tab-acl-state-every-read').prop('checked') ? 0x4 : 0;
            obj.acl.state |= $('#object-tab-acl-state-every-write').prop('checked') ? 0x2 : 0;
        }

        return obj;
    };

    this.saveFromRaw = function () {
        var obj;
        try {
            obj = JSON.parse(that.editor.getValue());
        } catch (e) {
            that.main.showMessage(e, $.i18n('Parse error'), 'alert');
            return false;
        }
        return obj;
    };

    this.save = function () {
    };

// ----------------------------- CUSTOMS ------------------------------------------------
    this.checkCustoms = function () {
        for (var u = 0; u < this.main.instances.length; u++) {
            if (this.main.objects[this.main.instances[u]].common &&
                    (this.main.objects[this.main.instances[u]].common.type === 'storage' || this.main.objects[this.main.instances[u]].common.supportCustoms) &&
                    this.main.objects[this.main.instances[u]].common.enabled) {
                if (this.customEnabled !== null && this.customEnabled !== true) {
                    this.customEnabled = true;
                    // update customs buttons
                    this.init(true);
                } else {
                    this.customEnabled = true;
                }
                return;
            }
        }
        if (this.customEnabled !== null && this.customEnabled !== false) {
            this.customEnabled = false;
            // update custom button
            this.init(true);
        } else {
            this.customEnabled = false;
        }
    };

    this.stateChangeHistory = function (id, state) {
        if (this.currentCustoms === id) {
            // Load data again from adapter
            if (this.historyTimeout) {
                return;
            }

            this.historyTimeout = setTimeout(function () {
                that.historyTimeout = null;
                that.loadHistoryTable($('#history-table-instance').data('id'), true);
            }, 5000);
        }
    };

    this.initCustomsTabs = function (ids, instances) {
        var $customTabs = $('#customs-tabs');
        $customTabs.html('');
        var wordDifferent = $.i18n('__different__');
        this.defaults = {};

        var collapsed = this.main.config['object-customs-collapsed'];
        collapsed = collapsed ? collapsed.split(',') : [];

        // add all tabs to div
        for (var j = 0; j < instances.length; j++) {
            // try to find settings
            var parts = instances[j].split('.');
            var adapter = parts[2];
            var instance = parts[3];
            var data = adapter + '.' + instance;
            var hidden = (collapsed.indexOf(data) !== -1);
            var img = this.main.objects['system.adapter.' + adapter].common.icon;
            img = '/adapter/' + adapter + '/' + img;
            var tab = '<div class="customs-row-title ui-widget-header ' +
                    (hidden ? 'customs-row-title-collapsed' : 'customs-row-title-expanded') +
                    '" data-adapter="' + data + '"><img class="customs-row-title-icon" width="20" src="' + img + '" /><span class="customs-row-title-settings">' + _('Settings for %s', '') + '</span>' + data +
                    '</div>' +
                    '<div class="customs-settings" style="' + (hidden ? 'display: none' : '') + '">' +
                    $('script[data-template-name="' + adapter + '"]').html() +
                    '</div>';

            var $tab = $(tab);
            this.defaults[adapter] = {};
            // set values
            $tab.find('input, select').each(function () {
                var $this = $(this);
                $this.attr('data-instance', adapter + '.' + instance);
                var field = $this.attr('data-field');
                var def = $this.attr('data-default');
                if (def === 'true')
                    def = true;
                if (def === 'false')
                    def = false;
                if (def == parseFloat(def).toString())
                    def = parseFloat(def);

                that.defaults[adapter][field] = def;
                if (field === 'enabled') {
                    $this.click(function (event) {
                        event.stopPropagation();
                        if ($(this).prop('checked')) {

                        } else {

                        }
                    });
                }
            });
            $customTabs.append($tab);
        }

        var commons = {};
        // calculate common settings
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i].replace('system.adapter.', '');
            commons[inst] = {};
            for (var id = 0; id < ids.length; id++) {
                var custom = main.objects[ids[id]].common.custom;
                // convert old structure
                // TODO: remove some day (08.2016)
                if (custom && custom.enabled !== undefined) {
                    custom = main.objects[ids[id]].common.custom = custom.enabled ? {'history.0': custom} : {};
                }
                var sett = custom ? custom[inst] : null;

                if (sett) {
                    for (var _attr in sett) {
                        if (commons[inst][_attr] === undefined) {
                            commons[inst][_attr] = sett[_attr];
                        } else if (commons[inst][_attr] != sett[_attr]) {
                            commons[inst][_attr] = '__different__';
                        }
                    }
                } else {
                    var a = inst.split('.')[0];
                    var _default = null;
                    // Try to get default values
                    if (defaults[a]) {
                        _default = defaults[a](that.main.objects[ids[id]], that.main.objects['system.adapter.' + inst]);
                    } else {
                        _default = this.defaults[a];
                    }

                    for (var attr in _default) {
                        if (commons[inst][attr] === undefined) {
                            commons[inst][attr] = _default[attr];
                        } else if (commons[inst][attr] != _default[attr]) {
                            commons[inst][attr] = '__different__';
                        }
                    }
                }
            }
        }

        // set values
        $customTabs.find('input, select').each(function () {
            var $this = $(this);
            var instance = $this.attr('data-instance');
            var adapter = instance.split('.')[0];
            var attr = $this.attr('data-field');

            if (commons[instance][attr] !== undefined) {
                if ($this.attr('type') === 'checkbox') {
                    if (commons[instance][attr] === '__different__') {
                        /*$('<select data-field="' + attr + '" data-instance="' + instance + '">\n' +
                         '   <option value="' + wordDifferent + '" selected>' + wordDifferent + '</option>\n' +
                         '   <option value="false">' + _('false') + '</option>\n' +
                         '   <option value="true">'  + _('true')  + '</option>\n' +
                         '</select>').insertBefore($this);
                         $this.hide().attr('data-field', '').data('field', '');*/
                        $this[0].indeterminate = true;
                    } else {
                        $this.prop('checked', commons[instance][attr]);
                    }
                } else {
                    if (commons[instance][attr] === '__different__') {
                        if ($this.attr('type') === 'number') {
                            $this.attr('type', 'text');
                        }
                        if ($this.prop('tagName').toUpperCase() === 'SELECT') {
                            $this.prepend('<option value="' + wordDifferent + '">' + wordDifferent + '</option>');
                            $this.val(wordDifferent);
                        } else {
                            $this.val('').attr('placeholder', wordDifferent);
                        }
                    } else {
                        $this.val(commons[instance][attr]);
                    }
                }
            } else {
                var def;
                if (that.defaults[adapter] && that.defaults[adapter][attr] !== undefined) {
                    def = that.defaults[adapter][attr];
                }
                if (def !== undefined) {
                    if ($this.attr('type') === 'checkbox') {
                        $this.prop('checked', def);
                    } else {
                        $this.val(def);
                    }
                }
            }

            if ($this.attr('type') === 'checkbox') {
                $this.change(function () {
                    $('#customs-button-save').button('enable');
                });
            } else {
                $this.change(function () {
                    $('#customs-button-save').button('enable');
                }).keyup(function () {
                    $(this).trigger('change');
                });
            }
        });

        $('.customs-row-title').click(function () {
            var $form = $(this).next();
            var _collapsed = that.main.config['object-customs-collapsed'];
            _collapsed = _collapsed ? _collapsed.split(',') : [];

            var id = $(this).data('adapter');
            var pos = _collapsed.indexOf(id);
            if ($form.is(':visible')) {
                if (pos === -1)
                    _collapsed.push(id);
                $form.hide();
                $(this).removeClass('customs-row-title-expanded').addClass('customs-row-title-collapsed');
            } else {
                if (pos !== -1)
                    _collapsed.splice(pos, 1);
                $form.show();
                $(this).removeClass('customs-row-title-collapsed').addClass('customs-row-title-expanded');
            }
            that.main.saveConfig('object-customs-collapsed', _collapsed.join(','));
            that.resizeHistory();
        });
        this.showCustomsData(ids.length > 1 ? null : ids[0]);
        $('#customs-button-save').button('disable');
    };

    this.loadHistoryTable = function (id, isSilent) {
        var end = (new Date()).getTime() + 10000; // now
        if (!isSilent) {
            $('#grid-history-body').html('<tr><td colspan="5" style="text-align: center">' + $.i18n('Loading...') + '</td></tr>');
        }

        main.socket.emit('getHistory', id, {
            end: end,
            count: 50,
            aggregate: 'none',
            instance: $('#history-table-instance').val(),
            from: true,
            ack: true,
            q: true
        }, function (err, res) {
            setTimeout(function () {
                if (!err) {
                    var text = '';
                    if (res && res.length) {
                        for (var i = res.length - 1; i >= 0; i--) {
                            text += '<tr class="grid-history-' + ((i % 2) ? 'odd' : 'even') + '">' +
                                    '<td>' + res[i].val + '</td>' +
                                    '<td>' + res[i].ack + '</td>' +
                                    '<td>' + (res[i].from || '').replace('system.adapter.', '').replace('system.', '') + '</td>' +
                                    '<td>' + main.formatDate(res[i].ts) + '</td>' +
                                    '<td>' + main.formatDate(res[i].lc) + '</td>' +
                                    '</tr>\n'
                        }
                    } else {
                        text = '<tr><td colspan="5" style="text-align: center">' + $.i18n('No data') + '</td></tr>'
                    }
                    $('#grid-history-body').html(text)
                            .data('odd', true);
                } else {
                    console.error(err);
                    $('#grid-history-body').html('<tr><td colspan="5" style="text-align: center" class="error">' + err + '</td></tr>');
                }
            }, 0);
        });
    };

    this.loadHistoryChart = function (id) {
        if (id) {
            var port = 0;
            var chart = false;
            for (var i = 0; i < this.main.instances.length; i++) {
                if (this.main.objects[main.instances[i]].common.name === 'flot' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'flot';
                } else if (!chart && this.main.objects[main.instances[i]].common.name === 'rickshaw' && this.main.objects[this.main.instances[i]].common.enabled) {
                    chart = 'rickshaw';
                } else if (this.main.objects[this.main.instances[i]].common.name === 'web' && this.main.objects[this.main.instances[i]].common.enabled) {
                    port = this.main.objects[this.main.instances[i]].native.port;
                }

                if (chart === 'flot' && port) {
                    break;
                }
            }
            var $chart = $('#iframe-history-chart');

            $chart.attr('src', 'http://' + location.hostname + ':' + port + '/' + chart + '/index.html?range=1440&zoom=true&axeX=lines&axeY=inside&_ids=' + encodeURI(id) + '&width=' + ($chart.width() - 50) + '&hoverDetail=true&height=' + ($chart.height() - 50) + '&aggregate=onchange&chartType=step&live=30&instance=' + $('#history-chart-instance').val());
        } else {
            $('#iframe-history-chart').attr('src', '');
        }
    };

    this.showCustomsData = function (id) {
    };

    function getCustomTemplate(adapter, callback) {
    }

    this.openCustomsDlg = function (ids) {
    };

// Set modified custom states
    this.setCustoms = function (ids, callback) {
    };

    this.resizeHistory = function () {
    };

    this.prepareCustoms = function () {
        $('#dialog-customs').load("templates/dialogs.html #tabs-customs", function () {
            restartFunctions('#dialog-customs');
        });
    };

    function handleFileSelect(evt) {
    }
}