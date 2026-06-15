import React, { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Zap, Target, Users, Cpu, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { GithubMark, LinkedinMark } from '../components/SocialBrandIcons.jsx';
import { ABOUT_TEAM } from '../data/aboutTeam.js';

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const introWrapRef = useRef(null);

  const { ref: missionRef, isInView: missionIsInView } = useScrollReveal({ margin: '-200px' });
  const { ref: visionRef, isInView: visionIsInView } = useScrollReveal({ margin: '-200px' });
  const { ref: techRef, isInView: techIsInView } = useScrollReveal();
  const { ref: teamRef, isInView: teamIsInView } = useScrollReveal();

  const missionDone = useRef(false);
  const visionDone = useRef(false);
  const techDone = useRef(false);
  const teamDone = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    const intro = introWrapRef.current;
    if (!root) return undefined;

    const ctx = gsap.context(() => {
      if (bg) {
        gsap.fromTo(
          bg,
          { yPercent: 0 },
          {
            yPercent: 50,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }

      if (intro) {
        gsap.fromTo(
          intro,
          { opacity: 1 },
          {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: intro,
              start: 'top top',
              end: '+=25%',
              scrub: true,
            },
          }
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    gsap.fromTo(
      '.about-intro-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0 }
    );
    gsap.fromTo(
      '.about-intro-p',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo(
      '.about-intro-logo',
      { opacity: 0, y: 16, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', delay: 0.08 }
    );
  }, []);

  useEffect(() => {
    if (!missionIsInView || missionDone.current) return;
    const block = missionRef.current?.querySelector('[data-mission-block]');
    if (!block) return;
    missionDone.current = true;
    gsap.from(block, { opacity: 0, x: -50, duration: 0.8, ease: 'power3.out' });
  }, [missionIsInView, missionRef]);

  useEffect(() => {
    if (!visionIsInView || visionDone.current) return;
    const block = visionRef.current?.querySelector('[data-vision-block]');
    if (!block) return;
    visionDone.current = true;
    gsap.from(block, { opacity: 0, x: 50, duration: 0.8, ease: 'power3.out' });
  }, [visionIsInView, visionRef]);

  useEffect(() => {
    if (!techIsInView || techDone.current) return;
    const grid = techRef.current?.querySelector('[data-tech-grid]');
    if (!grid?.children?.length) return;
    techDone.current = true;
    gsap.from(grid.children, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
    });
  }, [techIsInView, techRef]);

  useEffect(() => {
    if (!teamIsInView || teamDone.current) return;
    const grid = teamRef.current?.querySelector('[data-team-grid]');
    if (!grid?.children?.length) return;
    teamDone.current = true;
    gsap.from(grid.children, {
      opacity: 0,
      y: 36,
      duration: 0.75,
      stagger: 0.12,
      ease: 'power3.out',
    });
  }, [teamIsInView, teamRef]);

  return (
    <div ref={rootRef} className="flex-1 w-full bg-bg pt-32 pb-24 overflow-hidden text-text relative">
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between opacity-20"
      >
        <div className="w-[120vw] h-[50vh] bg-primary/10 blur-[150px] rounded-full ml-[-10vw] mt-[-20vh]" />
        <div className="w-screen h-[60vh] bg-accent/5 blur-[120px] rounded-full translate-x-1/2" />
        <div className="w-[120vw] h-[50vh] bg-primary/10 blur-[150px] rounded-full ml-[-10vw]" />
      </div>

      <section className="relative min-h-[70vh] flex flex-col justify-center items-center text-center px-4 z-10">
        <div
          ref={introWrapRef}
          className="mx-auto flex w-full max-w-4xl flex-col items-center text-center px-4 sm:px-6"
        >
          <div className="about-intro-logo mb-8 flex w-full max-w-2xl justify-center md:mb-10">
            <BrandLogo
              variant="about"
              className="drop-shadow-[0_12px_48px_rgba(109,103,200,0.2)]"
            />
          </div>
          <h1 className="about-intro-title text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-hover">
              Human-Bot
            </span>{' '}
            Collaboration
          </h1>
          <p className="about-intro-p text-lg md:text-xl text-muted font-light leading-relaxed max-w-3xl mx-auto">
            Hermes AI is built on the philosophy that AI shouldn&apos;t replace human support—it should empower it. We
            handle the noise, so you can focus on the complexity.
          </p>
        </div>
      </section>

      <section className="relative w-full py-40 px-4 z-10" ref={missionRef}>
        <div className="max-w-6xl mx-auto">
          <div data-mission-block className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                <Target size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">The Mission</h2>
              <p className="text-xl text-muted leading-relaxed font-light">
                We started Hermes AI because we saw support teams drowning in repetitive tasks. Our mission is to provide
                every business with an intelligent layer that filters common queries, handles routine operations, and
                seamlessly hands over complex issues to experts.
              </p>
              <div className="flex gap-8 pt-4">
                <div className="border-l-2 border-primary pl-6">
                  <p className="text-4xl font-black text-text mb-1">99%</p>
                  <p className="text-sm text-muted font-medium uppercase tracking-widest">Uptime SLA</p>
                </div>
                <div className="border-l-2 border-accent pl-6">
                  <p className="text-4xl font-black text-text mb-1">24/7</p>
                  <p className="text-sm text-muted font-medium uppercase tracking-widest">Instant Support</p>
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2 h-[400px] lg:h-[600px] w-full rounded-4xl overflow-hidden group">
              <div className="absolute inset-0 bg-surface/40 backdrop-blur-md border border-border/50 rounded-4xl z-10" />
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
                alt="Support team collaborating in an office"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-bg via-transparent to-transparent z-20" />
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative w-full py-40 px-4 z-10 bg-surface/30 border-y border-border/30"
        ref={visionRef}
      >
        <div className="max-w-6xl mx-auto">
          <div data-vision-block className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[400px] lg:h-[600px] w-full rounded-4xl overflow-hidden group">
              <div className="absolute inset-0 bg-surface/40 backdrop-blur-md border border-border/50 rounded-4xl z-10" />
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
                alt="Abstract visualization suggesting AI and human collaboration"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/40 to-transparent z-20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,var(--color-accent)_0%,transparent_55%)] opacity-[0.07] z-[15]" />
            </div>

            <div className="space-y-8">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <Users size={32} />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">The Vision</h2>
              <p className="text-xl text-muted leading-relaxed font-light">
                A world where no customer has to wait in a queue, and no agent has to answer the same question twice. We
                envision AI as a co-pilot that elevates the human experience.
              </p>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 font-bold tracking-wide text-accent transition-colors hover:text-text"
              >
                Partner with us
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative w-full py-40 px-4 z-10" ref={techRef}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built by Engineers, for Everyone</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto font-light">
              We leverage cutting-edge LLMs and custom RAG architectures to deliver uncompromising quality.
            </p>
          </div>

          <div data-tech-grid className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Cpu />,
                title: 'Intelligent Logic',
                desc: 'Multi-stage reasoning to decide when to answer and when to escalate.',
              },
              {
                icon: <Zap />,
                title: 'Instant Scaling',
                desc: 'Handles 10 or 10,000 customers simultaneously without latency.',
              },
              {
                icon: <Shield />,
                title: 'Data Sovereignty',
                desc: 'Enterprise-grade encryption. Never used for public model training.',
              },
            ].map((v, i) => (
              <div
                key={i}
                className="p-10 rounded-3xl bg-surface/50 border border-border backdrop-blur-sm group hover:bg-surface hover:border-primary/30 transition-colors duration-500"
              >
                <div className="text-primary mb-8 transform group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500">
                  {React.cloneElement(v.icon, { size: 40 })}
                </div>
                <h3 className="text-2xl font-bold mb-4">{v.title}</h3>
                <p className="text-muted leading-relaxed font-light">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative w-full py-24 md:py-32 px-4 z-10 border-t border-border/40 bg-surface/25"
        ref={teamRef}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">People</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The team behind Hermes AI</h2>
            <p className="text-muted font-light leading-relaxed">
              Engineers and designers shipping reliable AI support—reach out on GitHub or LinkedIn.
            </p>
          </div>

          <div data-team-grid className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {ABOUT_TEAM.map((member) => (
              <article
                key={member.id}
                className={`relative flex flex-col rounded-3xl border bg-surface/60 p-8 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] ${
                  member.lead
                    ? 'border-primary/40 shadow-[0_0_0_1px_rgba(99,102,241,0.12)] lg:ring-1 lg:ring-primary/25'
                    : 'border-border/60 hover:border-border'
                }`}
              >
                {member.lead ? (
                  <span className="absolute top-5 right-5 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Lead
                  </span>
                ) : null}
                <div
                  className="mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/90 to-accent/80 text-lg font-bold text-white shadow-md"
                  aria-hidden
                >
                  {member.initials}
                </div>
                <h3 className="mb-1 text-xl font-bold text-text">{member.name}</h3>
                {member.role ? (
                  <p className="text-sm font-medium text-primary/90 mb-1">{member.role}</p>
                ) : null}
                <p className={`text-sm text-muted leading-relaxed mb-6 flex-1 ${member.role ? '' : 'mt-1'}`}>
                  {member.focus}
                </p>
                <div className="flex flex-wrap gap-3 pt-1 border-t border-border/50">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-bg/40 px-3 py-2 text-sm text-muted transition-colors hover:border-primary/40 hover:text-text"
                  >
                    <GithubMark size={18} className="text-text/90" />
                    GitHub
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-bg/40 px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-text"
                  >
                    <LinkedinMark size={18} className="text-primary/90" />
                    LinkedIn
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
