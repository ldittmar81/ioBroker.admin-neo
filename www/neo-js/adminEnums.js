function Enums(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-list-ol';
    this.main = main;
    this.list = [];
    this.enumEdit = null;
    this.updateTimers = null;
    this.isOrbit = false;

    var treeOptionsObjectListForEnum = {
        source: [],
        extensions: ["dnd", "glyph"],
        glyph: that.main.glyph_opts,
        dnd: {
            focusOnClick: true,
            dragStart: function (node, data) {
                return true;
            },
            dragEnter: function (node, data) {
                return false;
            },
            dragDrop: function (node, data) {
                data.otherNode.copyTo(node, data.hitMode);
            },
            draggable: {// modify default jQuery draggable options
                appendTo: "body"
            }
        }
    };

    var treeOptionsEnumList = {
        source: [],
        extensions: ["dnd", "edit", "glyph"],
        glyph: that.main.glyph_opts,
        dnd: {
            autoExpandMS: 1000,
            focusOnClick: true,
            dragStart: function (node, data) {
                return false;
            },
            dragEnter: function (node, data) {
                return true;
            },
            dragDrop: function (node, data) {
                data.otherNode.copyTo(node, data.hitMode);
            },
            draggable: {// modify default jQuery draggable options
                appendTo: "body"
            }
        },
        activate: function (event, data) {
            if (data.node.data.members) {
                $(".objectCounterForEnum").text(data.node.data.members);
            }else{
                $(".objectCounterForEnum").text("0");
            }
            $(".folderTitleForEnum").text(data.node.title);
        }
    };

    var treeOptionsEnumObjectList = {
        source: [],
        extensions: ["dnd", "glyph"],
        glyph: that.main.glyph_opts,
        dnd: {
            focusOnClick: true,
            dragStart: function (node, data) {
                return true;
            },
            dragEnter: function (node, data) {
                return true;
            },
            dragDrop: function (node, data) {
                data.otherNode.moveTo(node, data.hitMode);
            },
            draggable: {// modify default jQuery draggable options
                appendTo: "body"
            }
        }
    }

    var $enumsTemplate, $enumsTable, $enumsOrbit, $enumsContainer, $enumList, $enumObjectList, $objectList;

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

            $enumsTemplate = $('#enumsTemplate');
            $enumsTable = $('#enumsTableTemplate');
            $enumsOrbit = $('#enumsOrbitTemplate');
            $enumsContainer = $('.enums-container');

        });
    };

    this.init = function (update, expandId) {
        if (!this.main || !this.main.objectsLoaded) {
            setTimeout(that.init, 250);
            return;
        }

        $enumsContainer.html('');

        if (that.isOrbit) {
            loadOrbitEnumMembers();
        } else {
            loadEnumMembers();
        }

        this.main.fillContent('#menu-enums-div');

        $(window).smartresize(resizeWindow);
        resizeWindow();
    };

    function loadEnumMembers() {
        var $tmpTable = $enumsTable.children().clone(true, true);
        $enumsContainer.append($tmpTable);

        $enumList = $tmpTable.find('.enumList');
        $enumList.fancytree(treeOptionsEnumList);

        $enumObjectList = $tmpTable.find('.enumObjectList');
        $enumObjectList.fancytree(treeOptionsEnumObjectList);

        $objectList = $tmpTable.find(".objectListForEnum");
        $objectList.fancytree(treeOptionsObjectListForEnum);

        that.objs = [];
        that.enums = [];
        for (var key in main.objects) {
            assign(key.startsWith('enum.') ? that.enums : that.objs, key, main.objects[key]);
        }

        var enumTree = $enumList.fancytree('getTree');
        enumTree.reload(convertToEnumTree(that.enums, 'enum'));
        var objectTree = $objectList.fancytree('getTree');
        objectTree.reload(convertToObjectTree(that.objs));

    }

    function loadOrbitEnumMembers() {
        var $orbitlist = $('.orbit');
        var obj = {};
        for (var key in main.objects) {
            if (key.startsWith('enum.')) {
                assign(obj, key, main.objects[key])
            }
        }
        $orbitlist.html(createOrbitList(obj, "enum"));
    }

    function createOrbitList(obj, key) {
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
                    text += createOrbitList(elem, k);
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
        var boxHeight = $('#pageContent').height();
        if (that.isOrbit) {
            $('#menu-enums-div').height(boxHeight);
            $('#enumsTemplate').height(boxHeight);
        } else {
            boxHeight = boxHeight * 0.7;
            $enumList.height(boxHeight);
            $enumObjectList.height(boxHeight);
            $objectList.height(boxHeight);
        }

    }

}