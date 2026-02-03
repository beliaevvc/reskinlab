import { getStageStatusInfo } from '../../hooks/useStages';

export function StageTimeline({ stages, activeStageId, onStageClick }) {
  if (!stages || stages.length === 0) {
    return (
      <div className="bg-neutral-50 rounded p-4 text-center text-neutral-500">
        No stages defined for this project
      </div>
    );
  }

  // Calculate progress
  const completedCount = stages.filter(
    (s) => s.status === 'completed' || s.status === 'approved'
  ).length;
  const progressPercent = Math.round((completedCount / stages.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm font-medium text-neutral-600 w-12">
          {progressPercent}%
        </span>
      </div>

      {/* Timeline */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {stages.map((stage, index) => {
          const statusInfo = getStageStatusInfo(stage.status);
          const isActive = stage.id === activeStageId;
          const isCompleted = stage.status === 'completed' || stage.status === 'approved';
          const isInProgress = stage.status === 'in_progress' || stage.status === 'review';

          return (
            <div key={stage.id} className="flex items-start flex-1 min-w-[120px]">
              {/* Stage item */}
              <div className="flex flex-col items-center w-full">
                {/* Connector line + Circle */}
                <div className="flex items-center w-full">
                  {/* Left connector */}
                  {index > 0 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isCompleted || isInProgress
                          ? 'bg-emerald-500'
                          : 'bg-neutral-200'
                      }`}
                    />
                  )}
                  {index === 0 && <div className="flex-1" />}

                  {/* Circle */}
                  <button
                    onClick={() => onStageClick?.(stage)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all shrink-0 border-2
                      ${isActive
                        ? 'ring-2 ring-emerald-500 ring-offset-2'
                        : ''}
                      ${isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isInProgress
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-neutral-300 text-neutral-500 hover:border-neutral-400'}
                    `}
                  >
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{stage.order}</span>
                    )}
                  </button>

                  {/* Right connector */}
                  {index < stages.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-neutral-200'
                      }`}
                    />
                  )}
                  {index === stages.length - 1 && <div className="flex-1" />}
                </div>

                {/* Label */}
                <div className="mt-2 text-center px-1">
                  <div
                    className={`text-xs font-medium truncate ${
                      isActive
                        ? 'text-emerald-700'
                        : isCompleted
                          ? 'text-emerald-600'
                          : isInProgress
                            ? 'text-blue-600'
                            : 'text-neutral-500'
                    }`}
                  >
                    {stage.name}
                  </div>
                  <div className={`text-xs ${statusInfo.textClass}`}>
                    {statusInfo.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StageTimeline;
