"use client";

import { useEffect, useRef } from "react";

/**
 * Adsterra iframe banner.
 *
 * Adsterra's snippet relies on a global `atOptions`, so two banners pasted on
 * one page collide. We isolate each banner in its own about:blank iframe and
 * write the `atOptions` + invoke script into it — the reliable way to run
 * multiple Adsterra banners on a single page.
 *
 * With no key set, a labeled placeholder renders so you can see the slot.
 */
export default function AdsterraBanner({
  adKey,
  width,
  height,
  label,
  className = "",
}: {
  adKey?: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const invokeHost =
    process.env.NEXT_PUBLIC_ADSTERRA_INVOKE_HOST || "www.highperformanceformat.com";

  useEffect(() => {
    if (!adKey || !ref.current) return;
    const doc = ref.current.contentWindow?.document;
    if (!doc) return;
    const s = "<scr" + "ipt";
    const e = "</scr" + "ipt>";
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>` +
        `${s} type="text/javascript">var atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};${e}` +
        `${s} type="text/javascript" src="https://${invokeHost}/${adKey}/invoke.js">${e}` +
        `</body></html>`
    );
    doc.close();
  }, [adKey, width, height, invokeHost]);

  if (!adKey) {
    return (
      <div
        className={`mx-auto flex items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02] text-xs text-white/30 ${className}`}
        style={{ width, height, maxWidth: "100%" }}
      >
        {label ?? `Ad slot · ${width}×${height}`}
      </div>
    );
  }

  return (
    <div className={`mx-auto overflow-hidden ${className}`} style={{ width, height, maxWidth: "100%" }}>
      <iframe
        ref={ref}
        title="advertisement"
        width={width}
        height={height}
        scrolling="no"
        style={{ border: 0, display: "block" }}
      />
    </div>
  );
}
