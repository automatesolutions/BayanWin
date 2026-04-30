import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import miroLogo from '../../assets/mirofish/MiroFish_logo_compressed.jpeg';
import miroVideo from '../../assets/mirofish/video_91a48dcd_1777203629133.mp4';
import miroOpenArt from '../../assets/mirofish/openart-image_V5EFsGse_1777203395123_raw.jpg';
import miroWebp from '../../assets/mirofish/1_K7nTNtUY5kk2StvwbVCFQg.webp';
import miroScreenshot from '../../assets/mirofish/运行截图2.png';

function MediaAside() {
  return (
    <aside className="lg:sticky lg:top-24 space-y-6" aria-label="Article media">
      <figure className="rounded-xl overflow-hidden border border-cyan-500/35 bg-black/50 shadow-[0_0_36px_-8px_rgba(34,211,238,0.35)]">
        <img src={miroLogo} alt="MiroFish logo" className="w-full h-auto object-cover" />
        <figcaption className="text-[11px] text-slate-500 px-3 py-2 bg-black/60 font-mono">
          MiroFish branding (community project)
        </figcaption>
      </figure>

      <figure className="rounded-xl overflow-hidden border border-slate-600/60 bg-slate-900/80 p-2">
        <video className="w-full rounded-lg bg-black" controls playsInline preload="metadata">
          <source src={miroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <figcaption className="text-[11px] text-slate-500 mt-2 px-1 leading-snug">
          Clip from the asset bundle—walkthrough / demo energy around the MiroFish narrative.
        </figcaption>
      </figure>

      <figure className="rounded-xl overflow-hidden border border-violet-500/25 bg-gradient-to-b from-slate-900 to-black p-1">
        <img src={miroOpenArt} alt="MiroFish concept illustration" className="w-full rounded-lg object-cover" />
        <figcaption className="text-[11px] text-slate-500 mt-2 px-2">Concept art–style visual from the MiroFish asset set.</figcaption>
      </figure>

      <figure className="rounded-xl overflow-hidden border border-slate-600/50 bg-black/40 p-1">
        <img src={miroWebp} alt="MiroFish swarm intelligence diagram" className="w-full rounded-lg" />
        <figcaption className="text-[11px] text-slate-500 mt-2 px-2">
          Swarm / multi-agent metaphor—many independent actors interacting in a shared space.
        </figcaption>
      </figure>

      <figure className="rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-900/60 p-1">
        <img src={miroScreenshot} alt="MiroFish interface screenshot" className="w-full rounded-lg border border-white/5" />
        <figcaption className="text-[11px] text-slate-500 mt-2 px-2">UI screenshot from the project materials (运行截图).</figcaption>
      </figure>

      <a
        href="https://666ghj.github.io/mirofish-demo/"
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl border border-cyan-400/40 bg-cyan-950/30 px-4 py-3 text-center text-sm font-medium text-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-200 transition-colors"
      >
        Open live demo (mirofish-demo) ↗
      </a>
    </aside>
  );
}

function BlogMiroPrediction() {
  useEffect(() => {
    document.title = 'Blog: Miro prediction & MiroFish | BayanWin';
    return () => {};
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 flex-1 max-w-6xl">
      <nav className="mb-6 text-sm text-slate-400">
        <Link to="/" className="text-electric-400 hover:text-electric-300 underline">
          Home
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <Link to="/blog" className="text-electric-400 hover:text-electric-300 underline">
          Blog
        </Link>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-300">Miro prediction</span>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-10 xl:gap-12">
        <article className="min-w-0 space-y-8 text-slate-300 text-sm leading-relaxed">
          <header className="border-l-4 border-cyan-400 pl-5 space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/90">LLM synthesis · Swarm metaphors · 2026 buzz</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Miro prediction: BayanWin’s <em>Miro</em> and the MiroFish idea
            </h1>
            <p className="text-slate-400 max-w-3xl">
              This note connects the <strong className="text-slate-200">Miro</strong> layer inside BayanWin—a multi-step LLM
              workflow that synthesizes numeric model outputs—to the viral <strong className="text-slate-200">MiroFish</strong>{' '}
              narrative: a “next-generation” prediction story built around multi-agent simulation, seed signals from the real
              world, and rehearsing futures in a digital sandbox. They are <strong className="text-slate-200">not the same codebase</strong>;
              the link is conceptual and cultural.
            </p>
          </header>

          <section className="rounded-lg bg-cyan-950/25 border border-cyan-500/20 px-4 py-3 text-xs text-cyan-100/90">
            <strong className="text-cyan-200">Try the public demo:</strong>{' '}
            <a
              href="https://666ghj.github.io/mirofish-demo/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              https://666ghj.github.io/mirofish-demo/
            </a>
          </section>

          <section className="space-y-4" aria-labelledby="sec-mirofish">
            <h2 id="sec-mirofish" className="text-xl font-semibold text-white">
              What people mean by “MiroFish”
            </h2>
            <p>
              In online coverage and demos, <strong className="text-slate-200">MiroFish</strong> is described as a prediction
              engine powered by <strong className="text-slate-200">multi-agent</strong> ideas: pull <em>seed information</em>{' '}
              from reality (breaking news, policy drafts, financial signals), spin up a high-fidelity parallel digital world,
              and let thousands of agents—with personality, memory, and behavior—interact and socially evolve. From a
              “God’s-eye” view you inject variables, run countless simulations, and compare trajectories before deciding.
            </p>
            <p>
              The pitch spans macro use (zero-risk rehearsal for policy and communications) and micro use (playful “what if”
              endings and scenarios). Taglines in that ecosystem often boil down to:{' '}
              <strong className="text-slate-200">rehearse the future in a sandbox, then decide</strong>—from serious forecasts
              to imaginative play.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-creator">
            <h2 id="sec-creator" className="text-xl font-semibold text-white">
              Origin story (as circulated)
            </h2>
            <p>
              Stories around the project credit a young developer—named in posts as{' '}
              <strong className="text-slate-200">Guo Hangjiang</strong>, sometimes referred to as <strong className="text-slate-200">BaiFu</strong>—with
              assembling an early demo in roughly <strong className="text-slate-200">ten days</strong>. Viral launch timelines
              mention <strong className="text-slate-200">March 2026</strong> and extraordinary early attention, including figures
              on the order of <strong className="text-slate-200">tens of millions of RMB</strong> in reported interest within a
              short window. Treat any investment totals as <strong className="text-slate-200">unverified hype</strong> unless
              you confirm them from primary sources—this article summarizes the narrative, not an offering memo.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="sec-macro">
            <h2 id="sec-macro" className="text-xl font-semibold text-white">
              Macro vs micro in the MiroFish framing
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-slate-200">Macro:</strong> a rehearsal lab for decision-makers—test narratives and
                shocks before they hit the real world.
              </li>
              <li>
                <strong className="text-slate-200">Micro:</strong> a creative sandbox—alternate endings, speculative fiction,
                accessible “what if” buttons.
              </li>
            </ul>
            <p>
              The through-line is <strong className="text-slate-200">swarm intelligence as mirror</strong>: many small
              interactions producing emergent patterns you could not script line-by-line.
            </p>
          </section>

          <section className="space-y-4 rounded-xl border border-violet-500/25 bg-slate-800/40 px-5 py-6" aria-labelledby="sec-bayanwin">
            <h2 id="sec-bayanwin" className="text-xl font-semibold text-white">
              How this relates to BayanWin’s <em>Miro</em>
            </h2>
            <p>
              BayanWin’s <strong className="text-slate-200">Miro</strong> is a <strong className="text-slate-200">practical LLM
              synthesis step</strong> after six numeric models: it reads the same structured context bundle (history, overlaps,
              errors, hot/cold snapshots, etc.) and returns a final six-number line with validation and fallbacks. There is no
              claim of thousands of autonomous agents or a parallel world—those are <strong className="text-slate-200">MiroFish-style metaphors</strong>{' '}
              from a different project.
            </p>
            <p>
              The <em>family resemblance</em> is cultural: both tap the same 2020s imagination—{' '}
              <strong className="text-slate-200">many voices, emergence, rehearsal, “predict anything” rhetoric</strong>. If
              MiroFish is the cinematic wide shot, BayanWin’s Miro is a focused tool on lottery history: smaller scope, explicit
              disclaimers, and InstantDB-backed auditability.
            </p>
          </section>

          <section className="space-y-3 text-slate-500 text-xs border-t border-slate-600/50 pt-6" aria-labelledby="sec-disclaimer">
            <h2 id="sec-disclaimer" className="text-sm font-semibold text-slate-400">
              Disclaimer
            </h2>
            <p>
              Lottery draws are random within their published rules; BayanWin is informational. Links to third-party demos are
              for exploration only; we do not endorse investments or tokens. Verify any financial claims independently.
            </p>
          </section>

          <section className="space-y-3 border-t border-slate-600/50 pt-6" aria-labelledby="related-articles">
            <h2 id="related-articles" className="text-lg font-semibold text-white">
              Related Articles
            </h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              <li>
                <Link to="/blog/deep-reinforcement-learning" className="text-cyan-400 hover:text-cyan-300 underline">
                  Deep reinforcement learning for AI lottery prediction
                </Link>
              </li>
              <li>
                <Link to="/blog/nash-hotfilter" className="text-cyan-400 hover:text-cyan-300 underline">
                  Game theory lottery analysis (NashHotFilter)
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="text-cyan-400 hover:text-cyan-300 underline">
                  BayanWin methodology and model limitations
                </Link>
              </li>
            </ul>
          </section>

          <p className="pt-2">
            <Link to="/blog" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
              ← Back to Blog
            </Link>
          </p>
        </article>

        <MediaAside />
      </div>
    </main>
  );
}

export default BlogMiroPrediction;
