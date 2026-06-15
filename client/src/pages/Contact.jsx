import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import axiosInstance from '../api/axiosInstance';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { ref: headerRef, isInView: headerIsInView } = useScrollReveal();
  const { ref: formRef, isInView: formIsInView } = useScrollReveal();

  const headerAnimated = useRef(false);
  const formAnimated = useRef(false);
  const successRef = useRef(null);
  const successIconRef = useRef(null);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/contact', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!headerIsInView || headerAnimated.current) return;
    const wrap = headerRef.current;
    if (!wrap) return;
    headerAnimated.current = true;
    gsap.from(wrap.querySelectorAll(':scope > *'), {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
    });
  }, [headerIsInView, headerRef]);

  useEffect(() => {
    if (!formIsInView || formAnimated.current) return;
    const root = formRef.current;
    if (!root) return;
    formAnimated.current = true;

    const leftCol = root.querySelector('[data-contact-left]');
    const rightPanel = root.querySelector('[data-contact-form-panel]');
    if (leftCol) {
      gsap.from(leftCol.children, {
        opacity: 0,
        x: -30,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }
    if (rightPanel) {
      gsap.from(rightPanel, { opacity: 0, y: 50, duration: 0.8, delay: 0.3, ease: 'power3.out' });
    }
  }, [formIsInView, formRef]);

  useLayoutEffect(() => {
    if (!submitted) return undefined;
    const box = successRef.current;
    const icon = successIconRef.current;
    if (!box) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(box, { opacity: 0, scale: 0.9, duration: 0.35, ease: 'power3.out' });
      if (icon) {
        gsap.from(icon, { scale: 0, duration: 0.55, ease: 'back.out(2)', delay: 0.15 });
      }
    }, box);

    return () => ctx.revert();
  }, [submitted]);

  return (
    <div className="flex-1 w-full bg-bg pt-32 pb-24 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-20 space-y-6" ref={headerRef}>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight">
            Let&apos;s{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">Connect</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto font-light">
            Have questions about integrating Hermes into your platform? Our team is ready to help you scale your
            support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start" ref={formRef}>
          <div data-contact-left className="lg:col-span-2 space-y-6">
            {[
              { icon: <Mail size={24} />, title: 'Email Us', desc: 'admin@hermesai.com', sub: 'Response within 24h' },
              {
                icon: <Phone size={24} />,
                title: 'Call Support',
                desc: '+91 (980) 012-35*',
                sub: 'Mon-Fri, 9am-6pm PST',
              },
              { icon: <MapPin size={24} />, title: 'Visit Us', desc: 'Sector 15, IT Park', sub: 'Gurugram, Haryana' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-6 p-6 rounded-2xl bg-surface/30 backdrop-blur-sm border border-border/50 group hover:bg-surface hover:border-primary/50 transition-colors duration-500 cursor-default"
              >
                <div className="p-4 bg-bg text-primary rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-text font-medium">{item.desc}</p>
                  <p className="text-sm text-muted mt-1">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            data-contact-form-panel
            className="lg:col-span-3 rounded-4xl bg-surface/40 backdrop-blur-xl border border-border p-8 md:p-12 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-3xl font-bold text-white mb-10">Send a Message</h2>

            {submitted ? (
              <div
                ref={successRef}
                className="py-16 text-center flex flex-col items-center justify-center h-full"
              >
                <div ref={successIconRef}>
                  <CheckCircle size={80} className="text-success mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Message Sent!</h3>
                <p className="text-lg text-muted max-w-md mx-auto">
                  Thank you for reaching out. Our team is reviewing your inquiry and will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="relative group">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      required
                      className="peer w-full bg-transparent border-b-2 border-border/50 px-0 py-3 text-white placeholder-transparent focus:outline-none focus:border-primary transition-colors"
                      placeholder="John Doe"
                    />
                    <label
                      htmlFor="name"
                      className="absolute left-0 -top-3.5 text-sm text-primary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-primary cursor-text"
                    >
                      Full Name
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={onChange}
                      required
                      className="peer w-full bg-transparent border-b-2 border-border/50 px-0 py-3 text-white placeholder-transparent focus:outline-none focus:border-primary transition-colors"
                      placeholder="john@company.com"
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-0 -top-3.5 text-sm text-primary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-primary cursor-text"
                    >
                      Work Email
                    </label>
                  </div>
                </div>

                <div className="relative group pt-4">
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={onChange}
                    required
                    rows="4"
                    className="peer w-full bg-transparent border-b-2 border-border/50 px-0 py-3 text-white placeholder-transparent focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="Tell us about your support needs..."
                  ></textarea>
                  <label
                    htmlFor="message"
                    className="absolute left-0 top-0 text-sm text-primary transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-muted peer-placeholder-shown:top-7 peer-focus:top-0 peer-focus:text-sm peer-focus:text-primary cursor-text"
                  >
                    How can we help?
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden bg-primary text-white font-bold py-5 rounded-xl group transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
                >
                  <div className="absolute inset-0 translate-y-full bg-primary-hover/30 transition-transform duration-300 ease-out group-hover:translate-y-0" />

                  <div className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    {loading ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-text/25 border-t-text" />
                    ) : (
                      <>
                        Send Inquiry
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
