(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
  var y=document.getElementById('yr'); if(y){y.textContent=new Date().getFullYear();}
  // Background clips: force muted inline playback (iOS Safari). If autoplay is refused, do nothing:
  // the poster stays visible silently. Reduced motion: pause and show the poster only.
  var mq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  var vids=document.querySelectorAll('video');
  function prep(v){v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.playsInline=true;v.controls=false;v.removeAttribute('controls');}
  function apply(){
    for(var i=0;i<vids.length;i++){
      var v=vids[i];prep(v);
      if(mq&&mq.matches){v.removeAttribute('autoplay');v.pause();try{v.currentTime=0;}catch(e){}}
      else{v.setAttribute('autoplay','');try{var p=v.play();if(p&&p.catch){p.catch(function(){});}}catch(e){}}
    }
  }
  apply();
  if(mq){if(mq.addEventListener){mq.addEventListener('change',apply);}else if(mq.addListener){mq.addListener(apply);}}
})();
