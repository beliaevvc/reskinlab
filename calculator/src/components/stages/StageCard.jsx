import { getStageStatusInfo } from '../../hooks/useStages';

export function StageCard({ stage, isActive, onClick }) {
  const statusInfo = getStageStatusInfo(stage.status);

  return (
    <button
      onClick={() => onClick?.(stage)}
      className={`
        w-full text-left p-4 rounded border transition-all
        ${isActive 
          ? 'border-emerald-500 bg-emerald-50' 
          : 'border-neutral-200 bg-white hover:border-neutral-300'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Order number */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${stage.status === 'completed' || stage.status === 'approved'
              ? 'bg-emerald-500 text-white'
              : stage.status === 'in_progress' || stage.status === 'review'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-200 text-neutral-600'}
          `}>
            {stage.status === 'completed' || stage.status === 'approved' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              stage.order
            )}
          </div>

          <div>
            <h3 className="font-medium text-neutral-900">{stage.name}</h3>
            {stage.description && (
              <p className="text-sm text-neutral-500">{stage.description}</p>
            )}
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
          {statusInfo.label}
        </span>
      </div>
    </button>
  );
}

export default StageCard;
