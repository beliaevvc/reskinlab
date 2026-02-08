import { Icon } from './Icon';
import { Select } from './Select';
import { USAGE_RIGHTS as LOCAL_USAGE_RIGHTS, PAYMENT_MODELS as LOCAL_PAYMENT_MODELS } from '../data';

export function SettingsSection({
  usageRights,
  paymentModel,
  onUsageRightsChange,
  onPaymentModelChange,
  disabledUsageRights = false,
  disabledPaymentModel = false,
  usageRightsList = LOCAL_USAGE_RIGHTS,
  paymentModelsList = LOCAL_PAYMENT_MODELS,
}) {
  const rightsOptions = usageRightsList.map(r => ({
    value: r.id,
    label: `${r.id} (x${r.coeff})`
  }));

  const paymentOptions = paymentModelsList.map(p => ({
    value: p.id,
    label: `${p.name} (x${p.coeff})`
  }));

  const handleRightsChange = (value) => {
    const rights = usageRightsList.find((u) => u.id === value);
    if (rights) onUsageRightsChange(rights);
  };

  const handlePaymentChange = (value) => {
    const model = paymentModelsList.find((p) => p.id === value);
    if (model) onPaymentModelChange(model);
  };

  return (
    <div className="border-t border-neutral-200 pt-8 mt-8">
      <h2 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
        <Icon name="settings" className="text-emerald-500" /> Settings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`bg-white border border-neutral-200 p-4 rounded-md ${disabledUsageRights ? 'opacity-75' : ''}`}>
          <label className="text-xs font-medium text-neutral-500 uppercase mb-2 flex items-center gap-2">
            Rights
            {disabledUsageRights && (
              <span className="normal-case text-neutral-400" title="Inherited from the first paid specification in this project">
                (locked)
              </span>
            )}
          </label>
          <Select
            value={usageRights.id}
            options={rightsOptions}
            onChange={handleRightsChange}
            disabled={disabledUsageRights}
          />
          <p className="text-xs text-neutral-500 mt-2 h-10">{usageRights.desc}</p>
        </div>
        <div className={`bg-white border border-neutral-200 p-4 rounded-md ${disabledPaymentModel ? 'opacity-75' : ''}`}>
          <label className="text-xs font-medium text-neutral-500 uppercase mb-2 flex items-center gap-2">
            Payment
            {disabledPaymentModel && (
              <span className="normal-case text-neutral-400" title="Inherited from the first paid specification in this project">
                (locked)
              </span>
            )}
          </label>
          <Select
            value={paymentModel.id}
            options={paymentOptions}
            onChange={handlePaymentChange}
            disabled={disabledPaymentModel}
          />
          <p className="text-xs text-neutral-500 mt-2 h-10">{paymentModel.desc}</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsSection;
