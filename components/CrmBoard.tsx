import React, { useMemo, useState } from 'react';
import { Building2, Phone, Mail, Plus, Search } from 'lucide-react';

type DealStage = 'Новые' | 'В работе' | 'Согласование' | 'Успешно';

interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  budget: number;
  stage: DealStage;
}

const STAGES: DealStage[] = ['Новые', 'В работе', 'Согласование', 'Успешно'];

const SEED: Deal[] = [
  { id: '1', company: 'ООО Вектор', contact: 'Ирина Левина', email: 'i.levina@vektor.ru', phone: '+7 900 110-22-33', budget: 220000, stage: 'Новые' },
  { id: '2', company: 'ПрофСнаб', contact: 'Сергей Титов', email: 't@profsnab.ru', phone: '+7 901 560-45-10', budget: 980000, stage: 'В работе' },
  { id: '3', company: 'Ритм-Логистик', contact: 'Анна Крылова', email: 'ak@ritm-log.ru', phone: '+7 922 770-31-88', budget: 540000, stage: 'Согласование' },
];

export const CrmBoard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>(SEED);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deals;
    return deals.filter((d) => [d.company, d.contact, d.email, d.phone].join(' ').toLowerCase().includes(q));
  }, [deals, query]);

  const moveDeal = (id: string) => {
    setDeals((prev) => prev.map((deal) => {
      if (deal.id !== id) return deal;
      const idx = STAGES.indexOf(deal.stage);
      return { ...deal, stage: STAGES[Math.min(idx + 1, STAGES.length - 1)] };
    }));
  };

  const total = filtered.reduce((sum, d) => sum + d.budget, 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">CRM-панель (аналог AmoCRM)</h1>
            <p className="text-sm text-slate-500">Воронка продаж, карточки клиентов и быстрые действия менеджера.</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Сумма сделок</p>
            <p className="text-2xl font-bold text-emerald-600">{total.toLocaleString('ru-RU')} ₽</p>
          </div>
        </div>
        <div className="mt-4 relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по компании, контакту, email или телефону"
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-700">{stage}</h2>
              <span className="text-xs bg-white border border-slate-300 rounded-full px-2 py-0.5">
                {filtered.filter((d) => d.stage === stage).length}
              </span>
            </div>
            <div className="space-y-3">
              {filtered.filter((d) => d.stage === stage).map((deal) => (
                <div key={deal.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800 flex items-center gap-2"><Building2 className="h-4 w-4" /> {deal.company}</p>
                      <p className="text-sm text-slate-500">{deal.contact}</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{deal.budget.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {deal.email}</p>
                    <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {deal.phone}</p>
                  </div>
                  <button
                    onClick={() => moveDeal(deal.id)}
                    disabled={deal.stage === 'Успешно'}
                    className="mt-3 w-full rounded-lg bg-blue-600 text-white text-sm py-1.5 disabled:bg-slate-300"
                  >
                    <span className="inline-flex items-center gap-1 justify-center"><Plus className="h-4 w-4" /> Следующий этап</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
