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
                    if (callback)
                        callback();
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
            common: {
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

        $(window).on('resize', resizeWindow);
        resizeWindow();

        loadEnumMembers();

        this.main.fillContent('#menu-enums-div');
    };

    function loadEnumMembers() {
        var $orbitlist = $('.orbit');
        var obj = {};
        for (var key in main.objects) {
            if (key.startsWith('enum.')) {
                assign(obj, key, main.objects[key])
            }
        }
        $orbitlist.html(createList(obj, "enum"));
    }

    function createList(obj, key) {
        var text = "";
        var elem = obj[key];
        for (var k in elem) {
            if (k !== '_id' && k !== 'acl' && k !== 'common' && k !== 'type') {
                var common;
                if (Object.prototype.toString.call(elem[k]) === '[object Object]') {
                    common = elem[k]['common'];
                }
                text += "<li id='" + k + "'>" + (common ? common['name'] : k);
                text += "<ol>";
                if (common && common.members) {
                    if (common.members.length > 0) {
                        text += "<li class='orbitEnd'>" + common.members.length + "</li>";
                    }
                    text += createList(elem, k);
                }
                text += "</ol>";
                text += "</li>";
            }
        }
        return text;
    }

    this.objectChange = function (id, obj) {
    };

    function resizeWindow() {
        $('#menu-enums-div').height($('#pageContent').height());
        $('#enumsTemplate').height($('#pageContent').height());
    }

}