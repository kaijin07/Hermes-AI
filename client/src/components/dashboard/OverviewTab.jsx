import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGsapTabEnter } from '../../hooks/useGsapTabEnter';

const OverviewTab = ({ tickets, faqs }) => {
  const navigate = useNavigate();
  const rootRef = useGsapTabEnter({ opacity: 0, y: 20 });

  const activeTicketsCount = useMemo(() => {
    return (tickets || []).filter((t) => t.status !== 'closed').length;
  }, [tickets]);

  const faqsCount = (faqs || []).length;

  const [animatedTickets, setAnimatedTickets] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedTickets((current) => {
        if (current === activeTicketsCount) {
          clearInterval(interval);
          return current;
        }

        return current + (activeTicketsCount > current ? 1 : -1);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeTicketsCount]);

  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card md:col-span-2 flex flex-col justify-between p-8 relative overflow-hidden group">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary opacity-10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-500"></div>
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">Chatbot Preview</h2>
          <p className="text-muted mb-8 max-w-md">
            Test your bot&apos;s personality and knowledge base in a controlled environment before deploying.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="btn-primary w-fit flex items-center gap-2"
        >
          Start Preview Session
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="card flex flex-col justify-between p-8">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-white">Support Stats</h3>
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-end">
              <span className="text-xs text-muted">Active Tickets</span>
              <span className="text-2xl font-bold text-white">{animatedTickets}</span>
            </div>

            <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full"
                style={{
                  width: `${Math.min(animatedTickets, 100)}%`,
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>

            <div className="flex justify-between items-end pt-2">
              <span className="text-xs text-muted">FAQ Coverage</span>
              <span className="text-2xl font-bold text-white">{faqsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
