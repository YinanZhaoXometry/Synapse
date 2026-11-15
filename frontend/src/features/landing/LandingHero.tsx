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
                  {/* connectors — curved, socket-dotted at both ends; the vertical
                      axis (recall chip above, open node below) stays straight */}
                  <g className="lp-map-edges" fill="none" stroke="var(--lp-map-line)" strokeWidth="1.3" strokeDasharray="4 6" opacity="0.72">
                    <path d="M210.8 140.1Q195.7 108.5 152 107" />
                    <path d="M289.4 140.4Q307.7 107.1 345.6 104" />
                    <path d="M209.2 189.3Q184.1 224.4 141.1 228" />
                    <path d="M290.4 190.1Q311.4 223.6 350.7 226" />
                  </g>
                  <g fill="none" stroke="var(--lp-map-line)" strokeWidth="1" opacity="0.35">
                    <path d="M177 79.5Q253.5 52 330 76.5" />
                    <path d="M151 252Q245 277 339 250" />
                  </g>
                  <path d="M250 119V62M250 213V280" fill="none" stroke="var(--lp-map-line)" strokeWidth="1.3" opacity="0.5" />
                  {/* the halo stays INSIDE the socket ring (r47 + dot) so the
                      terminator dots land on quiet background, not on glow */}
                  <circle cx="250" cy="166" r="54" fill="var(--lp-accent-soft)" />
                  <circle cx="250" cy="166" r="47" fill="var(--lp-surface)" stroke="var(--lp-accent)" strokeWidth="1.5" />
                  <text x="250" y="162" textAnchor="middle" fill="var(--lp-fg)" fontSize="18" fontWeight="700">
                    {t("landing.hero.map.core")}
                  </text>
                  <text className="lp-map-sub" x="250" y="184" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="11">
                    {t("landing.hero.map.coreSub")}
                  </text>
                  <g>
                    <rect x="61" y="52" width="116" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text className="lp-map-title" x="119" y="76" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.encode")}
                    </text>
                    <text className="lp-map-sub" x="119" y="95" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.encodeSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="330" y="49" width="116" height="55" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border)" />
                    <text className="lp-map-title" x="388" y="73" textAnchor="middle" fill="var(--lp-fg)" fontSize="15" fontWeight="650">
                      {t("landing.hero.map.retrieve")}
                    </text>
                    <text className="lp-map-sub" x="388" y="92" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.retrieveSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="47" y="228" width="104" height="48" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border-soft)" />
                    <text className="lp-map-title" x="99" y="249" textAnchor="middle" fill="var(--lp-fg-2)" fontSize="14" fontWeight="650">
                      {t("landing.hero.map.forget")}
                    </text>
                    <text className="lp-map-sub" x="99" y="265" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
                      {t("landing.hero.map.forgetSub")}
                    </text>
                  </g>
                  <g>
                    <rect x="339" y="226" width="104" height="48" rx="14" fill="var(--lp-surface)" stroke="var(--lp-border-soft)" />
                    <text className="lp-map-title" x="391" y="247" textAnchor="middle" fill="var(--lp-fg-2)" fontSize="14" fontWeight="650">
                      {t("landing.hero.map.space")}
                    </text>
                    <text className="lp-map-sub" x="391" y="263" textAnchor="middle" fill="var(--lp-text-subtle)" fontSize="10">
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
                  {/* sockets ride ABOVE the nodes so each edge visibly plugs into
                      its border; the bg-colored ring punches them through the
                      center halo instead of drowning in it */}
                  <g fill="var(--lp-map-line)" stroke="var(--lp-bg)" strokeWidth="1" opacity="0.95">
                    <circle cx="210.8" cy="140.1" r="2.5" />
                    <circle cx="152" cy="107" r="2.5" />
                    <circle cx="289.4" cy="140.4" r="2.5" />
                    <circle cx="345.6" cy="104" r="2.5" />
                    <circle cx="209.2" cy="189.3" r="2.5" />
                    <circle cx="141.1" cy="228" r="2.5" />
                    <circle cx="290.4" cy="190.1" r="2.5" />
                    <circle cx="350.7" cy="226" r="2.5" />
                    <circle cx="250" cy="119" r="2.5" />
                    <circle cx="250" cy="62" r="2.5" />
                  </g>
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
