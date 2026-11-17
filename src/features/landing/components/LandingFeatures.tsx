import { LANDING_FEATURES } from "../constants/landingData";
import type { LandingFeature } from "../types";

interface FeatureCardProps {
  feature: LandingFeature;
  index: number;
}

const FeatureCard = ({ feature: { icon: Icon, title, description }, index }: FeatureCardProps) => (
  <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-8">
    <div className="flex items-start justify-between gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon aria-hidden className="h-6 w-6" />
      </span>
      <span aria-hidden className="font-mono text-sm font-semibold tabular-nums text-slate-300">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
    <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-2 text-slate-600">{description}</p>
  </li>
);

export const LandingFeatures = () => (
  <section
    id="funciones"
    aria-labelledby="funciones-titulo"
    className="scroll-mt-16 bg-slate-50 py-16 md:py-24"
  >
    <div className="mx-auto max-w-6xl px-4">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Funciones</p>
        <h2
          id="funciones-titulo"
          className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
        >
          Todo lo que pasa en tu mostrador, bajo control
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Desde que pesas el producto hasta que cuadras la caja al final del turno.
        </p>
      </header>

      <ul className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
        {LANDING_FEATURES.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </ul>
    </div>
  </section>
);
