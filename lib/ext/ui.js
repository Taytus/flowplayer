
function zeropad(val) {
   val = parseInt(val, 10);
   return val >= 10 ? val : "0" + val;
}

// display seconds in hh:mm:ss format
function format(sec) {

   sec = sec || 0;

   var h = Math.floor(sec / 3600),
       min = Math.floor(sec / 60);

   sec = sec - (min * 60);

   if (h >= 1) {
      min -= h * 60;
      return h + "h:" + zeropad(min); // + ":" + zeropad(sec);
   }

   return zeropad(min) + ":" + zeropad(sec);
}


// detect animation support
$.support.animation = (function() {
   var vendors = ['','Webkit','Moz','O','ms','Khtml'], el = $("<p/>")[0];

   for (var i = 0; i < vendors.length; i++) {
      if (el.style[vendors[i] + 'AnimationName'] !== 'undefined') return true;
   }
})();


flowplayer(function(api, root) {

   var conf = api.conf,
      hovertimer;

   root.addClass("flowplayer").append('\
      <div class="ratio"/>\
      <div class="ui">\
         <div class="waiting"><em/><em/><em/></div>\
         <a class="fullscreen"/>\
         <a class="unload"/>\
         <div class="controls">\
            <div class="timeline">\
               <div class="buffer"/>\
               <div class="progress"/>\
            </div>\
            <div class="volume">\
               <a class="mute"></a>\
               <div class="volumeslider">\
                  <div class="volumelevel"/>\
               </div>\
            </div>\
         </div>\
         <div class="time">\
            <em class="elapsed">00:00</em>\
            <em class="remaining"/>\
            <em class="duration">99:99</em>\
         </div>\
         <div class="message"><h2/><p/></div>\
      </div>'.replace(/class="/g, 'class="fp-')
   );

   function find(klass) {
      return $(".fp-" + klass, root);
   }

   // widgets
   var progress = find("progress"),
      buffer = find("buffer"),
      elapsed = find("elapsed"),
      remaining = find("remaining"),
      waiting = find("waiting"),
      ratio = find("ratio"),
      origRatio = ratio.css("paddingTop"),

      // sliders
      timeline = find("timeline").slider(),
      timelineApi = timeline.data("api"),

      volume = find("volume"),
      volumeSlider = find("volumeslider").slider(),
      volumeApi = volumeSlider.data("api"),
      noToggle = root.hasClass("no-toggle");

   // aspect ratio
   function setRatio(val) {
      if (!parseInt(origRatio, 10))
         ratio.css("paddingTop", val * 100 + "%");

      // no inline-block support. sorry; no feature detection
      if ($.browser.msie && $.browser.version < 8) {
         $("object", root).height(root.height());
      }

   }

   function hover(flag) {
      root.toggleClass("is-mouseover", flag).toggleClass("is-mouseout", !flag);
   }

   // loading...
   if (!$.support.animation) waiting.html("<p>loading &hellip;</p>");

   setRatio(conf.ratio);

   if (noToggle) root.addClass("is-mouseover");

   // no fullscreen in IFRAME
   if (location.href != top.location.href) find("fullscreen").remove();


   api.bind("load", function() {
      root.addClass("is-loading");

   }).bind("ready", function() {

      setRatio(api.video.height / api.video.width);

      // initial time & volume
      find("duration").add(remaining).html(format(api.video.duration));
      volumeApi.slide(api.volumeLevel);


   }).bind("unload", function() {
      if (!origRatio) ratio.css("paddingTop", "");

   // buffer
   }).bind("buffer", function() {
      var video = api.video,
         max = video.buffer / video.duration;

      if (!video.seekable) timelineApi.max(max);

      buffer.animate({ width: (max * 100) + "%"}, 250, "linear");

   }).bind("buffered", function() {
      buffer.css({ width: '100%' });
      timelineApi.max(1);

   // progress
   }).bind("progress", function() {

      var time = api.video.time,
         duration = api.video.duration;

      if (!timelineApi.dragging) {
         timelineApi.slide(time / duration, api.seeking ? 0 : 250);
      }

      elapsed.html(format(time));
      remaining.html("-" + format(duration - time));

   }).bind("finish", function() {
      elapsed.html(format(api.video.duration));
      window.foo = timelineApi;
      timelineApi.slide(1, 100);

   // misc
   }).bind("beforeseek", function() {
      progress.stop();


   }).bind("volume", function() {
      volumeApi.slide(api.volumeLevel);


   }).bind("disable", function() {
      var flag = api.disabled;
      timelineApi.disable(flag);
      volumeApi.disable(flag);
      root.tc("is-disabled", api.disabled);

   }).bind("mute", function() {
      root.tc("is-muted", api.muted);

   }).bind("error", function(e, api, error) {
      root.removeClass("is-loading").addClass("is-error");

      if (error) {
         error.message = conf.errors[error.code];
         api.error = true;

         var el = $(".fp-message", root);
         $("h2", el).text(error.message);
         $("p", el).text(error.url || api.video.url || api.video.src);
      }


   // hover
   }).bind("mouseenter mouseleave", function(e) {
      if (noToggle) return;

      var is_over = e.type == "mouseenter",
         lastMove;

      // is-mouseover/out
      hover(is_over);

      if (is_over) {

         root.bind("pause.x mousemove.x volume.x", function() {
            hover(true);
            lastMove = new Date;
         });

         hovertimer = setInterval(function() {
            if (new Date - lastMove > 5000) {
               hover(false)
               lastMove = new Date;
            }
         }, 100);

      } else {
         root.unbind(".x");
         clearInterval(hovertimer);
      }


   // allow dragging over the player edge
   }).bind("mouseleave", function() {
      if (timelineApi.dragging || volumeApi.dragging) root.addClass("is-mouseover");

   // click
   }).bind("click.player", function(e) {
      if ($(e.target).is(".fp-ui, .fp-engine") || e.flash) {
         e.preventDefault();
         return api.toggle();
      }
   });

   /* controlbar elements */
   $.each(['mute', 'fullscreen', 'unload'], function(i, key) {
      find(key).click(function() {
         api[key]();
      });
   });

   timeline.bind("slide", function(e, val) {
      api.seeking = true;
      api.seek(val * api.video.duration);
   });

   volumeSlider.bind("slide", function(e, val) {
      api.volume(val);
   });

   // times
   find("time").click(function(e) {
      $(this).tc("is-inverted");
   });

   hover(false);

});
