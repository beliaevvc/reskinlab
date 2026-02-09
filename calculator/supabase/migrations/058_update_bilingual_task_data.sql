-- ===========================================
-- UPDATE BILINGUAL TASK DATA
-- ===========================================
-- Обновляем существующие шаблоны задач с двуязычными описаниями
-- Названия пока остаются на английском в обеих версиях

-- 1. Обновляем task_auto_templates (шаблон брифинга)
UPDATE public.task_auto_templates
SET 
  title_ru = 'Client Briefing',
  title_en = 'Client Briefing',
  description_ru = 'Провести брифинг с клиентом для уточнения требований и получения референсов',
  description_en = 'Conduct a briefing with the client to clarify requirements and gather references'
WHERE stage_key = 'briefing';

-- 2. Обновляем task_spec_item_templates с двуязычными описаниями

-- Concept Document
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Concept Document',
  task_title_en = 'Concept Document',
  task_description_ru = 'Создание концепт-документа проекта в количестве {qty} шт.',
  task_description_en = 'Create project concept document, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Concept Document ({anim_name})',
  animation_task_title_template_en = 'Animation: Concept Document ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для концепт-документа',
  animation_task_description_template_en = 'Create {anim_name} animation for concept document'
WHERE item_id = 'concept_doc';

-- Low Symbols
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Low Symbols',
  task_title_en = 'Low Symbols',
  task_description_ru = 'Создание символов низкой оплаты в количестве {qty} шт.',
  task_description_en = 'Create low paying symbols, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Low Symbols ({anim_name})',
  animation_task_title_template_en = 'Animation: Low Symbols ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для символов низкой оплаты',
  animation_task_description_template_en = 'Create {anim_name} animation for low symbols'
WHERE item_id = 'sym_low';

-- High Symbols
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'High Symbols',
  task_title_en = 'High Symbols',
  task_description_ru = 'Создание символов высокой оплаты в количестве {qty} шт.',
  task_description_en = 'Create high paying symbols, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: High Symbols ({anim_name})',
  animation_task_title_template_en = 'Animation: High Symbols ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для символов высокой оплаты',
  animation_task_description_template_en = 'Create {anim_name} animation for high symbols'
WHERE item_id = 'sym_mid';

-- Special Symbols (Wild/Bonus)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Special Symbols (Wild/Bonus)',
  task_title_en = 'Special Symbols (Wild/Bonus)',
  task_description_ru = 'Создание специальных символов (Wild, Scatter, Bonus) в количестве {qty} шт.',
  task_description_en = 'Create special symbols (Wild, Scatter, Bonus), quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Special Symbols ({anim_name})',
  animation_task_title_template_en = 'Animation: Special Symbols ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для специальных символов',
  animation_task_description_template_en = 'Create {anim_name} animation for special symbols'
WHERE item_id = 'sym_spec';

-- Base BG (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Base BG (Simple)',
  task_title_en = 'Base BG (Simple)',
  task_description_ru = 'Создание простого базового фона в количестве {qty} шт.',
  task_description_en = 'Create simple base background, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Base BG ({anim_name})',
  animation_task_title_template_en = 'Animation: Base BG ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для базового фона',
  animation_task_description_template_en = 'Create {anim_name} animation for base background'
WHERE item_id = 'bg_base_s';

-- Base BG (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Base BG (Detailed)',
  task_title_en = 'Base BG (Detailed)',
  task_description_ru = 'Создание детализированного базового фона в количестве {qty} шт.',
  task_description_en = 'Create detailed base background, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Base BG ({anim_name})',
  animation_task_title_template_en = 'Animation: Base BG ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для базового фона',
  animation_task_description_template_en = 'Create {anim_name} animation for base background'
WHERE item_id = 'bg_base_d';

-- Bonus BG (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus BG (Simple)',
  task_title_en = 'Bonus BG (Simple)',
  task_description_ru = 'Создание простого бонусного фона в количестве {qty} шт.',
  task_description_en = 'Create simple bonus background, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus BG ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus BG ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для бонусного фона',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus background'
WHERE item_id = 'bg_bonus_s';

-- Bonus BG (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus BG (Detailed)',
  task_title_en = 'Bonus BG (Detailed)',
  task_description_ru = 'Создание детализированного бонусного фона в количестве {qty} шт.',
  task_description_en = 'Create detailed bonus background, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus BG ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus BG ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для бонусного фона',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus background'
WHERE item_id = 'bg_bonus_d';

-- Big Win (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Big Win (Simple)',
  task_title_en = 'Big Win (Simple)',
  task_description_ru = 'Создание простого экрана Big Win в количестве {qty} шт.',
  task_description_en = 'Create simple Big Win screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Big Win ({anim_name})',
  animation_task_title_template_en = 'Animation: Big Win ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для Big Win',
  animation_task_description_template_en = 'Create {anim_name} animation for Big Win'
WHERE item_id = 'pop_win_s';

-- Big Win (Illustrated)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Big Win (Illustrated)',
  task_title_en = 'Big Win (Illustrated)',
  task_description_ru = 'Создание иллюстрированного экрана Big Win в количестве {qty} шт.',
  task_description_en = 'Create illustrated Big Win screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Big Win ({anim_name})',
  animation_task_title_template_en = 'Animation: Big Win ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для Big Win',
  animation_task_description_template_en = 'Create {anim_name} animation for Big Win'
WHERE item_id = 'pop_win_d';

-- Bonus Start (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus Start (Simple)',
  task_title_en = 'Bonus Start (Simple)',
  task_description_ru = 'Создание простого экрана начала бонуса в количестве {qty} шт.',
  task_description_en = 'Create simple bonus start screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus Start ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus Start ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана начала бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus start screen'
WHERE item_id = 'pop_start_s';

-- Bonus Start (Illustrated)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus Start (Illustrated)',
  task_title_en = 'Bonus Start (Illustrated)',
  task_description_ru = 'Создание иллюстрированного экрана начала бонуса в количестве {qty} шт.',
  task_description_en = 'Create illustrated bonus start screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus Start ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus Start ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана начала бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus start screen'
WHERE item_id = 'pop_start_d';

-- Bonus End (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus End (Simple)',
  task_title_en = 'Bonus End (Simple)',
  task_description_ru = 'Создание простого экрана завершения бонуса в количестве {qty} шт.',
  task_description_en = 'Create simple bonus end screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus End ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus End ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана завершения бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus end screen'
WHERE item_id = 'pop_end_s';

-- Bonus End (Illustrated)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus End (Illustrated)',
  task_title_en = 'Bonus End (Illustrated)',
  task_description_ru = 'Создание иллюстрированного экрана завершения бонуса в количестве {qty} шт.',
  task_description_en = 'Create illustrated bonus end screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus End ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus End ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана завершения бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus end screen'
WHERE item_id = 'pop_end_d';

-- Extra Spins (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Extra Spins (Simple)',
  task_title_en = 'Extra Spins (Simple)',
  task_description_ru = 'Создание простого экрана дополнительных спинов в количестве {qty} шт.',
  task_description_en = 'Create simple extra spins screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Extra Spins ({anim_name})',
  animation_task_title_template_en = 'Animation: Extra Spins ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана дополнительных спинов',
  animation_task_description_template_en = 'Create {anim_name} animation for extra spins screen'
WHERE item_id = 'pop_extra_s';

-- Extra Spins (Illustrated)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Extra Spins (Illustrated)',
  task_title_en = 'Extra Spins (Illustrated)',
  task_description_ru = 'Создание иллюстрированного экрана дополнительных спинов в количестве {qty} шт.',
  task_description_en = 'Create illustrated extra spins screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Extra Spins ({anim_name})',
  animation_task_title_template_en = 'Animation: Extra Spins ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана дополнительных спинов',
  animation_task_description_template_en = 'Create {anim_name} animation for extra spins screen'
WHERE item_id = 'pop_extra_d';

-- Error/Warning (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Error/Warning (Simple)',
  task_title_en = 'Error/Warning (Simple)',
  task_description_ru = 'Создание простого экрана ошибки/предупреждения в количестве {qty} шт.',
  task_description_en = 'Create simple error/warning screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Error/Warning ({anim_name})',
  animation_task_title_template_en = 'Animation: Error/Warning ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана ошибки',
  animation_task_description_template_en = 'Create {anim_name} animation for error screen'
WHERE item_id = 'pop_error_s';

-- Error/Warning (Illustrated)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Error/Warning (Illustrated)',
  task_title_en = 'Error/Warning (Illustrated)',
  task_description_ru = 'Создание иллюстрированного экрана ошибки/предупреждения в количестве {qty} шт.',
  task_description_en = 'Create illustrated error/warning screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Error/Warning ({anim_name})',
  animation_task_title_template_en = 'Animation: Error/Warning ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана ошибки',
  animation_task_description_template_en = 'Create {anim_name} animation for error screen'
WHERE item_id = 'pop_error_d';

-- Bonus Buy Menu (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus Buy Menu (Simple)',
  task_title_en = 'Bonus Buy Menu (Simple)',
  task_description_ru = 'Создание простого меню покупки бонуса в количестве {qty} шт.',
  task_description_en = 'Create simple bonus buy menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus Buy Menu ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus Buy Menu ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню покупки бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus buy menu'
WHERE item_id = 'menu_buy_s';

-- Bonus Buy Menu (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bonus Buy Menu (Detailed)',
  task_title_en = 'Bonus Buy Menu (Detailed)',
  task_description_ru = 'Создание детализированного меню покупки бонуса в количестве {qty} шт.',
  task_description_en = 'Create detailed bonus buy menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bonus Buy Menu ({anim_name})',
  animation_task_title_template_en = 'Animation: Bonus Buy Menu ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню покупки бонуса',
  animation_task_description_template_en = 'Create {anim_name} animation for bonus buy menu'
WHERE item_id = 'menu_buy_d';

-- Bet Selection (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bet Selection (Simple)',
  task_title_en = 'Bet Selection (Simple)',
  task_description_ru = 'Создание простого меню выбора ставки в количестве {qty} шт.',
  task_description_en = 'Create simple bet selection menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bet Selection ({anim_name})',
  animation_task_title_template_en = 'Animation: Bet Selection ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню выбора ставки',
  animation_task_description_template_en = 'Create {anim_name} animation for bet selection menu'
WHERE item_id = 'menu_bet_s';

-- Bet Selection (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Bet Selection (Detailed)',
  task_title_en = 'Bet Selection (Detailed)',
  task_description_ru = 'Создание детализированного меню выбора ставки в количестве {qty} шт.',
  task_description_en = 'Create detailed bet selection menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Bet Selection ({anim_name})',
  animation_task_title_template_en = 'Animation: Bet Selection ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню выбора ставки',
  animation_task_description_template_en = 'Create {anim_name} animation for bet selection menu'
WHERE item_id = 'menu_bet_d';

-- Autoplay Menu (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Autoplay Menu (Simple)',
  task_title_en = 'Autoplay Menu (Simple)',
  task_description_ru = 'Создание простого меню автоигры в количестве {qty} шт.',
  task_description_en = 'Create simple autoplay menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Autoplay Menu ({anim_name})',
  animation_task_title_template_en = 'Animation: Autoplay Menu ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню автоигры',
  animation_task_description_template_en = 'Create {anim_name} animation for autoplay menu'
WHERE item_id = 'menu_auto_s';

-- Autoplay Menu (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Autoplay Menu (Detailed)',
  task_title_en = 'Autoplay Menu (Detailed)',
  task_description_ru = 'Создание детализированного меню автоигры в количестве {qty} шт.',
  task_description_en = 'Create detailed autoplay menu, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Autoplay Menu ({anim_name})',
  animation_task_title_template_en = 'Animation: Autoplay Menu ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для меню автоигры',
  animation_task_description_template_en = 'Create {anim_name} animation for autoplay menu'
WHERE item_id = 'menu_auto_d';

-- UI Buttons Pack (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'UI Buttons Pack (Simple)',
  task_title_en = 'UI Buttons Pack (Simple)',
  task_description_ru = 'Создание простого набора UI кнопок в количестве {qty} шт.',
  task_description_en = 'Create simple UI buttons pack, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: UI Buttons ({anim_name})',
  animation_task_title_template_en = 'Animation: UI Buttons ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для UI кнопок',
  animation_task_description_template_en = 'Create {anim_name} animation for UI buttons'
WHERE item_id = 'ui_pack_s';

-- UI Buttons Pack (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'UI Buttons Pack (Detailed)',
  task_title_en = 'UI Buttons Pack (Detailed)',
  task_description_ru = 'Создание детализированного набора UI кнопок в количестве {qty} шт.',
  task_description_en = 'Create detailed UI buttons pack, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: UI Buttons ({anim_name})',
  animation_task_title_template_en = 'Animation: UI Buttons ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для UI кнопок',
  animation_task_description_template_en = 'Create {anim_name} animation for UI buttons'
WHERE item_id = 'ui_pack_d';

-- Loading Screen (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Loading Screen (Simple)',
  task_title_en = 'Loading Screen (Simple)',
  task_description_ru = 'Создание простого экрана загрузки в количестве {qty} шт.',
  task_description_en = 'Create simple loading screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Loading Screen ({anim_name})',
  animation_task_title_template_en = 'Animation: Loading Screen ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана загрузки',
  animation_task_description_template_en = 'Create {anim_name} animation for loading screen'
WHERE item_id = 'screen_load_s';

-- Loading Screen (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Loading Screen (Detailed)',
  task_title_en = 'Loading Screen (Detailed)',
  task_description_ru = 'Создание детализированного экрана загрузки в количестве {qty} шт.',
  task_description_en = 'Create detailed loading screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Loading Screen ({anim_name})',
  animation_task_title_template_en = 'Animation: Loading Screen ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана загрузки',
  animation_task_description_template_en = 'Create {anim_name} animation for loading screen'
WHERE item_id = 'screen_load_d';

-- Info/Guide Screen (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Info/Guide Screen (Simple)',
  task_title_en = 'Info/Guide Screen (Simple)',
  task_description_ru = 'Создание простого информационного экрана в количестве {qty} шт.',
  task_description_en = 'Create simple info/guide screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Info Screen ({anim_name})',
  animation_task_title_template_en = 'Animation: Info Screen ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для информационного экрана',
  animation_task_description_template_en = 'Create {anim_name} animation for info screen'
WHERE item_id = 'screen_info_s';

-- Info/Guide Screen (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Info/Guide Screen (Detailed)',
  task_title_en = 'Info/Guide Screen (Detailed)',
  task_description_ru = 'Создание детализированного информационного экрана в количестве {qty} шт.',
  task_description_en = 'Create detailed info/guide screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Info Screen ({anim_name})',
  animation_task_title_template_en = 'Animation: Info Screen ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для информационного экрана',
  animation_task_description_template_en = 'Create {anim_name} animation for info screen'
WHERE item_id = 'screen_info_d';

-- Onboarding (Simple)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Onboarding (Simple)',
  task_title_en = 'Onboarding (Simple)',
  task_description_ru = 'Создание простого экрана онбординга в количестве {qty} шт.',
  task_description_en = 'Create simple onboarding screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Onboarding ({anim_name})',
  animation_task_title_template_en = 'Animation: Onboarding ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана онбординга',
  animation_task_description_template_en = 'Create {anim_name} animation for onboarding screen'
WHERE item_id = 'screen_intro_s';

-- Onboarding (Detailed)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Onboarding (Detailed)',
  task_title_en = 'Onboarding (Detailed)',
  task_description_ru = 'Создание детализированного экрана онбординга в количестве {qty} шт.',
  task_description_en = 'Create detailed onboarding screen, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Onboarding ({anim_name})',
  animation_task_title_template_en = 'Animation: Onboarding ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для экрана онбординга',
  animation_task_description_template_en = 'Create {anim_name} animation for onboarding screen'
WHERE item_id = 'screen_intro_d';

-- Slot Cover (A/B Pack)
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Slot Cover (A/B Pack)',
  task_title_en = 'Slot Cover (A/B Pack)',
  task_description_ru = 'Создание обложки слота (A/B варианты) в количестве {qty} шт.',
  task_description_en = 'Create slot cover (A/B pack), quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Slot Cover ({anim_name})',
  animation_task_title_template_en = 'Animation: Slot Cover ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для обложки слота',
  animation_task_description_template_en = 'Create {anim_name} animation for slot cover'
WHERE item_id = 'promo_cover';

-- Promo Banner Pack
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Promo Banner Pack',
  task_title_en = 'Promo Banner Pack',
  task_description_ru = 'Создание промо-баннеров в количестве {qty} шт.',
  task_description_en = 'Create promo banner pack, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Promo Banners ({anim_name})',
  animation_task_title_template_en = 'Animation: Promo Banners ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для промо-баннеров',
  animation_task_description_template_en = 'Create {anim_name} animation for promo banners'
WHERE item_id = 'promo_banner';

-- Feature Poster / Key Art
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Feature Poster / Key Art',
  task_title_en = 'Feature Poster / Key Art',
  task_description_ru = 'Создание Key Art / постера в количестве {qty} шт.',
  task_description_en = 'Create feature poster / key art, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Key Art ({anim_name})',
  animation_task_title_template_en = 'Animation: Key Art ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для Key Art',
  animation_task_description_template_en = 'Create {anim_name} animation for key art'
WHERE item_id = 'promo_poster';

-- Static Promo Teaser
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Static Promo Teaser',
  task_title_en = 'Static Promo Teaser',
  task_description_ru = 'Создание статического промо-тизера в количестве {qty} шт.',
  task_description_en = 'Create static promo teaser, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Teaser ({anim_name})',
  animation_task_title_template_en = 'Animation: Teaser ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для тизера',
  animation_task_description_template_en = 'Create {anim_name} animation for teaser'
WHERE item_id = 'promo_teaser';

-- Store Icons Set
UPDATE public.task_spec_item_templates
SET 
  task_title_ru = 'Store Icons Set',
  task_title_en = 'Store Icons Set',
  task_description_ru = 'Создание набора иконок для магазинов в количестве {qty} шт.',
  task_description_en = 'Create store icons set, quantity: {qty} pcs.',
  animation_task_title_template_ru = 'Animation: Icons ({anim_name})',
  animation_task_title_template_en = 'Animation: Icons ({anim_name})',
  animation_task_description_template_ru = 'Создание анимации {anim_name} для иконок',
  animation_task_description_template_en = 'Create {anim_name} animation for icons'
WHERE item_id = 'promo_icons';

-- 3. Обновляем существующие задачи, у которых title_ru/title_en пустые
-- Копируем title в оба языковых поля если они пустые
UPDATE public.tasks
SET 
  title_ru = COALESCE(title_ru, title),
  title_en = COALESCE(title_en, title),
  description_ru = COALESCE(description_ru, description),
  description_en = COALESCE(description_en, description)
WHERE title_ru IS NULL OR title_en IS NULL;
