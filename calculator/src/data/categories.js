export const CATEGORIES = [
  {
    name: "Символы (Symbols)",
    items: [
      { 
        id: 'sym_low', 
        name: 'Low Symbols', 
        base: 150, 
        complexity: 0.8,
        details: {
          desc: "Базовые игровые символы, формирующие основной пул выигрышей. Минимум деталей, чистая форма, читаемость на любых экранах. Используются чаще всего и задают визуальный ритм игры.",
          descEn: "Basic game symbols forming the main win pool. Minimal details, clean shape, readable on any screen. Used most often and set the visual rhythm of the game.",
          examples: "Кристаллы, фрукты, карточные масти, планеты, монеты, шары, руны, камни.",
          examplesEn: "Crystals, fruits, card suits, planets, coins, balls, runes, stones.",
          tech: [
            "2 состояния: Idle (статичное) и Match (акцентное)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): свечение, вспышки, фреймы, частицы",
            "До 2 раундов минорных правок (цвет, свет, контуры)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'sym_mid', 
        name: 'High Symbols', 
        base: 250, 
        complexity: 1.0,
        details: {
          desc: "Детализированные и высокоценные символы, отвечающие за большие выигрыши и визуальный «вау-эффект». Это основные носители тематики слота — от персонажей до ключевых предметов.",
          descEn: "Detailed and high-value symbols responsible for big wins and visual wow-effect. Main thematic carriers of the slot — from characters to key items.",
          examples: "Герои, артефакты, маски, тотемы, драгоценности, сундуки, магические предметы, иконки богов.",
          examplesEn: "Heroes, artifacts, masks, totems, jewels, chests, magic items, god icons.",
          tech: [
            "2 состояния: Idle и Match (свет, контраст, динамика)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): свечение, вспышки, фреймы, частицы",
            "2 круга минорных правок",
            "Высокий уровень прорисовки (объём, текстура, материал)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'sym_spec', 
        name: 'Special Symbols (Wild/Bonus)', 
        base: 400, 
        complexity: 1.1,
        details: {
          desc: "Ключевые игровые символы, запускающие бонусные режимы, фриспины и мультипликаторы. Самые узнаваемые элементы слота, формирующие его айдентику и визуальную логику.",
          descEn: "Key game symbols triggering bonus modes, free spins, and multipliers. The most recognizable elements of the slot, forming its identity and visual logic.",
          examples: "Портрет персонажа, сундук, храм, книга, монета, амулет, логотип игры, ключевой артефакт.",
          examplesEn: "Character portrait, chest, temple, book, coin, amulet, game logo, key artifact.",
          tech: [
            "2 состояния: Idle и Match / Trigger",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): свечение, вспышки, фреймы, частицы",
            "Mini-Icons / Feature Symbols — мелкие вспомогательные символы для бонусных механик (например, множители ×2, ×3, жетоны, сундуки)",
            "2 круга минорных правок",
            "Повышенная детализация и композиционный фокус",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
    ]
  },
  {
    name: "Фоны (Backgrounds)",
    items: [
      { 
        id: 'bg_base_s', 
        name: 'Base BG (Simple)', 
        base: 700, 
        complexity: 1.1,
        details: {
          desc: "Базовый фон для основной игры. Используется в слотах, где требуется лёгкий, ненагруженный деталями визуал, не отвлекающий от символов. Включает цветовую среду, текстурную подложку и минимальные элементы окружения, создающие атмосферу без глубокой сценической проработки.",
          descEn: "Base background for the main game. Used in slots where light visuals are required, not overloaded with details. Includes color environment, texture base and minimal environment elements.",
          examples: "Абстрактный градиент с узором, стенка храма, неоновый фон, облачное небо, текстурированная каменная поверхность, мягкий световой градиент.",
          examplesEn: "Abstract gradient with pattern, temple wall, neon background, cloudy sky, textured stone surface, soft light gradient.",
          tech: [
            "Композиция: фон + лёгкий декор или текстурные элементы",
            "Простая рамка сетки слота (Grid Frame) без архитектурных деталей",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): мягкие блики, дым, пыль, частицы",
            "2 круга минорных правок (цвет, свет, фон)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'bg_base_d', 
        name: 'Base BG (Detailed)', 
        base: 1200, 
        complexity: 1.3,
        details: {
          desc: "Полноценная сценическая иллюстрация, формирующая атмосферу и визуальный мир слота. На этом фоне строится вся композиция барабанов, UI и декоративных элементов. Включает архитектуру, окружение, источники света и материалы, создающие глубину, перспективу и «живое» пространство.",
          descEn: "Full scenic illustration forming the atmosphere and visual world of the slot. The entire composition of reels, UI and decorative elements is built on this background.",
          examples: "Древний храм с колоннами, вулканическая пещера с лавой, волшебный лес с подсветкой растений, пиратская бухта с кораблём, казино-зал с отражениями света, киберпанк-город.",
          examplesEn: "Ancient temple with columns, volcanic cave with lava, magic forest with plant lighting, pirate bay with ship, casino hall with light reflections, cyberpunk city.",
          tech: [
            "Основная композиция: фон, архитектурные и природные элементы, свет, материалы",
            "Рамка сетки слота (Grid Frame): визуально встроена в композицию, с декором и светом",
            "Foreground-слой (передний план) при необходимости для глубины сцены",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): свечения, частицы, дым, искры, атмосферные эффекты",
            "2 раунда минорных правок (цвет, свет, детали)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'bg_bonus_s', 
        name: 'Bonus BG (Simple)', 
        base: 500, 
        complexity: 1.2,
        details: {
          desc: "Упрощённая версия бонусного фона, использующая базовую композицию, но с изменённым цветом, светом и лёгкими FX-эффектами. Подходит для игр, где бонусная сцена должна визуально отличаться, но без сложной иллюстрации или глубокого окружения.",
          descEn: "Simplified version of bonus background using base composition but with changed color, light and light FX effects. Suitable for games where bonus scene should visually differ.",
          examples: "Тот же фон что и Base Background (Simple) с затемнением и свечением, сменой цвета освещения, частицами энергии, бликами или туманом.",
          examplesEn: "Same background as Base Background (Simple) with darkening and glow, lighting color change, energy particles, glare or fog.",
          tech: [
            "Основывается на Base Background (Simple)",
            "Изменение палитры, освещения, FX-акцентов",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): свечение, частицы, дым, поток света",
            "2 круга минорных правок (цвет, FX)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'bg_bonus_d', 
        name: 'Bonus BG (Detailed)', 
        base: 800, 
        complexity: 1.4,
        details: {
          desc: "Отдельная сценическая иллюстрация для бонусного режима или фриспинов. Создаёт эффект перехода в другое состояние мира — с новой атмосферой, освещением и динамикой. Имеет собственную цветовую схему, источники света и FX-акценты.",
          descEn: "Separate scenic illustration for bonus mode or free spins. Creates the effect of transition to another state of the world — with new atmosphere, lighting and dynamics.",
          examples: "Ночная версия храма с магическим порталом, пылающая кузница богов, сияющий космический разлом, подводная арена с биолюминесценцией, город в молниях, неоновая буря, пещера с кристаллами и лавой.",
          examplesEn: "Night version of temple with magic portal, blazing forge of gods, glowing cosmic rift, underwater arena with bioluminescence, city in lightning, neon storm, cave with crystals and lava.",
          tech: [
            "Композиция: фон, окружение, освещение, архитектурные или природные элементы",
            "Основывается на концепции Base Background (Detailed), но имеет новую световую и FX-сцену",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): потоки света, дым, частицы, вспышки, атмосферные переходы",
            "2 круга минорных правок (цвет, свет, баланс FX)",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
    ]
  },
  {
    name: "Поп-апы (Pop-ups)",
    items: [
      { 
        id: 'pop_win_s', 
        name: 'Big Win (Simple)', 
        base: 500, 
        complexity: 1.0,
        details: {
          desc: "Базовые pop-up-экраны для отображения выигрыша. Состоят из стилизованной надписи («BIG WIN», «MEGA WIN», «MAX WIN») и визуальных эффектов, создающих ощущение энергии и всплеска эмоций. Фокус — на ярком типографическом решении, динамике и свете, без сложных сюжетных иллюстраций.",
          descEn: "Basic pop-up screens for displaying wins. Consist of stylized text (BIG WIN, MEGA WIN, MAX WIN) and visual effects creating energy and emotional burst.",
          examples: "Надпись «BIG WIN!» на фоне сияния, летящие монеты, вспышки, кольца света, частицы, неоновые лучи, огненные волны.",
          examplesEn: "BIG WIN! text on glow background, flying coins, flashes, light rings, particles, neon rays, fire waves.",
          tech: [
            "Композиция: надпись + фон + FX-элементы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, частицы, блики, дым, искры",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_win_d', 
        name: 'Big Win (Illustrated)', 
        base: 400, 
        complexity: 1.2,
        details: {
          desc: "Расширенные поп-апы с полноценной иллюстрацией — персонажем, сценой или сюжетным фрагментом. Создаются как мини-постеры: включают композицию, детали окружения, декоративные элементы, спецэффекты и подчёркнутый художественный стиль. Используются для премиум-слотов.",
          descEn: "Extended pop-ups with full illustration — character, scene or story fragment. Created as mini-posters: include composition, environment details, decorative elements, special effects.",
          examples: "Герой слота держит гору монет; персонаж с кубком; магический взрыв; сундук, из которого вырывается свет; неоновая сцена с логотипом игры и цифрами выигрыша.",
          examplesEn: "Slot hero holds mountain of coins; character with cup; magic explosion; chest with light bursting out; neon scene with game logo and win numbers.",
          tech: [
            "Композиция: фон, персонаж/объект, надпись, эффекты",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои: свет, частицы, огонь, дым, сияние, неон, вспышки",
            "Повышенная художественная детализация и проработка света",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_start_s', 
        name: 'Bonus Start (Simple)', 
        base: 300, 
        complexity: 1.0,
        details: {
          desc: "Базовый pop-up, который появляется после выпадения Scatter-символов или покупки бонусной игры. Создаёт переход между основной и бонусной фазой, подчёркивая активацию фичи. Фокус — на выразительной типографике и визуальных эффектах без сложной иллюстрации.",
          descEn: "Basic pop-up that appears after Scatter symbols drop or bonus game purchase. Creates transition between main and bonus phase, emphasizing feature activation.",
          examples: "Надпись «BONUS START!», «FEATURE ACTIVATED!» или «FREE SPINS!», окружённая частицами, сиянием, кольцами света, огнём или неоновыми линиями.",
          examplesEn: "BONUS START!, FEATURE ACTIVATED! or FREE SPINS! text surrounded by particles, glow, light rings, fire or neon lines.",
          tech: [
            "Композиция: надпись + фон + FX-элементы (свечение, искры, вспышки)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): пыль, частицы, кольца, вспышки",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_start_d', 
        name: 'Bonus Start (Illustrated)', 
        base: 500, 
        complexity: 1.2,
        details: {
          desc: "Расширенная версия экрана начала бонуса — с уникальной иллюстрацией, персонажем или элементом окружения, связанным с темой слота. Создаёт эффект «сюжетного перехода» и подчёркивает значимость события. Подходит для премиальных игр и ярких фичевых переходов.",
          descEn: "Extended version of bonus start screen — with unique illustration, character or environment element related to slot theme. Creates story transition effect.",
          examples: "Персонаж активирует магический портал, сундук открывается с потоком света, артефакт вспыхивает энергией, герои празднуют начало бонуса.",
          examplesEn: "Character activates magic portal, chest opens with light stream, artifact flashes with energy, heroes celebrate bonus start.",
          tech: [
            "Композиция: фон, персонаж или предмет, надпись, FX-элементы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (при необходимости): магические вспышки, дым, частицы, поток света, огонь, неон",
            "Повышенная художественная детализация (персонаж, свет, текстуры)",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_end_s', 
        name: 'Bonus End (Simple)', 
        base: 300, 
        complexity: 1.0,
        details: {
          desc: "Базовый экран завершения бонусной игры. Появляется после окончания фриспинов или бонусного раунда и служит переходом обратно в основную игру. Главная цель — зафиксировать внимание игрока на результате и сохранить эмоциональный отклик от фичи.",
          descEn: "Basic bonus game end screen. Appears after free spins or bonus round ends and serves as transition back to main game.",
          examples: "Надпись «BONUS COMPLETE!», «FEATURE FINISHED!», «END OF BONUS ROUND!» или «TOTAL WIN», окружённая эффектами света, монетами, сиянием или энергией.",
          examplesEn: "BONUS COMPLETE!, FEATURE FINISHED!, END OF BONUS ROUND! or TOTAL WIN text surrounded by light effects, coins, glow or energy.",
          tech: [
            "Композиция: надпись + фон + базовые FX-элементы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): вспышки, искры, частицы, световые кольца",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_end_d', 
        name: 'Bonus End (Illustrated)', 
        base: 500, 
        complexity: 1.2,
        details: {
          desc: "Расширенный pop-up завершения бонуса с индивидуальной иллюстрацией, отражающей сюжет или персонажей игры. Создаёт эффект финала — визуально подводит итог бонусного раунда и усиливает эмоциональное ощущение «закрытия» фазы. Часто используется как mini-cutscene.",
          descEn: "Extended bonus end pop-up with individual illustration reflecting game story or characters. Creates finale effect — visually summarizes bonus round.",
          examples: "Персонаж празднует победу, сундук закрывается после сбора награды, свет портала гаснет, магическая энергия рассеивается, сцена затухает с последним сиянием.",
          examplesEn: "Character celebrates victory, chest closes after collecting reward, portal light fades, magic energy dissipates, scene fades with final glow.",
          tech: [
            "Композиция: фон, персонаж или объект, надпись, FX-элементы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои: свет, дым, частицы, неон, рассеивание, искры",
            "Повышенная художественная детализация (свет, текстуры, композиция)",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_extra_s', 
        name: 'Extra Spins (Simple)', 
        base: 250, 
        complexity: 1.0,
        details: {
          desc: "Базовый pop-up, который появляется во время бонусной игры при выпадении дополнительных фриспинов. Отображает количество добавленных спинов и усиливает чувство прогресса игрока, не отвлекая от геймплея. Фокус — на читаемости и ярких визуальных эффектах без сложной иллюстрации.",
          descEn: "Basic pop-up that appears during bonus game when extra free spins drop. Displays number of added spins and enhances player progress feeling.",
          examples: "Надпись «+5 FREE SPINS!» или «EXTRA SPINS AWARDED!», сопровождаемая вспышками, вращающимися частицами, сиянием и динамической типографикой.",
          examplesEn: "+5 FREE SPINS! or EXTRA SPINS AWARDED! text accompanied by flashes, spinning particles, glow and dynamic typography.",
          tech: [
            "Композиция: текст + декоративные FX-элементы (монеты, искры, лучи, кольца)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, пульсация, частицы, дым",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma/Procreate (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_extra_d', 
        name: 'Extra Spins (Illustrated)', 
        base: 500, 
        complexity: 1.2,
        details: {
          desc: "Расширенный pop-up, отображающий получение дополнительных фриспинов через художественную сцену или иллюстрацию. Может включать персонажа, артефакт или уникальный объект, визуально символизирующий награду. Создаёт выразительный эмоциональный пик внутри бонусной игры.",
          descEn: "Extended pop-up displaying extra free spins through artistic scene or illustration. May include character, artifact or unique object visually symbolizing reward.",
          examples: "Персонаж подбрасывает магические монеты; сундук открывается и выпускает свет; артефакт вспыхивает энергией, показывая «+10 FREE SPINS!»; вокруг летят частицы и лучи.",
          examplesEn: "Character tosses magic coins; chest opens and releases light; artifact flashes with energy showing +10 FREE SPINS!; particles and rays fly around.",
          tech: [
            "Композиция: фон, персонаж / объект, надпись, FX-элементы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, частицы, дым, потоки света, вспышки",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_error_s', 
        name: 'Error/Warning (Simple)', 
        base: 250, 
        complexity: 0.8,
        details: {
          desc: "Базовое окно ошибки или предупреждения, которое появляется при сбоях соединения, нехватке баланса, недоступности функции или других технических событиях. Фокус — на читаемости сообщения и UX: быстро донести причину ошибки и действие пользователя («OK», «RETRY», «CANCEL»).",
          descEn: "Basic error or warning window appearing during connection failures, insufficient balance, unavailable features or other technical events.",
          examples: "Сообщения «NO INTERNET CONNECTION», «INSUFFICIENT BALANCE», «TRY AGAIN», «FEATURE UNAVAILABLE», простое модальное окно с минимальным фоном и кнопкой подтверждения.",
          examplesEn: "Messages NO INTERNET CONNECTION, INSUFFICIENT BALANCE, TRY AGAIN, FEATURE UNAVAILABLE, simple modal window with minimal background and confirmation button.",
          tech: [
            "Элементы: контейнер с текстом, иконка статуса (⚠, ⛔, ℹ), кнопка подтверждения",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, лёгкая вибрация, импульс при ошибке",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'pop_error_d', 
        name: 'Error/Warning (Illustrated)', 
        base: 500, 
        complexity: 1.0,
        details: {
          desc: "Расширенная версия окна ошибки с индивидуальной иллюстрацией или тематическим визуалом. Используется в играх с выраженным стилем, где даже технические сообщения оформлены в общей атмосфере слота. Может включать персонажа, объект или декоративную сцену.",
          descEn: "Extended version of error window with individual illustration or thematic visual. Used in games with pronounced style where even technical messages are styled in slot atmosphere.",
          examples: "Сломанный артефакт или сундук, персонаж, удивлённо реагирующий на ошибку, мигающие неоновые элементы, «глючный» экран с FX-эффектом, магический портал, закрывающийся при сбое.",
          examplesEn: "Broken artifact or chest, character surprised by error, blinking neon elements, glitchy screen with FX effect, magic portal closing on failure.",
          tech: [
            "Элементы: фон, текст, иконка, иллюстрация персонажа / предмета, кнопка",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, частицы, статический шум, вспышки",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
    ]
  },
  {
    name: "UI Меню и Экраны",
    items: [
      { 
        id: 'menu_buy_s', 
        name: 'Bonus Buy Menu (Simple)', 
        base: 500, 
        complexity: 1.0,
        details: {
          desc: "Базовое окно покупки бонусной игры. Включает кнопку активации, меню выбора бонуса (если есть несколько вариантов) и окно подтверждения. Фокус — на чистом UI-дизайне без иллюстраций, с акцентом на функциональность и читаемость.",
          descEn: "Basic bonus buy window. Includes activation button, bonus selection menu (if multiple options) and confirmation window. Focus on clean UI design without illustrations.",
          examples: "Плашка «BUY BONUS» на основном экране, простое всплывающее меню с вариантами «x50», «x100», «x200», окно подтверждения с кнопками «BUY» и «CANCEL».",
          examplesEn: "BUY BONUS badge on main screen, simple popup menu with options x50, x100, x200, confirmation window with BUY and CANCEL buttons.",
          tech: [
            "Элементы: кнопка / плашка покупки, окно выбора бонуса, окно подтверждения",
            "Дизайн ориентирован на UI/UX — без персонажей и сцен",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение кнопки, подсветка активного выбора",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'menu_buy_d', 
        name: 'Bonus Buy Menu (Detailed)', 
        base: 1000, 
        complexity: 1.2,
        details: {
          desc: "Расширенная иллюстрированная версия магазина бонусных игр. Каждый элемент — от кнопки покупки до подтверждения — оформлен с уникальными визуальными деталями и атмосферой слота. Используются иллюстрированные карточки, фоновые сцены и FX-эффекты, создающие ощущение «магазина артефактов».",
          descEn: "Extended illustrated version of bonus games store. Each element — from buy button to confirmation — is designed with unique visual details and slot atmosphere.",
          examples: "Иллюстрированные карточки бонусов с персонажами, кнопка с артефактом, окно подтверждения покупки с магическим порталом или сундуком, анимация золотого свечения.",
          examplesEn: "Illustrated bonus cards with characters, artifact button, purchase confirmation window with magic portal or chest, golden glow animation.",
          tech: [
            "Элементы: кнопка покупки, меню выбора бонуса, окно подтверждения",
            "Каждая часть имеет собственную мини-иллюстрацию и атмосферный фон",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свет, частицы, дым, энергия, искры",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'menu_bet_s', 
        name: 'Bet Selection (Simple)', 
        base: 300, 
        complexity: 1.0,
        details: {
          desc: "Базовое окно выбора ставки (BET SIZE). Используется для настройки размера ставки перед спином или бонусной покупкой. Включает элементы: кнопки изменения ставки, отображение текущего значения и подтверждение выбора. Фокус — на чистом UI-дизайне, читаемости и соответствии теме игры за счёт цветовой гаммы.",
          descEn: "Basic bet selection window (BET SIZE). Used for adjusting bet size before spin or bonus purchase. Includes elements: bet change buttons, current value display and selection confirmation.",
          examples: "Панель выбора «BET 1.00 / 2.00 / 5.00 / 10.00», кнопки «–» и «+», ползунок или круглый слайдер, кнопка «CONFIRM», текстовые поля со значением.",
          examplesEn: "Selection panel BET 1.00 / 2.00 / 5.00 / 10.00, – and + buttons, slider or round slider, CONFIRM button, text fields with value.",
          tech: [
            "Элементы: окно с заголовком, блок выбора ставки (кнопки / слайдер), кнопка подтверждения",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): подсветка активного значения, hover-эффекты, вспышки при подтверждении",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'menu_bet_d', 
        name: 'Bet Selection (Detailed)', 
        base: 600, 
        complexity: 1.2,
        details: {
          desc: "Расширенная версия окна выбора ставки с индивидуальной иллюстрацией или тематическим окружением. Каждый элемент интерфейса оформлен в художественном стиле игры: декоративные рамки, материалы (камень, металл, дерево, неон), тематические кнопки. Иногда добавляется персонаж или объект.",
          descEn: "Extended version of bet selection window with individual illustration or thematic environment. Each interface element is designed in game's artistic style.",
          examples: "Ставки, выгравированные на монетах или рунах; шестерни, вращающие множитель; персонаж, удерживающий рычаг ставки; неоновая панель с эффектом свечения.",
          examplesEn: "Bets engraved on coins or runes; gears rotating multiplier; character holding bet lever; neon panel with glow effect.",
          tech: [
            "Элементы: окно, фон с иллюстрацией, декоративные рамки, кнопки, индикаторы",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, частицы, подсветка активных зон",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'menu_auto_s', 
        name: 'Autoplay Menu (Simple)', 
        base: 300, 
        complexity: 0.9,
        details: {
          desc: "Базовое окно настройки автоигры. Позволяет игроку задать количество автоматических спинов, лимиты выигрыша и проигрыша, а также подтвердить выбор. Фокус — на функциональности и чистом UI-дизайне, без дополнительных иллюстраций.",
          descEn: "Basic autoplay settings window. Allows player to set number of automatic spins, win and loss limits, and confirm selection. Focus on functionality and clean UI design.",
          examples: "Панель с выбором количества спинов (10 / 25 / 50 / 100), чекбоксы «Stop on Win», «Stop on Loss Limit», кнопки «START» и «CANCEL», минимальный фон или прозрачный оверлей.",
          examplesEn: "Panel with spin count selection (10 / 25 / 50 / 100), checkboxes Stop on Win, Stop on Loss Limit, START and CANCEL buttons, minimal background or transparent overlay.",
          tech: [
            "Элементы: окно, поля выбора, чекбоксы, кнопки подтверждения / отмены",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): подсветка активных опций, hover-эффекты, световые переходы",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'menu_auto_d', 
        name: 'Autoplay Menu (Detailed)', 
        base: 600, 
        complexity: 1.1,
        details: {
          desc: "Расширенная версия меню автоигры с иллюстрированным окружением, декоративными рамками и тематическими элементами, соответствующими стилю игры. Окно может содержать фон-сцену, визуальные акценты и FX-анимацию, создавая ощущение полноценного «контрольного пульта» или магического интерфейса.",
          descEn: "Extended version of autoplay menu with illustrated environment, decorative frames and thematic elements matching game style.",
          examples: "Руны, вращающиеся при выборе количества спинов; механический интерфейс с шестернями; неоновая панель с мерцающими индикаторами; персонаж, запускающий автоигру.",
          examplesEn: "Runes spinning when selecting spin count; mechanical interface with gears; neon panel with flickering indicators; character launching autoplay.",
          tech: [
            "Элементы: окно, фон, декоративные рамки, индикаторы, кнопки",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, частицы, подсветка активных зон",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'ui_pack_s', 
        name: 'UI Buttons Pack (Simple)', 
        base: 400, 
        complexity: 0.9,
        details: {
          desc: "Базовый набор функциональных кнопок интерфейса слота. Включает все основные элементы управления: спин, автоигра, выбор ставки, меню, гайд (таблица выплат), турборежим и выключение звука. Фокус — на читаемости, UX-логике и консистентности с остальными элементами UI.",
          descEn: "Basic set of functional slot interface buttons. Includes all main controls: spin, autoplay, bet selection, menu, guide (paytable), turbo mode and sound off.",
          examples: "Плоские или слегка градиентные кнопки с иконками; кнопка «SPIN» с подсветкой при нажатии; лаконичные символы звука, шестерёнки, турбо, «i» для гайда и «A» для автоигры.",
          examplesEn: "Flat or slightly gradient buttons with icons; SPIN button with highlight on press; concise sound, gear, turbo, i for guide and A for autoplay symbols.",
          tech: [
            "Состав: SPIN, AUTO SPIN, AUTOPLAY, BET / STAKE, MENU, GUIDE / INFO (таблица выплат), SOUND ON/OFF, TURBO",
            "Каждая кнопка — в 3 состояниях: Normal / Hover / Pressed",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, обводка, пульсация",
            "Иконки: стандартные или стилизованные под общий UI",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'ui_pack_d', 
        name: 'UI Buttons Pack (Detailed)', 
        base: 700, 
        complexity: 1.1,
        details: {
          desc: "Расширенный набор кнопок, полностью стилизованных под тематику игры. Каждая кнопка прорисовывается индивидуально, с учётом материалов, освещения и декоративных эффектов (металл, камень, неон, дерево, магия и т.д.). Иконки — уникальные, создаются вручную под сеттинг конкретного слота.",
          descEn: "Extended button set, fully styled to game theme. Each button is drawn individually, considering materials, lighting and decorative effects.",
          examples: "Кнопка «SPIN» в виде магического кристалла или артефакта; «AUTO SPIN» — механическая шестерня; «TURBO» — с неоновым следом; «SOUND» — с визуальной волной; «INFO» — древний свиток или голограмма.",
          examplesEn: "SPIN button as magic crystal or artifact; AUTO SPIN — mechanical gear; TURBO — with neon trail; SOUND — with visual wave; INFO — ancient scroll or hologram.",
          tech: [
            "Состав: SPIN, AUTO SPIN, AUTOPLAY, BET / STAKE, MENU, GUIDE / INFO, SOUND ON/OFF, TURBO",
            "Каждая кнопка — в 3 состояниях: Normal / Hover / Pressed",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, вспышки, частицы, пульс",
            "Уникальные иконки под сеттинг игры",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_load_s', 
        name: 'Loading Screen (Simple)', 
        base: 300, 
        complexity: 1.0,
        details: {
          desc: "Базовый экран загрузки, отображающий логотип игры, прогресс-бар и визуальные элементы, соответствующие общему стилю проекта. Используется при запуске игры, входе в бонусный режим или перезагрузке сессии. Фокус — на чистом UI-дизайне и стилистической консистентности.",
          descEn: "Basic loading screen displaying game logo, progress bar and visual elements matching overall project style. Used on game launch, bonus mode entry or session reload.",
          examples: "Логотип игры на фоне текстуры или градиента, световые кольца, минимальный анимационный индикатор загрузки, подпись «Loading…» или «Please Wait».",
          examplesEn: "Game logo on texture or gradient background, light rings, minimal loading animation indicator, Loading... or Please Wait caption.",
          tech: [
            "Элементы: логотип, фон, индикатор загрузки (прогресс-бар, кольцо, полоса)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, лёгкие частицы, пульсация",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_load_d', 
        name: 'Loading Screen (Detailed)', 
        base: 600, 
        complexity: 1.2,
        details: {
          desc: "Расширенный загрузочный экран с уникальной иллюстрацией, фоном и визуальными эффектами, создающими атмосферу и стиль игры. Может включать персонажа, артефакт, сцену или тематическую композицию, а также динамические FX-элементы, связанные с прогрессом загрузки.",
          descEn: "Extended loading screen with unique illustration, background and visual effects creating atmosphere and game style.",
          examples: "Герой стоит перед порталом; вращающиеся монеты, кристаллы или руны; логотип игры на фоне магической сцены; анимация вспышек и сияния, сопровождающая процесс загрузки.",
          examplesEn: "Hero stands before portal; spinning coins, crystals or runes; game logo on magic scene background; flash and glow animation accompanying loading process.",
          tech: [
            "Элементы: фон, иллюстрация / персонаж, логотип, индикатор загрузки",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): частицы, дым, свечение, движение света, искры",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_info_s', 
        name: 'Info/Guide Screen (Simple)', 
        base: 500, 
        complexity: 1.0,
        details: {
          desc: "Базовое справочное окно, включающее правила игры, описание функций, таблицу выплат и информацию о специальных символах. Создаётся на основе материалов, предоставленных клиентом: текст, готовые иконки, скриншоты или таблицы. Фокус — на читаемости и аккуратной верстке в рамках общего UI.",
          descEn: "Basic help window including game rules, feature descriptions, paytable and special symbols info. Created based on materials provided by client.",
          examples: "Страница с разделами «Game Rules», «Paylines», «Bonus Features», «Payouts», текстовое описание Scatter / Wild, простые графические элементы и таблицы.",
          examplesEn: "Page with sections Game Rules, Paylines, Bonus Features, Payouts, text description of Scatter / Wild, simple graphic elements and tables.",
          tech: [
            "Структура: вкладки или скроллируемый экран (по макету клиента)",
            "Состав контента: текст, иконки символов, таблица выплат, изображения",
            "Основание: материалы клиента (контент предоставляется заказчиком)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): подсветка активной вкладки, плавные переходы",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходник PSD/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_info_d', 
        name: 'Info/Guide Screen (Detailed)', 
        base: 1000, 
        complexity: 1.2,
        details: {
          desc: "Расширенная версия справочного раздела, включающая не только правила и таблицы, но и уникальные иллюстрации, композиции и текст, написанный нашей командой. В этом варианте гайд превращается в полноценный брендированный документ внутри игры: визуально насыщенный, понятный и атмосферный.",
          descEn: "Extended version of help section including not only rules and tables, but also unique illustrations, compositions and text written by our team.",
          examples: "Иллюстрации символов с подсветкой и эффектами, отдельные сцены для бонусных функций, визуальные стрелки и схемы выплат, персонажи, объясняющие механику.",
          examplesEn: "Symbol illustrations with highlighting and effects, separate scenes for bonus features, visual arrows and payout schemes, characters explaining mechanics.",
          tech: [
            "Структура: вкладки / страницы с навигацией (обычно 3–5 экранов) или скроллируемый экран",
            "Контент: текст (может быть написан студией), визуальные схемы, иконки, иллюстрации, подсветки, FX",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): подсветка, свечение, анимация переходов",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_intro_s', 
        name: 'Onboarding (Simple)', 
        base: 400, 
        complexity: 1.0,
        details: {
          desc: "Базовый онбординг, который показывается один раз при первом запуске игры или после загрузочного экрана. Представляет 1–3 слайда с краткими пояснениями основных функций, бонусов или интерфейса. Фокус — на простом UI-дизайне, чёткой типографике и визуальной консистентности.",
          descEn: "Basic onboarding shown once on first game launch or after loading screen. Presents 1-3 slides with brief explanations of main features, bonuses or interface.",
          examples: "Слайды с подписями «COLLECT 3 SCATTERS TO START BONUS GAME», «WILD SYMBOL DOUBLES YOUR WIN», «HOLD SPACE FOR TURBO SPIN», текстовые блоки с иконками и фоном в стиле игры.",
          examplesEn: "Slides with captions COLLECT 3 SCATTERS TO START BONUS GAME, WILD SYMBOL DOUBLES YOUR WIN, HOLD SPACE FOR TURBO SPIN, text blocks with icons and game-style background.",
          tech: [
            "Состав: 2–3 слайда (экранов)",
            "Элементы: фон, текст, иконки, стрелки, кнопка «Next» / «Continue»",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, подсветка активного слайда",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/Figma/Procreate (по ТЗ)"
          ]
        }
      },
      { 
        id: 'screen_intro_d', 
        name: 'Onboarding (Detailed)', 
        base: 900, 
        complexity: 1.2,
        details: {
          desc: "Расширенная версия онбординга, превращающая первые слайды в полноценное атмосферное интро. Каждый экран имеет собственную композицию с персонажами, объектами или спецэффектами, визуально вводящими игрока в мир слота. Используется в премиальных проектах.",
          descEn: "Extended onboarding version turning first slides into full atmospheric intro. Each screen has its own composition with characters, objects or special effects visually introducing player to slot world.",
          examples: "Персонаж приветствует игрока; сцена с бонусными символами и надписью «COLLECT SCATTERS TO WIN!»; визуализация портала или тотема; мягкая анимация переходов между слайдами.",
          examplesEn: "Character greets player; scene with bonus symbols and COLLECT SCATTERS TO WIN! text; portal or totem visualization; smooth slide transition animation.",
          tech: [
            "Состав: 2–3 слайда с уникальными иллюстрациями и текстом",
            "Элементы: фон, персонажи / объекты, тексты, FX-анимация переходов",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, частицы, дым, свет, блики",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
    ]
  },
  {
    name: "Маркетинг (Promo)",
    items: [
      { 
        id: 'promo_cover', 
        name: 'Slot Cover (A/B Pack)', 
        base: 1500, 
        complexity: 1.3,
        details: {
          desc: "Ключевое промо-изображение для витрин казино, агрегаторов и storefront-платформ. Используется как основная «обложка» игры, формирует первое впечатление и напрямую влияет на кликабельность (CTR). Создаётся в 5 вариантах с разными композициями и цветовыми решениями для A/B-тестирования.",
          descEn: "Key promo image for casino showcases, aggregators and storefront platforms. Used as main game cover, forms first impression and directly affects clickability (CTR). Created in 5 variants.",
          examples: "Вариант с фокусом на персонаже. Вариант с логотипом и фоном без героя. Вариант с символами и анимированным FX. Вариант с упрощённой цветовой схемой (для мобильных лобби).",
          examplesEn: "Variant with character focus. Variant with logo and background without hero. Variant with symbols and animated FX. Variant with simplified color scheme (for mobile lobbies).",
          tech: [
            "Состав: 5 вариантов обложек, цветовые и композиционные варианты под A/B тест",
            "Форматы: 1920×1080, 1080×1080, 1080×1920 (адаптивы по ТЗ)",
            "Элементы: логотип, персонаж / символы, фон, FX",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, частицы, световые акценты",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'promo_banner', 
        name: 'Promo Banner Pack', 
        base: 1200, 
        complexity: 1.3,
        details: {
          desc: "Комплект промо-баннеров для продвижения слота в казино, агрегаторах, соцсетях и партнёрских рассылках. Каждый баннер — самостоятельный рекламный визуал, адаптированный под конкретную пропорцию экрана и тип площадки. Создаётся 5 вариантов с разной композицией для A/B-тестирования CTR.",
          descEn: "Promo banner kit for slot promotion in casinos, aggregators, social media and partner mailings. Each banner is independent advertising visual adapted for specific screen ratio and platform type.",
          examples: "Баннер с персонажем и CTA «Play Now». Баннер с логотипом и бонусной фразой «Free Spins Feature». Версия с крупным символом (мобильный формат). Версия с промо-надписью «New Game / Hot Release».",
          examplesEn: "Banner with character and Play Now CTA. Banner with logo and Free Spins Feature bonus phrase. Version with large symbol (mobile format). Version with New Game / Hot Release promo text.",
          tech: [
            "Состав: 5 визуальных вариантов",
            "Пропорции по ТЗ клиента: 1920×1080 (desktop), 1080×1080 (square), 1080×1920 (vertical / stories), 1200×628 (web banner)",
            "Элементы: логотип, персонаж / символы, фон, CTA-текст, FX",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, искры, дым, световые следы",
            "Цветовые / композиционные варианты под тест CTR",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'promo_poster', 
        name: 'Feature Poster / Key Art', 
        base: 1000, 
        complexity: 1.4,
        details: {
          desc: "Главный промо-арт слота — крупноформатная художественная композиция, визуализирующая мир, персонажей и атмосферу игры. Используется для презентаций, промо-страниц, соцсетей, выставок и баннеров агрегаторов («Featured Game»). Это не просто обложка — это эмоциональное «лицо» игры.",
          descEn: "Main slot promo art — large-format artistic composition visualizing world, characters and game atmosphere. Used for presentations, promo pages, social media, exhibitions and aggregator banners.",
          examples: "Бог Перун метает молнию на фоне неба, логотип внизу и FX вокруг. Главный герой среди символов слота (Wild, Scatter) в сценическом свете. Композиция из артефактов, персонажей и элементов фона.",
          examplesEn: "God Perun throws lightning against sky, logo below and FX around. Main hero among slot symbols (Wild, Scatter) in stage lighting. Composition of artifacts, characters and background elements.",
          tech: [
            "Состав: 1 основная композиция + 2 адаптивных кадра (по ТЗ)",
            "Элементы: персонажи, логотип, FX, окружение, световая схема",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): дым, свет, частицы, свечение, энерго-потоки",
            "Версии: с логотипом и без логотипа",
            "Возможность создания вертикального и горизонтального формата",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP (4K) + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'promo_teaser', 
        name: 'Static Promo Teaser', 
        base: 600, 
        complexity: 1.3,
        details: {
          desc: "Статичный промо-тизер — это художественный кадр или композиция на основе визуалов игры, используемый как обложка для видео-трейлеров, сторис и рекламных анонсов. Он создаётся из уже готовых ассетов (персонажей, фона, логотипа, FX) и собирается в динамичный, «оживлённый» кадр.",
          descEn: "Static promo teaser — artistic frame or composition based on game visuals, used as cover for video trailers, stories and advertising announcements. Created from ready assets (characters, background, logo, FX).",
          examples: "Персонаж держит артефакт, вокруг вспышки и монеты — надпись «Coming Soon». Кадр с логотипом и подсветкой символов Wild и Scatter. Взрывная композиция из FX-частиц и света — под трейлер YouTube.",
          examplesEn: "Character holds artifact, flashes and coins around — Coming Soon text. Frame with logo and Wild and Scatter symbols highlighting. Explosive composition of FX particles and light — for YouTube trailer.",
          tech: [
            "Состав: 2 композиции (по ТЗ клиента)",
            "Форматы: 1920×1080, 1080×1920, 1080×1080 (адаптивы для YouTube, TikTok, Telegram, Instagram)",
            "Элементы: фон, персонажи / символы, логотип, CTA-текст, FX",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, искры, поток света, пыль",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
      { 
        id: 'promo_icons', 
        name: 'Store Icons Set', 
        base: 250, 
        complexity: 0.8,
        details: {
          desc: "Набор иконок игры для лобби казино, мобильных лаунчеров, Telegram Mini App или storefront-платформ (Steam, App Store, Google Play). Используется для отображения игры в списках, кнопках «Play», «Demo», «Try Now» и в интерфейсах партнёров. Фокус — на узнаваемости и чистоте композиции.",
          descEn: "Game icon set for casino lobbies, mobile launchers, Telegram Mini App or storefront platforms (Steam, App Store, Google Play). Used for displaying game in lists, Play, Demo, Try Now buttons.",
          examples: "Иконка с логотипом игры на фоне градиента. Крупный символ Wild или Scatter в центре кадра. Персонаж на цветном фоне с лёгким свечением. Версия без текста — только объект и FX.",
          examplesEn: "Icon with game logo on gradient background. Large Wild or Scatter symbol in frame center. Character on colored background with light glow. Version without text — only object and FX.",
          tech: [
            "Состав: 1 основной вариант + 3 адаптивных версии",
            "Форматы: 512×512, 1024×1024, 2048×2048 (PNG/WebP/SVG)",
            "Элементы: логотип или объект, фон, FX, обводка / рамка (по сеттингу игры)",
            "Послойная отрисовка (PSD/AI/Procreate) для удобной анимации и адаптации под Spine / After Effects",
            "FX-слои (по необходимости): свечение, дым, частицы, мягкий градиент",
            "Варианты: «active / inactive» состояния (по запросу клиента)",
            "2 круга минорных правок",
            "Финальный экспорт: PNG/WebP + исходники PSD/AI/Procreate/Figma (по ТЗ)"
          ]
        }
      },
    ]
  }
];

// Собираем все items в плоский массив для удобства
export const ALL_ITEMS = CATEGORIES.reduce((acc, category) => {
  return acc.concat(category.items);
}, []);
