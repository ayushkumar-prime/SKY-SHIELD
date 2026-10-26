/* Decorative entrance. Runs locally without network or audio. */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || document.getElementById('bunker-intro')) return;
  const style = document.createElement('style');
  style.textContent = `
    #bunker-intro{position:fixed;inset:0;z-index:9999;overflow:hidden;background:transparent;color:#dbe1d3;font:14px Arial,sans-serif;isolation:isolate}
    #bunker-intro *{box-sizing:border-box}
    .bunker-door{position:absolute;top:0;bottom:0;width:50%;background:repeating-linear-gradient(0deg,transparent 0 89px,#080c0b80 90px 93px),linear-gradient(110deg,#454c47,#232a26 45%,#363e37);border:8px solid #161d18;box-shadow:inset 0 0 70px #0009;transition:transform 1.55s cubic-bezier(.65,0,.25,1);will-change:transform}
    .bunker-door:before{content:'';position:absolute;inset:24px;border:2px solid #5c6358;box-shadow:inset 0 0 0 10px #1b231d,0 0 0 2px #121a14;background:radial-gradient(circle at 12px 12px,#7a8074 0 3px,#101710 4px 6px,transparent 7px) 0 0/64px 64px}
    .bunker-door:after{content:'';position:absolute;top:0;bottom:0;width:12px;background:repeating-linear-gradient(135deg,#c79c39 0 12px,#1a211b 12px 24px)}
    .bunker-left{left:0;border-right:4px solid #070c08}.bunker-left:after{right:0}
    .bunker-right{right:0;border-left:4px solid #070c08}.bunker-right:after{left:0}
    .bunker-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(340px,80vw);padding:22px 16px;text-align:center;background:#19231ef2;border:2px solid #7f8d72;box-shadow:0 8px 32px #0008;transition:opacity .3s}
    .bunker-center small{color:#bbc4b4;font:11px monospace;letter-spacing:2px}
    .bunker-center strong{display:block;margin:10px 0;color:#e5e8de;font-size:clamp(25px,6vw,36px);letter-spacing:4px}
    .bunker-status{font:12px monospace;color:#c6d5b1}.bunker-light{display:inline-block;width:7px;height:7px;margin-right:8px;background:#dfac45;border-radius:50%;animation:bunker-blink .45s alternate infinite}
    .bunker-skip{position:absolute;right:20px;bottom:max(24px,env(safe-area-inset-bottom));padding:10px 16px;color:#e3eadc;background:#202a22;border:1px solid #b1bda4;cursor:pointer;font:13px Arial;z-index:2}.bunker-skip:focus-visible{outline:3px solid #e3b950;outline-offset:4px}
    #bunker-intro.is-opening .bunker-left{transform:translateX(-101%)}
    #bunker-intro.is-opening .bunker-right{transform:translateX(101%)}
    #bunker-intro.is-opening .bunker-center{opacity:0}
    @keyframes bunker-blink{to{opacity:.3}}
    @media(prefers-reduced-motion:reduce){#bunker-intro{display:none}}
  `;
  const overlay = document.createElement('div');
  overlay.id = 'bunker-intro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Sky Shield opening animation');
  overlay.innerHTML = '<div class="bunker-door bunker-left" aria-hidden="true"></div><div class="bunker-door bunker-right" aria-hidden="true"></div><div class="bunker-center"><small>AIRSPACE MONITOR</small><strong>SKY SHIELD</strong><span class="bunker-status"><i class="bunker-light" aria-hidden="true"></i>OPENING CONTROL ROOM</span></div><button class="bunker-skip" type="button">Skip intro →</button>';
  document.head.append(style);
  document.body.append(overlay);
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  let done = false;
  const remove = () => {
    if (done) return;
    done = true;
    clearTimeout(openTimer); clearTimeout(endTimer);
    document.removeEventListener('keydown', onKey);
    motion.removeEventListener('change', onMotion);
    document.body.style.overflow = previousOverflow;
    overlay.remove(); style.remove();
  };
  const onKey = event => { if (event.key === 'Escape') remove(); };
  const onMotion = event => { if (event.matches) remove(); };
  overlay.querySelector('button').addEventListener('click', remove);
  document.addEventListener('keydown', onKey);
  motion.addEventListener('change', onMotion);
  const openTimer = setTimeout(() => overlay.classList.add('is-opening'), 650);
  const endTimer = setTimeout(remove, 2350);
})();
