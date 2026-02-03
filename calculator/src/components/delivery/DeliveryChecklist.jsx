import { useDeliveryChecklist } from '../../hooks/useDelivery';

export function DeliveryChecklist({ projectId }) {
  const { data: checklist, isLoading, error } = useDeliveryChecklist(projectId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        Failed to load checklist: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
      {/* Header with progress */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-neutral-900">Delivery Checklist</h3>
          <span className={`text-sm font-medium ${
            checklist.readyForDelivery ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {checklist.completedItems}/{checklist.totalItems} complete
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              checklist.readyForDelivery ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${checklist.overallProgress}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="divide-y divide-neutral-100">
        {checklist.checklist.map((item) => (
          <div
            key={item.id}
            className={`p-4 flex items-center gap-4 ${
              item.optional ? 'bg-neutral-50' : ''
            }`}
          >
            {/* Status icon */}
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
              ${item.completed 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'bg-neutral-100 text-neutral-400'
              }
            `}>
              {item.completed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Label and detail */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${
                item.completed ? 'text-neutral-900' : 'text-neutral-600'
              }`}>
                {item.label}
                {item.optional && (
                  <span className="text-xs text-neutral-400 ml-2">(optional)</span>
                )}
              </p>
              <p className="text-sm text-neutral-500">{item.detail}</p>
            </div>

            {/* Progress indicator for partial completion */}
            {!item.completed && item.progress > 0 && (
              <div className="w-20">
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 text-right mt-1">
                  {Math.round(item.progress)}%
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ready status */}
      <div className={`p-4 ${
        checklist.readyForDelivery 
          ? 'bg-emerald-50 border-t border-emerald-200' 
          : 'bg-amber-50 border-t border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {checklist.readyForDelivery ? (
            <>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-emerald-800">Ready for delivery</p>
                <p className="text-sm text-emerald-600">All required items are complete</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-800">Not ready for delivery</p>
                <p className="text-sm text-amber-600">Complete all required items first</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeliveryChecklist;
