import { useTranslation } from 'react-i18next';
import useCalculatorStore from '../../stores/calculatorStore';

export function DraftStatusBadge({ isSaving, lastSaved }) {
  const { t } = useTranslation('calculator');
  const {
    currentProjectId,
    currentSpecificationId,
    currentSpecificationVersion,
    isDraft,
  } = useCalculatorStore();

  // No project selected
  if (!currentProjectId) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span className="w-2 h-2 rounded-full bg-neutral-300" />
        <span>{t('draftStatus.notSaved')}</span>
      </div>
    );
  }

  // Saving in progress
  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <div className="animate-spin rounded-full h-2 w-2 border-b border-amber-600" />
        <span>{t('draftStatus.saving')}</span>
      </div>
    );
  }

  // Finalized specification
  if (currentSpecificationId && !isDraft) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>{t('draftStatus.finalized')} {currentSpecificationVersion}</span>
      </div>
    );
  }

  // Draft with version
  if (currentSpecificationId && isDraft) {
    const savedTime = lastSaved
      ? new Date(lastSaved).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span>
          {t('draftStatus.draft')} {currentSpecificationVersion}
          {savedTime && ` • ${t('draftStatus.saved')} ${savedTime}`}
        </span>
      </div>
    );
  }

  // Project selected but no specification yet
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
      <span className="w-2 h-2 rounded-full bg-blue-400" />
      <span>{t('draftStatus.newSpecification')}</span>
    </div>
  );
}

export default DraftStatusBadge;
