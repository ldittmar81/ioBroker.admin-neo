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

/**
 * @constructor
 * @param {Object} main
 * @returns {Instances}  
 */
function Instances(main) {
    'use strict';

    var that = this;

    var $instancesTableTemplate, $instancesTileTemplate, $instanceContainer, $instancesTable;

    this.main = main;
    this.menuIcon = 'fa-object-group';
    this.list = [];
    this.hostsText = null;

    /**
     * 
     * @param {String} _var
     * @param {Object} obj
     * @param {String} attr
     * @param {String} link
     * @param {String} instance
     * @returns {String} link
     */
    function getLinkVar(_var, obj, attr, link, instance) {
        if (attr === 'protocol') {
            attr = 'secure';
        }

        if (_var === 'ip') {
            link = link.replace('%' + _var + '%', location.hostname);
        } else if (_var === 'instance') {
            link = link.replace('%' + _var + '%', instance);
        } else {
            if (obj) {
                if (attr.match(/^native_/)) {
                    attr = attr.substring(7);
                }

                var val = obj.native[attr];
                if (_var === 'bind' && (!val || val === '0.0.0.0')) {
                    val = location.hostname;
                }

                if (attr === 'secure') {
                    link = link.replace('%' + _var + '%', val ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', val);
                    } else {
                        link = link.replace('%' + _var + '%', val);
                    }
                }
            } else {
                if (attr === 'secure') {
                    link = link.replace('%' + _var + '%', 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', '');
                    } else {
                        link = link.replace('%' + _var + '%', '');
                    }
                }
            }
        }
        return link;
    }

    /**
     * 
     * @param {String} link
     * @param {String} adapter
     * @param {String} instance
     * @returns {Array|String|@var;firtsLink}
     */
    this.resolveLink = function (link, adapter, instance) {
        var vars = link.match(/%(\w+)%/g);
        var _var, v, parts, result;

        if (vars) {
            // first replace simple patterns
            for (v = vars.length - 1; v >= 0; v--) {
                _var = vars[v];
                _var = _var.replace(/%/g, '');

                parts = _var.split('_');
                // like "port"
                if (_var.match(/^native_/)) {
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + adapter + '.' + instance], _var, link, instance);
                    vars.splice(v, 1);
                } else if (parts.length === 1) {
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + adapter + '.' + instance], parts[0], link, instance);
                    vars.splice(v, 1);
                } else if (parts[0].match(/\.[0-9]+$/)) {
                    // like "web.0_port"
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + parts[0]], parts[1], link, instance);
                    vars.splice(v, 1);
                }
            }
            var links = {};
            var instances;
            var adptr = parts[0];
            // process web_port
            for (v = 0; v < vars.length; v++) {
                _var = vars[v];
                _var = _var.replace(/%/g, '');
                if (_var.match(/^native_/)) {
                    _var = _var.substring(7);
                }

                parts = _var.split('_');
                if (!instances) {
                    instances = [];
                    for (var inst = 0; inst < 10; inst++) {
                        if (that.main.objects['system.adapter.' + adptr + '.' + inst]) {
                            instances.push(inst);
                        }
                    }
                }

                for (var i = 0; i < instances.length; i++) {
                    links[adptr + '.' + i] = {
                        instance: adptr + '.' + i,
                        link: getLinkVar(_var, that.main.objects['system.adapter.' + adptr + '.' + i], parts[1], links[adptr + '.' + i] ? links[adptr + '.' + i].link : link, i)
                    };
                }
            }

            if (instances) {
                result = [];
                var count = 0;
                var firtsLink = '';
                for (var d in links) {
                    result[links[d].instance] = links[d].link;
                    if (!firtsLink) {
                        firtsLink = links[d].link;
                    }
                    count++;
                }
                if (count < 2) {
                    link = firtsLink;
                    result = null;
                }
            }
        }

        return result || link;
    };

    this.replaceInLink = function (link, adapter, instance) {
        if (typeof link === 'object') {
            var links = JSON.parse(JSON.stringify(link));
            var first;
            for (var v in links) {
                links[v] = that.resolveLink(links[v], adapter, instance);
                if (!first) {
                    first = links[v];
                }
            }
            links.__first = first;
            return links;
        } else {
            return that.resolveLink(link, adapter, instance);
        }
    };

    /**
     * 
     * @param {String} instanceId
     * @param {JQuery} $tile
     */
    function updateLed(instanceId, $tile) {
        var tmp = instanceId.split('.');
        var adapter = tmp[2];
        var instance = tmp[3];

        var $led_left = $tile.find('.instance-led-l');
        var $led_right = $tile.find('.instance-led-r');

        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var state_left = '';
        var title_left = '';
        var state_right = '';
        var title_right = '';
        var val = '';

        if (common.enabled && (!common.webExtension || !that.main.objects[instanceId].native.webInstance)) {
            state_left = (common.mode === 'daemon') ? 'green' : 'blue';
            state_right = (common.mode === 'daemon') ? 'green' : 'blue';

            title_left += '<p>';
            title_left += '<span>' + $.i18n('connectedtohost') + ': </span>';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title_left += ((common.mode === 'daemon') ? '<span style="color: #ff9999">' + $.i18n('false') + '</span>' : $.i18n('false'));
                state_left = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title_left += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
            }
            title_left += '</p>';

            title_right += '<p>';
            title_right += '<p><span>' + $.i18n('heartbeat') + ': </span>';
            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title_right += ((common.mode === 'daemon') ? '<span style="color: #ff9999">' + $.i18n('false') + '</span>' : $.i18n('false'));
                state_right = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title_right += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
            }
            title_right += '</p>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title_left += '<p>';
                title_left += '<span>' + $.i18n('connectedtoadapter', adapter) + ': </span>';
                val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    state_left = state_left === 'red' ? 'red' : 'orange';
                    title_left += '<span style="color: #ff9999">' + $.i18n('false') + '</span>';
                } else {
                    if (val === true) {
                        title_left += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
                    } else {
                        title_left += '<span style="color: #80ff00">' + val + '</span>';
                    }
                }
                title_left += '</p>';
            }
        } else {
            state_left = (common.mode === 'daemon') ? 'grey' : 'blue';
            state_right = (common.mode === 'daemon') ? 'grey' : 'blue';

            title_left += '<p>';
            title_left += '<span>' + $.i18n('connectedtohost') + ': </span>';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title_left += $.i18n('false');
            } else {
                title_left += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
            }
            title_left += '</p>';

            title_right += '<p>';
            title_right += '<p><span>' + $.i18n('heartbeat') + ': </span>';
            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title_right += $.i18n('false');
            } else {
                title_right += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
            }
            title_right += '</p>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title_left += '<p>';
                title_left += '<span>' + $.i18n('connectedtoadapter', adapter) + ': </span>';
                val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    title_left += $.i18n('false');
                } else {
                    if (val === true) {
                        title_left += '<span style="color: #80ff00">' + $.i18n('true') + '</span>';
                    } else {
                        title_left += '<span style="color: #80ff00">' + val + '</span>';
                    }
                }
                title_left += '</p>';
            }
        }

        $led_left.attr('src', 'img/leds/led_' + state_left + '.png')
                .attr('alt', state_left)
                .tooltip({placement: 'bottom', html: true, title: title_left});

        $led_right.attr('src', 'img/leds/led_' + state_right + '.png')
                .attr('alt', state_right)
                .tooltip({placement: 'bottom', html: true, title: title_right});

    }

    /**
     * 
     * @param {String} page
     * @returns {Number}
     */
    this.calculateTotalRam = function (page) {
        var host = that.main.states['system.host.' + that.main.currentHost + '.memRss'];
        var processes = 1;
        var mem = host ? host.val : 0;
        for (var i = 0; i < that.list.length; i++) {
            var obj = that.main.objects[that.list[i]];
            if (!obj || !obj.common)
                continue;
            if (obj.common.host !== that.main.currentHost)
                continue;
            if (obj.common.enabled && obj.common.mode === 'daemon') {
                var m = that.main.states[obj._id + '.memRss'];
                mem += m ? m.val : 0;
                processes++;
            }
        }
        var text = $.i18n('countProcesses', processes);
        var $running_processes = $('#' + page + 'RunningProcesses');
        if (text !== $running_processes.text()) {
            $running_processes.html('<span class="highlight">' + text + '</span>');
        }

        return Math.round(mem);
    };

    /**
     * 
     * @param {String} page
     * @returns {Number}
     */
    this.calculateFreeMem = function (page) {
        var host = that.main.states['system.host.' + that.main.currentHost + '.freemem'];
        if (host) {
            that.totalmem = that.totalmem || that.main.objects['system.host.' + that.main.currentHost].native.hardware.totalmem / (1024 * 1024);
            var percent = Math.round((host.val / that.totalmem) * 100);

            if (host.val.toString() !== $('#freeMem').text()) {
                $('#' + page + 'FreeMemPercent').text(percent + ' %');
                $("#" + page + "FreeMemSparkline").sparkline([that.totalmem - host.val, host.val], {
                    type: 'pie',
                    sliceColors: ["#F78181", "#088A29"],
                    height: "40px",
                    width: "40px"
                });
                $('#' + page + 'FreeMemSparkline > canvas').css('vertical-align', 'middle');
            }
        } else {
            $('.free-mem-label').hide();
        }

        return Math.round(host.val);
    };

    /**
     * 
     * @param {String} instanceId
     * @returns {Number|Object.states.val|Instances.calculateRam.mem|String}
     */
    function calculateRam(instanceId) {
        var mem;
        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        if (common.enabled && common.mode === 'daemon' && that.main.states[instanceId + '.memRss']) {
            mem = that.main.states[instanceId + '.memRss'].val;
            mem = parseFloat(mem) || 0;

            if (common.memoryLimitMB && common.memoryLimitMB <= mem) {
                mem = '<span class="high-mem">' + mem.toFixed(1) + ' MB</span>';
            } else {
                mem = mem.toFixed(1) + ' MB';
            }
        } else {
            mem = '';
        }
        return mem;
    }

    /**
     * 
     */
    function addGroups() {

        var $tempGroup = $('#instancesTemplateGroup').children().clone(true, true);
        $tempGroup.find('.group_title').text($.i18n('realInstances'));
        $tempGroup.find('.instancesList').attr('id', 'groupRealInstances');
        $instanceContainer.append($tempGroup);

        $tempGroup = $('#instancesTemplateGroup').children().clone(true, true);
        $tempGroup.find('.group_title').text($.i18n('webInstances'));
        $tempGroup.find('.instancesList').attr('id', 'groupWebInstances');
        $instanceContainer.append($tempGroup);

        $tempGroup = $('#instancesTemplateGroup').children().clone(true, true);
        $tempGroup.find('.group_title').text($.i18n('visAddonInstances'));
        $tempGroup.find('.instancesList').attr('id', 'groupVisAddonInstances');
        $instanceContainer.append($tempGroup);
    }

    /**
     * 
     * @param {String} instanceId
     */
    function showOneAdapter(instanceId) {

        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var tmp = instanceId.split('.');
        var adapter = tmp[2];
        var instance = tmp[3];

        if (!that.main.config.instanceFormList) {
            var $instanceTile = $instancesTileTemplate.children().clone(true, true);

            var type = "RealInstance";

            $instanceTile.attr('data-instance-id', instanceId);
            $instanceTile.attr('data-adapter', adapter);
            if (common.icon) {
                $instanceTile.find('.profile_img').attr('src', 'adapter/' + adapter + '/' + common.icon).attr('alt', adapter);
            }
            $instanceTile.find('.name').text(adapter + '.' + instance);
            $instanceTile.find('.description').text(common.title || '');

            updateLed(instanceId, $instanceTile);

            var link = common.localLinks || common.localLink || '';
            var url = link ? that.replaceInLink(link, adapter, instance) : '';
            if (link) {
                if (typeof url === 'object') {
                    link = '<a href="' + url.__first + '" target="_blank">';
                } else {
                    link = '<a href="' + url + '" target="_blank">';
                }
            }

            var isRun = common.onlyWWW || common.enabled;

            if (common.onlyWWW) {
                if (common.type === "vis" || common.type === "visualization-icons" || common.type === "visualization-widgets") {
                    type = "VisAddonInstance";
                } else {
                    type = "WebInstance";
                }
                $instanceTile.find('.instance-stop-run').remove();
                $instanceTile.find('.instance-reload').remove();
            } else {
                if (!isRun) {
                    $instanceTile.find('.instance-reload').prop('disabled', true);
                }
            }

            if (url) {
                $instanceTile.find('.instance-web')
                        .attr('data-link', typeof url !== 'object' ? url : '')
                        .prop('disabled', !isRun);
            } else {
                $instanceTile.find('.instance-web').remove();
            }

            $instanceTile.find('.instance-schedule').text(common.mode === 'schedule' ? (common.schedule || '') : '');
            $instanceTile.find('.instance-memUsage').text(calculateRam(instanceId));

            if (that.main.config.expertMode) {
                $instanceTile.find('.instance-restartSchedule').text(common.restartSchedule || '').show();
                $instanceTile.find('.instance-loglevel').text(common.loglevel || '').show();
                $instanceTile.find('.instance-memoryLimitMB').text(common.memoryLimitMB || '').show();
            } else {
                $instanceTile.find('.instance-restartSchedule').hide().prev().hide();
                $instanceTile.find('.instance-loglevel').hide().prev().hide();
                $instanceTile.find('.instance-memoryLimitMB').hide().prev().hide();
            }

            that.initButtons($instanceTile);

            $('#group' + type + 's').append($instanceTile);
        } else {
            var row = [{
                    instance: adapter + '.' + instance,
                    title: common.title || '',
                    schedule: common.mode === 'schedule' ? (common.schedule || '') : '',
                    memUsage: calculateRam(instanceId),
                    loglevel: common.loglevel || '',
                    restartSchedule: common.restartSchedule || '',
                    memoryLimitMB: common.memoryLimitMB || '',
                    icon: iconFormatter(common.icon, adapter),
                    buttons: addButtonsFormatter()
                }];
            $instancesTable.bootstrapTable('append', row);
        }

    }

    /**
     * 
     * @param {String} value
     * @param {String} adapter
     * @returns {String}
     */
    function iconFormatter(value, adapter) {
        if (value) {
            return '<img style="height: 20px;" src="adapter/' + adapter + '/' + value + '"/>';
        }
        return "";
    }

    /**
     * 
     * @returns {String}
     */
    function addButtonsFormatter() {
        var $tempButtons = $('#instanceTemplateTableButtons').children().clone(true, true);
        return $tempButtons.toString();
    }

    /**
     * 
     * @param {String} filter
     */
    function applyFilter(filter) {
        if (filter === undefined) {
            filter = $('#instances-filter').val();
        }
        var invisible = [];
        if (filter) {
            var reg = new RegExp(filter);

            for (var i = 0; i < that.list.length; i++) {
                var obj = that.main.objects[that.list[i]];
                if (!obj || !obj.common) {
                    $instanceContainer.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').hide();
                    continue;
                }
                var isShow = 'hide';
                if (obj.common.name && reg.test(obj.common.name)) {
                    isShow = 'show';
                } else if (obj.common.title && reg.test(obj.common.title)) {
                    isShow = 'show';
                } else if (filter === 'true') {
                    isShow = $instanceContainer.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'show' : 'hide';
                } else if (filter === 'false') {
                    isShow = $instanceContainer.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]').find('instance-led').hasClass('led-green') ? 'hide' : 'show';
                }
                if (isShow === 'hide') {
                    invisible.push(that.list[i]);
                }
                $instanceContainer.find('.instance-adapter[data-instance-id="' + that.list[i] + '"]')[isShow]();
            }
        } else {
            $instanceContainer.find('.instance-adapter').show();
        }
    }

    function onQuickEditField(e) {
        var $this = $(e);
        var id = $this.data('instance-id');
        var attr = $this.data('name');
        var options = $this.data('options');
        var oldVal = $this.data('value');
        var textAlign = $this.css('text-align');
        $this.css('text-align', 'left');

        $this.unbind('click').removeClass('select-id-quick-edit').css('position', 'relative');

        var css = 'cursor: pointer; position: absolute;width: 16px; height: 16px; top: 2px; border-radius: 6px; z-index: 3; background-color: lightgray';
        var type = 'text';
        var text;

        if (options) {
            var opt = options.split(';');
            text = '<select style="width: calc(100% - 50px); z-index: 2">';
            for (var i = 0; i < opt.length; i++) {
                var parts = opt[i].split(':');
                text += '<option value="' + parts[0] + '">' + (parts[1] || parts[0]) + '</option>';
            }
            text += '</select>';
        }
        text = text || '<input style="' + (type !== 'checkbox' ? 'width: 100%;' : '') + ' z-index: 2" type="' + type + '"/>';

        var timeout = null;

        $this.html(text +
                '<div class="ui-icon ui-icon-check        select-id-quick-edit-ok"     style="margin-top: 0.45em;' + css + ';right: 22px"></div>' +
                '<div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" style="margin-top: 0.45em;' + css + ';right: 2px" title="' + $.i18n('cancel') + '" ></div>');

        var $input = (options) ? $this.find('select') : $this.find('input');

        $this.find('.select-id-quick-edit-cancel').click(function (e) {
            if (timeout)
                clearTimeout(timeout);
            timeout = null;
            e.preventDefault();
            e.stopPropagation();
            if (oldVal === undefined)
                oldVal = '';
            $this.html(oldVal)
                    .click(onQuickEditField)
                    .addClass('select-id-quick-edit')
                    .css('text-align', textAlign);
        });

        $this.find('.select-id-quick-edit-ok').click(function () {
            $this.trigger('blur');
        });

        $input.val(oldVal);

        $input.blur(function () {
            timeout = setTimeout(function () {
                var val = $(this).val();

                if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
                    var obj = {common: {}};
                    obj.common[attr] = $(this).val();
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err)
                            that.main.showError(err);
                    });

                    oldVal = '<span style="color: pink">' + oldVal + '</span>';
                }
                $this.html(oldVal)
                        .click(onQuickEditField)
                        .addClass('select-id-quick-edit')
                        .css('text-align', textAlign);
            }.bind(this), 100);
        }).keyup(function (e) {
            if (e.which === 13)
                $(this).trigger('blur');
            if (e.which === 27) {
                if (oldVal === undefined) {
                    oldVal = '';
                }
                $this.html(oldVal)
                        .click(onQuickEditField)
                        .addClass('select-id-quick-edit')
                        .css('text-align', textAlign);
            }
        });

        if (typeof e === 'object') {
            e.preventDefault();
            e.stopPropagation();
        }

        setTimeout(function () {
            $input.focus().select();
        }, 100);
    }

    /**
     * 
     * @param {String} value
     * @param {Function} cb
     */
    function showCronDialog(value, cb) {
        value = (value || '').replace(/"/g, '').replace(/'/g, '');
        try {
            $('#div-cron').cron('value', value);
        } catch (e) {
            alert($.i18n('cannotParseValueAsCron'));
        }

        $('#dialog_cron_insert').hide();

        $('#dialog_cron_callback').show().click(function () {
            var val = $('#div-cron').cron('value');
            $('#modal-cron').modal('hide');
            if (cb) {
                cb(val);
            }
        });

        $('#modal-cron').modal();
    }

    /**
     * 
     */
    this.prepare = function () {
        $('#menu-instances-div').load("templates/instances.html", function () {

            $instancesTableTemplate = $('#instancesTemplateTable');
            $instancesTileTemplate = $('#instancesTemplateTile');
            $instanceContainer = $('#instances-container');

            $('#instances-filter').change(function () {
                that.main.saveConfig('instancesFilter', $(this).val());
                applyFilter($(this).val());
            }).keyup(function () {
                if (that.filterTimeout) {
                    clearTimeout(that.filterTimeout);
                }
                that.filterTimeout = setTimeout(function () {
                    $('#instances-filter').trigger('change');
                }, 300);
            });
            if (that.main.config.instancesFilter && that.main.config.instancesFilter[0] !== '{') {
                $('#instances-filter').val(that.main.config.instancesFilter);
            }

            $('#btn-instances-expert-mode').click(function () {
                that.main.config.expertMode = !that.main.config.expertMode;
                that.main.saveConfig('expertMode', that.main.config.expertMode);
                that.updateExpertMode();
            });

            $('#btn-instances-reload').click(function () {
                that.init(true);
            });

            $('#btn-instances-form').click(function () {
                that.main.config.instanceFormList = !that.main.config.instanceFormList;
                that.main.saveConfig('instanceForm', that.main.config.instanceFormList);
                that.init(true);
            });
            if (that.main.config.instanceFormList) {
                $('#btn-instances-form i').switchClass('fa-list', 'fa-window-maximize');
                $(this).changeTooltip($.i18n('tiles'));
            }

            $('.clearable').click(function () {
                $('#instances-filter').val('').trigger('change');
            });

        });
    };

    this.updateExpertMode = function () {
        that.init(true);
    };

    this.replaceLink = function (_var, adapter, instance, elem) {
        _var = _var.replace(/%/g, '');
        if (_var.match(/^native_/)) {
            _var = _var.substring(7);
        }
        // like web.0_port
        var parts;
        if (_var.indexOf('_') === -1) {
            parts = [
                adapter + '.' + instance,
                _var
            ];
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) {
                parts[0] += '.0';
            }
        }

        if (parts[1] === 'protocol') {
            parts[1] = 'secure';
        }

        if (_var === 'instance') {
            setTimeout(function () {
                var link;
                if (elem) {
                    link = $('#' + elem).data('src');
                } else {
                    link = $('#a_' + adapter + '_' + instance).attr('href');
                }

                link = link.replace('%instance%', instance);
                if (elem) {
                    $('#' + elem).data('src', link);
                } else {
                    $('#a_' + adapter + '_' + instance).attr('href', link);
                }
            }, 0);
            return;
        }

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (err) {
                console.log(err);
            }
            if (obj) {
                setTimeout(function () {
                    var link;
                    if (elem) {
                        link = $('#' + elem).data('src');
                    } else {
                        link = $('#a_' + adapter + '_' + instance).attr('href');
                    }
                    if (link) {
                        if (parts[1] === 'secure') {
                            link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                        } else {
                            if (link.indexOf('%' + _var + '%') === -1) {
                                link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                            } else {
                                link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                            }
                        }
                        if (elem) {
                            $('#' + elem).data('src', link);
                        } else {
                            $('#a_' + adapter + '_' + instance).attr('href', link);
                        }
                    }
                }, 0);
            }
        });
    };

    /**
     * 
     * @param {type} vars
     * @param {String} adapter
     * @param {String} instance
     * @param {type} elem
     */
    this.replaceLinks = function (vars, adapter, instance, elem) {
        if (typeof vars !== 'object') {
            vars = [vars];
        }
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance, elem);
        }
    };

    /**
     * 
     * @param {String} link
     * @param {String} _var
     * @param {String} adapter
     * @param {String} instance
     * @param {Function} callback
     */
    this._replaceLink = function (link, _var, adapter, instance, callback) {
        // remove %%
        _var = _var.replace(/%/g, '');

        if (_var.match(/^native_/)) {
            _var = _var.substring(7);
        }
        // like web.0_port
        var parts;
        if (_var.indexOf('_') === -1) {
            parts = [adapter + '.' + instance, _var];
        } else {
            parts = _var.split('_');
            // add .0 if not defined
            if (!parts[0].match(/\.[0-9]+$/)) {
                parts[0] += '.0';
            }
        }

        if (parts[1] === 'protocol') {
            parts[1] = 'secure';
        }

        this.main.socket.emit('getObject', 'system.adapter.' + parts[0], function (err, obj) {
            if (err) {
                console.log(err);
            }
            if (obj && link) {
                if (parts[1] === 'secure') {
                    link = link.replace('%' + _var + '%', obj.native[parts[1]] ? 'https' : 'http');
                } else {
                    if (link.indexOf('%' + _var + '%') === -1) {
                        link = link.replace('%native_' + _var + '%', obj.native[parts[1]]);
                    } else {
                        link = link.replace('%' + _var + '%', obj.native[parts[1]]);
                    }
                }
            } else {
                console.log('Cannot get link ' + parts[1]);
                link = link.replace('%' + _var + '%', '');
            }
            setTimeout(function () {
                callback(link, adapter, instance);
            }, 0);
        });
    };

    /**
     * 
     * @param {String} link
     * @param {type} adapter
     * @param {type} instance
     * @param {type} arg
     * @param {Function} callback
     */
    this._replaceLinks = function (link, adapter, instance, arg, callback) {
        if (!link) {
            return callback(link, adapter, instance, arg);
        }
        var vars = link.match(/%(\w+)%/g);
        if (!vars) {
            return callback(link, adapter, instance, arg);
        }
        if (vars[0] === '%ip%') {
            link = link.replace('%ip%', location.hostname);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        if (vars[0] === '%instance%') {
            link = link.replace('%instance%', instance);
            this._replaceLinks(link, adapter, instance, arg, callback);
            return;
        }
        this._replaceLink(link, vars[0], adapter, instance, function (link, adapter, instance) {
            this._replaceLinks(link, adapter, instance, arg, callback);
        }.bind(this));
    };

    /**
     * 
     * @param {Boolean} update
     */
    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        if (this.main.currentHost && (this.main.activemenu === 'instances' || update)) {
            $instanceContainer.html('');

            if (that.main.config.expertMode) {
                $('#btn-instances-expert-mode').removeClass('btn-default').addClass('btn-primary');
            } else {
                $('#btn-instances-expert-mode').addClass('btn-default').removeClass('btn-primary');
            }

            if (that.main.config.instanceFormList) {
                $('#btn-instances-form i').removeClass('fa-list').addClass('fa-window-maximize');
                $('#btn-instances-form').changeTooltip($.i18n('tiles'));
                createTable();
            } else {
                $('#btn-instances-form i').addClass('fa-list').removeClass('fa-window-maximize');
                $('#btn-instances-form').changeTooltip($.i18n('list'));
            }

            if (this.main.currentHost) {
                this.list.sort();
                var onlyWWW = [];
                // move all adapters with not onlyWWW and noConfig to the bottom
                for (var l = this.list.length - 1; l >= 0; l--) {
                    if (this.main.objects[this.list[l]] &&
                            this.main.objects[this.list[l]].common &&
                            !this.main.objects[this.list[l]].common.localLink &&
                            !this.main.objects[this.list[l]].common.localLinks &&
                            this.main.objects[this.list[l]].common.noConfig
                            ) {
                        onlyWWW.push(this.list[l]);
                        this.list.splice(l, 1);
                    }
                }

                this.list.sort();
                onlyWWW.sort();
                for (l = 0; l < onlyWWW.length; l++) {
                    this.list.push(onlyWWW[l]);
                }

                addGroups();

                for (var i = 0; i < this.list.length; i++) {
                    var obj = this.main.objects[this.list[i]];
                    if (!obj) {
                        continue;
                    }
                    showOneAdapter(this.list[i]);
                }

                applyFilter();

                $('#currentHost').html(this.main.currentHost);
                var totalRam = that.calculateTotalRam('instances');
                var freeRam = that.calculateFreeMem('instances');
                $('#instancesTotalRamText').text($.i18n('totalRamText', totalRam, freeRam));
            }

            this.main.fillContent('#menu-instances-div');
        }
    };

    this.stateChange = function (id, state) {
    };

    this.objectChange = function (id, obj) {
    };

    /**
     * 
     * @param {String} id
     */
    this.showConfigDialog = function (id) {
        // id = 'system.adapter.NAME.X'
        $iframeDialog = $('#modal-config');

        var parts = id.split('.');
        $('#config-iframe').attr('src', 'adapter/' + parts[2] + '/?' + parts[3]);

        var name = id.replace(/^system\.adapter\./, '');
        $('#modal-config').data('name', name);
        $('#modal-config-label').text($.i18n('adapterConfiguration') + ': ' + name);

        var height = $(window).height();
        $iframeDialog.find('.modal-content').css("height", height - 60);
        $('#config-iframe').css("height", height - 200);


        $iframeDialog.modal();

    };

    /**
     * 
     * @param {JQuery} $instanceTile
     */
    this.initButtons = function ($instanceTile) {
        var id = $instanceTile.attr('data-instance-id');
        var attr = $instanceTile.attr('data-adapter');

        $instanceTile.find('.instance-stop-run')
                .addClass(that.main.objects[id].common.enabled ? 'btn-success' : 'btn-danger')
                .attr('data-i18n-tooltip', that.main.objects[id].common.enabled ? 'activated' : 'deactivated')
                .click(function () {
                    $(this).prop('disable', true);
                    that.main.socket.emit('extendObject', id, {common: {enabled: !that.main.objects[id].common.enabled}}, function (err) {
                        if (err) {
                            that.main.showError(err);
                        }
                    });
                });
        $instanceTile.find('.instance-stop-run-icon').addClass(that.main.objects[id].common.enabled ? 'fa-pause' : 'fa-play');

        $instanceTile.find('.instance-schedule-button').click(function () {
            showCronDialog(that.main.objects[id].common[attr] || '', function (newValue) {
                if (newValue !== null) {
                    var obj = {common: {}};
                    obj.common[attr] = newValue;
                    that.main.socket.emit('extendObject', id, obj, function (err) {
                        if (err) {
                            that.main.showError(err);
                        }
                    });
                }
            });
        });
    };

    /**
     * 
     */
    function createTable() {
        var $tempTable = $instancesTableTemplate.children().clone(true, true);
        $tempTable.find('.instanceTable').bootstrapTable();
        $instanceContainer.append($tempTable);
        $instancesTable = $instanceContainer.find('.instanceTable');
    }

}
