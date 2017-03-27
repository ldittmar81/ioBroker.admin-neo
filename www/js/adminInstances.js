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
                $('#freeMem').html('<span class="highlight ' + (percent < 10 ? 'high-mem' : '') + '">' + host.val + '</span>');
                $('#freeMemPercent').html('<span class="highlight">(' + percent + '%)</span>');
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
    }

    function showCronDialog(value, cb) {
    }

    this.prepare = function () {
    };

    this.updateExpertMode = function () {
    };

    this.replaceLink = function (_var, adapter, instance, elem) {
    };

    this.replaceLinks = function (vars, adapter, instance, elem) {
    };

    this._replaceLink = function (link, _var, adapter, instance, callback) {
    };

    this._replaceLinks = function (link, adapter, instance, arg, callback) {
    };

    this.init = function (update) {
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
