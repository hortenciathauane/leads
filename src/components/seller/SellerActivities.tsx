import React, { useState } from 'react';
import { store } from '../../services/store';
import { Lead } from '../../types';
import { LeadDetailModal } from '../LeadDetailModal';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Building2,
  PlusCircle,
  Filter,
} from 'lucide-react';

export const SellerActivities: React.FC = () => {
  const [filterType, setFilterType] = useState<'todos' | 'atrasados' | 'hoje' | 'futuros'>('todos');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const myLeads = store.getLeads();
  const todayStr = new Date().toISOString().split('T')[0];

  // Leads que possuem data de retorno ou próxima ação agendada
  const activeLeadsWithTasks = myLeads.filter(
    (l) => (l.dataRetorno || l.proximaAcao) && l.etapaFunil !== 'venda_concluida' && l.etapaFunil !== 'venda_perdida'
  );

  const filteredTasks = activeLeadsWithTasks.filter((lead) => {
    if (!lead.dataRetorno) return filterType === 'todos';

    const isOverdue = lead.dataRetorno < todayStr;
    const isToday = lead.dataRetorno === todayStr;
    const isFuture = lead.dataRetorno > todayStr;

    if (filterType === 'atrasados') return isOverdue;
    if (filterType === 'hoje') return isToday;
    if (filterType === 'futuros') return isFuture;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Atividades e Retornos Comerciais</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Sua agenda de follow-ups, reuniões e ligações agendadas com potenciais clientes.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'todos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({activeLeadsWithTasks.length})
          </button>
          <button
            onClick={() => setFilterType('atrasados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'atrasados' ? 'bg-rose-50 text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atrasados
          </button>
          <button
            onClick={() => setFilterType('hoje')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'hoje' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Para Hoje
          </button>
          <button
            onClick={() => setFilterType('futuros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'futuros' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Futuros
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma atividade encontrada nesta categoria.</p>
              <p className="text-xs text-slate-400 mt-1">Abra um dos seus leads para agendar uma data de retorno.</p>
            </div>
          ) : (
            filteredTasks.map((lead) => {
              const isOverdue = lead.dataRetorno && lead.dataRetorno < todayStr;
              const isToday = lead.dataRetorno === todayStr;

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isOverdue ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{lead.razaoSocial}</h4>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Atrasado
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Retornar Hoje
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      📌 Próxima Ação: <span className="text-slate-900">{lead.proximaAcao || 'Realizar contato de follow-up'}</span>
                    </p>

                    <p className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>CNPJ: {lead.cnpj}</span>
                      <span>•</span>
                      <span>Telefone: {lead.telefone || 'Não informado'}</span>
                      <span>•</span>
                      <span>Etapa: {lead.etapaFunil}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      {lead.dataRetorno && (
                        <div
                          className={`text-xs font-bold ${
                            isOverdue ? 'text-rose-600' : isToday ? 'text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          {new Date(lead.dataRetorno + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      <span className="text-[11px] text-slate-400 block">
                        R$ {lead.valorOportunidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold cursor-pointer border border-blue-200 transition-colors"
                    >
                      Abrir Lead
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal ao Clicar */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => {
            const updated = store.getLeadById(selectedLead.id);
            if (updated) setSelectedLead(updated);
          }}
        />
      )}
    </div>
  );
};
