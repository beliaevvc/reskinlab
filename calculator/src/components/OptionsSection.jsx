import { Icon } from './Icon';

export function OptionsSection({ revisionRounds, onRevisionChange }) {
  return (
    <div className="border-t border-neutral-200 pt-8 mt-10">
      <h2 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
        <Icon name="edit" className="text-emerald-500" /> Options
      </h2>
      <div className="bg-white border border-neutral-200 p-4 rounded-md flex flex-col md:flex-row items-center gap-6">
        <div className="flex-grow">
          <label className="text-sm font-medium text-neutral-900">Revision Rounds</label>
          <p className="text-xs text-neutral-500">
            Extra rounds (+2.5% budget each)
          </p>
        </div>
        <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded h-11 overflow-hidden">
          <button
            className="px-4 text-neutral-500 hover:text-white hover:bg-emerald-500 text-lg cursor-pointer transition-all duration-150 h-full font-medium"
            onClick={() => onRevisionChange(Math.max(0, revisionRounds - 1))}
          >
            -
          </button>
          <div className="w-12 text-center font-mono text-lg font-semibold text-neutral-900">
            {revisionRounds}
          </div>
          <button
            className="px-4 text-neutral-500 hover:text-white hover:bg-emerald-500 text-lg cursor-pointer transition-all duration-150 h-full font-medium"
            onClick={() => onRevisionChange(revisionRounds + 1)}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default OptionsSection;
