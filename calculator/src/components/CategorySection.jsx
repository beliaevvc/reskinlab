import { ItemRow } from './ItemRow';

export function CategorySection({ category, items, onUpdate, onToggleDetails }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
        {category.name}
      </h2>
      <div className="hidden sm:flex px-3 pb-1 text-[10px] uppercase font-medium text-neutral-400">
        <div className="flex-grow">Item</div>
        <div className="w-32 pl-2">Anim</div>
        <div className="w-[100px] text-center">Qty</div>
      </div>
      <div className="space-y-2">
        {category.items.map((item) => {
          const state = items[item.id] || { qty: 0, anim: 'none', expanded: false };
          return (
            <ItemRow
              key={item.id}
              item={item}
              state={state}
              onUpdate={onUpdate}
              onToggleDetails={onToggleDetails}
            />
          );
        })}
      </div>
    </div>
  );
}

export default CategorySection;
