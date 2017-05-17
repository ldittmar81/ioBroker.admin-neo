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
 * @returns {Info}  
 */
function Info(main) {
    'use strict';
    var that = this;

    var $dialogInfo;

    this.prepare = function () {
        $('#dialog-info').load("templates/info.html", function () {

            $dialogInfo = $('#modal-info');

            $('#button-info, #link-info').click(function () {
                that.init();
            });

        });
    };

    this.init = function () {
        $dialogInfo.modal();
    };
}