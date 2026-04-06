import React, { useState, useMemo } from 'react';
import { useApp } from '../../AppContext';
import { 
  Search, 
  FileText, 
  User, 
  MapPin, 
  Wrench, 
  Package, 
  ChevronRight, 
  X,
  History,
  TrendingUp,
  Tag,
  Calendar,
  ClipboardList,
  LayoutGrid
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { SearchResult } from '../../types';

export const GlobalSearchView: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const { 
    role, 
    tickets, 
    clients, 
    properties, 
    invoices, 
    quotes, 
    technicians, 
    inventoryItems 
  } = useApp();
  
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'tickets' | 'clients' | 'billing' | 'inventory' | 'assets'>('all');

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // 1. Tickets
    tickets.forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        matches.push({
          id: t.id,
          type: 'ticket',
          title: t.title,
          subtitle: `Ticket #${t.id.slice(-6)} • ${t.status}`,
          link: '/dispatch', // Or specific ticket view if available
          metadata: { status: t.status, date: t.createdAt },
          matchReason: t.title.toLowerCase().includes(q) ? 'Title match' : 'Description match'
        });
      }
    });

    // 2. Clients (Admin only)
    if (role === 'ADMIN') {
      clients.forEach(c => {
        if (c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) {
          matches.push({
            id: c.id,
            type: 'client',
            title: c.fullName,
            subtitle: c.email,
            link: '/clients',
            metadata: { email: c.email, phone: c.phone },
            matchReason: 'Name or email match'
          });
        }
      });
    }

    // 3. Properties
    properties.forEach(p => {
      if (p.address.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q)) {
        matches.push({
          id: p.id,
          type: 'property',
          title: p.nickname || p.address,
          subtitle: p.address,
          link: '/properties',
          metadata: { address: p.address },
          matchReason: 'Address match'
        });
      }
    });

    // 4. Invoices & Quotes
    invoices.forEach(i => {
      const client = clients.find(c => c.id === i.clientId);
      const clientName = client?.fullName || 'Unknown Client';
      if (i.id.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)) {
        matches.push({
          id: i.id,
          type: 'invoice',
          title: `Invoice #${i.id.slice(-6)}`,
          subtitle: `${clientName} • $${i.total.toFixed(2)}`,
          link: '/billing',
          metadata: { total: i.total, status: i.status },
          matchReason: 'ID or Client match'
        });
      }
    });

    quotes.forEach(quote => {
      const client = clients.find(c => c.id === quote.clientId);
      const clientName = client?.fullName || 'Unknown Client';
      if (quote.id.toLowerCase().includes(q) || clientName.toLowerCase().includes(q)) {
        matches.push({
          id: quote.id,
          type: 'quote',
          title: `Quote #${quote.id.slice(-6)}`,
          subtitle: `${clientName} • $${quote.total.toFixed(2)}`,
          link: '/billing',
          metadata: { total: quote.total, status: quote.status },
          matchReason: 'ID or Client match'
        });
      }
    });

    // 5. Inventory (Admin/Tech)
    if (role === 'ADMIN' || role === 'TECHNICIAN') {
      inventoryItems.forEach(item => {
        if (item.name.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)) {
          matches.push({
            id: item.id,
            type: 'inventory',
            title: item.name,
            subtitle: `SKU: ${item.sku || 'N/A'}`,
            link: '/inventory',
            metadata: { price: item.basePrice },
            matchReason: 'Name or SKU match'
          });
        }
      });
    }

    // 6. Assets
    const { assets } = useApp();
    assets.forEach(asset => {
      if (asset.label.toLowerCase().includes(q) || asset.manufacturer?.toLowerCase().includes(q) || asset.model?.toLowerCase().includes(q) || asset.serialNumber?.toLowerCase().includes(q)) {
        matches.push({
          id: asset.id,
          type: 'asset',
          title: asset.label,
          subtitle: `${asset.manufacturer} ${asset.model} • ${asset.assetType}`,
          link: '/assets',
          metadata: { status: asset.status, serial: asset.serialNumber },
          matchReason: 'Label, Manufacturer, or Model match'
        });
      }
    });

    // Filter by category
    if (filter === 'all') return matches;
    if (filter === 'tickets') return matches.filter(m => m.type === 'ticket');
    if (filter === 'clients') return matches.filter(m => m.type === 'client');
    if (filter === 'billing') return matches.filter(m => m.type === 'invoice' || m.type === 'quote');
    if (filter === 'inventory') return matches.filter(m => m.type === 'inventory');
    if (filter === 'assets') return matches.filter(m => m.type === 'asset');

    return matches;
  }, [query, tickets, clients, properties, invoices, quotes, inventoryItems, role, filter]);

  const typeIcons = {
    ticket: ClipboardList,
    client: User,
    property: MapPin,
    invoice: FileText,
    quote: FileText,
    inventory: Package,
    asset: LayoutGrid
  };

  const typeColors = {
    ticket: 'text-blue-600 bg-blue-50',
    client: 'text-purple-600 bg-purple-50',
    property: 'text-amber-600 bg-amber-50',
    invoice: 'text-green-600 bg-green-50',
    quote: 'text-cyan-600 bg-cyan-50',
    inventory: 'text-orange-600 bg-orange-50',
    asset: 'text-indigo-600 bg-indigo-50'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for tickets, clients, invoices, or inventory..."
          className="block w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-100 bg-white shadow-xl shadow-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg font-medium"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'all' ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          All Results
        </button>
        <button 
          onClick={() => setFilter('tickets')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'tickets' ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Tickets
        </button>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setFilter('clients')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              filter === 'clients' ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            Clients
          </button>
        )}
        <button 
          onClick={() => setFilter('billing')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'billing' ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Billing
        </button>
        <button 
          onClick={() => setFilter('inventory')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'inventory' ? "bg-orange-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Inventory
        </button>
        <button 
          onClick={() => setFilter('assets')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
            filter === 'assets' ? "bg-indigo-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          Assets
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!query ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">Start searching...</h3>
            <p className="text-gray-500">Enter a keyword to find anything in your business.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No results found</h3>
            <p className="text-gray-500">Try a different keyword or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {results.map((result, i) => {
              const Icon = typeIcons[result.type as keyof typeof typeIcons] || Search;
              return (
                <motion.button
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    // Map link to internal tab if possible
                    const tabMap: Record<string, string> = {
                      ticket: 'dispatch',
                      client: 'clients',
                      property: 'properties',
                      invoice: 'billing',
                      quote: 'billing',
                      inventory: 'inventory',
                      asset: 'assets'
                    };
                    setActiveTab(tabMap[result.type] || 'dashboard');
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
                >
                  <div className={cn("p-3 rounded-xl shrink-0", typeColors[result.type as keyof typeof typeColors])}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 truncate">{result.title}</h4>
                      <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                        {result.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-400 italic">
                        Matched because: {result.matchReason}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
