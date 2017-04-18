function Enums(main) {
    'use strict';

    var that = this;
    this.menuIcon = 'fa-list-ol';
    this.main = main;
    this.list = [];
    this.enumEdit = null;
    this.updateTimers = null;
    this.isOrbit = false;
    this.treeOptions = {
        extensions: ["dnd", "edit", "glyph", "wide"],
        glyph: that.main.glyph_opts,
        wide: {
            iconWidth: "1em", // Adjust this if @fancy-icon-width != "16px"
            iconSpacing: "0.5em", // Adjust this if @fancy-icon-spacing != "3px"
            labelSpacing: "0.1em", // Adjust this if padding between icon and label != "3px"
            levelOfs: "1.5em"       // Adjust this if ul padding != "16px"
        }
    };

    var dndEnumObjectList = {
        focusOnClick: true,
        dragStart: function (node, data) {
            return true;
        },
        dragEnter: function (node, data) {
            return false;
        },
        dragDrop: function (node, data) {
            data.otherNode.copyTo(node, data.hitMode);
        }
    };
    
    var dndEnumList = {
        focusOnClick: true,
        dragStart: function (node, data) {
            return true;
        },
        dragEnter: function (node, data) {
            return true;
        },
        dragDrop: function (node, data) {
            data.otherNode.copyTo(node, data.hitMode);
        }
    };

    var $enumsTemplate, $enumsTable, $enumsOrbit, $enumsContainer;

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
    };

    function loadEnumMembers() {
        var $tmpTable = $enumsTable.children().clone(true, true);
        $enumsContainer.append($tmpTable);

        var $enumList = $tmpTable.find('.enumList');
        $enumList.fancytree(that.treeOptions);
        $enumList.fancytree("option", "dnd", dndEnumList);
        var $objectList = $tmpTable.find(".objectListForEnum");
        $objectList.fancytree(that.treeOptions);
        $objectList.fancytree("option", "dnd", dndEnumObjectList);

        that.objs = {};
        that.enums = {};
        for (var key in main.objects) {
            assign(key.startsWith('enum.') ? that.enums : that.objs, key, main.objects[key]);
        }

        var enumTree = $enumList.fancytree('getTree');
        //enumTree.reload(that.enums);
        var objectTree = $objectList.fancytree('getTree');
        //objectTree.reload(that.objs);

    }

    function loadOrbitEnumMembers() {

        $(window).on('resize', resizeWindow);
        resizeWindow();

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
        $('#menu-enums-div').height($('#pageContent').height());
        $('#enumsTemplate').height($('#pageContent').height());
    }

}