import { useLanguage } from "@/contexts/LanguageContext";
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
          <a href="#lp-features">{t("landing.nav.features")}</a>
          <a href="#lp-preview">{t("landing.nav.preview")}</a>
          <a href="#lp-scenarios">{t("landing.nav.scenarios")}</a>
          <a href="#lp-faq">{t("landing.nav.faq")}</a>
          <a href="#lp-top">{t("landing.footer.top")}</a>
        </nav>
      </div>
    </footer>
  );
}
