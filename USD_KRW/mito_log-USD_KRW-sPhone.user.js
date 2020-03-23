// ==UserScript==
// @name         mito_log[USD/KRW]@sPhone
// @namespace    https://m.jp.investing.com/currencies/usd-krw-chart
// @version      0.0
// @description  USD/KRW autologger...?
// @author       Trader@Live!
// @match        https://m.jp.investing.com/currencies/usd-krw*
// @require      https://cdn.jsdelivr.net/npm/umbrellajs
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var viewer_id = 'mito_log';
    (() => {
        // ログ出力全体像
        var viewer = document.createElement('div');
        // ページ末尾に追加枠…のような感じで
        var viewer_css = 'overflow:auto; background:#ffffff; width:100%; min-width:100%; height:15rem;';
        viewer_css += ' border-top:3px double #909090;';
        viewer.setAttribute('style', viewer_css);
        viewer.setAttribute('id', viewer_id + '_wrap');
        // 一時停止ボタン
        var btn = document.createElement('button');
        btn.setAttribute('style', 'padding:0.5rem 0.2rem;');
        btn.setAttribute('id', viewer_id + '_toggle');
        btn.appendChild(document.createTextNode('一時停止'));
        // 出力先
        var logList = document.createElement('div');
        logList.setAttribute('style', 'font-family:monospace;');
        logList.setAttribute('id', viewer_id);
        // 画面にセット
        viewer.appendChild(btn);
        viewer.appendChild(document.createElement('hr'));
        viewer.appendChild(logList);
        var append = document.getElementsByClassName('pairData')[0].parentNode;
        append.appendChild(viewer);
    })();

    // 以下、https://umbrellajs.com/ に感謝

    /***
     * データとる
     *   time: 取得時のリアルタイム/ text: コピペ用
     **/
    var GetValues = function(parent) {
        let $_p = u(parent).children().filter(function(node) {
            return 0 < u(node).text().trim().length;
        });
        // チャート数値の取得
        let _cls = "pid-650";
        let $prm = u($_p.first()).find('[class*="' + _cls + '"]');
        let prm = $prm.array();
        // 時間まわり
        let txt = u($_p.last()).text().trim();
        let time = txt.split(' ')[0].trim();
        // 整形
        prm.unshift("USD/KRW");
        prm.push(txt);
        var result = Object.assign({}, {time: time, text: prm.join(" ")});
        return result;
    }

    // ログを書くまわり
    var $div = u('section.boxItem > div.quotesBox').first();
    var $view = u('#' + viewer_id);
    var prev = '---';
    var delFlg = 'log_del';
    var Watch = function() {
        // 過去ログ削除
        $view.children('p.' + delFlg).remove();
        // ログを書く
        let val = GetValues($div);
        if(prev !== val.time) {
            let p = u('<p>').attr('style', 'border-bottom:1px dashed #c0c0c0; padding:0.8rem 0.5rem;').text(val.text);
            $view.prepend(p);
            prev = val.time;
        }
        // 100以上昔のは消す(準備)
        $view.children('p').each(function(node, i) {
            if(100 <= i) { u(node).addClass(delFlg); }
        });
    }

    // 2500ミリ秒毎に更新を呼ぶ
    var interval_id;
    var interval_span = 2500;
    var nowLogging = true;
    // 一時停止イベント
    u('button#' + viewer_id + '_toggle').on('click', function(e) {
        e.preventDefault();
        if(nowLogging) {
            nowLogging = false;
            clearInterval(interval_id);
            u(this).text('再開する');
        } else {
            nowLogging = true;
            interval_id = setInterval(Watch, interval_span);
            u(this).text('一時停止');
        }
    });
    // 繰り返し開始
    interval_id = setInterval(Watch, interval_span);
})();
