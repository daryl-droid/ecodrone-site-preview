(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
  var y=document.getElementById('yr'); if(y){y.textContent=new Date().getFullYear();}

  // iOS-safe autoplay: attributes live in the HTML; JS only mutes/playsInline
  // before play(), never pauses on a rejected play() (native autoplay may still
  // start), and never sets preload=none. One <video> per clip; desktop/mobile
  // src is chosen at parse time (see clip_bg_pair) or here before first play.
  var reduceMq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  function reduced(){return !!(reduceMq&&reduceMq.matches);}

  var LAYOUT_MQ='(max-width:640px)';

  function pickSrc(v){
    if(!v)return;
    var mobile=window.matchMedia&&window.matchMedia(LAYOUT_MQ).matches;
    var want=mobile
      ?(v.getAttribute('data-src-mobile')||v.getAttribute('data-src-desktop')||v.getAttribute('src'))
      :(v.getAttribute('data-src-desktop')||v.getAttribute('src'));
    if(!want)return;
    if(v.getAttribute('src')!==want){
      v.setAttribute('src',want);
    }
    var poster=mobile
      ?(v.getAttribute('data-poster-mobile')||v.getAttribute('data-poster-desktop'))
      :(v.getAttribute('data-poster-desktop')||v.getAttribute('poster'));
    if(poster){
      v.setAttribute('poster',poster);
      var media=v.closest('.bg-media');
      if(media)media.style.backgroundImage='url('+poster+')';
    }
  }

  function prep(v){
    // Order matters on iOS: muted + playsinline must be true before play().
    v.muted=true;
    v.defaultMuted=true;
    v.setAttribute('muted','');
    v.autoplay=true;
    v.setAttribute('autoplay','');
    v.loop=true;
    v.setAttribute('loop','');
    v.playsInline=true;
    v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
    v.preload='auto';
    v.setAttribute('preload','auto');
    v.controls=false;
    v.removeAttribute('controls');
    try{if('disablePictureInPicture' in v)v.disablePictureInPicture=true;}catch(e){}
  }

  function tryPlay(v){
    prep(v);
    try{
      var p=v.play();
      if(p&&p.then)return p;
      return v.paused?Promise.reject():Promise.resolve();
    }catch(e){
      return Promise.reject(e);
    }
  }

  function setToggle(btn,playing){
    if(!btn)return;
    btn.hidden=false;
    btn.setAttribute('aria-label',playing?'Pause background video':'Play background video');
    btn.setAttribute('aria-pressed',playing?'true':'false');
    btn.classList.toggle('is-paused',!playing);
  }

  function clipVisible(root,ratio){
    var r=root.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var vis=Math.min(r.bottom,vh)-Math.max(r.top,0);
    if(vis<=0||r.height<=0)return false;
    return (vis/r.height)>=(ratio||0.25);
  }

  function bindClip(root){
    var btn=root.querySelector('[data-clip-toggle]');
    var v=root.querySelector('video');
    if(!v)return;
    pickSrc(v);

    var media=v.closest('.bg-media')||v;
    var retryBound=false;
    root._ecoUserPaused=false;
    // Assume in view until IntersectionObserver says otherwise — never pause on load.
    root._ecoInView=true;

    function mark(playing){
      media.classList.toggle('is-playing',!!playing);
      root.classList.toggle('is-playing',!!playing);
      setToggle(btn,playing);
    }

    function start(){
      if(reduced()){
        v.removeAttribute('autoplay');
        try{v.pause();}catch(e){}
        mark(false);
        return;
      }
      if(root._ecoUserPaused)return;
      if(document.hidden)return;
      if(!root._ecoInView)return;
      prep(v);
      tryPlay(v).then(function(){
        if(!v.paused&&!v.error)mark(true);
        // If the promise resolved but the element is somehow paused, leave it —
        // do not call pause() or flip the toggle; native autoplay may still run.
      }).catch(function(){
        // Do NOT pause(). A rejected play() on iOS often happens before canplay;
        // calling pause() here is what killed autoplay in f10c4bf. Retry, and
        // only flip the toggle to Play if the element is still paused after that.
        if(retryBound)return;
        retryBound=true;
        function retry(){
          if(reduced()||root._ecoUserPaused||document.hidden||!root._ecoInView)return;
          if(!v.paused&&!v.error){mark(true);return;}
          tryPlay(v).then(function(){
            if(!v.paused&&!v.error)mark(true);
          }).catch(function(){
            if(v.paused)mark(false);
          });
        }
        v.addEventListener('canplay',retry);
        v.addEventListener('loadeddata',retry);
      });
    }

    v.addEventListener('play',function(){if(!v.error)mark(true);});
    v.addEventListener('playing',function(){if(!v.error)mark(true);});
    v.addEventListener('pause',function(){
      // Only reflect a pause in the toggle when it was requested (user, reduced
      // motion, off-screen, or hidden tab). Spurious pauses must not flip the
      // control to Play and must not block a later autoplay start.
      if(v.paused&&(root._ecoUserPaused||reduced()||document.hidden||!root._ecoInView))mark(false);
    });

    if(btn)btn.addEventListener('click',function(e){
      if(e){e.preventDefault();e.stopPropagation();}
      prep(v);
      if(v.paused){
        root._ecoUserPaused=false;
        tryPlay(v).then(function(){
          if(!v.paused)mark(true); else mark(false);
        }).catch(function(){mark(false);});
      }else{
        root._ecoUserPaused=true;
        try{v.pause();}catch(e){}
        mark(false);
      }
    });

    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){
        for(var i=0;i<entries.length;i++){
          root._ecoInView=entries[i].isIntersecting;
          if(root._ecoInView){
            if(!root._ecoUserPaused&&!reduced()&&!document.hidden)start();
          }else{
            if(!v.paused){try{v.pause();}catch(e){}}
          }
        }
      },{threshold:0.25});
      io.observe(root);
    }

    start();

    if(window.matchMedia){
      var layoutMq=window.matchMedia(LAYOUT_MQ);
      var onLayout=function(){
        var prev=v.getAttribute('src');
        pickSrc(v);
        retryBound=false;
        if(v.getAttribute('src')!==prev){/* new src will fire loadeddata/canplay */}
        if(!root._ecoUserPaused)start();
      };
      if(layoutMq.addEventListener)layoutMq.addEventListener('change',onLayout);
      else if(layoutMq.addListener)layoutMq.addListener(onLayout);
    }

    root._ecoStart=start;
  }

  var ROOT_SEL='.hero, .page-hero.has-clip, .clip-band, .fig.has-clip, .mission.clip-mission';
  var roots=document.querySelectorAll(ROOT_SEL);
  for(var i=0;i<roots.length;i++)bindClip(roots[i]);

  // One-time unlock for in-app iOS web views that withhold autoplay until a gesture.
  function unlock(){
    if(reduced())return;
    var list=document.querySelectorAll(ROOT_SEL);
    for(var i=0;i<list.length;i++){
      var root=list[i];
      var v=root.querySelector('video');
      if(!v||root._ecoUserPaused||document.hidden)continue;
      if(!clipVisible(root,0.25))continue;
      root._ecoInView=true;
      prep(v);
      var p=v.play();
      if(p&&p.catch)p.catch(function(){});
    }
    for(var j=0;j<GESTURES.length;j++)document.removeEventListener(GESTURES[j],unlock,GESTURE_OPTS);
  }
  var GESTURES=['touchstart','touchend','scroll','click'];
  var GESTURE_OPTS={passive:true,capture:true};
  for(var g=0;g<GESTURES.length;g++)document.addEventListener(GESTURES[g],unlock,GESTURE_OPTS);

  // Pause only when the tab is actually hidden; resume in-view clips when it returns.
  document.addEventListener('visibilitychange',function(){
    var list=document.querySelectorAll(ROOT_SEL);
    var i,root,v;
    if(document.hidden){
      for(i=0;i<list.length;i++){
        v=list[i].querySelector('video');
        if(v&&!v.paused){try{v.pause();}catch(e){}}
      }
      return;
    }
    if(reduced())return;
    for(i=0;i<list.length;i++){
      root=list[i];
      v=root.querySelector('video');
      if(!v||root._ecoUserPaused)continue;
      if(typeof root._ecoStart==='function')root._ecoStart();
    }
  });

  if(reduceMq){
    var onMotion=function(){
      var list=document.querySelectorAll(ROOT_SEL);
      for(var i=0;i<list.length;i++){
        var root=list[i];
        var v=root.querySelector('video');
        var btn=root.querySelector('[data-clip-toggle]');
        if(!v)continue;
        prep(v);
        if(reduced()){
          v.removeAttribute('autoplay');
          try{v.pause();v.currentTime=0;}catch(e){}
          setToggle(btn,false);
          root.classList.remove('is-playing');
          if(v.closest('.bg-media'))v.closest('.bg-media').classList.remove('is-playing');
        }else if(!root._ecoUserPaused){
          if(typeof root._ecoStart==='function')root._ecoStart();
        }
      }
    };
    if(reduceMq.addEventListener)reduceMq.addEventListener('change',onMotion);
    else if(reduceMq.addListener)reduceMq.addListener(onMotion);
  }
})();
