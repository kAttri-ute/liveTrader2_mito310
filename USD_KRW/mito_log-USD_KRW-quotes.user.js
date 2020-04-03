// ==UserScript==
// @name         mito_log[USD/KRW]by-quotes
// @namespace    https://quotes.ino.com/chart/?s=FOREX_USDKRW
// @version      0.0.1
// @description  USD/KRW autologger...?
// @author       Trader@Live!
// @match        https://quotes.ino.com/chart/?s=FOREX_USDKRW*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 日本時間にする
     **/
    var DateToJST = (function() {
        // アメリカ東部タイムゾーン(EST:標準時/ EDT:夏時間)
        const TZ = { EST: 14, EDT: 13, JST: 0, UTC: 9 };
        var plusDiff = 0;
        // 日本時間に変換する
        let _dateToJST = function(timezone = 'UTC') {
            plusDiff = TZ[timezone];
            return this;
        };
        _dateToJST.prototype.GetDate = function(dt) {
            let d = new Date(dt);
            d.setHours(d.getHours() + plusDiff);
            // 文字列に整形
            let fn = function(v, l) {
                let x = '000' + v.toString();
                return x.substring(x.length - l);
            };
            let ret = 'Y-M-D h:i:s';
            ret = ret.replace('Y', fn(d.getFullYear(), 4)).replace('M', fn(d.getMonth() + 1, 2)).replace('D', fn(d.getDate(), 2));
            ret = ret.replace('h', fn(d.getHours(), 2)).replace('i', fn(d.getMinutes(), 2)).replace('s', fn(d.getSeconds(), 2));
            return ret;
        };
        return _dateToJST;
    })();

    /**
     * リロード対策にSessionStorage
     **/
    var SesStoIO = (function() {
        let s = sessionStorage;
        let k = 'quotes';
        let GetObj = function() { return JSON.parse(s.getItem(k)); };
        // ---
        let _sesStoIO = function() {
            let tmp = s.getItem(k);
            if(tmp == null) { s.setItem(k, '[]'); }
            return this;
        };
        _sesStoIO.prototype.getAll = function() { return GetObj(); };
        _sesStoIO.prototype.set = function(val, dt) {
            let tmp = GetObj();
            // 先頭に追加して100以上のデータを削除
            tmp.unshift({v: val, d: dt})
            tmp = tmp.filter((e, i) => (i < 100));
            s.setItem(k, JSON.stringify(tmp));
            return true;
        };
        return _sesStoIO;
    })();

    // ログ出力の枠をセット
    var storage = new SesStoIO();
    let $wrap = document.getElementById('quote-above-chart-component');
    let $content = document.createElement('div');
    (() => {
        $content.setAttribute('id', 'mito-log');
        $content.setAttribute('style', 'border:3px double #c0c0c0; height:8rem; overflow:auto; font-family:monospace; font-size:110%;');
        $wrap.appendChild($content);
        // 過去ログを画面に反映
        let logs = storage.getAll();
        if(0 < logs.length) {
            logs.forEach((val, i) => {
                if(i == 0) prev = val.d;
                let _p = GetP(val.v);
                $content.appendChild(_p);
            });
        }
    })();
    var prev = '---';
    /**
     * ログ要素をつくる
     */
    var GetP = function(price, dt) {
        let result = document.createElement('p');
        result.setAttribute('style', 'border-bottom:1px dashed #c0c0c0; margin-bottom:0; padding:0.4rem 0.5rem;');
        result.appendChild(document.createTextNode(price));
        if(dt !== undefined) {
            result.appendChild(document.createTextNode(' '));
            result.appendChild(document.createTextNode(toJST.GetDate(dt)));
            result.appendChild(document.createTextNode(' JST,15min delay'));
        }
        return result;
    };
    /**
     * 値の取得+ログ出力
     **/
    function DateChange() {
        var price = $wrap.querySelector('p.quote-price').textContent;
        var dt = $wrap.querySelector('p.quote-date > span').textContent;
        if(dt != prev) {
            let p = GetP(price, dt);
            let first = $content.firstChild;
            if(first == null) {
                $content.appendChild(p);
            } else {
                $content.insertBefore(p, first);
            }
            storage.set(p.textContent, dt);
            prev = dt;
        }
    }

    var inv_id;
    let tz_id;
    var toJST;
    let tz;
    // タイムゾーン取得できたらログ取り開始
    tz_id = setInterval(() => {
        tz = document.getElementById('page-timestamp').textContent;
        if (tz != undefined) {
            tz = tz.trim().split(' ').reverse()[0];
            toJST = new DateToJST(tz);
            clearInterval(tz_id);
            inv_id = setInterval(DateChange, 3200);
        }
    }, 500);

})();
