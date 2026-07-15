import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { Timeline } from "./components/Timeline.js";
import { TimelineItem } from "./components/TimelineItem.js";
import { TimelineTime } from "./components/TimelineTime.js";

describe("timeline composition", () => {
  it("renders a chronological sequence with native list and time semantics", () => {
    const timelineRef = createRef<HTMLOListElement>();
    const { container } = render(
      <Timeline ref={timelineRef} aria-label="Deployment history">
        <TimelineItem>
          <TimelineTime dateTime="2026-07-14T10:30:00Z">10:30</TimelineTime>
          <h3>Deployed</h3>
          <p>Version 1.4 reached production.</p>
        </TimelineItem>
      </Timeline>,
    );

    expect(timelineRef.current).toBe(container.querySelector("ol"));
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(container.querySelector("time")?.dateTime).toBe("2026-07-14T10:30:00Z");
  });
});
