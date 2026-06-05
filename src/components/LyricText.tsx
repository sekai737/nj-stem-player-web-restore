import { lyricRunClass, splitLyricScriptRuns } from "../utils/lyricScriptFont";

interface LyricTextProps {
  text: string;
}

/** Renders lyric copy: Swiss for Latin, Noto KR/JP only on Korean/Japanese runs. */
export default function LyricText({ text }: LyricTextProps) {
  const runs = splitLyricScriptRuns(text);
  const allLatin = runs.length > 0 && runs.every((run) => run.script === "latin");

  if (allLatin) {
    return <>{text}</>;
  }

  return (
    <>
      {runs.map((run, index) => (
        <span key={index} className={lyricRunClass(run.script)}>
          {run.text}
        </span>
      ))}
    </>
  );
}
