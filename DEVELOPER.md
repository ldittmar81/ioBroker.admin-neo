![Logo](admin/admin-neo.png)
# ioBroker.admin-neo developer guide

## Bibliotheken

### CSS
* Bootstrap 3.3.7 http://getbootstrap.com/
* Font Awesome 4.7.0 http://fontawesome.io/examples/

### JS
* Bootstrap 3.3.7 http://getbootstrap.com/
* jQuery 3.3.1 https://api.jquery.com/
* jQuery i18n 1.0.4 https://github.com/wikimedia/jquery.i18n

## Other programs
Use https://github.com/jcbvm/i18n-editor for translations

## Javascript & CSS-Style nicht in der HTML
Damit das ganze flexibler wird, sollte man möglichst alle JavaScripts und CSS-Styles in den entsprechenden Dateien auslagern. Warum? Wenn man anstatt überall style="color: #ffe6e6;" macht und auf einmal merkt man dass es zu Hell sei, dann müsste man überall wieder rein gehen und auf ein andern Wert setzen. Wenn man aber dafür eine Klasse erstellt z.B. class="danger", dann könnte man einfach die Änderung global machen.
Wenn weder JS noch CSS in einer HTML ist, könnte man diese einfach durch eine andere ersetzen und es würde alles gleich funktionieren (verschiedene Styles) - man müsste nur auf die ids und classes auchten.