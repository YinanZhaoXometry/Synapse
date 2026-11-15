import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { LANGUAGES, useLanguage, type Language } from "@/contexts/LanguageContext";
import { BrandMark, CheckIcon, CloseIcon, DownloadIcon, GithubIcon, GlobeIcon, MenuIcon } from "./landing-icons";

/** The repository (owner ask 2026-11-15): linked from the header pill, the
 * mobile menu, and the footer nav. The download CTAs point at the releases
 * page (owner round 2026-11-15) — GitHub hosts the installers. */
export const LANDING_REPO_URL = "https://github.com/YinanZhaoXometry/Synapse";
export const LANDING_RELEASES_URL = "https://github.com/YinanZhaoXometry/Synapse/releases";

// The five in-page anchors the header nav + scrollspy share (landing sections).

export const LANDING_SECTIONS = ["lp-workflow", "lp-features", "lp-preview", "lp-scenarios", "lp-faq"] as const;

// Language endonyms: a language's own name reads the same in every UI locale,
// so these deliberately ride outside the i18n deck.
const LANGUAGE_LABELS: Record<Language, string> = {
  zh: "简体中文",
  en: "English",
  "zh-TW": "繁體中文",
};

export function LandingHeader() {
  const { t, language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const headerRef = useRef<HTMLElement | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  // Scrollspy (ported from the design's rAF-throttled scroll handler): the last
  // section whose top passes 38% of the viewport is the current one.
  useEffect(() => {
    let frameRequested = false;
    const update = () => {
      frameRequested = false;
      let currentId = "";
      LANDING_SECTIONS.forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.38) currentId = id;
      });
      setCurrentSection(currentId);
    };
    const onScroll = () => {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mobile menu: outside click closes, Escape closes + restores focus, and
  // crossing back over the desktop breakpoint closes (matchMedia, as designed).
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    document.addEventListener("click", onPointerDown);
    document.addEventListener("keydown", onKey);
    desktopQuery.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("click", onPointerDown);
      document.removeEventListener("keydown", onKey);
      desktopQuery.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  const navItems = [
    { href: "#lp-workflow", key: "landing.nav.workflow" },
    { href: "#lp-features", key: "landing.nav.features" },
    { href: "#lp-preview", key: "landing.nav.preview" },
    { href: "#lp-scenarios", key: "landing.nav.scenarios" },
    { href: "#lp-faq", key: "landing.nav.faq" },
  ];
  const navLink = useCallback(
    (item: { href: string; key: string }) => (
      <a
        key={item.href}
        className="lp-nav-link"
        href={item.href}
        aria-current={currentSection === item.href.slice(1) ? "true" : undefined}
      >
        {t(item.key)}
      </a>
    ),
    [currentSection, t],
  );

  return (
    <header className="lp-header" ref={headerRef}>
      <div className="lp-container lp-header-inner">
        <a className="lp-brand" href="#lp-top" aria-label={t("landing.header.brandAria")}>
          <BrandMark />
          <span className="lp-brand-name">Synapse</span>
          <span className="lp-brand-tag">{t("brand.sub")}</span>
        </a>
        <nav className="lp-primary-nav" aria-label={t("landing.header.primaryNavAria")}>
          {navItems.map(navLink)}
        </nav>
        <div className="lp-header-actions">
          {/* Language menu (round 5): a ghost globe trigger opening the three
              locales, persisting through the app's own synapse-lang seam. Radix
              primitives render inline — no portal — so the .lp-root token scope
              (fixed dark palette) applies to the menu panel. */}
          <DropdownMenuPrimitive.Root>
            <DropdownMenuPrimitive.Trigger className="lp-ghost-btn" aria-label={t("common.switchLang")}>
              <GlobeIcon />
            </DropdownMenuPrimitive.Trigger>
            <DropdownMenuPrimitive.Content className="lp-lang-menu" sideOffset={8} align="end">
              {LANGUAGES.map((lang) => (
                <DropdownMenuPrimitive.Item
                  key={lang}
                  className="lp-lang-item"
                  data-active={language === lang || undefined}
                  onSelect={() => setLanguage(lang)}
                >
                  <span className="lp-lang-name">{LANGUAGE_LABELS[lang]}</span>
                  {language === lang && <CheckIcon />}
                </DropdownMenuPrimitive.Item>
              ))}
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Root>
          <a
            className="lp-ghost-btn"
            href={LANDING_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={t("landing.header.githubAria")}
          >
            <GithubIcon />
          </a>
          <Link className="lp-login-link" to="/login">
            {t("landing.header.login")}
          </Link>
          <a className="lp-btn lp-btn-primary lp-btn-sm" href={LANDING_RELEASES_URL} target="_blank" rel="noreferrer">
            <DownloadIcon />
            {t("landing.header.download")}
          </a>
          <button
            className="lp-menu-toggle"
            type="button"
            ref={menuToggleRef}
            aria-expanded={menuOpen}
            aria-controls="lp-mobile-nav"
            aria-label={menuOpen ? t("landing.header.closeMenu") : t("landing.header.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
        {menuOpen && (
          <nav className="lp-mobile-nav" id="lp-mobile-nav" aria-label={t("landing.header.mobileNavAria")}>
            {navItems.map((item) => (
              <a key={item.href} className="lp-nav-link" href={item.href} onClick={() => setMenuOpen(false)}>
                {t(item.key)}
              </a>
            ))}
            <a className="lp-nav-link" href={LANDING_REPO_URL} target="_blank" rel="noreferrer">
              <GithubIcon /> GitHub
            </a>
            <Link className="lp-nav-link" to="/login" onClick={() => setMenuOpen(false)}>

              {t("landing.header.login")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
