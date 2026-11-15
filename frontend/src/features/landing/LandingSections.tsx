import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRightIcon } from "./landing-icons";

/** The demo tab ids the preview panel and the capability "查看演示" links share. */
export type DemoTabId = "organize" | "plan" | "ask" | "review";

/** The statement band between hero and 01 — a quiet product-philosophy aside. */
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

/** 01 / 学习闭环 — the four-step loop on a connective top rule. */
export function LandingWorkflow() {
  const { t } = useLanguage();
  const steps = [1, 2, 3, 4].map((n) => ({
    node: String(n).padStart(2, "0"),
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
          {steps.map((step) => (
            <li key={step.node} className="lp-loop-step">
              <span className="lp-step-node">{step.node}</span>
              <span className="lp-step-tag">{step.tag}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** 02 / 核心能力 — intro left, numbered capability rows right; each row's
 *  "查看演示" link jumps to the preview stage AND activates its demo tab. */
export function LandingCapabilities({ onSelectDemo }: { onSelectDemo: (tab: DemoTabId) => void }) {
  const { t } = useLanguage();
  const capabilities: { id: DemoTabId; n: string }[] = [
    { id: "organize", n: "01" },
    { id: "plan", n: "02" },
    { id: "ask", n: "03" },
    { id: "review", n: "04" },
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
        </div>
        <div className="lp-capability-list">
          {capabilities.map((cap) => (
            <article key={cap.id} className="lp-capability">
              <span className="lp-capability-number">{cap.n}</span>
              <div>
                <h3>{t(`landing.features.c.${cap.id}.title`)}</h3>
                <p>{t(`landing.features.c.${cap.id}.body`)}</p>
              </div>
              <a className="lp-text-link" href="#lp-preview" onClick={() => onSelectDemo(cap.id)}>
                {t("landing.features.demoLink")}
                <ArrowRightIcon />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 04 / 使用场景 — the three audience cards. */
export function LandingScenarios() {
  const { t } = useLanguage();
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
          {scenarios.map((n) => (
            <article key={n} className="lp-scenario-card">
              <span className="lp-scenario-index">SCENE / {String(n).padStart(2, "0")}</span>
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
          ))}
        </div>
      </div>
    </section>
  );
}

/** 05 / 常见问题 — native <details>, one open at a time (as designed). */
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
