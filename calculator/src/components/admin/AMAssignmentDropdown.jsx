import { useState, useRef, useEffect } from 'react';
import { useAMList, useAssignAM } from '../../hooks/useUsers';

export function AMAssignmentDropdown({ projectId, currentAMId, projectName }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { data: amList, isLoading } = useAMList();
  const assignAM = useAssignAM();

  const currentAM = amList?.find(am => am.id === currentAMId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAssign = async (amId) => {
    try {
      await assignAM.mutateAsync({ projectId, amId });
      setIsOpen(false);
    } catch (err) {
      alert('Failed to assign AM: ' + err.message);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={assignAM.isPending}
        className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors min-w-[200px] text-left"
      >
        {assignAM.isPending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
        ) : currentAM ? (
          <>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-blue-700">
                {currentAM.full_name?.[0] || currentAM.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-neutral-900 truncate flex-1">
              {currentAM.full_name || currentAM.email}
            </span>
          </>
        ) : (
          <span className="text-sm text-neutral-500">Assign Account Manager</span>
        )}
        <svg
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded shadow-lg border border-neutral-200 py-1 z-50">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Loading...</div>
          ) : amList?.length === 0 ? (
            <div className="px-4 py-3 text-sm text-neutral-500">No managers available</div>
          ) : (
            <>
              {/* Unassign option */}
              {currentAMId && (
                <>
                  <button
                    onClick={() => handleAssign(null)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove assignment
                  </button>
                  <div className="border-t border-neutral-100 my-1" />
                </>
              )}
              
              {/* AM list */}
              {amList.map((am) => (
                <button
                  key={am.id}
                  onClick={() => handleAssign(am.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-neutral-50 transition-colors ${
                    am.id === currentAMId ? 'bg-emerald-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-blue-700">
                      {am.full_name?.[0] || am.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {am.full_name || 'No name'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{am.email}</p>
                  </div>
                  {am.id === currentAMId && (
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AMAssignmentDropdown;
