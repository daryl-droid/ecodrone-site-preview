(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
  var y=document.getElementById('yr'); if(y){y.textContent=new Date().getFullYear();}

  // iOS-safe autoplay: muted/autoplay/loop/playsinline stay literal in the HTML.
  // JS never pauses on a rejected play() (native autoplay may still start) and
  // never disables preload entirely. One <video> per clip. Pause icon only when the
  // element is actually playing and currentTime is advancing.
  var reduceMq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  function reduced(){return !!(reduceMq&&reduceMq.matches);}

  var LAYOUT_MQ='(max-width:640px)';
  var ROOT_SEL='.hero, .page-hero.has-clip, .clip-band, .fig.has-clip, .mission.clip-mission';
  var PLAY_CAP=3;
  var NEAR_PX=200;
  var STALL_MS=2000;
  var POLL_MS=500;

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
    // Do not force preload=auto here — only the near-view path may upgrade it.
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
    v.controls=false;
    v.removeAttribute('controls');
    try{if('disablePictureInPicture' in v)v.disablePictureInPicture=true;}catch(e){}
  }

  function setPreload(v,mode){
    if(!v||!mode)return;
    if(v.preload===mode&&v.getAttribute('preload')===mode)return;
    v.preload=mode;
    v.setAttribute('preload',mode);
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

  function clipNear(root,px){
    var r=root.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var vw=window.innerWidth||document.documentElement.clientWidth;
    var m=px||NEAR_PX;
    return r.bottom>-m && r.top<vh+m && r.right>-m && r.left<vw+m;
  }

  function isHero(root){
    return !!(root&&root.classList&&root.classList.contains('hero'));
  }

  function viewScore(root){
    var r=root.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var vis=Math.min(r.bottom,vh)-Math.max(r.top,0);
    if(vis<=0||r.height<=0)return -1e9;
    var mid=(r.top+r.bottom)/2;
    return (vis/r.height)*1000 - Math.abs(mid-vh/2);
  }

  var roots;
  function playingRoots(except){
    var out=[],i,v;
    if(!roots)return out;
    for(i=0;i<roots.length;i++){
      if(except&&roots[i]===except)continue;
      v=roots[i].querySelector('video');
      if(v&&!v.paused&&!v.ended)out.push(roots[i]);
    }
    return out;
  }

  function evictFor(root){
    var others=playingRoots(root);
    others.sort(function(a,b){return viewScore(a)-viewScore(b);});
    while(others.length>=PLAY_CAP){
      var evict=others.shift();
      var ev=evict.querySelector('video');
      if(ev&&!ev.paused){try{ev.pause();}catch(e){}}
      var media=ev&&ev.closest?ev.closest('.bg-media'):null;
      if(media)media.classList.remove('is-playing');
      evict.classList.remove('is-playing');
      setToggle(evict.querySelector('[data-clip-toggle]'),false);
    }
  }

  function bindClip(root){
    var btn=root.querySelector('[data-clip-toggle]');
    var v=root.querySelector('video');
    if(!v)return;
    pickSrc(v);

    var media=v.closest('.bg-media')||v;
    var retryBound=false;
    root._ecoUserPaused=false;
    root._ecoInView=clipVisible(root,0.25);
    root._ecoLastT=-1;
    root._ecoLastAdvance=0;
    root._ecoStallReloaded=false;

    if(isHero(root)||clipNear(root,NEAR_PX))setPreload(v,'auto');
    else setPreload(v,'metadata');

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
      if(!root._ecoInView&&!isHero(root))return;
      setPreload(v,'auto');
      evictFor(root);
      prep(v);
      tryPlay(v).then(function(){
        // Do not mark Pause here. Wait for 'playing' or advancing currentTime.
      }).catch(function(){
        // Do NOT pause(). A rejected play() on iOS often happens before canplay;
        // calling pause() here is what killed autoplay in f10c4bf. Retry, and
        // only flip the toggle to Play if the element is still paused after that.
        if(retryBound)return;
        retryBound=true;
        function retry(){
          if(reduced()||root._ecoUserPaused||document.hidden||!root._ecoInView)return;
          if(!v.paused&&!v.error)return;
          evictFor(root);
          tryPlay(v).then(function(){}).catch(function(){
            if(v.paused)mark(false);
          });
        }
        v.addEventListener('canplay',retry);
        v.addEventListener('loadeddata',retry);
      });
    }

    // Pause icon only once playback is actually rendering, not on the 'play' event
    // (which can fire before frames advance, or while the decoder is stalled).
    v.addEventListener('playing',function(){
      if(v.error||root._ecoUserPaused||reduced()||document.hidden)return;
      if(!root._ecoInView&&!isHero(root))return;
      root._ecoLastT=v.currentTime||0;
      root._ecoLastAdvance=Date.now();
      mark(true);
    });
    v.addEventListener('pause',function(){
      if(v.paused&&(root._ecoUserPaused||reduced()||document.hidden||!root._ecoInView))mark(false);
    });

    function onWait(){
      if(root._ecoUserPaused||reduced()||document.hidden||!root._ecoInView)return;
      if(!root._ecoLastAdvance)root._ecoLastAdvance=Date.now();
    }
    v.addEventListener('waiting',onWait);
    v.addEventListener('stalled',onWait);

    root._ecoWatch=function(){
      if(reduced()||document.hidden||root._ecoUserPaused||!root._ecoInView){
        root._ecoStallReloaded=false;
        return;
      }
      var t=v.currentTime||0;
      var last=root._ecoLastT;
      var advanced=false;
      if(last>=0){
        var delta=t-last;
        if(delta>0.04||(delta<-0.2&&t<1))advanced=true;
      }
      root._ecoLastT=t;
      if(advanced){
        root._ecoLastAdvance=Date.now();
        root._ecoStallReloaded=false;
        if(!v.paused)mark(true);
        return;
      }
      if(v.paused)return;
      if(!root._ecoLastAdvance){
        root._ecoLastAdvance=Date.now();
        return;
      }
      var stuck=Date.now()-root._ecoLastAdvance;
      if(stuck>=STALL_MS&&!root._ecoStallReloaded){
        root._ecoStallReloaded=true;
        root._ecoLastAdvance=Date.now();
        try{v.load();}catch(e){}
        setPreload(v,'auto');
        evictFor(root);
        prep(v);
        var p=v.play();
        if(p&&p.catch)p.catch(function(){});
        return;
      }
      if(stuck>=STALL_MS&&root._ecoStallReloaded){
        try{v.pause();}catch(e){}
        mark(false);
      }
    };

    if(btn)btn.addEventListener('click',function(e){
      if(e){e.preventDefault();e.stopPropagation();}
      prep(v);
      if(v.paused){
        root._ecoUserPaused=false;
        root._ecoStallReloaded=false;
        root._ecoLastAdvance=0;
        root._ecoInView=true;
        setPreload(v,'auto');
        evictFor(root);
        tryPlay(v).then(function(){
          // mark on 'playing' / watchdog
        }).catch(function(){mark(false);});
      }else{
        root._ecoUserPaused=true;
        try{v.pause();}catch(e){}
        mark(false);
      }
    });

    if('IntersectionObserver' in window){
      var nearIO=new IntersectionObserver(function(entries){
        for(var i=0;i<entries.length;i++){
          if(entries[i].isIntersecting){
            setPreload(v,'auto');
          }else if(v.paused&&!isHero(root)){
            setPreload(v,'metadata');
          }
        }
      },{rootMargin:NEAR_PX+'px',threshold:0});
      nearIO.observe(root);

      var io=new IntersectionObserver(function(entries){
        for(var i=0;i<entries.length;i++){
          root._ecoInView=entries[i].isIntersecting;
          if(root._ecoInView){
            if(!root._ecoUserPaused&&!reduced()&&!document.hidden)start();
          }else{
            if(!v.paused){try{v.pause();}catch(e){}}
            mark(false);
          }
        }
      },{threshold:0.25});
      io.observe(root);
    }

    if(root._ecoInView||isHero(root))start();

    if(window.matchMedia){
      var layoutMq=window.matchMedia(LAYOUT_MQ);
      var onLayout=function(){
        var prev=v.getAttribute('src');
        pickSrc(v);
        retryBound=false;
        if(v.getAttribute('src')!==prev){/* new src will fire loadeddata/canplay */}
        if(!root._ecoUserPaused&&(root._ecoInView||isHero(root)))start();
      };
      if(layoutMq.addEventListener)layoutMq.addEventListener('change',onLayout);
      else if(layoutMq.addListener)layoutMq.addListener(onLayout);
    }

    root._ecoStart=start;
  }

  roots=document.querySelectorAll(ROOT_SEL);
  for(var i=0;i<roots.length;i++)bindClip(roots[i]);

  setInterval(function(){
    for(var i=0;i<roots.length;i++){
      if(typeof roots[i]._ecoWatch==='function')roots[i]._ecoWatch();
    }
  },POLL_MS);

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
      setPreload(v,'auto');
      evictFor(root);
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
        setToggle(list[i].querySelector('[data-clip-toggle]'),false);
        list[i].classList.remove('is-playing');
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
