import { useState } from "react";
import { CalendarDays, Compass, History, Inbox, Layers, MessageCircle, Network, PenLine, Share2, Target, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRightIcon } from "./landing-icons";
import { LANDING_REPO_URL } from "./LandingHeader";

/** The demo tab ids the preview panel and the capability "查看演示" links share. */
export type DemoTabId = "organize" | "plan" | "ask" | "review";

/** The statement band between hero and the loop — a quiet product-philosophy aside. */
export function LandingStatement() {
  const { t } = useLanguage();
  return (
    <div className="lp-statement">
      <div className="lp-container lp-statement-inner">
        <p className="lp-statement-quote">{t("landing.statement.quote")}</p>
        <p className="lp-statement-note">{t("landing.statement.note")}</p>
      </div>
    </div>
  );
}

/** 学习闭环 — the four-step loop on a connective top rule. Icons, not
 *  numbers, mark the steps (round 3: numbering read as machine-generated). */
export function LandingWorkflow() {
  const { t } = useLanguage();
  const StepIcons = [Inbox, Share2, PenLine, History];
  const steps = [1, 2, 3, 4].map((n) => ({
    icon: StepIcons[n - 1],
    tag: ["INPUT", "CONNECT", "PRACTICE", "RETAIN"][n - 1],
    title: t(`landing.workflow.step${n}.title`),
    body: t(`landing.workflow.step${n}.body`),
  }));
  return (
    <section className="lp-section" id="lp-workflow" aria-labelledby="lp-workflow-title">
      <div className="lp-container">
        <div className="lp-section-heading">
          <p className="lp-eyebrow">{t("landing.workflow.eyebrow")}</p>
          <h2 className="lp-section-title" id="lp-workflow-title">
            {t("landing.workflow.title")}
          </h2>
          <p className="lp-section-lead">{t("landing.workflow.lead")}</p>
        </div>
        <ol className="lp-loop-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.tag} className="lp-loop-step">
                <span className="lp-step-node">
                  <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="lp-step-tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** 核心能力 — intro left, capability rows right; each row's "查看演示" link
 *  jumps to the preview stage AND activates its demo tab. Icons replace the
 *  row numbers (round 3). */
export function LandingCapabilities({ onSelectDemo }: { onSelectDemo: (tab: DemoTabId) => void }) {
  const { t } = useLanguage();
  const capabilities: { id: DemoTabId; icon: typeof Network }[] = [
    { id: "organize", icon: Network },
    { id: "plan", icon: CalendarDays },
    { id: "ask", icon: MessageCircle },
    { id: "review", icon: TrendingUp },
  ];
  return (
    <section className="lp-section lp-capabilities" id="lp-features" aria-labelledby="lp-features-title">
      <div className="lp-container lp-capabilities-layout">
        <div className="lp-capabilities-intro">
          <p className="lp-eyebrow">{t("landing.features.eyebrow")}</p>
          <h2 className="lp-section-title" id="lp-features-title">
            {t("landing.features.title1")}
            <br />
            {t("landing.features.title2")}
          </h2>
          <p className="lp-section-lead">{t("landing.features.lead")}</p>
          {/* fills the sticky column's lower half with quiet, factual meta —
              what runs where, what you can bring */}
          <ul className="lp-capabilities-meta" aria-hidden="true">
            <li>{t("landing.features.meta1")}</li>
            <li>{t("landing.features.meta2")}</li>
          </ul>
        </div>
        <div className="lp-capability-list">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <article key={cap.id} className="lp-capability">
                <span className="lp-capability-number">
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div>
                  <h3>{t(`landing.features.c.${cap.id}.title`)}</h3>
                  <p>{t(`landing.features.c.${cap.id}.body`)}</p>
                </div>
                <a className="lp-text-link" href="#lp-preview" onClick={() => onSelectDemo(cap.id)}>
                  {t("landing.features.demoLink")}
                  <ArrowRightIcon />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 使用场景 — the three audience cards. Icons replace the SCENE / 0N index
 *  (round 3). */
export function LandingScenarios() {
  const { t } = useLanguage();
  const SceneIcons = [Target, Compass, Layers];
  const scenarios = [1, 2, 3];
  return (
    <section className="lp-section" id="lp-scenarios" aria-labelledby="lp-scenarios-title">
      <div className="lp-container">
        <div className="lp-section-heading">
          <p className="lp-eyebrow">{t("landing.scenarios.eyebrow")}</p>
          <h2 className="lp-section-title" id="lp-scenarios-title">
            {t("landing.scenarios.title")}
          </h2>
          <p className="lp-section-lead">{t("landing.scenarios.lead")}</p>
        </div>
        <div className="lp-scenario-grid">
          {scenarios.map((n) => {
            const Icon = SceneIcons[n - 1];
            return (
              <article key={n} className="lp-scenario-card">
                <span className="lp-scenario-index">
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3>{t(`landing.scenarios.s${n}.title`)}</h3>
                <p className="lp-scenario-quote">{t(`landing.scenarios.s${n}.quote`)}</p>
                <p className="lp-scenario-detail">{t(`landing.scenarios.s${n}.detail`)}</p>
                <div className="lp-scenario-example">
                  <div className="lp-example-box">
                    <p className="lp-example-label">{t(`landing.scenarios.s${n}.exampleLabel`)}</p>
                    <p className="lp-example-title">{t(`landing.scenarios.s${n}.exampleTitle`)}</p>
                    <p className="lp-example-meta">{t(`landing.scenarios.s${n}.exampleMeta`)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 常见问题 — native <details>, one open at a time (as designed). */
export function LandingFaq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);
  const items = [1, 2, 3, 4, 5];
  return (
    <section className="lp-section" id="lp-faq" aria-labelledby="lp-faq-title">
      <div className="lp-container lp-faq-layout">
        <div>
          <p className="lp-eyebrow">{t("landing.faq.eyebrow")}</p>
          <h2 className="lp-section-title" id="lp-faq-title">
            {t("landing.faq.title1")}
            <br />
            {t("landing.faq.title2")}
          </h2>
          <p className="lp-section-lead">{t("landing.faq.lead")}</p>
          {/* the intro column's lower half — a fallback for questions the
              accordion doesn't answer */}
          <a className="lp-faq-more" href={`${LANDING_REPO_URL}/issues`} target="_blank" rel="noreferrer">
            <span className="lp-faq-more-title">{t("landing.faq.more")}</span>
            <span className="lp-faq-more-link">
              {t("landing.faq.moreLink")}
              <ArrowRightIcon />
            </span>
          </a>
        </div>
        <div className="lp-faq-list">
          {items.map((n, index) => (
            <details
              key={n}
              open={index === openIndex}
              onToggle={(event) => {
                if ((event.target as HTMLDetailsElement).open) setOpenIndex(index);
              }}
            >
              <summary>
                {t(`landing.faq.q${n}`)}
                <span className="lp-faq-plus" aria-hidden="true" />
              </summary>
              <div className="lp-faq-answer">{t(`landing.faq.a${n}`)}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
