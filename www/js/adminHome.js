function Home(main) {
    "use strict";

    var that = this;
    this.menuIcon = 'fa-home';
    
    this.main = main;
    
    this.prepare = function () {
        $('#menu-home-div').load("templates/home.html", function () {
            restartFunctions('menu-home-div');
        });
        
    };
    
    this.init = function () {
        this.main.fillContent('#menu-home-div');
        startClock();              
    };
    
}