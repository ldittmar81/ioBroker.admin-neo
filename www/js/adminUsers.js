'use strict';

function Users(main) {
    
    var that = this;
    this.list = [];
    this.main = main;
    this.userLastSelected = null;

    this.prepare = function () {
        $('#dialog-users').load("templates/users.html", function () {

            that.$dialogUsers = $('#modal-users');
            that.$table = $('#users-table');
            
            that.$table.bootstrapTable();

        });
    };

    // ----------------------------- Users show and Edit ------------------------------------------------
    this.init = function (update) {
        if (!that.main.objectsLoaded) {
            setTimeout(function () {
                that.init(update);
            }, 500);
            return;
        }

        for (var i = 0; i < that.list.length; i++) {
            var obj = that.main.objects[that.list[i]];
            var select = '<select class="user-groups-edit" multiple="multiple" data-id="' + that.list[i] + '">';

            var groups = that.main.tabs.groups.list;
            for (var j = 0; j < groups.length; j++) {
                var name = groups[j].substring('system.group.'.length);
                name = name.substring(0, 1).toUpperCase() + name.substring(1);
                select += '<option value="' + groups[j] + '"';
                if (that.main.objects[groups[j]].common && that.main.objects[groups[j]].common.members && that.main.objects[groups[j]].common.members.indexOf(that.list[i]) != -1)
                    select += ' selected';
                select += '>' + name + '</option>';
            }

            that.$table.bootstrapTable('insertRow', {
                row: {
                    _id: obj._id,
                    name: obj.common ? obj.common.name : '',
                    enabled: '<input class="user-enabled-edit" type="checkbox" data-id="' + that.list[i] + '" ' + (obj.common && obj.common.enabled ? 'checked' : '') + '/>',
                    groups: select
                }
            });
        }

        restartFunctions('#dialog-users');

        that.$dialogUsers.modal();
    };

    function editUser(id) {
    }

    function saveUser() {
        var pass = $('#edit-user-pass').val();
        var passconf = $('#edit-user-passconf').val();

        if (pass !== passconf) {
            that.main.showMessage($.i18n('Password and confirmation are not equal!'), null, 'notice');
            return;
        }
        if (!pass) {
            that.main.showMessage($.i18n('Password cannot be empty!'), null, 'notice');
            return;
        }
        var id = $('#edit-user-id').val();
        var user = $('#edit-user-name').val();

        if (!id) {
            that.main.socket.emit('addUser', user, pass, function (err) {
                if (err) {
                    that.main.showMessage($.i18n('Cannot create user: ') + $.i18n(err), null, 'alert');
                } else {
                    that.$dialog.modal('hide');
                    setTimeout(function () {
                        that.init(true);
                    }, 0);
                }
            });
        } else {
            // If password changed
            if (pass !== '__pass_not_set__') {
                that.main.socket.emit('changePassword', user, pass, function (err) {
                    if (err) {
                        that.main.showMessage($.i18n('Cannot set password: ') + $.i18n(err), null, 'alert');
                    } else {
                        that.$dialog.modal('hide');
                    }
                });
            } else {
                that.$dialog.modal('hide');
            }
        }

    }

    this.objectChange = function (id, obj) {
        if (id.match(/^system\.user\./)) {
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

            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(function () {
                that.timer = null;
                that.main.menus.groups.init(true);
                that.init(true);
            }, 200);
        }
    };

}

