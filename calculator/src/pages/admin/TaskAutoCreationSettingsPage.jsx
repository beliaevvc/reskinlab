import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTaskAutoCreationSettings, useUpdateTaskAutoCreationSettings } from '../../hooks/useTaskAutoCreationSettings';
import { useTaskAutoTemplates, useCreateTaskAutoTemplate, useUpdateTaskAutoTemplate, useDeleteTaskAutoTemplate } from '../../hooks/useTaskAutoTemplates';
import { useTaskSpecItemTemplates, useUpdateTaskSpecItemTemplate, useCreateTaskSpecItemTemplate } from '../../hooks/useTaskSpecItemTemplates';
import { ALL_ITEMS } from '../../data/categories';
import { TemplateChecklistEditor } from '../../components/admin/TemplateChecklistEditor';

const STAGE_KEYS = ['briefing', 'moodboard', 'symbols', 'ui', 'animation', 'revisions', 'delivery'];

export function TaskAutoCreationSettingsPage() {
  const { t } = useTranslation('admin');
  const { data: settings, isLoading: settingsLoading } = useTaskAutoCreationSettings();
  const { data: templates, isLoading: templatesLoading } = useTaskAutoTemplates();
  const { data: specTemplates, isLoading: specTemplatesLoading } = useTaskSpecItemTemplates();
  const updateSettings = useUpdateTaskAutoCreationSettings();
  const createTemplate = useCreateTaskAutoTemplate();
  const updateTemplate = useUpdateTaskAutoTemplate();
  const deleteTemplate = useDeleteTaskAutoTemplate();
  const updateSpecTemplate = useUpdateTaskSpecItemTemplate();
  const createSpecTemplate = useCreateTaskSpecItemTemplate();
  
  // Localized stage options
  const STAGE_OPTIONS = STAGE_KEYS.map(key => ({
    value: key,
    label: t(`taskSettings.stages.${key}`)
  }));

  const [formData, setFormData] = useState({
    spec_tasks_enabled: true,
    animation_tasks_separate: true,
    default_due_days: 7,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    title_ru: '',
    title_en: '',
    description_ru: '',
    description_en: '',
    stage_key: 'briefing',
    order: 0,
    due_days_offset: 7,
    is_enabled: true,
    checklist_items: [],
  });
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [editingSpecTemplateId, setEditingSpecTemplateId] = useState(null);
  const [newSpecTemplates, setNewSpecTemplates] = useState({}); // Храним данные новых шаблонов до сохранения

  // Инициализируем форму при загрузке настроек
  useEffect(() => {
    if (settings) {
      setFormData({
        spec_tasks_enabled: settings.spec_tasks_enabled ?? true,
        animation_tasks_separate: settings.animation_tasks_separate ?? true,
        default_due_days: settings.default_due_days || 7,
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateSettings.mutateAsync(formData);
      alert(t('taskSettings.alerts.saved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('taskSettings.alerts.saveError') + ' ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveTemplate = async (template) => {
    try {
      if (template.id) {
        await updateTemplate.mutateAsync(template);
      } else {
        await createTemplate.mutateAsync(template);
        setNewTemplate({
          title_ru: '',
          title_en: '',
          description_ru: '',
          description_en: '',
          stage_key: 'briefing',
          order: 0,
          due_days_offset: 7,
          is_enabled: true,
          checklist_items: [],
        });
        setShowNewTemplateForm(false);
      }
      setEditingTemplateId(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(t('taskSettings.alerts.templateSaveError') + ' ' + error.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm(t('taskSettings.confirms.deleteTemplate'))) {
      return;
    }
    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(t('taskSettings.alerts.templateDeleteError') + ' ' + error.message);
    }
  };

  const handleSaveSpecTemplate = async (template) => {
    try {
      if (template.id) {
        // Обновляем существующий шаблон
        await updateSpecTemplate.mutateAsync(template);
      } else {
        // Создаем новый шаблон
        await createSpecTemplate.mutateAsync(template);
      }
      setEditingSpecTemplateId(null);
    } catch (error) {
      console.error('Error saving spec template:', error);
      alert(t('taskSettings.alerts.templateSaveError') + ' ' + error.message);
    }
  };

  const getItemName = (itemId) => {
    const item = ALL_ITEMS.find(i => i.id === itemId);
    return item ? item.name : itemId;
  };

  if (settingsLoading || templatesLoading || specTemplatesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">{t('taskSettings.loading')}</div>
      </div>
    );
  }


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t('taskSettings.title')}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {t('taskSettings.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Дополнительные автоматические задачи (шаблоны) */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{t('taskSettings.sections.additionalTasks.title')}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                {t('taskSettings.sections.additionalTasks.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewTemplateForm(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              {t('taskSettings.actions.addTemplate')}
            </button>
          </div>

          {/* Форма создания нового шаблона */}
          {showNewTemplateForm && (
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <h3 className="text-md font-semibold text-neutral-900 mb-4">{t('taskSettings.newTemplate.title')}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.titleRu')} *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.title_ru}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title_ru: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('taskSettings.form.titleRuPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.titleEn')} *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.title_en}
                      onChange={(e) => setNewTemplate({ ...newTemplate, title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('taskSettings.form.titleEnPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('taskSettings.form.projectStageRequired')}
                  </label>
                  <select
                    value={newTemplate.stage_key}
                    onChange={(e) => setNewTemplate({ ...newTemplate, stage_key: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {STAGE_OPTIONS.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.descriptionRu')}
                    </label>
                    <textarea
                      value={newTemplate.description_ru}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description_ru: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('taskSettings.form.descriptionRuPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.descriptionEn')}
                    </label>
                    <textarea
                      value={newTemplate.description_en}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description_en: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('taskSettings.form.descriptionEnPlaceholder')}
                    />
                  </div>
                </div>
                <TemplateChecklistEditor
                  checklistItems={newTemplate.checklist_items || []}
                  onChange={(items) => setNewTemplate({ ...newTemplate, checklist_items: items })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.order')}
                    </label>
                    <input
                      type="number"
                      value={newTemplate.order}
                      onChange={(e) => setNewTemplate({ ...newTemplate, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('taskSettings.form.dueDays')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newTemplate.due_days_offset}
                      onChange={(e) => setNewTemplate({ ...newTemplate, due_days_offset: parseInt(e.target.value) || 7 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newTemplate.is_enabled}
                    onChange={(e) => setNewTemplate({ ...newTemplate, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                    id="new-template-enabled"
                  />
                  <label htmlFor="new-template-enabled" className="text-sm text-neutral-700 cursor-pointer">
                    {t('taskSettings.form.enabled')}
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTemplateForm(false);
                      setNewTemplate({
                        title_ru: '',
                        title_en: '',
                        description_ru: '',
                        description_en: '',
                        stage_key: 'briefing',
                        order: 0,
                        due_days_offset: 7,
                        is_enabled: true,
                        checklist_items: [],
                      });
                    }}
                    className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    {t('taskSettings.actions.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTemplate(newTemplate)}
                    disabled={(!newTemplate.title_ru && !newTemplate.title_en) || createTemplate.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createTemplate.isPending ? t('taskSettings.actions.saving') : t('taskSettings.actions.create')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Список существующих шаблонов */}
          <div className="space-y-3">
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  {editingTemplateId === template.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.titleRu')}
                          </label>
                          <input
                            type="text"
                            value={template.title_ru || ''}
                            onChange={(e) => {
                              const updated = { ...template, title_ru: e.target.value };
                              handleSaveTemplate(updated);
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder={t('taskSettings.form.titleRuPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.titleEn')}
                          </label>
                          <input
                            type="text"
                            value={template.title_en || ''}
                            onChange={(e) => {
                              const updated = { ...template, title_en: e.target.value };
                              handleSaveTemplate(updated);
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder={t('taskSettings.form.titleEnPlaceholder')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          {t('taskSettings.form.projectStageRequired')}
                        </label>
                        <select
                          value={template.stage_key}
                          onChange={(e) => {
                            const updated = { ...template, stage_key: e.target.value };
                            handleSaveTemplate(updated);
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          {STAGE_OPTIONS.map((stage) => (
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.descriptionRu')}
                          </label>
                          <textarea
                            value={template.description_ru || ''}
                            onChange={(e) => {
                              const updated = { ...template, description_ru: e.target.value };
                              handleSaveTemplate(updated);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder={t('taskSettings.form.descriptionRuPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.descriptionEn')}
                          </label>
                          <textarea
                            value={template.description_en || ''}
                            onChange={(e) => {
                              const updated = { ...template, description_en: e.target.value };
                              handleSaveTemplate(updated);
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder={t('taskSettings.form.descriptionEnPlaceholder')}
                          />
                        </div>
                      </div>
                      <TemplateChecklistEditor
                        checklistItems={template.checklist_items || []}
                        onChange={(items) => {
                          const updated = { ...template, checklist_items: items };
                          handleSaveTemplate(updated);
                        }}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.order')}
                          </label>
                          <input
                            type="number"
                            value={template.order}
                            onChange={(e) => {
                              const updated = { ...template, order: parseInt(e.target.value) || 0 };
                              handleSaveTemplate(updated);
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.form.dueDays')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={template.due_days_offset}
                            onChange={(e) => {
                              const updated = { ...template, due_days_offset: parseInt(e.target.value) || 7 };
                              handleSaveTemplate(updated);
                            }}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={template.is_enabled}
                            onChange={(e) => {
                              const updated = { ...template, is_enabled: e.target.checked };
                              handleSaveTemplate(updated);
                            }}
                            className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm text-neutral-700">{t('taskSettings.status.enabled')}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingTemplateId(null)}
                          className="px-3 py-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          {t('taskSettings.actions.done')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="font-semibold text-neutral-900">
                              {template.title_en || template.title}
                            </h3>
                            {template.title_ru && template.title_ru !== template.title_en && (
                              <p className="text-sm text-neutral-500">{template.title_ru}</p>
                            )}
                          </div>
                          <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                            {STAGE_OPTIONS.find((s) => s.value === template.stage_key)?.label || template.stage_key}
                          </span>
                          {template.is_enabled ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{t('taskSettings.status.enabled')}</span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded">{t('taskSettings.status.disabled')}</span>
                          )}
                        </div>
                        {(template.description_ru || template.description_en || template.description) && (
                          <div className="text-sm text-neutral-600 mb-2 space-y-1">
                            {template.description_ru && <p><span className="text-neutral-400">RU:</span> {template.description_ru}</p>}
                            {template.description_en && <p><span className="text-neutral-400">EN:</span> {template.description_en}</p>}
                            {!template.description_ru && !template.description_en && template.description && (
                              <p>{template.description}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>{t('taskSettings.labels.order')} {template.order}</span>
                          <span>{t('taskSettings.labels.deadline')} +{template.due_days_offset} {t('taskSettings.labels.days')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTemplateId(template.id)}
                          className="px-3 py-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          {t('taskSettings.actions.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={deleteTemplate.isPending}
                          className="px-3 py-1 text-sm text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          {t('taskSettings.actions.delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-500">
                {t('taskSettings.noTemplates')}
              </div>
            )}
          </div>
        </div>

        {/* Шаблоны задач из спецификации */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('taskSettings.sections.specTemplates.title')}</h2>
            <p className="text-xs text-neutral-500 mt-1">
              {t('taskSettings.sections.specTemplates.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            {[...ALL_ITEMS].sort((a, b) => {
              const tplA = specTemplates?.find(t => t.item_id === a.id);
              const tplB = specTemplates?.find(t => t.item_id === b.id);
              return (tplA?.sort_order ?? 999) - (tplB?.sort_order ?? 999);
            }).map((item) => {
              // Ищем существующий шаблон для этого item_id
              const existingTemplate = specTemplates?.find(t => t.item_id === item.id);
              const editingKey = `new-${item.id}`;
              const newTemplateData = newSpecTemplates[editingKey] || {};
              const isNewTemplate = !existingTemplate;
              const template = existingTemplate || {
                id: null,
                item_id: item.id,
                task_title_ru: newTemplateData.task_title_ru || item.name,
                task_title_en: newTemplateData.task_title_en || item.name,
                task_description_ru: newTemplateData.task_description_ru || `Задача по созданию ${item.name.toLowerCase()} в количестве {qty} шт.`,
                task_description_en: newTemplateData.task_description_en || `Task for creating ${item.name.toLowerCase()} in quantity of {qty} pcs.`,
                animation_task_title_template_ru: newTemplateData.animation_task_title_template_ru || `Анимация: {item_name} ({anim_name})`,
                animation_task_title_template_en: newTemplateData.animation_task_title_template_en || `Animation: {item_name} ({anim_name})`,
                animation_task_description_template_ru: newTemplateData.animation_task_description_template_ru || `Задача по созданию анимации для {item_name}: {anim_name}`,
                animation_task_description_template_en: newTemplateData.animation_task_description_template_en || `Animation task for {item_name}: {anim_name}`,
                checklist_items: newTemplateData.checklist_items || [],
              };
              const itemName = item.name;
              const isEditing = editingSpecTemplateId === template.id || (isNewTemplate && editingSpecTemplateId === editingKey);
              
              return (
                <div
                  key={item.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                >
                  {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.specForm.specItem')}
                          </label>
                          <div className="px-3 py-2 bg-neutral-100 rounded-lg text-sm text-neutral-600">
                            {itemName} ({template.item_id})
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.titleRuHint')}
                            </label>
                            <input
                              type="text"
                              value={template.task_title_ru || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], task_title_ru: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, task_title_ru: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.titleRuPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.titleEnHint')}
                            </label>
                            <input
                              type="text"
                              value={template.task_title_en || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], task_title_en: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, task_title_en: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.titleEnPlaceholder')}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.descriptionRuHint')}
                            </label>
                            <textarea
                              value={template.task_description_ru || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], task_description_ru: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, task_description_ru: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.descriptionRuPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.descriptionEnHint')}
                            </label>
                            <textarea
                              value={template.task_description_en || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], task_description_en: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, task_description_en: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.descriptionEnPlaceholder')}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.animationTitleRuHint')}
                            </label>
                            <input
                              type="text"
                              value={template.animation_task_title_template_ru || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], animation_task_title_template_ru: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, animation_task_title_template_ru: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.animationTitleRuPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.animationTitleEnHint')}
                            </label>
                            <input
                              type="text"
                              value={template.animation_task_title_template_en || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], animation_task_title_template_en: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, animation_task_title_template_en: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.animationTitleEnPlaceholder')}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.animationDescriptionRuHint')}
                            </label>
                            <textarea
                              value={template.animation_task_description_template_ru || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], animation_task_description_template_ru: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, animation_task_description_template_ru: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.animationDescriptionRuPlaceholder')}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              {t('taskSettings.specForm.animationDescriptionEnHint')}
                            </label>
                            <textarea
                              value={template.animation_task_description_template_en || ''}
                              onChange={(e) => {
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], animation_task_description_template_en: e.target.value }
                                  }));
                                } else {
                                  const updated = { ...template, animation_task_description_template_en: e.target.value };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder={t('taskSettings.specForm.animationDescriptionEnPlaceholder')}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {t('taskSettings.specForm.sortOrder')}
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              value={template.sort_order ?? 999}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                if (isNewTemplate) {
                                  setNewSpecTemplates(prev => ({
                                    ...prev,
                                    [editingKey]: { ...prev[editingKey], sort_order: val }
                                  }));
                                } else {
                                  const updated = { ...template, sort_order: val };
                                  handleSaveSpecTemplate(updated);
                                }
                              }}
                              className="w-32 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <span className="text-xs text-neutral-500">{t('taskSettings.specForm.sortHint')}</span>
                          </div>
                        </div>
                        <TemplateChecklistEditor
                          checklistItems={template.checklist_items || []}
                          onChange={(items) => {
                            if (isNewTemplate) {
                              setNewSpecTemplates(prev => ({
                                ...prev,
                                [editingKey]: { ...prev[editingKey], checklist_items: items }
                              }));
                            } else {
                              const updated = { ...template, checklist_items: items };
                              handleSaveSpecTemplate(updated);
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSpecTemplateId(null);
                              if (isNewTemplate) {
                                // Очищаем данные нового шаблона при отмене
                                setNewSpecTemplates(prev => {
                                  const newState = { ...prev };
                                  delete newState[editingKey];
                                  return newState;
                                });
                              }
                            }}
                            className="px-3 py-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            {t('taskSettings.actions.cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              // Для нового шаблона используем актуальные данные из состояния
                              const templateToSave = isNewTemplate ? {
                                item_id: item.id,
                                task_title_ru: newTemplateData.task_title_ru || template.task_title_ru,
                                task_title_en: newTemplateData.task_title_en || template.task_title_en,
                                task_description_ru: newTemplateData.task_description_ru || template.task_description_ru,
                                task_description_en: newTemplateData.task_description_en || template.task_description_en,
                                animation_task_title_template_ru: newTemplateData.animation_task_title_template_ru || template.animation_task_title_template_ru,
                                animation_task_title_template_en: newTemplateData.animation_task_title_template_en || template.animation_task_title_template_en,
                                animation_task_description_template_ru: newTemplateData.animation_task_description_template_ru || template.animation_task_description_template_ru,
                                animation_task_description_template_en: newTemplateData.animation_task_description_template_en || template.animation_task_description_template_en,
                                checklist_items: newTemplateData.checklist_items || template.checklist_items || [],
                                sort_order: newTemplateData.sort_order ?? template.sort_order ?? 999,
                              } : template;
                              
                              await handleSaveSpecTemplate(templateToSave);
                              if (isNewTemplate) {
                                // Очищаем данные нового шаблона после создания
                                setNewSpecTemplates(prev => {
                                  const newState = { ...prev };
                                  delete newState[editingKey];
                                  return newState;
                                });
                              }
                            }}
                            className="px-3 py-1 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                          >
                            {isNewTemplate ? t('taskSettings.actions.createTemplate') : t('taskSettings.actions.save')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <h3 className="font-semibold text-neutral-900">
                                {existingTemplate ? (template.task_title_en || template.task_title || itemName) : `${itemName} ${t('taskSettings.noTemplateLabel')}`}
                              </h3>
                              {existingTemplate && template.task_title_ru && template.task_title_ru !== template.task_title_en && (
                                <p className="text-sm text-neutral-500">{template.task_title_ru}</p>
                              )}
                            </div>
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                              {itemName}
                            </span>
                            <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded font-mono">
                              {item.id}
                            </span>
                            {!existingTemplate && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                {t('taskSettings.status.noTemplate')}
                              </span>
                            )}
                          </div>
                          {existingTemplate && (template.task_description_ru || template.task_description_en) && (
                            <div className="text-sm text-neutral-600 mb-2 space-y-1">
                              {template.task_description_ru && <p><span className="text-neutral-400">RU:</span> {template.task_description_ru}</p>}
                              {template.task_description_en && <p><span className="text-neutral-400">EN:</span> {template.task_description_en}</p>}
                            </div>
                          )}
                          {existingTemplate && (
                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <span>{t('taskSettings.labels.order')} {template.sort_order ?? '—'}</span>
                              <span>{t('taskSettings.labels.animation')} {template.animation_task_title_template_en || template.animation_task_title_template || t('taskSettings.labels.default')}</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSpecTemplateId(existingTemplate ? template.id : `new-${item.id}`)}
                          className="px-3 py-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
                        >
                          {existingTemplate ? t('taskSettings.actions.edit') : t('taskSettings.actions.createTemplate')}
                        </button>
                      </div>
                    )}
                  </div>
                );
            })}
          </div>
        </div>

        {/* Задачи из спецификации */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{t('taskSettings.sections.specTasks.title')}</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.spec_tasks_enabled}
                onChange={(e) => handleChange('spec_tasks_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {formData.spec_tasks_enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('taskSettings.form.dueDays')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.default_due_days}
                  onChange={(e) => handleChange('default_due_days', parseInt(e.target.value) || 7)}
                  className="w-48 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {t('taskSettings.hints.appliesToAll')}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.animation_tasks_separate}
                    onChange={(e) => handleChange('animation_tasks_separate', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-neutral-700">
                    {t('taskSettings.form.separateAnimations')}
                  </span>
                </label>
                <p className="text-xs text-neutral-500 mt-1 ml-6">
                  {t('taskSettings.hints.separateAnimations')}
                </p>
              </div>
            </div>
          )}
        </div>


        {/* Кнопки действий */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (settings) {
                setFormData({
                  spec_tasks_enabled: settings.spec_tasks_enabled ?? true,
                  animation_tasks_separate: settings.animation_tasks_separate ?? true,
                  default_due_days: settings.default_due_days || 7,
                });
              }
            }}
            className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            {t('taskSettings.actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving || updateSettings.isPending}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || updateSettings.isPending ? t('taskSettings.actions.saving') : t('taskSettings.actions.saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}
