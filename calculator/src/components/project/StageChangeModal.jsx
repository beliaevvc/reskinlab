import { useUpdateStageStatus, useActivateStageWithPrevious, useDeactivateStageWithPrevious } from '../../hooks/useStages';

export function StageChangeModal({ isOpen, onClose, stage, projectId, allStages = [] }) {
  const updateStage = useUpdateStageStatus();
  const activateWithPrevious = useActivateStageWithPrevious();
  const deactivateWithPrevious = useDeactivateStageWithPrevious();

  if (!isOpen || !stage) return null;

  const isActive = stage.status === 'in_progress' || stage.status === 'review';
  const isCompleted = stage.status === 'completed' || stage.status === 'approved';
  // Деактивация возможна для активных и завершенных этапов
  const isDeactivating = isActive || isCompleted;

  // Определяем, какие этапы будут активированы/деактивированы
  const stagesToActivate = !isDeactivating && !isCompleted
    ? allStages.filter(
        s => s.order <= stage.order && s.status === 'pending'
      )
    : [];

  const stagesToDeactivate = (isDeactivating || isCompleted)
    ? allStages
        .filter(
          s => s.order >= stage.order && 
          (s.status === 'in_progress' || s.status === 'review' || 
           s.status === 'completed' || s.status === 'approved')
        )
        .sort((a, b) => b.order - a.order) // Сортируем справа налево для отображения
    : [];

  const handleConfirm = async () => {
    try {
      if (isDeactivating || isCompleted) {
        // Деактивация: деактивируем выбранный этап и все предыдущие этапы
        await deactivateWithPrevious.mutateAsync({
          stageId: stage.id,
          allStages,
          projectId,
        });
      } else {
        // Активация: активируем выбранный этап и все предыдущие pending этапы
        await activateWithPrevious.mutateAsync({
          stageId: stage.id,
          allStages,
          projectId,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error updating stage:', error);
      // Ошибка будет обработана React Query
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          {isDeactivating || isCompleted ? 'Деактивировать этап?' : 'Активировать этап?'}
        </h3>

        <div className="mb-6">
          <p className="text-sm text-neutral-600 mb-2">
            <span className="font-medium">Этап:</span> {stage.name}
          </p>
          <p className="text-sm text-neutral-600 mb-2">
            {isDeactivating || isCompleted
              ? stagesToDeactivate.length > 1
                ? `Будут деактивированы следующие этапы: ${stagesToDeactivate.map(s => s.name).join(', ')}. Все этапы будут возвращены в статус "Ожидает".`
                : `Вы уверены, что хотите деактивировать этап "${stage.name}"? Этап будет возвращен в статус "Ожидает".`
              : stagesToActivate.length > 1
              ? `Будут активированы следующие этапы: ${stagesToActivate.map(s => s.name).join(', ')}`
              : `Вы уверены, что хотите активировать этап "${stage.name}"?`}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={updateStage.isPending}
            className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded font-medium disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={updateStage.isPending || activateWithPrevious.isPending || deactivateWithPrevious.isPending}
            className={`px-4 py-2 rounded font-medium text-white disabled:opacity-50 ${
              isDeactivating || isCompleted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {updateStage.isPending || activateWithPrevious.isPending || deactivateWithPrevious.isPending
              ? 'Обработка...'
              : isDeactivating || isCompleted
              ? 'Деактивировать'
              : 'Активировать'}
          </button>
        </div>
      </div>
    </div>
  );
}
