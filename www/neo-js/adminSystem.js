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
/* global availableLanguages, systemLang */

/**
 * @constructor
 * @param {Object} main
 * @returns {System}
 */
function System(main) {
    'use strict';
    var that = this;

    var $dialogSystem, $gridRepo, $gridCerts;

    var editingCerts = [];
    var editingRepos = [];

    this.systemRepos = null;
    this.systemCerts = null;

    function string2cert(name, str) {
        // expected format: -----BEGIN CERTIFICATE-----certif...icate==-----END CERTIFICATE-----
        if (str.length < '-----BEGIN CERTIFICATE-----==-----END CERTIFICATE-----'.length) {
            main.showMessage($.i18n('invalidCertShort', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) === '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length - '-----END RSA PRIVATE KEY-----'.length) !== '-----END RSA PRIVATE KEY-----') {
                main.showMessage($.i18n('certMustEndWith', name, "-----END RSA PRIVATE KEY-----"), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN RSA PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END RSA PRIVATE KEY-----'.length);
            str = str.replace(/\s/g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN RSA PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END RSA PRIVATE KEY-----\r\n';
        } else if (str.substring(0, '-----BEGIN PRIVATE KEY-----'.length) === '-----BEGIN PRIVATE KEY-----') {
            if (str.substring(str.length - '-----END PRIVATE KEY-----'.length) !== '-----END PRIVATE KEY-----') {
                main.showMessage($.i18n('certMustStartWith', name, "-----BEGIN PRIVATE KEY-----"), '', 'notice');
                return '';
            }
            str = str.substring('-----BEGIN PRIVATE KEY-----'.length);
            str = str.substring(0, str.length - '-----END PRIVATE KEY-----'.length);
            str = str.replace(/\s/g, '');
            while (str.length) {
                lines.push(str.substring(0, 64));
                str = str.substring(64);
            }
            return '-----BEGIN PRIVATE KEY-----\r\n' + lines.join('\r\n') + '\r\n-----END PRIVATE KEY-----\r\n';
        } else {
            if (str.substring(0, '-----BEGIN CERTIFICATE-----'.length) !== '-----BEGIN CERTIFICATE-----') {
                main.showMessage($.i18n('certMustStartWith', name, "-----BEGIN CERTIFICATE-----"), '', 'notice');
                return '';
            }
            if (str.substring(str.length - '-----END CERTIFICATE-----'.length) !== '-----END CERTIFICATE-----') {
                main.showMessage($.i18n('certMustEndWith', name, "-----END CERTIFICATE-----"), '', 'notice');
                return '';
            }
            // process chained certificates
            var parts = str.split('-----END CERTIFICATE-----');
            for (var p = parts.length - 1; p >= 0; p--) {
                if (!parts[p].replace(/[\r\n|\r|\n]+/, '').trim()) {
                    parts.splice(p, 1);
                    continue;
                }
                str = parts[p];
                str = str.substring('-----BEGIN CERTIFICATE-----'.length);
                str = str.replace(/\s/g, '');
                lines = [];
                while (str.length) {
                    lines.push(str.substring(0, 64));
                    str = str.substring(64);
                }
                parts[p] = '-----BEGIN CERTIFICATE-----\r\n' + lines.join('\r\n') + '\r\n-----END CERTIFICATE-----\r\n';
            }

            return parts.join('');
        }
    }

    function cert2string(cert) {
        var res = cert.replace(/(?:\\[rn]|[\r\n]+)+/g, '');
        return res;
    }

    function addCert(name, text) {

    }

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function finishEditingRepo() {
        if (editingRepos.length) {
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();

            for (var i = 0; i < editingRepos.length; i++) {
                //TODO $gridRepo.jqGrid('saveRow', editingRepos[i], {url: 'clientArray'});
                updateRepoListSelect();
            }
            editingRepos = [];
        }
    }
    function initRepoGrid() {

        $gridRepo.bootstrapTable();

        if (that.systemRepos && that.systemRepos.native.repositories) {
            var id = 1;
            // list of the repositories
            for (var repo in that.systemRepos.native.repositories) {

                var row = [{
                        _id: id,
                        name: repo,
                        link: (typeof that.systemRepos.native.repositories[repo] === 'object') ? that.systemRepos.native.repositories[repo].link : that.systemRepos.native.repositories[repo],
                        commands: addButtonsFormatter(id, "repo")
                    }];
                $gridRepo.bootstrapTable('append', row);

                id++;
            }

            initRepoButtons();
        } else {
            $('#tab-system-repo').html($.i18n('permissionError'));
        }
    }
    function initRepoButtons() {
        $('.repo-edit-submit').on("click", function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').hide();
            $('.repo-delete-submit').hide();
            $('.repo-ok-submit[data-repo-id="' + id + '"]').show();
            $('.repo-cancel-submit[data-repo-id="' + id + '"]').show();
            /* TODO $gridRepo.jqGrid('editRow', 'repo_' + id, {url: 'clientArray'});
             if (editingRepos.indexOf('repo_' + id) === -1) editingRepos.push(rowid);*/
        });

        $('.repo-delete-submit').on("click", function () {
            var id = $(this).attr('data-repo-id');
            //TODO $gridRepo.jqGrid('delRowData', 'repo_' + id);
            updateRepoListSelect();
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) {
                editingRepos.splice(pos, 1);
            }
        });

        $('.repo-ok-submit').on("click", function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            //TODO $gridRepo.jqGrid('saveRow', 'repo_' + id, {"url":"clientArray"});
            updateRepoListSelect();
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) {
                editingRepos.splice(pos, 1);
            }
        });

        $('.repo-cancel-submit').on("click", function () {
            var id = $(this).attr('data-repo-id');
            $('.repo-edit-submit').show();
            $('.repo-delete-submit').show();
            $('.repo-ok-submit').hide();
            $('.repo-cancel-submit').hide();
            //TODO $gridRepo.jqGrid('restoreRow', 'repo_' + id, false);
            var pos = editingRepos.indexOf('repo_' + id);
            if (pos !== -1) {
                editingRepos.splice(pos, 1);
            }
        });
    }
    function updateRepoListSelect() {
        var selectedRepo = $('#system_activeRepo').val();
        var isFound = false;
        $('#system_activeRepo').html('');
        var data = $gridRepo.jqGrid('getRowData');
        for (var i = 0; i < data.length; i++) {
            $('#system_activeRepo').append('<option value="' + data[i].name + '">' + data[i].name + '</option>');
            if (selectedRepo === data[i].name) {
                isFound = true;
            }
        }

        $('#system_activeRepo').selectpicker('refresh');

        if (isFound) {
            $('#system_activeRepo').val(selectedRepo);
        }
    }

    function fileHandler(event) {
        event.preventDefault();
        var file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];

        var $dz = $('#drop-zone');
        if (file.size > 10000) {
            $('#drop-text').html($.i18n('fileTooBig'));
            $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                main.showError($.i18n('fileTooBig'));
                $('#drop-text').html($.i18n('drop-zone'));
            });
            return false;
        }

        $dz.show();

        var reader = new FileReader();
        reader.onload = function (evt) {
            var text;
            try {
                text = atob(evt.target.result.split(',')[1]); // string has form data:;base64,TEXT==
            } catch (err) {
                $('#drop-text').html($.i18n('cannotReadFile'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError($.i18n('cannotReadFile'));
                    $('#drop-text').html($.i18n('drop-zone'));
                });
                return;
            }
            text = text.replace(/(\r\n|\n|\r)/gm, '');
            if (text.indexOf('BEGIN RSA PRIVATE KEY') != -1) {
                $dz.hide();
                addCert('private', text);
            } else if (text.indexOf('BEGIN PRIVATE KEY') != -1) {
                $dz.hide();
                addCert('private', text);
            } else if (text.indexOf('BEGIN CERTIFICATE') != -1) {
                $dz.hide();
                var m = text.split('-----END CERTIFICATE-----');
                var count = 0;
                for (var _m = 0; _m < m.length; _m++) {
                    if (m[_m].replace(/[\r\n|\r|\n]+/, '').trim())
                        count++;
                }
                if (count > 1) {
                    addCert('chained', text);
                } else {
                    addCert('public', text);
                }

            } else {
                $('#drop-text').html($.i18n('unknownFormat'));
                $dz.addClass('dropZone-error').animate({opacity: 0}, 1000, function () {
                    $dz.hide().removeClass('dropZone-error').css({opacity: 1});
                    main.showError($.i18n('unknownFormat'));
                    $('#drop-text').html($.i18n('drop-zone'));
                });
            }
        };
        reader.readAsDataURL(file);
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function finishEditingCerts() {

    }
    function initCertsGrid() {

        $gridCerts.bootstrapTable();

        if (that.systemCerts && that.systemCerts.native.certificates) {
            var id = 1;
            // list of the repositories
            for (var cert in that.systemCerts.native.certificates) {
                var row = [{
                        _id: id,
                        name: cert,
                        certificate: cert2string(that.systemCerts.native.certificates[cert]),
                        commands: addButtonsFormatter(id, "cert")
                    }];
                $gridCerts.bootstrapTable('append', row);

                id++;
            }

            initCertButtons();
        } else {
            $('#tab-system-certs').html($.i18n('permissionError'));
        }

        var $dropZone = $('#tab-system-certs');
        if (typeof (window.FileReader) !== 'undefined' && !$dropZone.data('installed')) {
            $dropZone.data('installed', true);
            var $dz = $('#drop-zone');
            $('#drop-text').html($.i18n('drop-zone'));
            $dropZone[0].ondragover = function () {
                $dz.unbind('click');
                $dz.show();
                return false;
            };
            $dz.click(function () {
                $dz.hide();
            });

            $dz[0].ondragleave = function () {
                $dz.hide();
                return false;
            };

            $dz[0].ondrop = fileHandler;
        }

        $('#drop-file').change(fileHandler);
    }

    function initCertButtons() {
    }

    function updateCertListSelect() {
    }

    this.init = function () {
        if (!main.systemConfig.error) {
            $('#button-system, #link-system').click(function () {

                $('#system_activeRepo').html('');

                if (that.systemRepos && that.systemRepos.native.repositories) {
                    for (var repo in that.systemRepos.native.repositories) {
                        $('#system_activeRepo').append('<option value="' + repo + '">' + repo + '</option>');
                    }
                } else {
                    $('#tab-system-repo').html($.i18n('permissionError'));
                }

                $('#diagMode')
                        .val(main.systemConfig.common.diag)
                        .change(function () {
                            main.socket.emit('sendToHost', main.currentHost, 'getDiagData', $(this).val(), function (obj) {
                                $('#diagSample').html(JSON.stringify(obj, null, 2));
                            });
                        })
                        .trigger('change');

                // collect all history instances
                $('#system_defaultHistory').html('<option value=""></option>');
                for (var id = 0; id < main.instances.length; id++) {
                    if (main.objects[main.instances[id]].common.type === 'storage') {
                        $('#system_defaultHistory')
                                .append('<option value="' + main.instances[id].substring('system.adapter.'.length) + '">' + main.instances[id].substring('system.adapter.'.length) + '</option>');
                    }
                }

                $('.system-settings.value').not('.bootstrap-select').each(function () {
                    var $this = $(this);
                    var id = $this.attr('id').substring('system_'.length);

                    if ($this.attr('type') === 'checkbox') {
                        $this.prop('checked', main.systemConfig.common[id]);
                    } else {
                        if (id === 'isFloatComma') {
                            $this.val(main.systemConfig.common[id] ? 'true' : 'false');
                        } else {
                            $this.val(main.systemConfig.common[id]);
                        }
                    }
                });

                if (!that.systemCerts.native.letsEncrypt) {
                    that.systemCerts.native.letsEncrypt = {
                        path: 'letsencrypt'
                    };
                }

                $('.system-le-settings.value').each(function () {
                    var $this = $(this);
                    var id = $this.data('name');
                    if (that.systemCerts && that.systemCerts.native.letsEncrypt) {
                        if ($this.attr('type') === 'checkbox') {
                            $this.prop('checked', that.systemCerts.native.letsEncrypt[id]);
                        } else {
                            $this.val(that.systemCerts.native.letsEncrypt[id]);
                        }
                    }
                });

                $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                    if ($(e.target).attr('href') === '#tab-system-certs') {
                        $('#drop-zone').show().css({opacity: 1}).animate({opacity: 0}, 2000, function () {
                            $('#drop-zone').hide().css({opacity: 1});
                        });
                    }
                });                

                restartFunctions('#dialog-system');

                initRepoGrid();
                initCertsGrid();

                initSaveButton();

                $dialogSystem.modal();
            });
        } else {
            $('#button-system').prop('disabled', true);
            $('#link-system').hide();
        }

    };

    this.prepare = function () {
        $('#dialog-system').load("templates/system.html", function () {

            $dialogSystem = $('#modal-system');

            for (var lang in availableLanguages) {
                $('#system_language')
                        .append('<option value="' + lang + '" ' + (systemLang === lang ? "selected" : "") + '>' + availableLanguages[lang] + '</option>');
            }

            $gridRepo = $('#grid-repos');
            $gridCerts = $('#grid-certs');

        });
    };

    function addButtonsFormatter(id, type) {
        var $tempButtons = $('#systemTemplateTableButtons').children().clone(true, true);
        $tempButtons.find('.edit-submit')
                .removeClass('edit-submit')
                .addClass(type + "-edit-submit")
                .attr("data-" + type + "-id", id);
        $tempButtons.find('.delete-submit')
                .removeClass('delete-submit')
                .addClass(type + "-delete-submit")
                .attr("data-" + type + "-id", id);
        $tempButtons.find('.ok-submit')
                .removeClass('ok-submit')
                .addClass(type + "-ok-submit")
                .attr("data-" + type + "-id", id);
        $tempButtons.find('.cancel-submit')
                .removeClass('cancel-submit')
                .addClass(type + "-cancel-submit")
                .attr("data-" + type + "-id", id);
        return $tempButtons.toString();
    }

    function initSaveButton() {

        $('#saveSystemConfigData').on("click", function () {
            var common = main.systemConfig.common;
            var languageChanged = false;
            var activeRepoChanged = false;

            finishEditingCerts();
            finishEditingRepo();

            $('.system-settings.value').each(function () {
                var $this = $(this);
                var id = $this.attr('id').substring('system_'.length);

                if ($this.attr('type') === 'checkbox') {
                    common[id] = $this.prop('checked');
                } else {
                    if (id === 'language' && common.language !== $this.val()) {
                        languageChanged = true;
                    }
                    if (id === 'activeRepo' && common.activeRepo !== $this.val()) {
                        activeRepoChanged = true;
                    }
                    common[id] = $this.val();
                    if (id === 'isFloatComma') {
                        common[id] = (common[id] === 'true' || common[id] === true);
                    }
                }
            });

            // Fill the repositories list
            var links = {};
            if (that.systemRepos) {
                for (var r in that.systemRepos.native.repositories) {
                    if (typeof that.systemRepos.native.repositories[r] === 'object' && that.systemRepos.native.repositories[r].json) {
                        links[that.systemRepos.native.repositories[r].link] = that.systemRepos.native.repositories[r].json;
                    }
                }
                that.systemRepos.native.repositories = {};
            }

            var data = $gridRepo.bootstrapTable('getData');
            if (that.systemRepos) {
                var first = null;
                for (var i = 0; i < data.length; i++) {
                    that.systemRepos.native.repositories[data[i].name] = {link: data[i].link, json: null};
                    if (links[data[i].link]) {
                        that.systemRepos.native.repositories[data[i].name].json = links[data[i].link];
                    }
                    if (!first) {
                        first = data[i].name;
                    }
                }
                // Check if the active repository still exist in the list
                if (!first) {
                    if (common.activeRepo) {
                        activeRepoChanged = true;
                        common.activeRepo = '';
                    }
                } else if (!that.systemRepos.native.repositories[common.activeRepo]) {
                    activeRepoChanged = true;
                    common.activeRepo = first;
                }
            }
            common.diag = $('#diagMode').val();

            if (that.systemCerts) {
                // Fill the certificates list
                that.systemCerts.native.certificates = {};
                data = $gridCerts.bootstrapTable('getData');
                for (var j = 0; j < data.length; j++) {
                    that.systemCerts.native.certificates[data[j].name] = string2cert(data[j].name, data[j].certificate);
                }

                $('.system-le-settings.value').each(function () {
                    var $this = $(this);
                    var id = $this.data('name');

                    if ($this.attr('type') === 'checkbox') {
                        that.systemCerts.native.letsEncrypt[id] = $this.prop('checked');
                    } else {
                        that.systemCerts.native.letsEncrypt[id] = $this.val();
                    }
                });
            }

            main.socket.emit('extendObject', 'system.config', {common: common}, function (err) {
                if (!err) {
                    if (languageChanged) {
                        window.location.reload();
                    } else {
                        if (activeRepoChanged) {
                            setTimeout(function () {
                                that.main.menus.adapters.init(true);
                            }, 0);
                        }
                    }
                } else {
                    main.showError(err);
                    return;
                }

                main.socket.emit('extendObject', 'system.repositories', that.systemRepos, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    if (activeRepoChanged) {
                        setTimeout(function () {
                            that.main.menus.adapters.init(true);
                        }, 0);
                    }

                    main.socket.emit('extendObject', 'system.certificates', that.systemCerts, function (err) {
                        if (err) {
                            console.log(err);
                        }
                        $dialogSystem.modal('hide');
                    });
                });
            });
        });

    }
}