
var CUE_RE = / ?cue\d+ ?/;

flowplayer(function(player, root) {

   var cues = player.conf.cuepoints;

   // no cuepoints
   if (!cues) return;

   function setClass(index) {
      root[0].className = root[0].className.replace(CUE_RE, " ");
      if (index >= 0) root.addClass("cue" + index);
   }

   player.bind("progress", function() {

      for (var i = 0, cue, time = player.video.time; i < cues.length; i++) {

         cue = cues[i];
         if (1 * cue) cue = { time: cue }
         if (cue.time < 0) cue.time = player.video.duration + cue.time;
         cue.index = i;

         // progress_interval / 2 = 0.125
         if (Math.abs(cue.time - time) < 0.125) {
            setClass(i);
            root.trigger("cuepoint", [player, cue]);
         }

      }

   // no CSS class name
   }).bind("unload seek", setClass);

   if (player.conf.generate_cuepoints) {

      player.bind("ready", function() {

         var duration = player.video.duration,
            timeline = $(".fp-timeline", root);

         $.each(cues, function(i, cue) {

            var time = cue.time || cue;
            if (time < 0) time = duration + cue;

            var el = $("<a/>").addClass("fp-cuepoint fp-cuepoint" + i)
               .css("left", (time / duration * 100) + "%");

            el.appendTo(timeline).mousedown(function() {
               player.seek(time);

               // preventDefault() doesn't work
               return false;
            });

         });

      });

   }

});