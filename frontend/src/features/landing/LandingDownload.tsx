import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRightIcon, DownloadIcon, GithubIcon } from "./landing-icons";
import { LANDING_RELEASES_URL, LANDING_REPO_URL } from "./LandingHeader";

/**
 * The gradient download CTA panel above the FAQ. The download itself is an
 * outbound link to the GitHub releases page (owner round 2026-11-15) — the
 * former platform-picker dialog is gone along with its triggers.
 */
export function LandingDownloadSection() {
  const { t } = useLanguage();
  return (
    <section className="lp-download-section" aria-labelledby="lp-download-title">
      <div className="lp-container">
        <div className="lp-download-panel">
          <svg className="lp-download-lines" viewBox="0 0 1200 460" preserveAspectRatio="none" aria-hidden="true">
            <g fill="none" stroke="var(--lp-on-warm)" strokeWidth="1" opacity="0.22">
              <path d="M0 92 196 160 378 58M1200 90 1010 168 830 62M0 376l194-74 176 88M1200 372l-190-70-180 88" />
              <path d="m196 160-2 142M1010 168v134M378 58l76 322M830 62l-74 330" strokeDasharray="5 8" />
            </g>
            <g fill="var(--lp-on-warm)" opacity="0.26">
              <circle cx="196" cy="160" r="7" />
              <circle cx="194" cy="302" r="5" />
              <circle cx="378" cy="58" r="6" />
              <circle cx="454" cy="380" r="8" />
              <circle cx="1010" cy="168" r="7" />
              <circle cx="1010" cy="302" r="5" />
              <circle cx="830" cy="62" r="6" />
              <circle cx="756" cy="392" r="8" />
            </g>
          </svg>
          <div className="lp-download-content">
            <p className="lp-eyebrow">{t("landing.download.eyebrow")}</p>
            <h2 id="lp-download-title">
              {t("landing.download.title1")}
              <br />
              {t("landing.download.title2")}
            </h2>
            <p className="lp-section-lead">{t("landing.download.lead")}</p>
            <div className="lp-download-actions">
              <a className="lp-btn lp-btn-dark" href={LANDING_RELEASES_URL} target="_blank" rel="noreferrer">
                <DownloadIcon />
                {t("landing.download.cta")}
              </a>
              <a className="lp-btn lp-btn-subtle" href="#lp-faq">
                {t("landing.download.faq")}
                <ArrowRightIcon />
              </a>
            </div>
            <div className="lp-download-platforms" aria-label={t("landing.download.platformsAria")}>
              <span>macOS</span>
              <span>Windows</span>
              {/* shipping platforms full-weight, mobile visibly "soon" — matching
                  what Releases actually hosts */}
              <span className="lp-platform-soon">
                iOS / Android
                <em className="lp-soon-chip">{t("landing.download.soon")}</em>
              </span>
            </div>
            <a className="lp-download-oss" href={LANDING_REPO_URL} target="_blank" rel="noreferrer">
              <GithubIcon />
              {t("landing.download.openSource")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
