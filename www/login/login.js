    document.getElementById("origin").value = window.location.search.replace('&error', '');
    var userLang = navigator.language || navigator.userLanguage;
    if (window.location.search.indexOf('error') != -1) {
        if (userLang == 'ru') {
            document.getElementById('error').innerHTML = '???????? ??? ???????????? ??? ??????';
        } else if (userLang == 'de') {
            document.getElementById('error').innerHTML = 'Name oder Kennwort sind falsch';
        } else {
            document.getElementById('error').innerHTML = 'Invalid username or password';
        }
        document.getElementById('error').style.display = '';
    }
    if (userLang == 'ru') {
        if (document.getElementById('username').placeholder) {
            document.getElementById('username').placeholder = '??????? ?????';
            document.getElementById('password').placeholder = '??????? ??????';
        }
        document.getElementById('submit').value = 'Ok';
        document.getElementById('login').innerHTML  = '???? ? ?????';

    } else if (userLang == 'de') {
        if (document.getElementById('username').placeholder) {
            document.getElementById('username').placeholder = 'Login eingeben';
            document.getElementById('password').placeholder = 'Kennwort eingeben';
        }
        document.getElementById('submit').value = 'Ok';
        document.getElementById('login').innerHTML  = 'Login in Admin';
    }