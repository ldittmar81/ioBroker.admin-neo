/* jshint -W097 */// jshint strict:true
/* jslint vars: true */
/* jslint browser:true */
/* jslint devel:true */
/* jshint browser:true */
/* jshint devel:true */
/* jshint jquery:true */
/* global io:false */
/* global jQuery:false */
/* global $, sorttable:false */

/**
 * 
 * @constructor
 * @param {Object} main
 * @returns {States}
 */
function States(main) {
    "use strict";

    var that = this;
    this.menuIcon = 'fa-bolt';

    this.main = main;

    function convertState(key, _obj) {
        var obj = JSON.parse(JSON.stringify(_obj));
        obj = obj || {};
        obj._id = key;
        obj.name = main.objects[obj._id] ? (main.objects[obj._id].common.name || obj._id) : obj._id;

        if (that.main.objects[key] && that.main.objects[key].parent && that.main.objects[that.main.objects[key].parent]) {
            obj.pname = that.main.objects[that.main.objects[key].parent].common.name;
            // Add instance
            var parts = that.main.objects[key].parent.split('.');
            if (obj.pname.indexOf('.' + parts[parts.length - 1]) === -1) {
                obj.pname += '.' + parts[parts.length - 1];
            }
        } else if (obj.name.indexOf('.messagebox') !== -1) {
            var p = obj.name.split('.');
            p.splice(-1);
            obj.pname = p.join('.');
        } else {
            var b = obj.name.split('.');
            b.splice(2);
            obj.pname = b.join('.');
        }

        obj.type = that.main.objects[obj._id] && that.main.objects[obj._id].common ? that.main.objects[obj._id].common.type : '-';
        if (obj.ts) {
            obj.ts = that.main.formatDate(obj.ts);
        }
        if (obj.lc) {
            obj.lc = that.main.formatDate(obj.lc);
        }

        if (typeof obj.val === 'object') {
            obj.val = JSON.stringify(obj.val);
        }

        if (that.main.objects[obj._id] && that.main.objects[obj._id].common && that.main.objects[obj._id].common.role === 'value.time') {
            obj.val = main.formatDate(obj.val);
        }

        obj.from = obj.from ? obj.from.replace('system.adapter.', '').replace('system.', '') : '-';
        return obj;
    }

    this.prepare = function () {
        $('#menu-states-div').load("templates/states.html", function () {
            restartFunctions('#menu-states-div');
        });
    };

    this.init = function (update) {
        if (!this.main.objectsLoaded || !this.main.states) {
            setTimeout(function () {
                that.init(update);
            }, 250);
            return;
        }

        for (var key in main.states) {
            var obj = convertState(key, main.states[key]);
            that.addRow(obj);
        }
        sorttable.makeSortable($('#states-outer')[0]);

        this.main.fillContent('#menu-states-div');
    };

    this.clear = function () {
        $('#states-tbody').html('');
    };

    this.addRow = function (data) {
        var row = "<tr id='statetable_" + data['_id'] + "'>";
        row += "<td data-field='_id'>" + data['_id'] + "</td>";
        row += "<td data-field='pname'>" + data.pname + "</td>";
        row += "<td data-field='name'>" + data.name + "</td>";
        row += "<td data-field='val'>" + (data.val ? data.val : '-') + "</td>";
        row += "<td data-field='ack'>" + (data.ack ? data.ack : '-') + "</td>";
        row += "<td data-field='from'>" + (data.from ? data.from.replace('system.adapter.', '').replace('system.', '') : '') + "</td>";
        row += "<td data-field='ts'>" + main.formatDate(data.ts) + "</td>";
        row += "<td data-field='lc'>" + main.formatDate(data.lc) + "</td>";
        row += "</tr>"
        $('#states-tbody').append(row);
    };

    this.stateChange = function (id, state) {
        if (this.main.activemenu === 'states') {
            var rowData = {};
            // Update gridStates
            if (state) {
                if (this.main.states[id]) {
                    var $tr = $('#states-tbody').find('tr[id="statetable_' + id + '"]');
                    if ($tr.length > 0) {
                        rowData['_id'] = id;
                        rowData.pname = $tr.find('td[data-field="pname"]').text();
                        rowData.name = $tr.find('td[data-field="name"]').text();
                        rowData.ack = state.ack;
                        $tr.find('td[data-field="ack"]').text(rowData.ack ? rowData.ack : '-');
                        if (state.ts) {
                            rowData.ts = main.formatDate(state.ts);
                            $tr.find('td[data-field="ts"]').text(rowData.ts ? rowData.ts : '-');
                        }
                        if (state.lc) {
                            rowData.lc = main.formatDate(state.lc);
                            $tr.find('td[data-field="lc"]').text(rowData.lc ? rowData.lc : '-');
                        }
                        rowData.from = state.from ? state.from.replace('system.adapter.', '').replace('system.', '') : '';
                        $tr.find('td[data-field="from"]').text(rowData.from ? rowData.from : '-');
                        if (main.objects[id] && main.objects[id].common && main.objects[id].common.role === 'value.time') {
                            rowData.val = main.formatDate(state.val);
                        } else {
                            rowData.val = state.val;
                        }
                        $tr.find('td[data-field="val"]').text(rowData.val ? rowData.val : '-');

                        $tr.find('td').addClass("glow_ok");
                        setTimeout(function () {
                            $tr.find('td').removeClass("glow_ok");
                        }, 500);

                    } else {
                        rowData = convertState(id, state);
                        that.addRow(rowData);
                    }
                } else {
                    rowData = convertState(id, state);
                    that.addRow(rowData);
                    sorttable.makeSortable($('#states-outer')[0]);
                }
            } else {
                $('#statetable_' + id).remove();
            }
            this.main.addEventMessage(id, state, rowData);
        }
    };

}
