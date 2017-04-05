function Enums(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-list-ol';
    this.main = main;
    this.list = [];
    this.enumEdit = null;
    this.updateTimers = null;
    
    var $enumsContainer;

    var enumCurrentParent = '';
    var tasks = [];

    function enumRename(oldId, newId, newName, callback) {
        if (tasks.length) {
            var task = tasks.shift();
            if (task.name === 'delObject') {
                main.socket.emit(task.name, task.id, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            } else {
                main.socket.emit(task.name, task.id, task.obj, function () {
                    setTimeout(function () {
                        enumRename(undefined, undefined, undefined, callback);
                    }, 0);
                });
            }
        } else {
            _enumRename(oldId, newId, newName, function () {
                if (tasks.length) {
                    enumRename(undefined, undefined, undefined, callback);
                } else {
                    if (callback) callback();
                }
            });
        }
    }
    function _enumRename(oldId, newId, newName, callback) {
    }

    function enumAddChild(parent, newId, name) {
        if (main.objects[newId]) {
            main.showMessage($.i18n('Name yet exists!'), '', 'notice');
            return false;
        }

        main.socket.emit('setObject', newId, {
            _id: newId,
            common:   {
                name: name,
                members: []
            },
            type: 'enum'
        });
        return true;
    }

    function enumMembers(id) {
    }

    function prepareEnumMembers() {
    }

    this.prepare = function () {
        $('#menu-enums-div').load("templates/enums.html", function () {
            
            $enumsContainer = $('#enumsTemplate');
            
        });
    };

    this.init = function (update, expandId) {
        if (!this.main || !this.main.objectsLoaded) {
            setTimeout(that.init, 250);
            return;
        }
        
        this.main.fillContent('#menu-enums-div');
    };

    this.objectChange = function (id, obj) {
    };

}