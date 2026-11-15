import { useLanguage } from "@/contexts/LanguageContext";
import { LANDING_RELEASES_URL, LANDING_REPO_URL } from "./LandingHeader";
import { BrandMark } from "./landing-icons";

export function LandingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="lp-footer">
      <div className="lp-container lp-footer-inner">
        <div className="lp-footer-brand">
          <BrandMark />
          <div>
            <p className="lp-footer-title">{t("landing.footer.title")}</p>
            <p className="lp-footer-note">{t("landing.footer.note")}</p>
          </div>
        </div>
        <nav className="lp-footer-nav" aria-label={t("landing.footer.navAria")}>
          {/* product anchors first, then a separator, then the actions — the
              download CTA repeats here so the page's goal survives to the end */}
          <a href="#lp-features">{t("landing.nav.features")}</a>
          <a href="#lp-preview">{t("landing.nav.preview")}</a>
          <a href="#lp-scenarios">{t("landing.nav.scenarios")}</a>
          <a href="#lp-faq">{t("landing.nav.faq")}</a>
          <span className="lp-footer-sep" aria-hidden="true" />
          <a href={LANDING_RELEASES_URL} target="_blank" rel="noreferrer">
            {t("landing.hero.download")}
          </a>
          <a href="#lp-top">{t("landing.footer.top")}</a>
          <a href={LANDING_REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
        </nav>
      </div>
      <div className="lp-container lp-footer-bottom">
        <p className="lp-footer-copyright">{t("landing.footer.copyright")}</p>
      </div>
    </footer>
  );
}
