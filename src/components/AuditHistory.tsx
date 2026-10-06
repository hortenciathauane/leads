import React, { useState, useMemo } from 'react';
import { store } from '../services/store';
import { AuditLog } from '../types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User as UserIcon,
  Tag,
  ArrowRight,
} from 'lucide-react';

export const AuditHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const logs = store.getAuditLogs();

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.acao !== actionFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          log.descricao.toLowerCase().includes(term) ||
          log.userName.toLowerCase().includes(term) ||
          (log.leadNome && log.leadNome.toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, searchTerm, actionFilter]);

  const uniqueActions = Array.from(new Set(logs.map((l) => l.acao)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Histórico de Auditoria e Conformidade</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Trilha de auditoria imutável registrando todas as alterações cadastrais, movimentações no funil, distribuições e ações de usuários.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, usuário responsável ou empresa..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as Ações</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Timeline / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum registro de auditoria encontrado com os filtros informados.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateObj = new Date(log.createdAt);

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {log.acao}
                        </span>
                        {log.leadNome && (
                          <span className="font-bold text-slate-900 text-xs">
                            {log.leadNome}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {dateObj.toLocaleDateString('pt-BR')} às {dateObj.toLocaleTimeString('pt-BR')}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{log.descricao}</p>

                    <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span>Usuário responsável: <strong className="text-slate-700">{log.userName}</strong></span>
                    </div>

                    {log.detalhes?.camposModificados && (
                      <div className="mt-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                        Campos alterados: {log.detalhes.camposModificados.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
