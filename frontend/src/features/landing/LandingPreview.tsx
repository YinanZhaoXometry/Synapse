import { useRef } from "react";
import { Bookmark, Library } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AskIcon, OrganizeIcon, PlanIcon, ReviewIcon } from "./landing-icons";
import type { DemoTabId } from "./LandingSections";

const TAB_ORDER: DemoTabId[] = ["organize", "plan", "ask", "review"];

/**
 * 03 / 产品演示 — the dark stage wrapping a fake product window: a vertical
 * tab rail (horizontal rail under 900px) and four demo panels. Roving-tabindex
 * keyboard nav ported from the design (arrows/Home/End wrap + move focus).
 */
export function LandingPreview({
  activeTab,
  onSelectTab,
}: {
  activeTab: DemoTabId;
  onSelectTab: (tab: DemoTabId) => void;
}) {
  const { t } = useLanguage();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const focusTab = (tab: DemoTabId) => {
    const node = tabRefs.current[tab];
    if (node) {
      node.focus();
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % TAB_ORDER.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = TAB_ORDER.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = TAB_ORDER[nextIndex];
    onSelectTab(next);
    focusTab(next);
  };

  const tabIcons: Record<DemoTabId, React.ComponentType> = {
    organize: OrganizeIcon,
    plan: PlanIcon,
    ask: AskIcon,
    review: ReviewIcon,
  };

  return (
    <section className="lp-section" id="lp-preview" aria-labelledby="lp-preview-title">
      <div className="lp-container">
        <div className="lp-stage">
          <div className="lp-stage-header">
            <div className="lp-section-heading">
              <p className="lp-eyebrow">{t("landing.preview.eyebrow")}</p>
              <h2 className="lp-section-title" id="lp-preview-title">
                {t("landing.preview.title")}
              </h2>
              <p className="lp-section-lead">{t("landing.preview.lead")}</p>
            </div>
            <p className="lp-demo-hint">{t("landing.preview.hint")}</p>
          </div>
          <div className="lp-window">
            <div className="lp-toolbar">
              <div className="lp-window-dots" aria-hidden="true">
                <span className="lp-window-dot" />
                <span className="lp-window-dot" />
                <span className="lp-window-dot" />
              </div>
              <span className="lp-breadcrumb lp-truncate">{t("landing.preview.breadcrumb")}</span>
              <span className="lp-pill">{t("landing.preview.interactivePill")}</span>
            </div>
            <div className="lp-product-body">
              <aside className="lp-sidebar" aria-label={t("landing.preview.sidebarAria")}>
                <p className="lp-space-label">{t("landing.preview.sidebarLabel")}</p>
                <div className="lp-demo-tabs lp-stack" role="tablist" aria-label={t("landing.preview.tabsAria")} aria-orientation="vertical">
                  {TAB_ORDER.map((tab, index) => {
                    const Icon = tabIcons[tab];
                    const selected = tab === activeTab;
                    return (
                      <button
                        key={tab}
                        id={`lp-tab-${tab}`}
                        ref={(node) => {
                          tabRefs.current[tab] = node;
                        }}
                        className="lp-demo-tab"
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`lp-panel-${tab}`}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onSelectTab(tab)}
                        onKeyDown={(event) => onKeyDown(event, index)}
                      >
                        <Icon />
                        {t(`landing.preview.tab.${tab}`)}
                      </button>
                    );
                  })}
                </div>
                <div className="lp-rail-group">
                  <p className="lp-space-label">{t("landing.preview.rail.label2")}</p>
                  <ul className="lp-rail-rows" aria-hidden="true">
                    <li>
                      <Library size={16} strokeWidth={1.7} />
                      {t("landing.preview.rail.item5")}
                    </li>
                    <li>
                      <Bookmark size={16} strokeWidth={1.7} />
                      {t("landing.preview.rail.item6")}
                    </li>
                  </ul>
                </div>
                <div className="lp-sidebar-note">
                  <p className="lp-sidebar-note-title">{t("landing.preview.weekTitle")}</p>
                  <p className="lp-sidebar-note-text">{t("landing.preview.weekText")}</p>
                </div>
              </aside>
              <div className="lp-demo-main">
                <OrganizePanel hidden={activeTab !== "organize"} />
                <PlanPanel hidden={activeTab !== "plan"} />
                <AskPanel hidden={activeTab !== "ask"} />
                <ReviewPanel hidden={activeTab !== "review"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PanelShell({
  tab,
  hidden,
  title,
  description,
  pill,
  children,
}: {
  tab: DemoTabId;
  hidden: boolean;
  title: string;
  description: string;
  pill: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lp-demo-panel" id={`lp-panel-${tab}`} role="tabpanel" aria-labelledby={`lp-tab-${tab}`} tabIndex={0} hidden={hidden}>
      <div className="lp-demo-panel-header">
        <div>
          <h3 className="lp-demo-title">{title}</h3>
          <p className="lp-demo-description">{description}</p>
        </div>
        <span className="lp-pill">{pill}</span>
      </div>
      <div className="lp-demo-canvas">{children}</div>
    </section>
  );
}

function OrganizePanel({ hidden }: { hidden: boolean }) {
  const { t } = useLanguage();
  return (
    <PanelShell
      tab="organize"
      hidden={hidden}
      title={t("landing.preview.organize.title")}
      description={t("landing.preview.organize.desc")}
      pill={t("landing.preview.tab.organize")}
    >
      <div className="lp-organize-grid">
        <article className="lp-note-sheet">
          <h3>{t("landing.preview.organize.summaryTitle")}</h3>
          <p className="lp-note-paragraph">
            {t("landing.preview.organize.p1a")}
            <mark>{t("landing.preview.organize.p1mark")}</mark>
            {t("landing.preview.organize.p1b")}
          </p>
          <p className="lp-note-paragraph">{t("landing.preview.organize.p2")}</p>
          <div className="lp-concept-list" aria-label={t("landing.preview.organize.conceptsAria")}>
            <span className="lp-concept-chip">{t("landing.preview.organize.concept1")}</span>
            <span className="lp-concept-chip">{t("landing.preview.organize.concept2")}</span>
            <span className="lp-concept-chip">{t("landing.preview.organize.concept3")}</span>
            <span className="lp-concept-chip">{t("landing.preview.organize.concept4")}</span>
            <span className="lp-concept-chip">{t("landing.preview.organize.concept5")}</span>
          </div>
        </article>
        <aside className="lp-relation-panel">
          <h3>{t("landing.preview.organize.relationTitle")}</h3>
          <p>{t("landing.preview.organize.relationNote")}</p>
          <svg viewBox="0 0 180 150" role="img" aria-label={t("landing.preview.organize.relationAria")}>
            {/* curved, socket-dotted edges; satellites vary in size/weight so the
                hub reads as a real relation graph, not a symmetric wireframe */}
            <g fill="none" stroke="var(--lp-map-line)" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.72">
              <path d="M67.2 54Q65.3 39.6 50.8 40.9" />
              <path d="M112.4 53.6Q115.2 38.3 130.8 38.4" />
              <path d="M69.7 92.7Q66.7 110.1 49.3 113.5" />
              <path d="M110.7 92.3Q113.7 109.3 130.7 112" />
            </g>
            <circle cx="90" cy="72" r="29" fill="var(--lp-accent-soft)" stroke="var(--lp-accent)" />
            <text x="90" y="69" textAnchor="middle" fill="var(--lp-accent-deep)" fontSize="11" fontWeight="700">
              {t("landing.preview.organize.r.core1")}
            </text>
            <text x="90" y="84" textAnchor="middle" fill="var(--lp-accent-deep)" fontSize="11" fontWeight="700">
              {t("landing.preview.organize.r.core2")}
            </text>
            <circle cx="32" cy="26" r="24" fill="var(--lp-surface)" stroke="var(--lp-border)" />
            <circle cx="147" cy="25" r="21" fill="var(--lp-surface)" stroke="var(--lp-border)" />
            <circle cx="36" cy="127" r="19" fill="var(--lp-surface)" stroke="var(--lp-border-soft)" />
            <circle cx="145" cy="126" r="20" fill="var(--lp-surface)" stroke="var(--lp-border-soft)" />
            <g fontSize="10" textAnchor="middle">
              <text x="32" y="30" fill="var(--lp-fg-2)">{t("landing.preview.organize.r.encode")}</text>
              <text x="147" y="29" fill="var(--lp-fg-2)">{t("landing.preview.organize.r.retrieve")}</text>
              <text x="36" y="131" fill="var(--lp-text-subtle)">{t("landing.preview.organize.r.forget")}</text>
              <text x="145" y="130" fill="var(--lp-text-subtle)">{t("landing.preview.organize.r.space")}</text>
            </g>
            {/* sockets above the nodes, same as the hero map */}
            <g fill="var(--lp-map-line)" stroke="var(--lp-bg)" strokeWidth="0.8" opacity="0.95">
              <circle cx="67.2" cy="54" r="2" />
              <circle cx="50.8" cy="40.9" r="2" />
              <circle cx="112.4" cy="53.6" r="2" />
              <circle cx="130.8" cy="38.4" r="2" />
              <circle cx="69.7" cy="92.7" r="2" />
              <circle cx="49.3" cy="113.5" r="2" />
              <circle cx="110.7" cy="92.3" r="2" />
              <circle cx="130.7" cy="112" r="2" />
            </g>
          </svg>
        </aside>
      </div>
    </PanelShell>
  );
}

function PlanPanel({ hidden }: { hidden: boolean }) {
  const { t } = useLanguage();
  const items = [
    { day: "08", done: true, time: "20 min" },
    { day: "09", done: false, time: "25 min" },
    { day: "10", done: false, time: "30 min" },
  ];
  return (
    <PanelShell
      tab="plan"
      hidden={hidden}
      title={t("landing.preview.plan.title")}
      description={t("landing.preview.plan.desc")}
      pill={t("landing.preview.tab.plan")}
    >
      <div className="lp-plan-summary">
        <span>{t("landing.preview.plan.summaryLeft")}</span>
        <span>
          <strong>9</strong> / 14 {t("landing.preview.plan.dayUnit")}
        </span>
      </div>
      <div
        className="lp-progress-track"
        role="progressbar"
        aria-label={t("landing.preview.plan.progressAria")}
        aria-valuemin={0}
        aria-valuemax={14}
        aria-valuenow={9}
      >
        <div className="lp-progress-fill" />
      </div>
      <ol className="lp-plan-list">
        {items.map((item, index) => (
          <li key={item.day} className={item.done ? "lp-plan-item done" : "lp-plan-item"}>
            <span className="lp-plan-day">{item.day}</span>
            <div>
              <h4>{t(`landing.preview.plan.item${index + 1}.title`)}</h4>
              <p>{t(`landing.preview.plan.item${index + 1}.body`)}</p>
            </div>
            <span className="lp-plan-time">{item.time}</span>
          </li>
        ))}
      </ol>
    </PanelShell>
  );
}

function AskPanel({ hidden }: { hidden: boolean }) {
  const { t } = useLanguage();
  return (
    <PanelShell
      tab="ask"
      hidden={hidden}
      title={t("landing.preview.ask.title")}
      description={t("landing.preview.ask.desc")}
      pill={t("landing.preview.tab.ask")}
    >
      <div className="lp-conversation">
        <div className="lp-message lp-message-user">
          <span className="lp-message-label">{t("landing.preview.ask.userLabel")}</span>
          {t("landing.preview.ask.question")}
        </div>
        <div className="lp-message lp-message-ai">
          <span className="lp-message-label">SYNAPSE</span>
          <strong>{t("landing.preview.ask.strong")}</strong>
          <br />
          {t("landing.preview.ask.body")}
          <div className="lp-source-note">
            {t("landing.preview.ask.source")}
            <br />
            {t("landing.preview.ask.followup")}
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function ReviewPanel({ hidden }: { hidden: boolean }) {
  const { t } = useLanguage();
  const bars = [
    { x: 58, y: 90, h: 60, value: 8 },
    { x: 128, y: 70, h: 80, value: 12 },
    { x: 198, y: 80, h: 70, value: 10 },
    { x: 268, y: 50, h: 100, value: 16 },
    { x: 338, y: 60, h: 90, value: 14 },
    { x: 408, y: 30, h: 120, value: 20 },
    { x: 478, y: 40, h: 110, value: 18 },
  ];
  const bestValue = Math.max(...bars.map((bar) => bar.value));
  return (
    <PanelShell
      tab="review"
      hidden={hidden}
      title={t("landing.preview.review.title")}
      description={t("landing.preview.review.desc")}
      pill={t("landing.preview.tab.review")}
    >
      <div className="lp-review-stats">
        <div className="lp-review-stat">
          <span className="lp-stat-value">12</span>
          <span className="lp-stat-label">{t("landing.preview.review.stat1")}</span>
        </div>
        <div className="lp-review-stat">
          <span className="lp-stat-value">28</span>
          <span className="lp-stat-label">{t("landing.preview.review.stat2")}</span>
        </div>
        <div className="lp-review-stat">
          <span className="lp-stat-value">
            6<span className="lp-nowrap"> {t("landing.preview.review.stat3Unit")}</span>
          </span>
          <span className="lp-stat-label">{t("landing.preview.review.stat3")}</span>
        </div>
      </div>
      <div className="lp-review-chart">
        <div className="lp-chart-heading">
          <h3>{t("landing.preview.review.chartTitle")}</h3>
          <span>{t("landing.preview.review.chartNote")}</span>
        </div>
        <svg viewBox="0 0 560 190" role="img" aria-labelledby="lp-chart-title lp-chart-desc">
          <title id="lp-chart-title">{t("landing.preview.review.chartAria")}</title>
          <desc id="lp-chart-desc">{t("landing.preview.review.chartDesc")}</desc>
          <g stroke="var(--lp-border)" strokeWidth="1">
            <path d="M40 20H540M40 65H540M40 110H540M40 150H540" />
          </g>
          <defs>
            <linearGradient id="lp-review-bar-best" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--lp-peach)" />
              <stop offset="1" stopColor="var(--lp-coral)" />
            </linearGradient>
          </defs>
          <g fill="var(--lp-accent-soft)">
            {bars.map((bar) => (
              <rect
                key={bar.x}
                x={bar.x}
                y={bar.y}
                width="42"
                height={bar.h}
                rx="6"
                fill={bar.value === bestValue ? "url(#lp-review-bar-best)" : undefined}
              />
            ))}
          </g>
          <g fill="var(--lp-accent)" fontSize="12" textAnchor="middle" fontWeight="700">
            {bars.map((bar) => (
              <text key={bar.x} x={bar.x + 21} y={bar.y - 10}>
                {bar.value}
              </text>
            ))}
          </g>
          <g fill="var(--lp-text-subtle)" fontSize="11" textAnchor="middle">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <text key={n} x={79 + (n - 1) * 70} y="174">
                {t(`landing.preview.review.d${n}`)}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </PanelShell>
  );
}
