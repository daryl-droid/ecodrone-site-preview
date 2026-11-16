(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
  var y=document.getElementById('yr'); if(y){y.textContent=new Date().getFullYear();}

  // Background clips — iOS Safari-safe autoplay + a tap-to-play fallback on every clip.
  // muted/defaultMuted/playsInline are set BEFORE play(). Hidden desktop/mobile
  // variants are never play()'d (iOS can "spend" autoplay on a display:none video).
  // If play() rejects (or reduced motion is on), the poster stays and the toggle shows Play.
  var mq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  function reduced(){return !!(mq&&mq.matches);}

  function isShown(el){
    while(el&&el!==document.documentElement){
      var st=window.getComputedStyle(el);
      if(st.display==='none'||st.visibility==='hidden')return false;
      el=el.parentElement;
    }
    return true;
  }

  function visibleVideo(root){
    var vids=root.querySelectorAll('video');
    var fallback=null;
    for(var i=0;i<vids.length;i++){
      var wrap=vids[i].closest('.bg-media')||vids[i];
      if(isShown(wrap))return vids[i];
      if(!fallback)fallback=vids[i];
    }
    return fallback;
  }

  function prep(v){
    // Order matters on iOS: mute and playsinline must be true before play().
    v.muted=true;
    v.defaultMuted=true;
    v.setAttribute('muted','');
    v.playsInline=true;
    v.setAttribute('playsinline','');
    v.setAttribute('webkit-playsinline','');
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

  function bindClip(root){
    var btn=root.querySelector('[data-clip-toggle]');
    if(!btn)return;
    var retryBound=false;

    function video(){return visibleVideo(root);}

    function reallyPlaying(v){
      // A rejected play() or MEDIA_ERR_SRC_NOT_SUPPORTED can leave paused=false
      // on some engines; never treat an errored element as playing (so the
      // tap-to-play fallback stays in the Play state).
      return !!(v && !v.paused && !v.error);
    }

    function mark(playing){
      var v=video();
      var media=v&&(v.closest('.bg-media')||v);
      if(media)media.classList.toggle('is-playing',!!playing);
      root.classList.toggle('is-playing',!!playing);
      setToggle(btn,playing);
    }

    function fail(){
      var v=video();
      if(v){try{v.pause();}catch(e){}}
      mark(false);
    }

    function hushHidden(){
      var v=video();
      var all=root.querySelectorAll('video');
      for(var i=0;i<all.length;i++){
        if(all[i]===v)continue;
        try{all[i].pause();}catch(e){}
        all[i].removeAttribute('autoplay');
        all[i].preload='none';
      }
    }

    function start(){
      var v=video();
      if(!v)return;
      hushHidden();
      prep(v);
      if(reduced()){
        v.removeAttribute('autoplay');
        try{v.pause();v.currentTime=0;}catch(e){}
        mark(false);
        return;
      }
      v.setAttribute('autoplay','');
      v.preload='auto';
      tryPlay(v).then(function(){
        if(reallyPlaying(v))mark(true); else fail();
      }).catch(function(){
        fail();
        if(retryBound)return;
        retryBound=true;
        function retry(){
          if(reduced())return;
          if(reallyPlaying(v)&&v.currentTime>0){mark(true);return;}
          tryPlay(v).then(function(){
            if(reallyPlaying(v))mark(true); else fail();
          }).catch(fail);
        }
        v.addEventListener('canplay',retry);
        v.addEventListener('loadeddata',retry);
      });
    }

    btn.addEventListener('click',function(){
      var v=video();
      if(!v)return;
      prep(v);
      if(v.paused || v.error){
        tryPlay(v).then(function(){
          if(reallyPlaying(v))mark(true); else fail();
        }).catch(fail);
      }else{
        try{v.pause();}catch(e){}
        mark(false);
      }
    });

    // Keep the button in sync if the element itself plays/pauses.
    var all=root.querySelectorAll('video');
    for(var i=0;i<all.length;i++){
      (function(v){
        v.addEventListener('play',function(){if(v===video()&&reallyPlaying(v))mark(true);});
        v.addEventListener('pause',function(){if(v===video()&&v.paused)mark(false);});
        v.addEventListener('error',function(){if(v===video())fail();});
      })(all[i]);
    }

    start();

    if(window.matchMedia){
      var layoutMq=window.matchMedia('(max-width:640px)');
      var onLayout=function(){retryBound=false;start();};
      if(layoutMq.addEventListener)layoutMq.addEventListener('change',onLayout);
      else if(layoutMq.addListener)layoutMq.addListener(onLayout);
    }
  }

  var roots=document.querySelectorAll('.hero, .page-hero.has-clip, .clip-band, .fig.has-clip, .mission.clip-mission');
  for(var i=0;i<roots.length;i++)bindClip(roots[i]);

  if(mq){
    var onMotion=function(){
      var roots2=document.querySelectorAll('.hero, .page-hero.has-clip, .clip-band, .fig.has-clip, .mission.clip-mission');
      // Re-run start by dispatching a fake path: pause all then the bind already ran;
      // simply walk again with a new start via click-state.
      for(var i=0;i<roots2.length;i++){
        var ev=document.createEvent?null:null;
        // Rebind is simplest: query button and invoke start through a custom event isn't set up.
        // Pause or resume according to the new preference.
        var root=roots2[i];
        var v=visibleVideo(root);
        var btn=root.querySelector('[data-clip-toggle]');
        if(!v)continue;
        prep(v);
        if(reduced()){
          v.removeAttribute('autoplay');
          try{v.pause();v.currentTime=0;}catch(e){}
          setToggle(btn,false);
          root.classList.remove('is-playing');
        }else{
          v.setAttribute('autoplay','');
          tryPlay(v).then(function(vv,bb,rr){return function(){
            if(vv.error||vv.paused){setToggle(bb,false);rr.classList.remove('is-playing');return;}
            rr.classList.add('is-playing');setToggle(bb,true);
          };}(v,btn,root)).catch(function(bb,rr){return function(){setToggle(bb,false);rr.classList.remove('is-playing');};}(btn,root));
        }
      }
    };
    if(mq.addEventListener)mq.addEventListener('change',onMotion);
    else if(mq.addListener)mq.addListener(onMotion);
  }
})();
