function Home(main) {
    "use strict";

    var that = this;
    this.menuIcon = 'fa-home';

    this.main = main;

    this.prepare = function () {
        $('#menu-home-div').load("templates/home.html", function () {

        });
    };

    this.init = function () {
        this.main.fillContent('#menu-home-div');
        startClock();
    };
    
        function startClock() {
        isClockOn = true;
        secInterval = setInterval(function () {
            var seconds = new Date().getSeconds();
            var sdegree = seconds * 6;
            var srotate = "rotate(" + sdegree + "deg)";

            $("#cssSec").css({"-moz-transform": srotate, "-webkit-transform": srotate});

        }, 1000);


        hourInterval = setInterval(function () {
            var hours = new Date().getHours();
            if (hours === 0) {
                getActualDate();
            }
            var mins = new Date().getMinutes();
            var hdegree = hours * 30 + (mins / 2);
            var hrotate = "rotate(" + hdegree + "deg)";

            $("#cssHour").css({"-moz-transform": hrotate, "-webkit-transform": hrotate});

        }, 1000);


        minInterval = setInterval(function () {
            var mins = new Date().getMinutes();
            var mdegree = mins * 6;
            var mrotate = "rotate(" + mdegree + "deg)";

            $("#cssMin").css({"-moz-transform": mrotate, "-webkit-transform": mrotate});

        }, 1000);

        getActualDate();

        $(window).on('resize', checkWindowSize);
        checkWindowSize();
    }

    function getActualDate() {
        var MONTH = [
            'january',
            'february',
            'march',
            'april',
            'may',
            'june',
            'july',
            'august',
            'september',
            'october',
            'november',
            'december'
        ];
        var DOW = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday'
        ];
        var date = new Date();
        $('#date_now').text(date.getDate() + ". " + $.i18n(MONTH[date.getMonth()]) + " " + date.getFullYear());
        $('#weekday_now').text($.i18n(DOW[date.getDay()]));
    }

    function checkWindowSize() {
        var windowsize = $(window).width();
        if (windowsize < 992) {
            $('.clock').prependTo('.justify-content-start');
        } else {
            $('.clock').appendTo('.justify-content-start');
        }        
    }

}