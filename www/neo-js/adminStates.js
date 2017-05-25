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
        if (!obj) {
            console.log(key);
        }
        obj = obj || {};
        obj._id = key;
        obj.id = 'state_' + key;
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

        obj.type = that.main.objects[obj._id] && that.main.objects[obj._id].common ? that.main.objects[obj._id].common.type : '';
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

        obj.gridId = 'state_' + key.replace(/ /g, '_');
        obj.from = obj.from ? obj.from.replace('system.adapter.', '').replace('system.', '') : '';
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

        var data = [];
        for (var key in main.states) {
            var obj = convertState(key, main.states[key]);
            data.push(obj);
        }

        $('#states-outer').bootstrapTable({
            data: data
        });

        this.main.fillContent('#menu-states-div');
    };

    this.clear = function () {
        $('#states-outer').bootstrapTable('removeAll');
    };

    this.stateChange = function (id, state) {
        if (this.main.activemenu === 'states') {
            var rowData;
            // Update gridStates
            if (state) {
                if (this.main.states[id]) {
                    rowData = $('#states-outer').bootstrapTable('getRowByUniqueId', "state_" + id);
                    if (rowData) {
                        rowData.val = state.val;
                        rowData.ack = state.ack;
                        if (state.ts) {
                            rowData.ts = main.formatDate(state.ts);
                        }
                        if (state.lc) {
                            rowData.lc = main.formatDate(state.lc);
                        }
                        rowData.from = state.from ? state.from.replace('system.adapter.', '').replace('system.', '') : '';
                        if (main.objects[id] && main.objects[id].common && main.objects[id].common.role === 'value.time') {
                            rowData.val = main.formatDate(rowData.val);
                        }

                        $('#states-outer').bootstrapTable('updateByUniqueId', "state_" + id, rowData);
                        $('tr[data-uniqueid="state_' + id + '"]').find('td').addClass("bg-success");

                    } else {
                        rowData = convertState(id, state);
                        $('#states-outer').bootstrapTable('append', rowData);
                    }
                } else {
                    rowData = convertState(id, state);
                    $('#states-outer').bootstrapTable('append', rowData);
                }
            } else {
                $('#states-outer').bootstrapTable('removeByUniqueId', "state_" + id);
            }
            this.main.addEventMessage(id, state, rowData);
        }
    };
}
