# План улучшения безопасности админки

**Дата создания:** 4 Февраля 2026  
**Приоритет:** Высокий  
**Статус:** Планирование

---

## Контекст

После добавления управления криптокошельками в админке (`/admin/wallets`) критически важно защитить админский аккаунт от взлома. Компрометация аккаунта может привести к подмене кошельков и краже средств клиентов.

---

## 1. Двухфакторная аутентификация (2FA)

**Приоритет:** Критический  
**Сложность:** Средняя

### Описание
Supabase Auth поддерживает TOTP (Time-based One-Time Password). Даже при утечке пароля без кода из приложения аутентификатора войти не получится.

### Реализация
- Включить MFA в Supabase Dashboard → Authentication → Multi-Factor Authentication
- Добавить UI для настройки 2FA в профиле админа
- При входе запрашивать TOTP код
- Сделать 2FA обязательным для роли `admin`

### Поддерживаемые приложения
- Google Authenticator
- Authy
- 1Password
- Microsoft Authenticator

### Документация
- https://supabase.com/docs/guides/auth/auth-mfa

---

## 2. Audit Log для кошельков

**Приоритет:** Высокий  
**Сложность:** Низкая

### Описание
Логировать все изменения кошельков (CREATE/UPDATE/DELETE) в таблицу `audit_logs`. Видеть кто, когда и что менял.

### Реализация
- Использовать существующий `lib/auditLog.js`
- Добавить функцию `logWalletEvent(action, walletId, details)`
- Вызывать при создании, обновлении, удалении, toggle кошелька
- Логировать: old_value, new_value, user_id, ip, user_agent

### Пример лога
```json
{
  "action": "wallet_updated",
  "entity_type": "crypto_wallet",
  "entity_id": "uuid",
  "changes": {
    "address": {
      "old": "TYDzs...",
      "new": "TXabc..."
    }
  },
  "user_id": "admin-uuid",
  "timestamp": "2026-02-04T12:00:00Z"
}
```

---

## 3. Уведомления о критических действиях

**Приоритет:** Высокий  
**Сложность:** Средняя

### Описание
При изменении кошельков отправлять уведомление (email/Telegram). Мгновенное оповещение о подозрительной активности.

### Варианты реализации

#### Email (через Supabase Edge Functions)
- Supabase Edge Function триггерится на изменение таблицы
- Отправка через Resend/SendGrid/Postmark

#### Telegram Bot
- Создать бота через @BotFather
- Edge Function отправляет сообщение в личный чат
- Формат: "⚠️ Wallet changed: TRC20 USDT address updated by admin@email.com"

### Что уведомлять
- Создание кошелька
- Изменение адреса кошелька
- Удаление кошелька
- Изменение статуса (active/inactive)
- Неудачные попытки входа в админку

---

## 4. Подтверждение изменений кошельков

**Приоритет:** Средний  
**Сложность:** Средняя

### Описание
Перед сохранением изменений кошелька требовать повторный ввод пароля или 2FA кода. Даже при краже сессии без пароля изменить не получится.

### Реализация
- Модалка подтверждения перед save/delete
- Поле ввода текущего пароля
- Или ввод текущего TOTP кода (если 2FA включен)
- Валидация через Supabase Auth API

### UX
```
┌─────────────────────────────────┐
│  Confirm Wallet Change          │
│                                 │
│  Enter your password to         │
│  confirm this action:           │
│                                 │
│  [••••••••••••]                 │
│                                 │
│  [Cancel]  [Confirm]            │
└─────────────────────────────────┘
```

---

## 5. IP Whitelist

**Приоритет:** Низкий (опционально)  
**Сложность:** Средняя

### Описание
Разрешить доступ к админке только с определённых IP адресов. Радикально, но очень эффективно.

### Реализация

#### Вариант A: RLS политика
```sql
CREATE POLICY "Admin only from whitelisted IPs"
ON crypto_wallets
FOR ALL
USING (
  -- Проверка IP через request headers
  current_setting('request.headers', true)::json->>'x-real-ip' 
  IN ('1.2.3.4', '5.6.7.8')
);
```

#### Вариант B: Middleware на фронте
- Таблица `admin_allowed_ips`
- Проверка при загрузке админских страниц
- Редирект если IP не в списке

#### Вариант C: Cloudflare Access
- Настроить Zero Trust для /admin/* путей
- Требовать email верификацию или device posture

### Минусы
- Сложность при динамическом IP
- Нужен VPN или статический IP

---

## 6. Session Management

**Приоритет:** Средний  
**Сложность:** Средняя

### Описание
Улучшенное управление сессиями для админов.

### Функции

#### 6.1 Короткое время жизни сессии
- Для админа: 1 час (вместо стандартных 7 дней)
- Настройка в Supabase: `JWT expiry time`

#### 6.2 Принудительный выход при смене IP/устройства
- Сохранять IP и User-Agent при создании сессии
- При изменении — инвалидировать сессию
- Требовать повторный вход

#### 6.3 Просмотр активных сессий
- Страница в профиле: список активных сессий
- Информация: IP, устройство, время последней активности
- Кнопка "Завершить сессию" для каждой
- Кнопка "Завершить все кроме текущей"

### Таблица для хранения
```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  is_valid BOOLEAN DEFAULT true
);
```

---

## Порядок реализации (рекомендуемый)

1. **2FA** — максимальный эффект, базовая защита
2. **Audit Log** — видимость всех изменений
3. **Telegram уведомления** — мгновенные алерты
4. **Подтверждение паролем** — защита от кражи сессии
5. **Session Management** — контроль активных сессий
6. **IP Whitelist** — если нужна максимальная защита

---

## Дополнительные меры (на будущее)

- **Hardware Key (YubiKey)** — WebAuthn вместо TOTP
- **Задержка на изменения** — 24ч очередь с возможностью отмены
- **Мультиподпись** — требовать подтверждение 2+ админов
- **Honeypot кошельки** — фейковые записи для детекции взлома

---

## Ссылки

- [Supabase MFA Docs](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/)
