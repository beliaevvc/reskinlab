import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  useOfferTemplates,
  useCreateOfferTemplate,
  useDeleteOfferTemplate,
  useSetActiveTemplate,
  useDuplicateTemplate,
  useClientOfferAssignments,
} from '../../hooks/useOfferTemplates';
import { formatDate } from '../../lib/utils';
import UserAvatar from '../../components/UserAvatar';
// ============================================
// Create Template Modal
// ============================================
function TemplateModal({ template, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: template?.name || '',
        description: template?.description || '',
      });
    }
  }, [isOpen, template]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Название обязательно');
      return;
    }
    onSave(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {template ? 'Редактировать шаблон' : 'Новый шаблон'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Стандартная оферта"
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Описание шаблона..."
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// Audience badge for table
// ============================================
function AudienceBadge({ template, assignments }) {
  const audienceType = template.audience_type || 'all';

  if (audienceType === 'all') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Все
      </span>
    );
  }

  // specific — show assigned user avatars
  const templateAssignments = (assignments || []).filter((a) => a.template?.id === template.id);
  const count = templateAssignments.length;

  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {count}
      </span>
      {/* Avatar stack */}
      {count > 0 && (
        <div className="flex -space-x-1.5">
          {templateAssignments.slice(0, 4).map((a) => (
            <div key={a.id} title={a.client?.full_name || a.client?.email} className="border-2 border-white rounded-full">
              <UserAvatar
                name={a.client?.full_name}
                email={a.client?.email}
                avatarUrl={a.client?.avatar_url}
                role="client"
                size="xs"
              />
            </div>
          ))}
          {count > 4 && (
            <div className="w-5 h-5 rounded-full border-2 border-white bg-neutral-200 text-neutral-500 flex items-center justify-center text-[8px] font-bold">
              +{count - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page
// ============================================
export function OfferTemplatesPage() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  const { data: templates, isLoading } = useOfferTemplates();
  const { data: assignments } = useClientOfferAssignments();
  const createTemplate = useCreateOfferTemplate();
  const deleteTemplate = useDeleteOfferTemplate();
  const setActive = useSetActiveTemplate();
  const duplicate = useDuplicateTemplate();

  const handleCreate = async (data) => {
    try {
      const newTemplate = await createTemplate.mutateAsync(data);
      setShowModal(false);
      navigate(`/admin/offer-templates/${newTemplate.id}`);
    } catch (err) {
      alert('Failed to create: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить этот шаблон?'))
      return;
    try {
      await deleteTemplate.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await setActive.mutateAsync(id);
    } catch (err) {
      alert('Failed to set active: ' + err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicate.mutateAsync(id);
    } catch (err) {
      alert('Failed to duplicate: ' + err.message);
    }
  };

  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all' | template id
  const [assignmentSearch, setAssignmentSearch] = useState('');

  const activeTemplate = templates?.find((t) => t.is_active);
  const specificCount = (assignments || []).length;

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    let list = assignments || [];
    if (assignmentFilter !== 'all') {
      list = list.filter((a) => a.template?.id === assignmentFilter);
    }
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      list = list.filter((a) =>
        (a.client?.full_name || '').toLowerCase().includes(q) ||
        (a.client?.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [assignments, assignmentFilter, assignmentSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Шаблоны оферт</h1>
          <p className="text-neutral-500 mt-1">
            Управление шаблонами оферт с переменными и настройкой аудитории
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новый шаблон
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Всего шаблонов</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{templates?.length || 0}</p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Активный шаблон</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {activeTemplate ? activeTemplate.name : 'Не выбран'}
          </p>
        </div>
        <div
          className="bg-white rounded-md border border-neutral-200 p-4 cursor-pointer hover:border-amber-300 transition-colors"
          onClick={() => {
            const el = document.getElementById('assignments-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <p className="text-sm text-neutral-500">Персональные назначения</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{specificCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : templates?.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            Нет шаблонов оферт. Создайте первый шаблон.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Шаблон
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Аудитория
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Версия
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                    Создано
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {templates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    onClick={() => navigate(`/admin/offer-templates/${tpl.id}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-900">
                        {tpl.name}
                      </span>
                      {tpl.description && (
                        <span className="text-xs text-neutral-500 block truncate max-w-xs">
                          {tpl.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AudienceBadge template={tpl} assignments={assignments} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500">{tpl.terms_version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); !tpl.is_active && handleSetActive(tpl.id); }}
                        disabled={tpl.is_active}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          tpl.is_active
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer'
                        }`}
                      >
                        {tpl.is_active ? 'Активна' : 'Черновик'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">{formatDate(tpl.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Duplicate */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(tpl.id); }}
                          title="Дублировать"
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={(e) => { e.stopPropagation(); !tpl.is_active && handleDelete(tpl.id); }}
                          title={tpl.is_active ? 'Нельзя удалить активный шаблон' : 'Удалить'}
                          disabled={tpl.is_active}
                          className={`p-1.5 rounded transition-colors ${
                            tpl.is_active
                              ? 'text-neutral-200 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Assignments section ──────────────── */}
      <div id="assignments-section" className="bg-white rounded-md border border-neutral-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-neutral-900">Персональные назначения</h2>
                <span className="text-xs text-neutral-400">({specificCount})</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    placeholder="Поиск..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-48"
                  />
                </div>

                {/* Filter by template */}
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                  className="text-xs border border-neutral-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">Все шаблоны</option>
                  {templates?.filter((t) => t.audience_type === 'specific').map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  {/* Also show templates that have assignments even if audience_type isn't 'specific' */}
                  {templates?.filter((t) => t.audience_type !== 'specific' && (assignments || []).some((a) => a.template?.id === t.id)).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-10 h-10 text-neutral-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-neutral-400">
                {assignmentSearch
                  ? 'Ничего не найдено'
                  : 'Нет персональных назначений. Откройте шаблон → Настройки → «Для конкретных» чтобы назначить пользователей.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredAssignments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors">
                  {/* Avatar */}
                  <UserAvatar
                    name={a.client?.full_name}
                    email={a.client?.email}
                    avatarUrl={a.client?.avatar_url}
                    role="client"
                    size="md"
                  />

                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {a.client?.full_name || 'Без имени'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{a.client?.email}</p>
                  </div>

                  {/* Role */}
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                    a.client?.role === 'admin' ? 'bg-red-100 text-red-600' :
                    a.client?.role === 'am' ? 'bg-blue-100 text-blue-600' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {a.client?.role || '—'}
                  </span>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>

                  {/* Template name */}
                  <button
                    onClick={() => a.template?.id && navigate(`/admin/offer-templates/${a.template.id}`)}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 truncate max-w-[200px] shrink-0"
                  >
                    {a.template?.name || 'Неизвестный шаблон'}
                  </button>

                  {/* Active badge */}
                  {a.template?.is_active && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full shrink-0">
                      Активна
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-xs text-neutral-400 shrink-0 ml-auto">
                    {formatDate(a.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Create Modal */}
      <TemplateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
        isSaving={createTemplate.isPending}
      />
    </div>
  );
}

export default OfferTemplatesPage;
