# HOLLYWOOD CAR DETAILING

Одностраничный сайт детейлинг-студии в Ярославле. Полная пересборка с нуля (v3): светлый editorial / film-bay, без шаблонного AI-layout.

- Репозиторий: <https://github.com/TeasSty/hollywood-car-detailing>
- GitHub Pages: <https://teassty.github.io/hollywood-car-detailing/>
- VK: <https://vk.com/hollywoodcardetailing>
- Карта: <https://yandex.ru/maps/org/239649973526>

## Стек

Astro (static) + TypeScript + авторский CSS. Деплой через GitHub Actions на GitHub Pages (`base: /hollywood-car-detailing/`).

## Данные на сайте

- Адрес: **Ярославль, Ленинградский пр-т, 123Д** (официальная карточка clients.site / Яндекс)
- Телефон / WhatsApp: +7 (951) 284-23-25
- График: Пн–Сб, 10:00–20:00
- Цены — из публичной карточки Яндекс Карт (стартовые «от …»)
- Отзывы — реальные фрагменты с карточки организации, со ссылкой на источник

## Signature Viewer

Секция «Детейлинг — полный уход» (`#signature`):

- **3D wireframe (static):** Khronos **CarConcept** GLB — тёмный studio + EdgesGeometry, камера фиксирована в **правом** ¾ ракурсе (без орбиты / fly-to), модель по центру кадра.
- **Золотые callout-точки (~6 популярных зон):** якоря в нормированном AABB кузова (`uvw`); hover/click подсвечивает линию и строку прайса.
- **Прайс** (`#prices`): полный список услуг; точки на схеме — только ключевые зоны.
- Lazy-load Three.js при появлении секции, dispose вне viewport, DPR cap на мобиле.
- Лицензия модели: [`docs/signature-3d-model.md`](docs/signature-3d-model.md) (без кредитной строки в UI секции).

**Не используется** модель Audi e-tron GT с Sketchfab (CC BY-NC-SA — коммерческий сайт запрещён; плюс Real Racing 3). Подробности в том же документе.

Ранее в переписке фигурировал адрес «Полушкина Роща, 123». Он **не** совпадает с публичной карточкой студии, поэтому на сайте стоит адрес из официальных источников. Если нужен другой — напишите.

## Запуск

```bash
npm ci
npm run dev
npm run build
```

## Лиды

Форма заявки работает только в браузере: собирает текст и открывает `wa.me` с предзаполненным сообщением. Имитации «заявка отправлена» нет.
