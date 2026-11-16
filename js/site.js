(function(){
  var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');
  if(b&&n){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
  var y=document.getElementById('yr'); if(y){y.textContent=new Date().getFullYear();}
  // Clips: force muted inline playback (iOS Safari), fall back to a tap-to-play button,
  // and respect reduced-motion by showing the poster only.
  var mq=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  var vids=document.querySelectorAll('video');
  function btnFor(v){var h=v.closest?v.closest('.vfig,.hero'):null;return h?h.querySelector('.tap-play'):null;}
  function prep(v){
    v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');
    v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
  }
  function tryPlay(v){
    var bt=btnFor(v);prep(v);
    var p;try{p=v.play();}catch(e){if(bt)bt.hidden=false;return;}
    if(p&&p.then){p.then(function(){if(bt)bt.hidden=true;},function(){if(bt&&!(mq&&mq.matches))bt.hidden=false;});}
  }
  function apply(){
    for(var i=0;i<vids.length;i++){
      var v=vids[i],bt=btnFor(v);
      if(mq&&mq.matches){v.removeAttribute('autoplay');v.pause();try{v.currentTime=0;}catch(e){}if(bt)bt.hidden=true;}
      else{v.setAttribute('autoplay','');tryPlay(v);}
    }
  }
  for(var i=0;i<vids.length;i++){(function(v){
    prep(v);
    var bt=btnFor(v);
    if(bt){bt.addEventListener('click',function(){tryPlay(v);});}
    v.addEventListener('playing',function(){if(bt)bt.hidden=true;});
  })(vids[i]);}
  apply();
  if(mq){if(mq.addEventListener){mq.addEventListener('change',apply);}else if(mq.addListener){mq.addListener(apply);}}
})();
