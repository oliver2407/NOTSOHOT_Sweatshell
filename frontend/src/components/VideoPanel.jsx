import { useEffect, useRef, useState } from "react";

/*
 * What the roof is doing, as footage of the roof doing it. Desktop layout only.
 *
 * The three care rules that used to sit here are worth reading once and never again,
 * and the person who reads them owns the sheet — which is the phone, under Care,
 * where they still are. The desktop layout is what a judge opens, and the one thing
 * that screen cannot otherwise show is a sheet physically travelling across a roof
 * or a pump wetting the gel. A column of maintenance advice was the least valuable
 * use of the largest free rectangle on the page.
 *
 * It follows the state rather than sitting there: the clip that plays is the one for
 * the thing happening right now, so pressing Roll out — or warming the air until the
 * roof unit presses it for you — answers "and what does that look like" in the same
 * second, without anyone having to ask.
 *
 * NOT A LIVE CAMERA, and the caption says so on every frame. A recording that sits
 * beside live numbers and is not labelled will be read as a live view of the roof,
 * and then every number next to it inherits that lie.
 */

/*
 * Drop the files in at frontend/public/clips/ and they appear. Nothing else to wire.
 * Until then each one degrades to a placeholder that still names what is happening,
 * so the panel is useful — and demonstrable — before a camera has been near a roof.
 */
const CLIPS = {
  rolling_out: {
    src: "/clips/roll-out.mp4",
    title: "Rolling out",
    note: "The sheet travelling out over the roof.",
  },
  rolling_up: {
    src: "/clips/roll-up.mp4",
    title: "Rolling up",
    note: "The roller taking the sheet back in.",
  },
  watering: {
    src: "/clips/water.mp4",
    title: "Watering",
    note: "The pump wetting the gel so it can evaporate again.",
  },
  idle: {
    src: "/clips/idle.mp4",
    title: "On the roof",
    note: "The rig this app was built against.",
  },
};

/*
 * Which clip the current reading calls for.
 *
 * Direction is read from the position the roller still holds, not from where it is
 * heading: the firmware only flips `sheet_out` when the travel finishes, so while it
 * is moving and still reports "up", what you are watching is it going out.
 */
function actionOf(home) {
  if (!home) return "idle";
  if (home.pump_on) return "watering";
  if (home.sheet_moving) return home.sheet_out ? "rolling_up" : "rolling_out";
  return "idle";
}

export default function VideoPanel({ home }) {
  const action = actionOf(home);
  const clip = CLIPS[action];

  // Per clip, so one file that has not been shot yet does not take the others down
  // with it. A 404 and a codec the browser will not touch both land here.
  const [missing, setMissing] = useState({});
  const video = useRef(null);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    // Muted autoplay is the only kind a browser allows without a click, and a clip
    // of a roller does not want sound anyway.
    el.load();
    el.play().catch(() => {});
  }, [action]);

  const gone = missing[action];

  return (
    <div className="panel vidpanel">
      <div className="vidhead">
        <h2>{clip.title}</h2>
        {action !== "idle" && <span className="vidlive">now</span>}
      </div>

      <div className="vidbox">
        {gone ? (
          /*
           * The placeholder is not a dead grey rectangle. It names the thing that is
           * happening, so the panel does its job — telling a judge what the hardware
           * is physically doing — on the day the clips are still unshot.
           */
          <div className="vidempty">
            <PlayMark />
            <span>{clip.note}</span>
            <span className="vidfile">{clip.src}</span>
          </div>
        ) : (
          /*
           * No controls, no sound, nothing to press.
           *
           * This panel is a readout, not a player: what it shows is whatever the
           * roof unit is doing, and a scrub bar would let someone park it on a
           * frame of the sheet rolling out while the sheet is in fact rolled up —
           * a picture contradicting the words beside it. Muted for the same
           * reason it is silent on the rig, and because a page that starts making
           * noise in a quiet judging room is its own kind of failure.
           *
           * `controlsList` and `disablePictureInPicture` close the back doors:
           * right-click on desktop and long-press on mobile both offer a player
           * otherwise.
           */
          <video
            ref={video}
            className="vid"
            src={clip.src}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
            onContextMenu={(e) => e.preventDefault()}
            onError={() => setMissing((m) => ({ ...m, [action]: true }))}
          />
        )}
      </div>

      <p className="vidcap">
        The functions of the SweatShell are pre-recorded, rather than being captured by a live camera feed.
      </p>
    </div>
  );
}

function PlayMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 11.5 L23.5 17 L14 22.5 Z" fill="currentColor" />
    </svg>
  );
}
