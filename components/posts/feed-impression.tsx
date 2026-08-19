"use client";

import { useEffect, useRef } from "react";
import { recordFeedInteractionAction } from "@/lib/actions/feed";
import { FEED_CONFIG } from "@/lib/feed/config";

export function FeedImpression({
  postId,
  position,
  children,
}: {
  postId: string;
  position: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const impressed = useRef(false);
  const viewed = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let visibleSince = 0;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= FEED_CONFIG.impressionMinRatio) {
          if (!impressed.current) {
            impressed.current = true;
            void recordFeedInteractionAction({ postId, type: "IMPRESSION", position });
          }
          if (!viewed.current && !visibleSince) {
            visibleSince = Date.now();
            timer = window.setTimeout(() => {
              if (!viewed.current) {
                viewed.current = true;
                void recordFeedInteractionAction({ postId, type: "VIEW", position });
              }
            }, FEED_CONFIG.viewVisibleMs);
          }
        } else {
          visibleSince = 0;
          window.clearTimeout(timer);
        }
      },
      { threshold: [FEED_CONFIG.impressionMinRatio, 0.75] },
    );
    observer.observe(node);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [postId, position]);

  return <div ref={ref}>{children}</div>;
}
