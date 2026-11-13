// コハク拡張 v5：コハクとアバターを並べて表示（GitHubから毎日の姿を取得、失敗時は同梱画像）
// 表示条件：muse.ai のチャット画面（メッセージ入力欄が見えている間）だけ（近似判定）
(function () {
  if (window.__kohakuExtV5) return;
  window.__kohakuExtV5 = true;

  var today = new Date();
  var ymd = '' + today.getFullYear() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  var REMOTE_KOHAKU = 'https://raw.githubusercontent.com/masa-kohaku/kohaku/main/kohaku.png?v=' + ymd;
  var REMOTE_AVATAR = 'https://raw.githubusercontent.com/masa-kohaku/kohaku/main/avatar.png?v=' + ymd;

  var wrap = document.createElement('div');
  wrap.id = 'kohaku-ext-wrap';
  wrap.style.cssText = [
    'position:fixed', 'right:16px', 'bottom:8px', 'z-index:2147483647',
    'display:none', 'flex-direction:row', 'align-items:flex-end', 'gap:10px',
    'cursor:grab', 'user-select:none', 'touch-action:none'
  ].join(';');

  function makeImg(id, remote, local) {
    var img = document.createElement('img');
    img.id = id;
    img.alt = '';
    img.draggable = false;
    img.style.cssText = 'height:170px;width:auto;pointer-events:none;';
    img.onerror = function () {
      if (img.src !== local) img.src = local;
    };
    img.src = remote;
    return img;
  }
  var avatarImg = makeImg('kohaku-ext-avatar',
    REMOTE_AVATAR, chrome.runtime.getURL('avatar.png'));
  var kohakuImg = makeImg('kohaku-ext-img',
    REMOTE_KOHAKU, chrome.runtime.getURL('kohaku.png'));
  wrap.appendChild(avatarImg);
  wrap.appendChild(kohakuImg);

  // ウィンドウが画面からはみ出している分だけ内側へ寄せる
  var dragged = false;
  function fit() {
    if (dragged) return;
    var overX = Math.max(0, window.screenX + window.outerWidth - (window.screen.availLeft + window.screen.availWidth));
    var overY = Math.max(0, window.screenY + window.outerHeight - (window.screen.availTop + window.screen.availHeight));
    wrap.style.right = (16 + overX) + 'px';
    wrap.style.bottom = (8 + overY) + 'px';
  }
  window.addEventListener('resize', fit);
  setInterval(fit, 2000);
  fit();

  // ドラッグで移動
  var dragging = false, sx = 0, sy = 0, sr = 0, sb = 0;
  wrap.addEventListener('pointerdown', function (e) {
    dragging = true; dragged = true;
    sx = e.clientX; sy = e.clientY;
    sr = parseInt(wrap.style.right, 10) || 16;
    sb = parseInt(wrap.style.bottom, 10) || 8;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var r = Math.min(Math.max(sr - (e.clientX - sx), -40), vw - 60);
    var b = Math.min(Math.max(sb - (e.clientY - sy), -20), vh - 60);
    wrap.style.right = r + 'px';
    wrap.style.bottom = b + 'px';
  });
  wrap.addEventListener('pointerup', function () { dragging = false; });

  // ホイールで2人まとめて拡縮
  wrap.addEventListener('wheel', function (e) {
    e.preventDefault();
    var h = (parseInt(avatarImg.style.height, 10) || 170) + (e.deltaY < 0 ? 12 : -12);
    h = Math.min(420, Math.max(70, h));
    avatarImg.style.height = h + 'px';
    kohakuImg.style.height = h + 'px';
  }, { passive: false });

  // ダブルクリックでこのページでは隠す
  wrap.addEventListener('dblclick', function () { wrap.remove(); });

  function add() { document.documentElement.appendChild(wrap); }
  if (document.documentElement) { add(); }
  else { document.addEventListener('DOMContentLoaded', add); }

  // 近似判定：メッセージ入力欄（textarea / contenteditable）が見えている間だけ表示する
  function isChatView() {
    var els = document.querySelectorAll('textarea, [contenteditable="true"]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (wrap.contains(el)) continue;
      var r = el.getBoundingClientRect();
      var st = window.getComputedStyle(el);
      if (r.height >= 18 && r.width >= 120 && st.display !== 'none' && st.visibility !== 'hidden') return true;
    }
    return false;
  }
  function tick() {
    if (!wrap.isConnected) return;
    wrap.style.display = isChatView() ? 'flex' : 'none';
  }
  setInterval(tick, 1000);
  setTimeout(tick, 300);
})();
