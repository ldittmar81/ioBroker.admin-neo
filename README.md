![Logo](admin/admin-neo.png)
# ioBroker.admin-neo
===================

[![NPM version](http://img.shields.io/npm/v/iobroker.admin-neo.svg)](https://www.npmjs.com/package/iobroker.admin-neo)
[![Downloads](https://img.shields.io/npm/dm/iobroker.admin-neo.svg)](https://www.npmjs.com/package/iobroker.admin-neo)
[![Dependency Status](https://img.shields.io/david/ldittmar81/iobroker.admin-neo.svg)](https://david-dm.org/ldittmar81/iobroker.admin-neo)
[![Known Vulnerabilities](https://snyk.io/test/github/ldittmar81/ioBroker.admin-neo/badge.svg)](https://snyk.io/test/github/ldittmar81/ioBroker.admin-neo)
[![bitHound Overall Score](https://www.bithound.io/github/ldittmar81/ioBroker.admin-neo/badges/score.svg)](https://www.bithound.io/github/ldittmar81/ioBroker.admin-neo)

[![NPM](https://nodei.co/npm/iobroker.admin-neo.png?downloads=true)](https://nodei.co/npm/iobroker.admin-neo/)

**Tests:** Linux/Mac: [![Travis-CI](http://img.shields.io/travis/ldittmar81/ioBroker.admin-neo/master.svg)](https://travis-ci.org/ldittmar81/ioBroker.admin-neo)
Windows: [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/ldittmar81/ioBroker.admin-neo?branch=master&svg=true)](https://ci.appveyor.com/project/ldittmar81/ioBroker-admin-neo/)

User interface for configuration and administration.

## Using common.localLink

- %ip% - ioBroker ip address (address of the admin)
- %secure% or %protocol% - read from native.secure the value and use http or https
- %web_protocol% - looking for the first instance of web (e.g. web.0) and get "native.secure" from "system.adapter.web.0"
- %instance% - instance of the adapter
- %someField% - get someField from "native" of this adapter instance
- %web.0_bind% - get native.bind from "system.adapter.web.0"
- %native_someField% - get someField from "native" of this adapter instance

## Scheduled restart
Some adapters re not stable or connection disappear after one or two days.
To fix this there is a scheduled restart setting.
To activate scheduled restart just define CRON condition when to restart adapter.

It is suggested to restart in the night, when no one use the adapter, e.g. "0 3 * * *" - at 3:00 every day.

## Let's Encrypt Certificates
Let’s Encrypt is a free, automated, and open certificate authority brought to you by the non-profit Internet Security Research Group (ISRG).

You can read about Let’s Encrypt [here](https://letsencrypt.org/).

Some installations use Dynamic DNS and Co to get the domain name and to reach under this domain name own web sites.
ioBroker supports automatic request and renew of certificates from Let’s Encrypt Organisation.

There is an option to activate free certificates from Let’s Encrypt almost in every adapter, that can start some web server and supports HTTPS.

If you just enable the using of certificates and will not activate an automatic update the instance will try to use stored certificates.

If the automatic update is activated the instance will try to request certificates from Let’s Encrypt and will automatically update it.

The certificates will be first requested when the given domain address will be accessed. E.g you have "sub.domain.com" as address, when you try to access https://sub.domain.com the certificates will be first requested and it can last a little before first answer will come.

The issuing of certificates is rather complex procedure, but if you will follow the explanation you will easy get free certificates.

Description:

1. The new account will be created with given email address (you must set it up in system settings)
2. Some random key will be created as password for the account.
3. After the account is created the system starts on port 80 the small web site to confirm the domain.
4. Let's encrypt use **always** port **80** to check the domain.
5. If port 80 is occupied by other service see point 4.
6. After the small web server is up the request to get certificates for given domains (system settings) will be sent to the Let's encrypt server.
7. Let's encrypt server sends back some challenge phrase as answer on the request and after a while tries to read this challenge phrase on "http://yourdomain:80/.well-known/acme-challenge/<CHALLENGE>"
8. If challenge phrase from our side comes back the Let's encrypt server send us the certificates. They will be stored in the given directory (system settings).

Sounds complex, but everything what you must do is to activate checkboxes and specify your email and domain in system settings.

The received certificates are valid ca. 90 days.
After the certificates are received the special task will be started to automatically renew the certificates.

The topic is rather complex and 1000 things can go wrong. If you cannot get certificates please use cloud service to reach your installation from internet.

**Let's encrypt works only from node.js version>=4.5**

## Changelog
### 0.0.1 (2017-03-15)
* (ldittmar) inicial commit

## License
The MIT License (MIT)

Copyright (c) 2017 ldittmar <iobroker@lmdsoft.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.