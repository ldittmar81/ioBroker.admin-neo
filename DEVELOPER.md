![Logo](admin/admin-neo.png)
# ioBroker.admin-neo developer guide

## Usage

### Tooltips with translation

```
<i class="fa fa-question-circle" data-i18n-tooltip="tooltip_lePort"></i>
```

### Change tooltips

```
$('#element').changeTooltip('New Tooltip!');
```

### Icons -> fa-icons at showMessage and confirmMessage

```
"alert".text2iconClass      // "fa-exclamation-triangle text-danger"
"help".text2iconClass       // "fa-question-circle text-info"
"notice".text2iconClass     // "fa-exclamation-circle text-info"

"test".text2iconClass       //"fa-test"
"fa-test".text2iconClass    //"fa-test"
```

### "test".startsWith("te") -> true

```
var str = 'ioBroker ist einfach super';

console.log(str.startsWith('ioBroker ist'));    // true
console.log(str.startsWith('einfach'));         // false
console.log(str.startsWith('einfach', 13));     // true
```

## Bibliotheken

### CSS
* Bootstrap 3.3.7 http://getbootstrap.com/
* Font Awesome 4.7.0 http://fontawesome.io/examples/
* Animate.css 3.5.2 https://daneden.github.io/animate.css/

### JS
* Bootstrap 3.3.7 http://getbootstrap.com/
* jQuery 3.3.1 https://api.jquery.com/
* jQuery i18n 1.0.4 https://github.com/wikimedia/jquery.i18n
* Bootbox 4.4.0 https://bootboxjs.com/
* Bootstrap Select 1.12.2 https://silviomoreto.github.io/bootstrap-select/
* iCheck 1.0.2 http://icheck.fronteed.com/
* Parsley 2.7.0 http://parsleyjs.org/
* PNotify 3.0.0 https://sciactive.github.io/pnotify/
* jQuery Inputmask 3.3.4 http://robinherbots.github.io/Inputmask/
* Dropzone 4.3.0 http://www.dropzonejs.com/

## Other programs
Use https://github.com/jcbvm/i18n-editor for translations

## Javascript & CSS-Style nicht in der HTML
Damit das ganze flexibler wird, sollte man möglichst alle JavaScripts und CSS-Styles in den entsprechenden Dateien auslagern. Warum? Wenn man anstatt überall style="color: #ffe6e6;" macht und auf einmal merkt man dass es zu Hell sei, dann müsste man überall wieder rein gehen und auf ein andern Wert setzen. Wenn man aber dafür eine Klasse erstellt z.B. class="danger", dann könnte man einfach die Änderung global machen.
Wenn weder JS noch CSS in einer HTML ist, könnte man diese einfach durch eine andere ersetzen und es würde alles gleich funktionieren (verschiedene Styles) - man müsste nur auf die ids und classes auchten.