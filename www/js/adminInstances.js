function Instances(main) {
    'use strict';

    var that = this;

    this.main = main;
    this.menuIcon = 'fa-object-group';
    this.list = [];
    this.hostsText = null;

    function getLinkVar(_var, obj, attr, link, instance) {
        if (attr === 'protocol')
            attr = 'secure';

        if (_var === 'ip') {
            link = link.replace('%' + _var + '%', location.hostname);
        } else
        if (_var === 'instance') {
            link = link.replace('%' + _var + '%', instance);
        } else {
            if (obj) {
                if (attr.match(/^native_/))
                    attr = attr.substring(7);

                var val = obj.native[attr];
                if (_var === 'bind' && (!val || val === '0.0.0.0'))
                    val = location.hostname;

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
                } else
                if (parts.length === 1) {
                    link = getLinkVar(_var, that.main.objects['system.adapter.' + adapter + '.' + instance], parts[0], link, instance);
                    vars.splice(v, 1);
                } else
                // like "web.0_port"
                if (parts[0].match(/\.[0-9]+$/)) {
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
                if (_var.match(/^native_/))
                    _var = _var.substring(7);

                parts = _var.split('_');
                if (!instances) {
                    instances = [];
                    for (var inst = 0; inst < 10; inst++) {
                        if (that.main.objects['system.adapter.' + adptr + '.' + inst])
                            instances.push(inst);
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
                    if (!firtsLink)
                        firtsLink = links[d].link;
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
                if (!first)
                    first = links[v];
            }
            links.__first = first;
            return links;
        } else {
            return resolveLink(link, adapter, instance);
        }
    }

    function updateLed(instanceId) {
    }

    function createHead() {
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
        mem = Math.round(mem);
        var $totalRam = $('#totalRam');
        if (mem.toString() !== $totalRam.text()) {
            $totalRam.html('<span class="highlight">' + mem + '</span>');
        }
        var text = $.i18n('%s processes', processes);
        var $running_processes = $('#running_processes');
        if (text !== $running_processes.text()) {
            $running_processes.html('<span class="highlight">' + text + '</span>')
        }
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
                    sliceColors: ['red', 'green']
                });
            }
        } else {
            $('.free-mem-label').hide();
        }
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
                '<div class="cancel ui-icon ui-icon-close select-id-quick-edit-cancel" style="margin-top: 0.45em;' + css + ';right: 2px" title="' + _('cancel') + '" ></div>');

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

            $('#instances-filter').change(function () {
                that.main.saveConfig('instancesFilter', $(this).val());
                applyFilter($(this).val());
            }).keyup(function () {
                if (that.filterTimeout)
                    clearTimeout(that.filterTimeout);
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
                that.main.tabs.adapter.updateExpertMode();
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

        if (this.main.currentHost && typeof this.$grid !== 'undefined' && (!this.$grid.data('inited') || update)) {
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

            createHead();

            for (var i = 0; i < this.list.length; i++) {
                var obj = this.main.objects[this.list[i]];
                if (!obj)
                    continue;
                showOneAdapter(this.$grid, this.list[i], this.main.config.instanceForm);
            }
            applyFilter();

            $('#currentHost').html(this.main.currentHost);
            calculateTotalRam();
            calculateFreeMem();
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
