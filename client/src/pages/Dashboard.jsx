import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth.js';
import { useTickets } from '../hooks/useTickets.js';
import { useBotConfig } from '../hooks/useBotConfig.js';

import Sidebar from '../components/dashboard/Sidebar.jsx';
import OverviewTab from '../components/dashboard/OverviewTab.jsx';
import ConfigTab from '../components/dashboard/ConfigTab.jsx';
import TicketsTab from '../components/dashboard/TicketsTab.jsx';
import EmbedTab from '../components/dashboard/EmbedTab.jsx';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { tickets, fetchTickets, updateTicket, loading: ticketsLoading } = useTickets();
  const { botConfig, fetchBotConfig, updateBotConfig, saving: savingConfig } = useBotConfig();
  
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboardActiveTab') || 'overview';
  });

  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchBotConfig();
    }
  }, [user, fetchTickets, fetchBotConfig]);

  // Socket for real-time ticket updates
  useEffect(() => {
    if (!user?._id) return;

    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5000';
    
    const socket = io(backendUrl, { withCredentials: true });

    socket.on('connect', () => {
      socket.emit('joinBusinessRoom', user._id);
    });

    socket.on('newTicket', () => {
      toast.success('New ticket received!');
      fetchTickets();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id, fetchTickets]);

  if (authLoading || ticketsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab tickets={tickets} faqs={botConfig?.faqs} />;
      case 'config':
        return (
          <ConfigTab 
            botConfig={botConfig} 
            updateBotConfig={updateBotConfig} 
            fetchBotConfig={fetchBotConfig}
            savingConfig={savingConfig} 
          />
        );
      case 'tickets':
        return <TicketsTab tickets={tickets} updateTicket={updateTicket} fetchTickets={fetchTickets} />;
      case 'embed':
        return <EmbedTab user={user} />;
      default:
        return <OverviewTab tickets={tickets} faqs={botConfig?.faqs} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full bg-bg min-h-screen pt-20">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-muted">Manage your AI agent and support tickets.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 bg-surface border border-border rounded-full text-sm font-medium text-accent shadow-sm">
                {user?.businessName || 'Business Profile'}
              </span>
            </div>
          </header>

          {renderTab()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
