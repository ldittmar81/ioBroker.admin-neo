/* global availableLanguages */
/* global systemLang */

function System(main) {
    'use strict';
    var that = this;

    var $dialogSystem;

    var editingCerts = [];
    var editingRepos = [];

    this.systemRepos = null;
    this.systemCerts = null;


    function string2cert(name, str) {
        // expected format: -----BEGIN CERTIFICATE-----certif...icate==-----END CERTIFICATE-----
        if (str.length < '-----BEGIN CERTIFICATE-----==-----END CERTIFICATE-----'.length) {
            main.showMessage(_('Invalid certificate "%s". To short.', name));
            return '';
        }
        var lines = [];
        if (str.substring(0, '-----BEGIN RSA PRIVATE KEY-----'.length) == '-----BEGIN RSA PRIVATE KEY-----') {
            if (str.substring(str.length - '-----END RSA PRIVATE KEY-----'.length) != '-----END RSA PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END RSA PRIVATE KEY-----".', name), '', 'notice');
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
        } else if (str.substring(0, '-----BEGIN PRIVATE KEY-----'.length) == '-----BEGIN PRIVATE KEY-----') {
            if (str.substring(str.length - '-----END PRIVATE KEY-----'.length) != '-----END PRIVATE KEY-----') {
                main.showMessage(_('Certificate "%s" must end with "-----BEGIN PRIVATE KEY-----".', name), '', 'notice');
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
            if (str.substring(0, '-----BEGIN CERTIFICATE-----'.length) != '-----BEGIN CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must start with "-----BEGIN CERTIFICATE-----".', name), '', 'notice');
                return '';
            }
            if (str.substring(str.length - '-----END CERTIFICATE-----'.length) != '-----END CERTIFICATE-----') {
                main.showMessage(_('Certificate "%s" must end with "-----END CERTIFICATE-----".', name), '', 'notice');
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

    function prepareRepos() {
    }

    function addCert(name, text) {
    }

    function prepareCerts() {
    }

    // ----------------------------- Repositories show and Edit ------------------------------------------------
    function finishEditingRepo() {
    }
    function initRepoGrid(update) {
    }
    function initRepoButtons() {
    }
    function updateRepoListSelect() {

    }

    function fileHandler(event) {
    }

    // ----------------------------- Certificates show and Edit ------------------------------------------------
    function finishEditingCerts() {
    }
    function initCertsGrid(update) {
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

                $('.system-settings.value').each(function () {
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

                $dialogSystem.modal();
            });
        } else {
            $('#button-system').prop('disabled', true);
            $('#link-system').hide();
        }
        restartFunctions('#dialog-system');
    };

    this.prepare = function () {
        $('#dialog-system').load("templates/dialogs.html #modal-system", function () {
       
            for (var lang in availableLanguages) {
                $('#system_language')
                        .append('<option value="' + lang + '" ' + (systemLang === lang ? "selected" : "") + '>' + availableLanguages[lang] + '</option>');
            }

            $dialogSystem = $('#modal-system');

            initRepoGrid();
            initCertsGrid();

        });
    };
}