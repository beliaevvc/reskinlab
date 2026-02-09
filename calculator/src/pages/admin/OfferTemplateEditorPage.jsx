import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  useOfferTemplate,
  useUpdateOfferTemplate,
  useSetActiveTemplate,
  useOfferVariables,
  useTemplateAssignments,
  useAssignOfferToClient,
  useRemoveOfferAssignment,
  useAllProfiles,
} from '../../hooks/useOfferTemplates';
import { OfferTemplateEditor } from '../../components/admin/offer-templates/OfferTemplateEditor';
import { OfferPreview } from '../../components/admin/offer-templates/OfferPreview';
import UserAvatar from '../../components/UserAvatar';
// ── Settings Modal ──────────────────────────────────
function SettingsModal({ isOpen, onClose, templateId, meta, onMetaChange }) {
  const { t } = useTranslation('admin');
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-neutral-900">{t('offerTemplates.settingsModal.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Section 1: Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('offerTemplates.settingsModal.descriptionSection')}</h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t('offerTemplates.settingsModal.descriptionLabel')}</label>
              <textarea
                value={meta.description}
                onChange={(e) => onMetaChange('description', e.target.value)}
                placeholder={t('offerTemplates.settingsModal.descriptionPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-colors"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-100" />

          {/* Section 2: Audience */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('offerTemplates.settingsModal.audienceSection')}</h3>
            <AudienceSettings
              templateId={templateId}
              audienceType={meta.audience_type}
              onAudienceTypeChange={(val) => onMetaChange('audience_type', val)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('offerTemplates.settingsModal.done')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Audience Settings (inside modal) ────────────────
function AudienceSettings({ templateId, audienceType, onAudienceTypeChange }) {
  const { t } = useTranslation('admin');
  const { data: assignments, isLoading: assignmentsLoading } = useTemplateAssignments(templateId);
  const { data: allProfiles, isLoading: profilesLoading } = useAllProfiles();
  const assignClient = useAssignOfferToClient();
  const removeAssignment = useRemoveOfferAssignment();

  const [searchQuery, setSearchQuery] = useState('');

  const assignedIds = new Set((assignments || []).map((a) => a.client_id));

  const filteredResults = (allProfiles || []).filter((p) => {
    if (assignedIds.has(p.id)) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  const handleAddUser = async (profile) => {
    try {
      await assignClient.mutateAsync({ client_id: profile.id, template_id: templateId });
      setSearchQuery('');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  const handleRemoveUser = async (assignmentId) => {
    try {
      await removeAssignment.mutateAsync({ id: assignmentId, templateId });
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex bg-neutral-100 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onAudienceTypeChange('all')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            audienceType === 'all' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('offerTemplates.settingsModal.forAll')}
        </button>
        <button
          type="button"
          onClick={() => onAudienceTypeChange('specific')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            audienceType === 'specific' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('offerTemplates.settingsModal.forSpecific')}
        </button>
      </div>

      {audienceType === 'all' && (
        <p className="text-xs text-neutral-400">{t('offerTemplates.settingsModal.forAllDesc')}</p>
      )}

      {/* Inline user picker */}
      {audienceType === 'specific' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('offerTemplates.settingsModal.search')}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-colors"
            />
          </div>

          {/* Assigned users chips */}
          {assignmentsLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-500" />
              <span className="text-xs text-neutral-500">Загрузка...</span>
            </div>
          ) : assignments?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full pl-1 pr-1.5 py-0.5 hover:border-red-300 transition-colors group"
                >
                  <UserAvatar
                    name={a.client?.full_name}
                    email={a.client?.email}
                    avatarUrl={a.client?.avatar_url}
                    role="client"
                    size="xs"
                  />
                  <span className="text-xs font-medium text-emerald-800 max-w-[120px] truncate">
                    {a.client?.full_name || a.client?.email || 'Unknown'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(a.id)}
                    disabled={removeAssignment.isPending}
                    className="w-4 h-4 flex items-center justify-center rounded-full text-emerald-400 group-hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available users list */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="max-h-52 overflow-y-auto divide-y divide-neutral-100">
              {profilesLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                  <span className="ml-2 text-xs text-neutral-500">{t('offerTemplates.settingsModal.loadingUsers')}</span>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <svg className="w-6 h-6 text-neutral-300 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs text-neutral-400">
                    {assignedIds.size > 0 && !searchQuery ? t('offerTemplates.settingsModal.allAssigned') : t('offerTemplates.settingsModal.noResults')}
                  </p>
                </div>
              ) : (
                filteredResults.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleAddUser(profile)}
                    disabled={assignClient.isPending}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50/50 transition-colors text-left disabled:opacity-50"
                  >
                    <UserAvatar
                      name={profile.full_name}
                      email={profile.email}
                      avatarUrl={profile.avatar_url}
                      role={profile.role}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">{profile.full_name || 'Без имени'}</p>
                      <p className="text-xs text-neutral-400 truncate">{profile.email}</p>
                    </div>
                    <svg className="w-4 h-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>

          {!assignmentsLoading && (
            <p className="text-xs text-neutral-400">
              {assignments?.length
                ? `Назначено: ${assignments.length}`
                : 'Кликните на пользователя, чтобы назначить оферту'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Editor Page ──────────────────────────────
export function OfferTemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('admin');

  // Data
  const { data: template, isLoading } = useOfferTemplate(id);
  const { data: variables } = useOfferVariables();

  // Mutations
  const updateTemplate = useUpdateOfferTemplate();
  const setActive = useSetActiveTemplate();

  // Local state
  const [contentRu, setContentRu] = useState({ text: '' });
  const [contentEn, setContentEn] = useState({ text: '' });
  const [contentLang, setContentLang] = useState('en'); // 'ru' | 'en' — default to English
  const [meta, setMeta] = useState({
    name: '', description: '', audience_type: 'all',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Current content based on selected language
  const content = contentLang === 'ru' ? contentRu : contentEn;
  const setContent = contentLang === 'ru' ? setContentRu : setContentEn;

  // Init from template
  useEffect(() => {
    if (template) {
      // Use bilingual fields if available, fallback to legacy content
      setContentRu(template.content_ru || template.content || { text: '' });
      setContentEn(template.content_en || { text: '' });
      setMeta({
        name: template.name || '',
        description: template.description || '',
        audience_type: template.audience_type || 'all',
      });
      setHasChanges(false);
    }
  }, [template]);

  const handleContentChange = useCallback((newContent) => {
    if (contentLang === 'ru') {
      setContentRu(newContent);
    } else {
      setContentEn(newContent);
    }
    setHasChanges(true);
  }, [contentLang]);

  const handleMetaChange = useCallback((field, value) => {
    setMeta((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Save — metadata + content in one call, auto-generate version
  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const now = new Date();
      const version = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('.') + ' ' + [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
      ].join(':');

      await updateTemplate.mutateAsync({
        id,
        updates: {
          name: meta.name,
          description: meta.description,
          terms_version: version,
          audience_type: meta.audience_type,
          content: contentRu, // Legacy field, keep in sync with RU
          content_ru: contentRu,
          content_en: contentEn,
        },
      });
      setHasChanges(false);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetActive = async () => {
    try {
      await setActive.mutateAsync(id);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  // Print — with full Tailwind-equivalent styles
  const handlePrint = () => {
    const el = document.getElementById('offer-preview-content');
    if (!el) return;
    
    const popup = window.open('', 'print', 'width=900,height=700');
    if (!popup) { alert('Allow popups to print'); return; }
    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Offer - ReSkin Lab</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { 
      background: #fff; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #171717;
    }
    .print-wrapper { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    /* Tailwind utilities */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-shrink-0 { flex-shrink: 0; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-baseline { align-items: baseline; }
    .justify-center { justify-content: center; }
    .gap-3 { gap: 0.75rem; }
    .gap-8 { gap: 2rem; }
    .space-y-1 > * + * { margin-top: 0.25rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-8 > * + * { margin-top: 2rem; }
    
    .w-1\\.5 { width: 0.375rem; }
    .h-1\\.5 { height: 0.375rem; }
    .w-5 { width: 1.25rem; }
    .h-5 { height: 1.25rem; }
    .w-7 { width: 1.75rem; }
    .h-7 { height: 1.75rem; }
    .w-8 { width: 2rem; }
    
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-10 { margin-top: 2.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-8 { margin-bottom: 2rem; }
    .pb-6 { padding-bottom: 1.5rem; }
    .pt-1 { padding-top: 0.25rem; }
    .pt-6 { padding-top: 1.5rem; }
    .pl-10 { padding-left: 2.5rem; }
    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .leading-relaxed { line-height: 1.625; }
    
    .text-white { color: #fff; }
    .text-neutral-400 { color: #a3a3a3; }
    .text-neutral-500 { color: #737373; }
    .text-neutral-600 { color: #525252; }
    .text-neutral-700 { color: #404040; }
    .text-neutral-900 { color: #171717; }
    .text-emerald-700 { color: #047857; }
    
    .bg-white { background-color: #fff; }
    .bg-neutral-100 { background-color: #f5f5f5; }
    .bg-neutral-900 { background-color: #171717; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .bg-emerald-500 { background-color: #10b981; }
    
    .border { border-width: 1px; border-style: solid; }
    .border-t { border-top-width: 1px; border-top-style: solid; }
    .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
    .border-neutral-200 { border-color: #e5e5e5; }
    .border-neutral-900 { border-color: #171717; }
    .border-emerald-200 { border-color: #a7f3d0; }
    
    .rounded { border-radius: 0.25rem; }
    .rounded-full { border-radius: 9999px; }
    
    /* Variable highlight */
    .var-highlight {
      display: inline;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    @media print {
      html, body { background: #fff !important; }
      .print-wrapper { padding: 0; max-width: 100%; }
      @page { margin: 1.5cm; size: A4; }
      * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-wrapper">${el.innerHTML}</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 200);
    };
  <\/script>
</body>
</html>`);
    popup.document.close();
  };

  // ── Loading / not found ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-neutral-500">
        <p className="text-lg font-medium">Template not found</p>
        <button onClick={() => navigate('/admin/offer-templates')} className="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
          &larr; Back to templates
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -m-6">
      {/* ── Top bar ───────────────────────────── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3 bg-white border-b border-neutral-200 shrink-0">
        {/* Left: back + name + badges */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate('/admin/offer-templates')}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <input
            type="text"
            value={meta.name}
            onChange={(e) => handleMetaChange('name', e.target.value)}
            className="text-sm font-semibold text-neutral-900 bg-transparent border-none focus:outline-none focus:ring-0 min-w-0 w-full max-w-[220px]"
            placeholder={t('offerTemplates.form.namePlaceholder')}
          />

          {template.is_active && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-full shrink-0 whitespace-nowrap">
              {t('offerTemplates.status.active')}
            </span>
          )}

          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full shrink-0 whitespace-nowrap ${
            meta.audience_type === 'all'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {meta.audience_type === 'all' ? t('offerTemplates.audience.all') : t('offerTemplates.audience.personal')}
          </span>

          <span className="text-[11px] text-neutral-400 shrink-0 whitespace-nowrap">{template.terms_version}</span>
        </div>

        {/* Center: mode toggle + language toggle */}
        <div className="flex items-center gap-3 mx-4">
          {/* Mode toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'edit'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t('offerTemplates.editor.edit')}
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'preview'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t('offerTemplates.editor.preview')}
            </button>
          </div>

          {/* Language toggle for content */}
          <div className="flex bg-blue-50 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setContentLang('ru')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                contentLang === 'ru'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => setContentLang('en')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                contentLang === 'en'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Right: actions — aligned right */}
        <div className="flex items-center gap-2 justify-end">
          {/* Settings toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
            title={t('offerTemplates.editor.settingsTitle')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {!template.is_active && (
            <button
              onClick={handleSetActive}
              disabled={setActive.isPending}
              className="px-3 py-1.5 text-sm font-medium border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:opacity-50 transition-colors"
            >
              {t('offerTemplates.editor.setActive')}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-4 py-1.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isSaving ? t('offerTemplates.editor.saving') : hasChanges ? t('offerTemplates.editor.saveChanges') : t('offerTemplates.editor.saved')}
          </button>
        </div>
      </div>

      {/* ── Settings modal ─────── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        templateId={id}
        meta={meta}
        onMetaChange={handleMetaChange}
      />

      {/* ── Main content ──────────────────── */}
      <div className="flex-1 overflow-hidden bg-neutral-50">
        {mode === 'edit' ? (
          <div className="h-full overflow-y-auto px-6 py-6">
            <OfferTemplateEditor
              key={contentLang}
              content={content}
              onChange={handleContentChange}
              variables={variables}
              contentLang={contentLang}
            />
          </div>
        ) : (
          <div className="h-full">
            <OfferPreview
              key={contentLang}
              content={content}
              variables={variables || []}
              contentLang={contentLang}
              onPrint={handlePrint}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OfferTemplateEditorPage;
