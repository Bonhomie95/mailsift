"use client";

import { useMemo } from "react";

/**
 * Adsterra iframe banner.
 *
 * Adsterra's snippet relies on a global `atOptions`, so two banners pasted
 * directly on one page collide. We isolate each banner inside its own srcDoc
 * iframe, giving each its own `atOptions` + invoke script.
 *
 * Configure with an ad key from your Adsterra dashboard (Banner unit). With no
 * key set, a labeled placeholder renders so you can see the slot in dev.
 *
 * Security note: ad networks run third-party JS. The iframe scopes it to the
 * banner box; that's standard practice but you are trusting Adsterra's code.
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
  const invokeHost =
    process.env.NEXT_PUBLIC_ADSTERRA_INVOKE_HOST || "www.highperformanceformat.com";

  const srcDoc = useMemo(() => {
    if (!adKey) return "";
    const open = "<scr" + "ipt>";
    const close = "</scr" + "ipt>";
    return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>
${open}var atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};${close}
<scr${""}ipt src="//${invokeHost}/${adKey}/invoke.js"></scr${""}ipt>
</body></html>`;
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
        title="advertisement"
        width={width}
        height={height}
        srcDoc={srcDoc}
        scrolling="no"
        // Scope the third-party ad script to this box while still letting it run
        // and open its click-through target.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        style={{ border: 0, display: "block" }}
      />
    </div>
  );
}
