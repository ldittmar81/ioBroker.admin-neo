function Instances(main) {
    'use strict';

    var that = this;

    var $tableTemplate, $tileTemplate, $instanceContainer;

    this.main = main;
    this.menuIcon = 'fa-object-group';
    this.list = [];
    this.hostsText = null;

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

    function resolveLink(link, adapter, instance) {
        var vars = link.match(/%(\w+)%/g);
        var _var;
        var v;
        var parts;
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
            var result;
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
    }

    function replaceInLink(link, adapter, instance) {
        if (typeof link === 'object') {
            var links = JSON.parse(JSON.stringify(link));
            var first;
            for (var v in links) {
                links[v] = resolveLink(links[v], adapter, instance);
                if (!first) {
                    first = links[v];
                }
            }
            links.__first = first;
            return links;
        } else {
            return resolveLink(link, adapter, instance);
        }
    }

    function updateLed(instanceId) {
        var tmp = instanceId.split('.');
        var adapter = tmp[2];
        var instance = tmp[3];

        var $led = $('.instance-led[data-instance-id="' + instanceId + '"]');

        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var state = (common.mode === 'daemon') ? 'green' : 'blue';
        var title = '';
        if (common.enabled && (!common.webExtension || !that.main.objects[instanceId].native.webInstance)) {
            title = '<table style="border: 0">';
            title += '<tr style="border: 0"><td style="border: 0">' + $.i18n('Connected to host: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title += ((common.mode === 'daemon') ? '<span style="color: red">' + $.i18n('false') + '</span>' : $.i18n('false'));
                state = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title += '<span style="color: green">' + $.i18n('true') + '</span>';
            }
            title += '</td></tr><tr style="border: 0"><td style="border: 0">' + $.i18n('Heartbeat: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title += ((common.mode === 'daemon') ? '<span style="color: red">' + $.i18n('false') + '</span>' : $.i18n('false'));
                state = (common.mode === 'daemon') ? 'red' : 'blue';
            } else {
                title += '<span style="color: green">' + $.i18n('true') + '</span>';
            }
            title += '</td></tr>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title += '<tr style="border: 0"><td style="border: 0">' + $.i18n('Connected to %s: ', adapter) + '</td><td>';
                var val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    state = state === 'red' ? 'red' : 'orange';
                    title += '<span style="color: red">' + $.i18n('false') + '</span>';
                } else {
                    if (val === true) {
                        title += '<span style="color: green">' + $.i18n('true') + '</span>';
                    } else {
                        title += '<span style="color: green">' + val + '</span>';
                    }
                }
                title += '</td></tr>';
            }
            title += '</table>';
        } else {
            state = (common.mode === 'daemon') ? 'gray' : 'blue';
            title = '<table style="border: 0">';
            title += '<tr style="border: 0"><td style="border: 0">' + $.i18n('Connected to host: ') + '</td><td style="border: 0">';

            if (!that.main.states[instanceId + '.connected'] || !that.main.states[instanceId + '.connected'].val) {
                title += $.i18n('false');
            } else {
                title += '<span style="color: green">' + $.i18n('true') + '</span>';
            }
            title += '</td></tr><tr style="border: 0">';

            title += '<td style="border: 0">' + $.i18n('Heartbeat: ') + '</td><td style="border: 0">';
            if (!that.main.states[instanceId + '.alive'] || !that.main.states[instanceId + '.alive'].val) {
                title += $.i18n('false');
            } else {
                title += '<span style="color: green">' + $.i18n('true') + '</span>';
            }
            title += '</td></tr>';

            if (that.main.states[adapter + '.' + instance + '.info.connection'] || that.main.objects[adapter + '.' + instance + '.info.connection']) {
                title += '<tr style="border: 0"><td style="border: 0">' + $.i18n('Connected to %s: ', adapter) + '</td><td>';
                var val = that.main.states[adapter + '.' + instance + '.info.connection'] ? that.main.states[adapter + '.' + instance + '.info.connection'].val : false;
                if (!val) {
                    title += $.i18n('false');
                } else {
                    if (val === true) {
                        title += '<span style="color: green">' + $.i18n('true') + '</span>';
                    } else {
                        title += '<span style="color: green">' + val + '</span>';
                    }
                }
                title += '</td></tr>';
            }
            title += '</table>';
        }

        state = (state === 'blue') ? '' : state;

        $led.removeClass('led-red led-green led-orange led-blue').addClass('led-' + state).data('title', title);

        if (!$led.data('inited') && state !== 'gray') {
            $led.data('inited', true);

            $led.hover(function () {
                var text = '<div class="instance-state-hover" style="' +
                        'left: ' + Math.round($(this).position().left + $(this).width() + 5) + 'px;">' + $(this).data('title') + '</div>';
                var $big = $(text);

                $big.insertAfter($(this));
                $(this).data('big', $big[0]);
                var h = parseFloat($big.height());
                var top = Math.round($(this).position().top - ((h - parseFloat($(this).height())) / 2));
                if (h + top > (window.innerHeight || document.documentElement.clientHeight)) {
                    top = (window.innerHeight || document.documentElement.clientHeight) - h;
                }
                if (top < 0) {
                    top = 0;
                }
                $big.click(function () {
                    var big = $(this).data('big');
                    $(big).remove();
                    $(this).data('big', undefined);
                });
            }, function () {
                var big = $(this).data('big');
                $(big).remove();
                $(this).data('big', undefined);
            }).click(function () {
                $(this).trigger('hover');
            });
        }
    }

    function calculateTotalRam() {
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
        var $running_processes = $('#running_processes');
        if (text !== $running_processes.text()) {
            $running_processes.html('<span class="highlight">' + text + '</span>')
        }

        return Math.round(mem);
    }

    function calculateFreeMem() {
        var host = that.main.states['system.host.' + that.main.currentHost + '.freemem'];
        if (host) {
            that.totalmem = that.totalmem || that.main.objects['system.host.' + that.main.currentHost].native.hardware.totalmem / (1024 * 1024);
            var percent = Math.round((host.val / that.totalmem) * 100);

            if (host.val.toString() !== $('#freeMem').text()) {
                $('#freeMemPercent').text(percent + ' %');
                $("#freeMemSparkline").sparkline([that.totalmem - host.val, host.val], {
                    type: 'pie',
                    sliceColors: ["#F78181", "#088A29"],
                    height: "40px",
                    width: "40px"
                });
                $('#freeMemSparkline > canvas').css('vertical-align', 'middle');
            }
        } else {
            $('.free-mem-label').hide();
        }

        return Math.round(host.val);
    }

    function calculateRam(instanceId) {
        var mem;
        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        if (common.enabled && common.mode === 'daemon' && that.main.states[instanceId + '.memRss']) {
            mem = that.main.states[instanceId + '.memRss'].val;
            mem = parseFloat(mem) || 0;

            if (common.memoryLimitMB && common.memoryLimitMB <= mem) {
                mem = '<span class="high-mem">' + mem.toFixed(1) + ' MB</span>';
            } else {
                mem = mem.toFixed(1) + ' MB'
            }
        } else {
            mem = '';
        }
        return mem;
    }

    function showOneAdapter(rootElem, instanceId, form, justContent) {
        var text;
        var common = that.main.objects[instanceId] ? that.main.objects[instanceId].common || {} : {};
        var tmp = instanceId.split('.');
        var adapter = tmp[2];
        var instance = tmp[3];

        if (form === 'tile') {
            text = justContent ? '' : '<div class="instance-adapter" data-instance-id="' + instanceId + '">';
            text += justContent ? '' : '</div>';
        } else {
            // table
            text = justContent ? '' : '<tr class="instance-adapter" data-instance-id="' + instanceId + '">';

            var link = common.localLinks || common.localLink || '';
            var url = link ? replaceInLink(link, adapter, instance) : '';
            if (link) {
                if (typeof url === 'object') {
                    link = '<a href="' + url.__first + '" target="_blank">';
                } else {
                    link = '<a href="' + url + '" target="_blank">';
                }
            }

            // State -
            //             red - adapter is not connected or not alive,
            //             orange - adapter is connected and alive, but device is not connected,
            //             green - adapter is connected and alive, device is connected or no device,
            text += '<td class="instance-state" style="text-align: center"><div class="instance-led" style="margin-left: 0.5em; width: 1em; height: 1em;" data-instance-id="' + instanceId + '"></div></td>';

            // icon
            text += '<td>' + (common.icon ? link + '<img src="adapter/' + adapter + '/' + common.icon + '" style="width: 2em; height: 2em" class="instance-image" data-instance-id="' + instanceId + '"/>' : '') + (link ? '</a>' : '') + '</td>';

            // name and instance
            text += '<td style="padding-left: 0.5em" data-instance-id="' + instanceId + '" class="instance-name"><b>' + adapter + '.' + instance + '</b></td>';

            var isRun = common.onlyWWW || common.enabled;
            // buttons
            text += '<td style="text-align: left; padding-left: 1em;">' +
                    (!common.onlyWWW ? '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-stop-run"></button>' : '<div class="ui-button" style="display: inline-block; width: 2em">&nbsp;</div>') +
                    '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-settings"></button>' +
                    (!common.onlyWWW ? '<button ' + (isRun ? '' : 'disabled ') + 'style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-reload"></button>' : '<div class="ui-button" style="display: inline-block; width: 2em">&nbsp;</div>') +
                    '<button style="display: inline-block" data-instance-id="' + instanceId + '" class="instance-del"></button>' +
                    (url ? '<button ' + (isRun ? '' : 'disabled ') + 'style="display: inline-block" data-link="' + (typeof url !== 'object' ? url : '') + '" data-instance-id="' + instanceId + '" class="instance-web"></button>' : '') +
                    '</td>';

            // title
            text += '<td title="' + (link ? $.i18n('Click on icon') : '') + '" style="padding-left: 0.5em" data-name="title" data-value="' + (common.title || '') + '" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.title || '') + '</td>';

            // host - hide it if only one host
            if (that.main.menus.hosts.list.length > 1) {
                if (!that.hostsText) {
                    that.hostsText = '';
                    for (var h = 0; h < that.main.menus.hosts.list.length; h++) {
                        var host = that.main.menus.hosts.list[h] || '';
                        that.hostsText += (that.hostsText ? ';' : '') + host.name;
                    }
                }
                text += '<td  style="padding-left: 0.5em" data-name="host" data-value="' + (common.host || '') + '" class="instance-editable" data-instance-id="' + instanceId + '" data-options="' + that.hostsText + '">' + (common.host || '') + '</td>';
            }

            // schedule
            text += '<td data-name="schedule" data-value="' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '" style="text-align: center" class="' + (common.mode === 'schedule' ? 'instance-schedule' : '') + '" data-instance-id="' + instanceId + '">' + (common.mode === 'schedule' ? (common.schedule || '') : '') + '</td>';

            // scheduled restart (only experts)
            if (that.main.config.expertMode) {
                text += '<td data-name="restartSchedule" data-value="' + (common.restartSchedule || '') + '"  style="text-align: center" class="instance-schedule" data-instance-id="' + instanceId + '">' + (common.restartSchedule || '') + '</td>';
                // debug level (only experts)
                text += '<td data-name="loglevel" data-value="' + (common.loglevel || '') + '"  style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '" data-options="debug:debug;info:info;warn:warn;error:error">' + (common.loglevel || '') + '</td>';
                // Max RAM  (only experts)
                text += '<td data-name="memoryLimitMB" data-value="' + (common.memoryLimitMB || '') + '" style="text-align: center" class="instance-editable" data-instance-id="' + instanceId + '">' + (common.memoryLimitMB || '') + '</td>';
                // Max RAM  (only experts)
                if (isRun && that.main.states[instanceId + '.inputCount'] && that.main.states[instanceId + '.outputCount']) {
                    text += '<td style="text-align: center"><span title="in" data-instance-id="' + instanceId + '" class="instance-in">&#x21E5;' + that.main.states[instanceId + '.inputCount'].val + '</span> / <span title="out" data-instance-id="' + instanceId + '" class="instance-out">&#x21A6;' + that.main.states[instanceId + '.outputCount'].val + '</span></td>';
                } else {
                    text += '<td style="text-align: center"><span title="in" data-instance-id="' + instanceId + '" class="instance-in"></span> / <span title="out" data-instance-id="' + instanceId + '" class="instance-out"></span></td>';
                }
            }

            text += '<td class="memUsage" style="text-align: center" data-instance-id="' + instanceId + '">' + calculateRam(instanceId) + '</td>';

            text += justContent ? '' : '</tr>';
        }
        if (!justContent) {
            rootElem.append(text);
        } else {
            $('.instance-adapter[data-instance-id="' + instanceId + '"]').html(text);
        }
        // init buttons
        that.initButtons(instanceId, url);
        updateLed(instanceId);
        // init links
        $('.instance-editable[data-instance-id="' + instanceId + '"]')
                .click(onQuickEditField)
                .addClass('select-id-quick-edit');

        // init schedule editor
        $('.instance-schedule[data-instance-id="' + instanceId + '"]').each(function () {
            if (!$(this).find('button').length) {
                $(this).append('<button class="instance-schedule-button" data-instance-id="' + instanceId + '" data-name="' + $(this).data('name') + '">...</button>');
                $(this).find('button').button().css('width', 16).click(function () {
                    var attr = $(this).data('name');
                    var _instanceId = $(this).data('instance-id');
                    showCronDialog(that.main.objects[_instanceId].common[attr] || '', function (newValue) {
                        if (newValue !== null) {
                            var obj = {common: {}};
                            obj.common[attr] = newValue;
                            that.main.socket.emit('extendObject', _instanceId, obj, function (err) {
                                if (err)
                                    that.main.showError(err);
                            });
                        }
                    })
                });
            }
        });

        $('.instance-name[data-instance-id="' + instanceId + '"]').click(function () {
            $('.instance-settings[data-instance-id="' + $(this).data('instance-id') + '"]').trigger('click');
        });
    }

    function applyFilter(filter) {
    }


    function onQuickEditField(e) {
        var $this = $(this);
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

    function showCronDialog(value, cb) {
    }

    this.prepare = function () {
        $('#menu-instances-div').load("templates/instances.html", function () {

            $tableTemplate = $('#instancesTemplateTable');
            $tileTemplate = $('#instancesTemplateTile');
            $instanceContainer = $('#instances-container');

            $('#instances-filter').change(function () {
                that.main.saveConfig('instancesFilter', $(this).val());
                applyFilter($(this).val());
            }).keyup(function () {
                if (that.filterTimeout){
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
                that.main.menus.adapter.updateExpertMode();
            });
            if (that.main.config.expertMode) {
                $('#btn-instances-expert-mode').switchClass('btn-default', 'btn-primary');
            }

            $('#btn-instances-reload').click(function () {
                that.init(true);
            });

            $('.clearable').click(function () {
                $('#instances-filter').val('').trigger('change');
            });

        });
    };

    this.updateExpertMode = function () {
        that.init(true);
        $('#btn-instances-expert-mode').switchClass('btn-default', 'btn-primary');
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
            ]
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

    this.replaceLinks = function (vars, adapter, instance, elem) {
        if (typeof vars !== 'object')
            vars = [vars];
        for (var t = 0; t < vars.length; t++) {
            this.replaceLink(vars[t], adapter, instance, elem);
        }
    };

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

    this.init = function (update) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
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

            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                if (!obj)
                    continue;
                $instanceContainer.append($tileTemplate.children().clone(true, true));
                //showOneAdapter($tableTemplate, this.list[i], this.main.config.instanceForm);
            }
          
            $('#currentHost').html(this.main.currentHost);
            var totalRam = calculateTotalRam();
            var freeRam = calculateFreeMem();
            $('#totalRamText').text($.i18n('totalRamText', totalRam, freeRam));
        }

        restartFunctions('menu-instances-div');
        this.main.fillContent('#menu-instances-div');

    };

    this.stateChange = function (id, state) {
    };

    this.objectChange = function (id, obj) {
    };

    this.showConfigDialog = function (id) {
    };

    this.initButtons = function (id, url) {
    };

}
