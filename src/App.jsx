import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Target,
  Video,
  X,
  Zap
} from "lucide-react";
import manifest from "./data/assetManifest.json";
import {
  caseStudies,
  experience,
  profile,
  proofPoints,
  services,
  skills,
  visualStories,
  workflow
} from "./data/profile.js";

const renderableImageExtensions = new Set(["png", "jpg", "jpeg"]);
const originalSourceAvailable = import.meta.env.DEV;

function originalAssetUrl(assetOrPath) {
  const path = typeof assetOrPath === "string" ? assetOrPath : assetOrPath.path;
  return `/client-assets/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function staticAssetUrl(path) {
  return `/${path.split("/").map(encodeURIComponent).join("/")}`;
}

function assetPreviewUrl(asset) {
  if (asset?.previewPath) return staticAssetUrl(asset.previewPath);
  return asset ? originalAssetUrl(asset) : "";
}

function assetOpenUrl(asset) {
  if (!asset) return "";
  if (asset.downloadPath) return staticAssetUrl(asset.downloadPath);
  if (originalSourceAvailable) return originalAssetUrl(asset);
  return asset.previewPath ? staticAssetUrl(asset.previewPath) : "";
}

function getAsset(path, fallbackPath) {
  return (
    manifest.assets.find((asset) => asset.path === path) ||
    (fallbackPath ? manifest.assets.find((asset) => asset.path === fallbackPath) : undefined)
  );
}

function cleanNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function canPreviewAsset(asset) {
  return Boolean(asset?.previewPath) || (asset?.type === "image" && renderableImageExtensions.has(asset.extension));
}

function SectionTitle({ eyebrow, title, text, compact = false }) {
  return (
    <div className={`section-title ${compact ? "compact" : ""}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function AssetModal({ asset, onClose }) {
  if (!asset) return null;

  const previewable = canPreviewAsset(asset);
  const isVideo = asset.type === "video";
  const openUrl = assetOpenUrl(asset);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={asset.title}>
      <div className="modal-panel">
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close preview">
          <X aria-hidden="true" />
        </button>
        <div className="modal-media">
          {isVideo && originalSourceAvailable && <video src={originalAssetUrl(asset)} controls autoPlay playsInline />}
          {(!isVideo || !originalSourceAvailable) && previewable && <img src={assetPreviewUrl(asset)} alt={asset.title} />}
          {!previewable && !isVideo && (
            <div className="document-preview">
              <FileText aria-hidden="true" />
              <p>{asset.name}</p>
            </div>
          )}
        </div>
        <div className="modal-copy">
          <span>{asset.medium}</span>
          <h2>{asset.title}</h2>
          <p>{asset.collection}</p>
          {isVideo && !originalSourceAvailable && <small>The live site shows a polished preview frame for heavier reel files.</small>}
          {openUrl && (
            <a href={openUrl} target="_blank" rel="noreferrer">
              <Download aria-hidden="true" />
              Open asset
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignTheatre({ slides, activeIndex, setActiveIndex, onOpen }) {
  const active = slides[activeIndex];

  function move(direction) {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <div className="campaign-theatre">
      <div className="theatre-image-wrap">
        <button type="button" className="theatre-image" onClick={() => onOpen(active.asset)}>
          <img key={active.asset.path} src={assetPreviewUrl(active.asset)} alt={active.title} />
          <span>{active.label}</span>
        </button>
        <div className="theatre-controls" aria-label="Campaign carousel controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous campaign">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next campaign">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="theatre-copy" key={active.title}>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <h3>{active.title}</h3>
        <p>{active.result}</p>
        <div className="theatre-tags">
          {active.tags.map((tag) => (
            <small key={tag}>{tag}</small>
          ))}
        </div>
      </div>
      <div className="theatre-progress">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.title}
            className={index === activeIndex ? "active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show ${slide.title}`}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}

function ServiceRow({ service, index }) {
  const icons = [Target, CalendarDays, Sparkles, BarChart3];
  const Icon = icons[index % icons.length];

  return (
    <article className="service-row">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <Icon aria-hidden="true" />
      <div>
        <h3>{service.title}</h3>
        <p>{service.text}</p>
      </div>
    </article>
  );
}

function ProjectFeature({ study, index, onOpen }) {
  const asset = getAsset(study.assetPath);

  return (
    <article className={`project-feature ${index % 2 ? "reverse" : ""}`}>
      <button className="project-media" type="button" onClick={() => asset && onOpen(asset)}>
        {asset && <img src={assetPreviewUrl(asset)} alt={study.title} loading="lazy" />}
      </button>
      <div className="project-copy">
        <span>{study.label}</span>
        <h3>{study.title}</h3>
        <strong>{study.result}</strong>
        <p>{study.text}</p>
        <div className="tag-row">
          {study.tags.map((tag) => (
            <small key={tag}>{tag}</small>
          ))}
        </div>
      </div>
    </article>
  );
}

function LibraryItem({ asset, onOpen }) {
  const Icon = asset.type === "video" ? Video : asset.type === "document" ? FileText : ImageIcon;
  const title = asset.project && asset.project !== asset.medium ? asset.project : asset.title;
  const note =
    asset.type === "video"
      ? "Motion content for reels, campaign stories, and social-first edits."
      : asset.collection || "Selected portfolio preview from the working content system.";

  return (
    <button className="library-item" type="button" onClick={() => onOpen(asset)}>
      <span className="library-type">
        <Icon aria-hidden="true" />
        {asset.type}
      </span>
      <span className="library-thumb">
        {canPreviewAsset(asset) ? (
          <img src={assetPreviewUrl(asset)} alt={title} loading="lazy" />
        ) : (
          <span>
            <Icon aria-hidden="true" />
            {asset.extension.toUpperCase()}
          </span>
        )}
      </span>
      <span className="library-copy">
        <small>{asset.medium}</small>
        <strong>{title}</strong>
        <em>{note}</em>
      </span>
    </button>
  );
}

export default function App() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeLibrary, setActiveLibrary] = useState("Beauty");
  const [query, setQuery] = useState("");
  const [openAsset, setOpenAsset] = useState(null);

  const campaignSlides = useMemo(
    () =>
      caseStudies
        .map((study) => ({
          ...study,
          asset: getAsset(study.assetPath)
        }))
        .filter((study) => study.asset),
    []
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % campaignSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [campaignSlides.length]);

  const heroStack = useMemo(
    () =>
      [
        "Canva Designs_/11_i have treated 5000+ patients/1.png",
        "Dslr Shoot_/Cafe pulp_/Caraousel_/IMG_2284.PNG",
        "clothing brand practice shoot_/Karan edit_/DSC01195.JPG"
      ]
        .map((path) => getAsset(path))
        .filter(Boolean),
    []
  );

  const libraryGroups = useMemo(
    () => ({
      Beauty: manifest.assets.filter((asset) => asset.medium === "Canva Designs" && asset.type === "image").slice(0, 10),
      Hospitality: manifest.assets.filter((asset) => asset.medium === "DSLR Shoots").slice(0, 10),
      Fashion: manifest.assets.filter((asset) => asset.medium === "Clothing Shoot").slice(0, 10),
      Reels: manifest.assets.filter((asset) => asset.type === "video").slice(0, 10)
    }),
    []
  );

  const searchedAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return libraryGroups[activeLibrary] || [];
    return manifest.assets
      .filter((asset) => asset.type !== "document")
      .filter((asset) =>
        [asset.title, asset.name, asset.medium, asset.project, asset.collection, asset.path]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [activeLibrary, libraryGroups, query]);

  return (
    <>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Primary navigation">
          <a className="brand-mark" href="#home" aria-label="Khushali Bochiwal home">
            {profile.initials}
          </a>
          <div className="nav-links">
            <a href="#work">Work</a>
            <a href="#services">Services</a>
            <a href="#resume">Resume</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Digital marketer | social media strategist</span>
            <h1>Premium social presence for brands that need more than posts.</h1>
            <p>
              {profile.name} turns strategy, shoots, reels, carousels, campaigns, and paid media into a sharp brand
              system for beauty, hospitality, fashion, luxury, automotive, and emerging businesses.
            </p>
            <div className="hero-actions">
              <a href="#work" className="primary-action">
                <Sparkles aria-hidden="true" />
                View portfolio
              </a>
              <a href={`mailto:${profile.email}`} className="secondary-action">
                <Mail aria-hidden="true" />
                Book a campaign
              </a>
            </div>
          </div>

          <div className="hero-art" aria-label="Portfolio visual preview">
            {heroStack.map((asset, index) => (
              <button key={asset.path} type="button" className={`floating-shot shot-${index + 1}`} onClick={() => setOpenAsset(asset)}>
                <img src={assetPreviewUrl(asset)} alt={asset.project} />
              </button>
            ))}
            <div className="hero-card">
              <strong>{cleanNumber(manifest.totals.files)}</strong>
              <span>curated creative assets</span>
            </div>
          </div>
        </section>

        <section className="signal-strip">
          <div className="content-shell">
            <div className="signal-track">
              {["Strategy", "Reels", "Carousels", "Meta Ads", "Brand Launches", "Client Servicing", "Shoot Direction"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="intro-section">
          <div className="content-shell intro-grid">
            <SectionTitle
              eyebrow="Portfolio strategy"
              title="Keep the work curated. Show the thinking. Let the visuals sell the skill."
              text="A client-facing portfolio should highlight the categories, proof, process, and strongest visuals that make Khushali easy to trust and easy to hire."
            />
            <div className="intro-proof">
              <div>
                <strong>{cleanNumber(manifest.totals.byType.image)}</strong>
                <span>images and designs</span>
              </div>
              <div>
                <strong>{cleanNumber(manifest.totals.byType.video)}</strong>
                <span>video and reel assets</span>
              </div>
              <div>
                <strong>4</strong>
                <span>core industries shown</span>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="theatre-section">
          <div className="content-shell">
            <SectionTitle
              eyebrow="Featured campaigns"
              title="A moving campaign theatre, built from real client assets."
              text="The carousel highlights the work that belongs on a public portfolio: beauty authority, hospitality discovery, fashion visuals, and premium campaign execution."
            />
            <CampaignTheatre
              slides={campaignSlides}
              activeIndex={activeSlide}
              setActiveIndex={setActiveSlide}
              onOpen={setOpenAsset}
            />
          </div>
        </section>

        <section id="services" className="services-section">
          <div className="content-shell service-layout">
            <div className="service-lead">
              <SectionTitle
                eyebrow="Services"
                title="One content engine from brand idea to performance learning."
                text="These are the services that matter for the client, presented as a working capability system instead of random boxes."
              />
            </div>
            <div className="service-list">
              {services.map((service, index) => (
                <ServiceRow key={service.title} service={service} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="proof-section">
          <div className="content-shell">
            <div className="proof-line">
              {proofPoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="projects-section">
          <div className="content-shell">
            <SectionTitle
              eyebrow="Selected work"
              title="Case studies with space to breathe."
              text="The layout gives each project a premium editorial moment, so the portfolio feels intentional on desktop, Android, and iOS."
            />
            <div className="project-stack">
              {caseStudies.map((study, index) => (
                <ProjectFeature key={study.title} study={study} index={index} onOpen={setOpenAsset} />
              ))}
            </div>
          </div>
        </section>

        <section className="visual-section">
          <div className="content-shell">
            <SectionTitle
              eyebrow="Content directions"
              title="Different formats, one premium visual language."
              text="A portfolio should show range without becoming cluttered: education, food, creator thumbnails, fashion imagery, and campaign assets."
            />
            <div className="visual-carousel">
              {visualStories.map((story, index) => {
                const asset = getAsset(story.assetPath, story.fallbackPath);
                return (
                  <article key={story.title} className={`visual-slide visual-${index + 1}`}>
                    <button type="button" onClick={() => asset && setOpenAsset(asset)}>
                      {asset && <img src={assetPreviewUrl(asset)} alt={story.title} loading="lazy" />}
                    </button>
                    <div>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <h3>{story.title}</h3>
                      <p>{story.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="resume" className="resume-section">
          <div className="content-shell resume-grid">
            <div>
              <SectionTitle
                eyebrow="Resume, translated for the web"
                title="Hands-on marketer with agency polish and independent execution."
                text={profile.intro}
              />
              <div className="profile-note">
                {profile.profile.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
            <aside className="resume-panel">
              <span>Based in</span>
              <strong>{profile.location}</strong>
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" />
                {profile.email}
              </a>
              <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" />
                {profile.phone}
              </a>
            </aside>
          </div>

          <div className="content-shell resume-details">
            <div className="experience-flow">
              {experience.map((item) => (
                <article key={`${item.title}-${item.period}`}>
                  <span>{item.period}</span>
                  <h3>{item.title}</h3>
                  <p>{item.company}{item.location ? ` | ${item.location}` : ""}</p>
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <div className="skill-cloud">
              <h3>Core skills</h3>
              {[...skills.core, ...skills.tools, ...skills.soft].map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
              <div className="education-block">
                <strong>{profile.education.title}</strong>
                <small>{profile.education.school}</small>
                <strong>{profile.certification.title}</strong>
                <small>{profile.certification.school}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="method-section">
          <div className="content-shell method-layout">
            <SectionTitle
              eyebrow="Method"
              title="Simple, repeatable, performance-aware."
              text="This is the operating rhythm behind the work, shown simply because clients care about clarity."
              compact
            />
            <div className="method-steps">
              {workflow.map((step, index) => (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="library-section">
          <div className="content-shell">
            <SectionTitle
              eyebrow="Portfolio explorer"
              title="A curated preview of the work clients should see first."
              text="Search by format, category, or brand. The page keeps the strongest designs, shoots, and reels easy to scan without turning the portfolio into a crowded gallery."
            />
            <div className="library-toolbar">
              <label>
                <Search aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets..." />
              </label>
              <div>
                {Object.keys(libraryGroups).map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={activeLibrary === group && !query ? "active" : ""}
                    onClick={() => {
                      setQuery("");
                      setActiveLibrary(group);
                    }}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
            <p className="library-count">
              Showing {searchedAssets.length} selected {query ? "matching" : activeLibrary.toLowerCase()} pieces.
            </p>
            <div className="library-grid">
              {searchedAssets.map((asset) => (
                <LibraryItem key={asset.path} asset={asset} onOpen={setOpenAsset} />
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="content-shell contact-grid">
            <div>
              <span className="eyebrow">Build the next campaign</span>
              <h2>For brands that need taste, speed, and measurable social presence.</h2>
            </div>
            <div className="contact-card">
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" />
                {profile.email}
              </a>
              <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                <Phone aria-hidden="true" />
                {profile.phone}
              </a>
              <span>
                <MapPin aria-hidden="true" />
                {profile.location}
              </span>
              <Zap aria-hidden="true" />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>{profile.name}</span>
        <span>{profile.role}</span>
      </footer>

      <AssetModal asset={openAsset} onClose={() => setOpenAsset(null)} />
    </>
  );
}
