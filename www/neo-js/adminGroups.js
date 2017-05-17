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
 * @returns {Groups}  
 */
function Groups(main) {
    "use strict";

    var that = this;
    this.list = [];
    this.main = main;
    this.groupLastSelected = null;

    this.prepare = function () {
        $('#dialog-groups').load("templates/groups.html", function () {

            that.$dialogGroups = $('#modal-groups');
            that.$table = $('#groups-table');
            
            that.$table.bootstrapTable();

        });
    };

    this.init = function (update) {
        if (!that.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 500);
            return;
        }

        for (var i = 0; i < this.list.length; i++) {
            var obj = that.main.objects[this.list[i]];
            var select = '<select class="group-users-edit" multiple="multiple" data-id="' + this.list[i] + '">';

            var users = this.main.usersDialog.list;
            for (var j = 0; j < users.length; j++) {
                var name = users[j].substring('system.user.'.length);
                select += '<option value="' + users[j] + '"';
                if (obj.common && obj.common.members && obj.common.members.indexOf(users[j]) !== -1)
                    select += ' selected';
                select += '>' + name + '</option>';
            }

            that.$table.bootstrapTable('insertRow', {
                row: {
                    _id: obj._id,
                    name: obj.common ? obj.common.name : '',
                    description: obj.common ? obj.common.desc : '',
                    users: select,
                    buttons: '<button data-group-id="' + this.list[i] + '" class="group-edit">' + $.i18n('edit') + '</button>' +
                            (!obj.common.dontDelete ? ('<button data-group-id="' + this.list[i] + '" class="group-del">' + $.i18n('delete') + '</button>') : '')
                }
            });
        }

        $('.group-edit').click(function () {
            editGroup($(this).attr('data-group-id'));
        });

        $('.group-del').click(function () {
            var id = $(this).attr('data-group-id');
            that.main.confirmMessage($.i18n('Are you sure?'), null, 'help', function (result) {
                if (result) {
                    that.main.socket.emit('delGroup', id.replace("system.group.", ""), function (err) {
                        if (err) {
                            that.main.showMessage($.i18n('Cannot delete group: %s', err), '', 'alert');
                        }
                    });
                }
            });
        });

        restartFunctions('#dialog-groups');

        that.$dialogGroups.modal();
    };

    function editGroup(id) {
    }
    function saveGroup() {
    }

    this.synchronizeUser = function (userId, userGroups, callback) {
        var obj;
        userGroups = userGroups || [];
        for (var i = 0; i < this.list.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (userGroups.indexOf(this.list[i]) === -1 &&
                    that.main.objects[this.list[i]].common.members && that.main.objects[this.list[i]].common.members.indexOf(userId) !== -1) {
                var members = JSON.parse(JSON.stringify(that.main.objects[this.list[i]].common.members));
                members.splice(members.indexOf(userId), 1);
                obj = {common: {members: members}};
                that.main.socket.emit('extendObject', this.list[i], obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        if (callback) {
                            callback(err);
                        }
                    } else {
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
            if (userGroups.indexOf(this.list[i]) !== -1 &&
                    (!that.main.objects[this.list[i]].common.members || that.main.objects[this.list[i]].common.members.indexOf(userId) === -1)) {
                that.main.objects[this.list[i]].common.members = that.main.objects[this.list[i]].common.members || [];
                var _members = JSON.parse(JSON.stringify(that.main.objects[this.list[i]].common.members));
                _members.push(userId);
                obj = {common: {members: _members}};
                that.main.socket.emit('extendObject', this.list[i], obj, function (err) {
                    if (err) {
                        that.main.showError(err);
                        if (callback) {
                            callback(err);
                        }
                    } else {
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        }
    };

    this.delUser = function (id) {
        for (var i = 0; i < this.list.length; i++) {
            // If user has no group, but group has user => delete user from group
            if (that.main.objects[this.list[i]].common.members && that.main.objects[this.list[i]].common.members.indexOf(id) !== -1) {
                that.main.objects[this.list[i]].common.members.splice(that.main.objects[this.list[i]].common.members.indexOf(id), 1);
                that.main.socket.emit('extendObject', this.list[i], {
                    common: {
                        members: that.main.objects[this.list[i]].common.members
                    }
                });
            }
        }
    };

    this.objectChange = function (id, obj) {
        if (id.match(/^system\.group\./)) {
            if (obj) {
                if (this.list.indexOf(id) === -1) {
                    this.list.push(id);
                }
            } else {
                var j = this.list.indexOf(id);
                if (j !== -1) {
                    this.list.splice(j, 1);
                }
            }

            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            this.updateTimer = setTimeout(function () {
                that.updateTimer = null;
                that.main.usersDialog.init(true);
                that.init(true);
            }, 200);
        }
    };

}

