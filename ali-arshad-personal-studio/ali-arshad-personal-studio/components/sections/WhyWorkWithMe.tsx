import { Icon, type IconName } from "@/components/ui/Icon";

type Differentiator = {
  icon: IconName;
  title: string;
  text: string;
};

const REASONS: Differentiator[] = [
  {
    icon: "layers",
    title: "Creative & technical under one roof",
    text: "Brand systems, video editing, 3D visuals and production code are shaped together — eliminating the friction between design and engineering.",
  },
  {
    icon: "code",
    title: "Full-stack implementation",
    text: "Clean Next.js frontends, reliable APIs, custom dashboards and storefronts built with strict TypeScript and verified end-to-end.",
  },
  {
    icon: "bot",
    title: "Practical AI & workflow automation",
    text: "n8n pipelines and custom AI agents built around your actual CRM, support desk and operational rules — with clear hand-offs to humans.",
  },
  {
    icon: "globe",
    title: "Business & supply-chain grounding",
    text: "Grounded in commercial margins, procurement realities and landed-cost discipline so technical builds solve real operational bottlenecks.",
  },
  {
    icon: "users",
    title: "Direct senior communication",
    text: "You speak directly with the person designing, building and debugging your project — no account-manager relay or bloated retainers.",
  },
  {
    icon: "shield",
    title: "Structured, transparent delivery",
    text: "Plain-language written scope, realistic milestones, honest trade-offs and clean hand-off documentation you can actually maintain.",
  },
];

export function WhyWorkWithMe() {
  return (
    <section className="section" aria-labelledby="why-studio-title">
      <div className="container">
        <div className="section-head section-head--row reveal">
          <div>
            <p className="eyebrow eyebrow--plain">Why work with me</p>
            <h2 className="section-title" id="why-studio-title">
              Agency polish, independent execution
            </h2>
          </div>
          <p className="section-sub section-sub--inline">
            One multidisciplinary partner who understands both how a product looks and how the business behind it operates.
          </p>
        </div>

        <ol className="why-grid">
          {REASONS.map((item, i) => (
            <li key={item.title} className="why-card reveal">
              <div className="why-card__head">
                <span className="why-card__icon" aria-hidden="true">
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="why-card__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="why-card__title">{item.title}</h3>
              <p className="why-card__text">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

