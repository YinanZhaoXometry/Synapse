import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowDownIcon, BulbIcon, DownloadIcon } from "./landing-icons";
import { LANDING_RELEASES_URL } from "./LandingHeader";

/**
 * Hero — copy left, the knowledge-map board right (ported verbatim from the
 * design: window chrome, the memory-topic SVG map, the "next step" row).
 */
export function LandingHero() {
  const { t } = useLanguage();
  return (
    <section className="lp-hero" id="lp-top" aria-labelledby="lp-hero-title">
      <div className="lp-container lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">{t("landing.hero.eyebrow")}</p>
          <h1 className="lp-hero-title" id="lp-hero-title">
            {t("landing.hero.titleLine1")}
            <br />
            <span>{t("landing.hero.titleAccent")}</span>
          </h1>
          <p className="lp-hero-lead">{t("landing.hero.lead")}</p>
          <div className="lp-hero-actions">
            <a className="lp-btn lp-btn-primary" href={LANDING_RELEASES_URL} target="_blank" rel="noreferrer">
              <DownloadIcon />
              {t("landing.hero.download")}
            </a>
            <a className="lp-btn lp-btn-secondary" href="#lp-preview">
              {t("landing.hero.seeHow")}
              <ArrowDownIcon />
            </a>
          </div>
          <p className="lp-hero-note">{t("landing.hero.note")}</p>
          <div className="lp-hero-principles" aria-label={t("landing.hero.principlesAria")}>
            <span className="lp-hero-principle">{t("landing.hero.principle1")}</span>
            <span className="lp-hero-principle">{t("landing.hero.principle2")}</span>
            <span className="lp-hero-principle">{t("landing.hero.principle3")}</span>
          </div>
        </div>
        <div className="lp-hero-visual">
          <span className="lp-hero-caption">{t("landing.hero.caption")}</span>
          <div className="lp-hero-board" aria-label={t("landing.hero.boardAria")}>
            <div className="lp-window-bar">
              <div className="lp-window-dots" aria-hidden="true">
                <span className="lp-window-dot" />
                <span className="lp-window-dot" />
                <span className="lp-window-dot" />
              </div>
              <span className="lp-window-title">{t("landing.hero.windowTitle")}</span>
              <span className="lp-window-status">{t("landing.hero.windowStatus")}</span>
            </div>
            <div className="lp-board-content">
              <div className="lp-board-heading">
                <div>
                  <p className="lp-board-kicker">{t("landing.hero.boardKicker")}</p>
                  <h2 className="lp-board-title">{t("landing.hero.boardTitle")}</h2>
                </div>
                <span className="lp-board-count">{t("landing.hero.boardCount")}</span>
              </div>
              <div className="lp-knowledge-map">
                <svg viewBox="0 0 500 330" role="img" aria-labelledby="lp-map-title lp-map-desc">
                  <title id="lp-map-title">{t("landing.hero.mapTitle")}</title>
                  <desc id="lp-map-desc">{t("landing.hero.mapDesc")}</desc>
                  <path
                    d="M250 166 119 80M250 166 388 77M250 166 104 251M250 166 394 249M119 80 388 77M104 251 394 249"
                    fill="none"
                    stroke="var(--lp-map-line)"
                    strokeWidth="1.3"
                    strokeDasharray="4 6"
                    opacity="0.72"
                  />
                  <path d="M250 166 250 54M250 166 250 288" fill="none" stroke="var(--lp-map-line)" strokeWidth="1.3" opacity="0.5" />
                  <circle cx="250" cy="166" r="64" fill="var(--lp-accent-soft)" />
                  <circle cx="250" cy="166" r="47" fill="var(--lp-surface)" stroke="var(--lp-accent)" strokeWidth="1.5" />
                  <text x="250" y="162" textAnchor="middle" fill="var(--lp-fg)" fontSize="18" fontWeight="700">
                    {t("landing.hero.map.core")}
                  </text>
                  <text x="250" y="184" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="11">
                    {t("landing.hero.map.coreSub")}
                  </text>
                  <g>
                    <rect x="61" y="52" width="116" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text x="119" y="76" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.encode")}
                    </text>
                    <text x="119" y="95" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.encodeSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="330" y="49" width="116" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text x="388" y="73" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.retrieve")}
                    </text>
                    <text x="388" y="92" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.retrieveSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="42" y="224" width="124" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text x="104" y="248" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.forget")}
                    </text>
                    <text x="104" y="267" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.forgetSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="332" y="222" width="124" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text x="394" y="246" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.space")}
                    </text>
                    <text x="394" y="265" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.spaceSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="194" y="24" width="112" height="38" rx="12" fill="var(--lp-accent-soft)" stroke="var(--lp-accent)" />
                    <text x="250" y="48" textAnchor="middle" fill="var(--lp-accent-deep)" fontSize="13" fontWeight="650">
                      {t("landing.hero.map.recall")}
                    </text>
                  </g>
                  <circle cx="250" cy="288" r="8" fill="var(--lp-surface)" stroke="var(--lp-map-line)" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="lp-board-next">
                <span className="lp-next-symbol">
                  <BulbIcon />
                </span>
                <div>
                  <p className="lp-next-title">{t("landing.hero.nextTitle")}</p>
                  <p className="lp-next-description">{t("landing.hero.nextDesc")}</p>
                </div>
                <span className="lp-next-time">25 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
