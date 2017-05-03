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