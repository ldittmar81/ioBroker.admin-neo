/* global systemLang, i18n */

var oldBind;
var oldSecure;
var oldPort;

function showHideSettings() {
    if ($('#secure').prop('checked')) {
        $('#_certPublic').show();
        $('#_certPrivate').show();
        $('#_certChained').show();
        $('.le-settings').show();

        if ($('#leEnabled').prop('checked')) {
            $('.le-sub-settings').show();
            if ($('#leUpdate').prop('checked')) {
                $('.le-sub-settings-update').show();
            } else {
                $('.le-sub-settings-update').hide();
            }
        } else {
            $('.le-sub-settings').hide();
        }

    } else {
        $('#_certPublic').hide();
        $('#_certPrivate').hide();
        $('#_certChained').hide();
        $('#auth').prop('checked', false);
        $('.le-settings').hide();
    }
    if ($('#auth').prop('checked')) {
        $('#secure').prop('checked', true);
        $('#defaultUser').val('admin');
        $('.defaultUser').hide();
        $('#_ttl').show();
    } else {
        $('.defaultUser').show();
        $('#_ttl').hide();
    }
}

// the function loadSettings has to exist ...
function load(settings, onChange) {
    if (!settings)
        return;

    getIPs(function (ips) {
        for (var i = 0; i < ips.length; i++) {
            $('#bind').append('<option value="' + ips[i].address + '">' + ips[i].name + '</option>');
        }
        $('#bind.value').val(settings.bind);
    });

    oldBind = settings.bind;
    oldSecure = settings.secure;
    oldPort = settings.port;

    if (settings.autoUpdate === undefined) {
        settings.autoUpdate = 24;
    }
    if (!settings.lePort) {
        settings.lePort = 80;
    }

    $('.value').each(function () {
        var key = $(this).attr('id');
        // example: select elements with id=key and class=value and insert value
        if ($('#' + key + '.value').attr('type') === 'checkbox') {
            $('#' + key + '.value').prop('checked', settings[key]).change(function () {
                showHideSettings();
                onChange();
            });
        } else {
            $('#' + key + '.value').val(settings[key]).change(onChange).keyup(function () {
                onChange();
                // Check that only numbers entered
                if ($(this).hasClass('number')) {
                    var val = $(this).val();
                    if (val) {
                        var newVal = '';
                        for (var i = 0; i < val.length; i++) {
                            if (val[i] >= '0' && val[i] <= '9') {
                                newVal += val[i];
                            }
                        }

                        if (val != newVal)
                            $(this).val(newVal);
                    }
                }
            });
        }
    });

    onChange(false);

    fillSelectCertificates('#certPublic', 'public', settings.certPublic);
    fillSelectCertificates('#certPrivate', 'private', settings.certPrivate);
    fillSelectCertificates('#certChained', 'chained', settings.certChained);
    fillUsers('#defaultUser', settings.defaultUser);

    showHideSettings();

    $('#auth').change(function () {
        if ($(this).prop('checked')) {
            $('#secure').prop('checked', true);
            showHideSettings();
        }
    });
}

function save(callback) {
    var obj = {};
    $('.value').each(function () {
        var $this = $(this);
        if ($this.attr('type') == 'checkbox') {
            obj[$this.attr('id')] = $this.prop('checked');
        } else {
            obj[$this.attr('id')] = $this.val();
        }
    });

    if ($('#secure').prop('checked') && (!$('#certPrivate').val() || !$('#certPublic').val())) {
        showMessage($.i18n('setCertMessage'));
        return;
    }
    var isRedirect = false;
    var isHttp = false;
    if (oldBind !== obj.bind) {
        isRedirect = true;
    }
    if (oldSecure !== obj.secure) {
        isHttp = true;
    }
    if (oldPort !== obj.port) {
        isRedirect = true;
    }
    var href = '';
    if (isRedirect || isHttp) {
        href = obj.secure ? 'https://' : 'http://';

        href += (obj.bind !== '0.0.0.0') ? obj.bind : document.location.hostname;
        href += ':' + obj.port;
    }

    callback(obj, null, href);
}