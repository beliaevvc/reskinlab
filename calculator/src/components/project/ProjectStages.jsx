import { useAuth } from '../../contexts/AuthContext';

export function ProjectStages({ 
  stages = [], 
  currentStageId,
  onStageClick,
  canChangeStage = false,
}) {
  const { isAdmin, isAM } = useAuth();

  if (!stages.length) {
    return null;
  }

  // Find current stage index
  const currentIndex = stages.findIndex(s => 
    s.status === 'in_progress' || s.status === 'review'
  );

  return (
    <div className="bg-white border-b border-neutral-200 px-6 py-3">
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed' || stage.status === 'approved';
          const isCurrent = stage.status === 'in_progress' || stage.status === 'review';
          const isPending = stage.status === 'pending';
          
          // Админы и AM могут кликать на любые этапы для активации/деактивации
          // Можно активировать pending этапы и деактивировать активные/завершенные
          const isClickable = canChangeStage && (isAdmin || isAM);

          return (
            <div key={stage.id} className="flex items-center flex-1">
              {/* Stage dot/circle */}
              <button
                onClick={() => isClickable && onStageClick?.(stage)}
                disabled={!isClickable}
                className={`
                  relative flex items-center justify-center
                  w-8 h-8 rounded-full border-2 transition-all
                  ${isCompleted 
                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                    : isCurrent 
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-400'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                `}
                title={`${stage.name}: ${stage.status}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </button>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-1 rounded-full transition-colors
                  ${isCompleted || isCurrent ? 'bg-emerald-500' : 'bg-neutral-200'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage labels */}
      <div className="flex items-center gap-1 mt-1">
        {stages.map((stage, index) => {
          const isCompleted = stage.status === 'completed' || stage.status === 'approved';
          const isCurrent = stage.status === 'in_progress' || stage.status === 'review';

          return (
            <div 
              key={stage.id} 
              className="flex-1 flex items-center"
            >
              <span className={`
                text-xs truncate
                ${isCurrent 
                  ? 'text-emerald-600 font-medium' 
                  : isCompleted 
                    ? 'text-emerald-600' 
                    : 'text-neutral-400'
                }
              `}>
                {stage.name}
              </span>
              {index < stages.length - 1 && <div className="flex-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectStages;
