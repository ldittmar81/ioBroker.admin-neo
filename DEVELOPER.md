![Logo](admin/admin-neo.png)
# ioBroker.admin-neo developer guide

## Usage

### Tooltips with translation

```
<i class="fa fa-question-circle" data-i18n-tooltip="tooltip_lePort"></i>
```

### Custom attribute with translation

```
<input type="text" placeholder="hallo" data-i18n-attr="tooltip_lePort|placeholder"></i>
```

### Change tooltips

```
$('#element').changeTooltip('New Tooltip!');
```

### Translation with HTML tags

```
<p data-i18n-html="htmlData"></p>
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

### SwitchClass for jQuery

```
<div id="hallo" class="test"></div>
$('#hallo').switchClass('test','test2');
...
<div id="hallo" class="test2"></div>
$('#hallo').switchClass('test2','yellow');
...
<div id="hallo" class="yellow"></div>
```

### Alert message

alert(message, type, title);

type = notice, error, success, info

```
alert('Hello World'); // == alert('Hello World', 'notice', $.i18n('notice');
```

### Progress bar

Ist must be a div with class "meter" and a span as child
```
<div id="meter" class="meter nostripes">
    <span style="width: 1%;"></span>
</div>

$('#meter).progressbar(50); // set progres bar to 50%
$('#meter).progressbar('+5'); // add 5% to the progress bar (max 90%)
$('#meter).progressbar('10', 'error'); // set progress bar to 10% with color red
$('#meter).progressbar('error', '10'); // set progress bar to 10% with color red
$('#meter).progressbar('warning'); // set progress bar to color orange
$('#meter).progressbar('auto'); // auto increase bar till 90%
```

## Bibliotheken

### CSS
* Bootstrap 3.3.7 http://getbootstrap.com/
* Font Awesome 4.7.0 http://fontawesome.io/examples/
* Animate.css 3.5.2 https://daneden.github.io/animate.css/

### JS
* Bootstrap 3.3.7 http://getbootstrap.com/
* jQuery 3.3.1 https://api.jquery.com/
* jQuery UI 1.12.1 (Drag & Drop + Blind + Keycode + UniqueID) https://jqueryui.com/download/#!version=1.12.1&components=101010010111110000000000010000001100000000000000
* jQuery i18n master 07.06.17 https://github.com/wikimedia/jquery.i18n
* jQuery Mobile v1.5.0-pre (Touch-Events & Orientation-Events) http://jquerymobile.com/
* Bootbox 4.4.0 https://bootboxjs.com/
* Bootstrap Select 1.12.2 https://silviomoreto.github.io/bootstrap-select/
* iCheck 1.0.2 http://icheck.fronteed.com/
* Parsley 2.7.0 http://parsleyjs.org/
* PNotify 3.0.0 https://sciactive.github.io/pnotify/
* jQuery Inputmask 3.3.4 http://robinherbots.github.io/Inputmask/
* Dropzone 4.3.0 http://www.dropzonejs.com/
* ACE 1.2.6 https://ace.c9.io/
* Showdown 1.6.3 https://github.com/showdownjs/showdown
* Bootstrap Table 1.11.1 http://bootstrap-table.wenzhixin.net.cn/
* Bootstrap Table - Editable 1.1.0 https://github.com/wenzhixin/bootstrap-table/tree/master/src/extensions/editable
* Bootstrap Table - Context 1.1.5 https://github.com/prograhammer/bootstrap-table-contextmenu
* Bootstrap Table - Sticky Header 1.0.0 https://github.com/wenzhixin/bootstrap-table/tree/master/src/extensions/sticky-header
* Bootstrap Table - Mobile 1.0.0 https://github.com/wenzhixin/bootstrap-table/tree/master/src/extensions/mobile
* jQuery Sparkline 2.1.2 http://omnipotent.net/jquery.sparkline/#s-about
* clipboard.js 1.6.1 https://clipboardjs.com/
* Fancytree 2.22.0 https://github.com/mar10/fancytree
* Sorttable 2 https://kryogenix.org/code/browser/sorttable/

## Other programs
Use https://github.com/jcbvm/i18n-editor for translations

Um die Übersetzungsdatein zu bearbeiten, empfehle ich die Installation des Editors, denn damit kann man gleichzeitig alle Sprachen bearbeiten. Sobal es installiert ist, klickt man auf "File > Import Project..." und wählt den i18n-Ordner aus. Das Programm untertützt zwar ein "Multilevel-System für Sprachen" (man kann Wörter verschachteln) aber unsere JS-Anbindung (jQuery i18n 1.0.4 https://github.com/wikimedia/jquery.i18n) nicht, also wenn man was neues hinzufügen möchte, mit der rechten Maustaste auf dem obersten Punkt "Translations" klicken und "Add translation" auswählen.

Eine orangene Markierung bei der Übersetzung bedeutet, dass das Wort in irgendeine Sprache fehlt. Sollte die Übersetzung in eine Sprache fehlen, dann wird Englisch angezeigt.

Auf der Adminoberfläche werden fehlenden Übersetzungen in der Console angezeigt. Sämtliche Übersetzungsschlüsseln MÜSSEN mit eienm kleinen Buchstaben anfangen und dürfen werder Punkt noch Leerzeichen enthalten.

## Javascript & CSS-Style nicht in der HTML
Damit das ganze flexibler wird, sollte man möglichst alle JavaScripts und CSS-Styles in den entsprechenden Dateien auslagern. Warum? Wenn man anstatt überall style="color: #ffe6e6;" macht und auf einmal merkt man dass es zu Hell sei, dann müsste man überall wieder rein gehen und auf ein andern Wert setzen. Wenn man aber dafür eine Klasse erstellt z.B. class="danger", dann könnte man einfach die Änderung global machen.
Wenn weder JS noch CSS in einer HTML ist, könnte man diese einfach durch eine andere ersetzen und es würde alles gleich funktionieren (verschiedene Styles) - man müsste nur auf die ids und classes auchten.