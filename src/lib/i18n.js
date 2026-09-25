// Russian-first UI vocabulary.
//
// The app is Russian-only by design: one locale, no language switcher, no i18n framework.
// Exercise *names* stay canonical English (the dataset ships no Russian name pack and
// machine-transliterating 1324 names would invent data); everything the interface itself
// says — labels, facets, muscle names, instructions — is Russian.

export const PHRASES = {
  tagline: 'Публичный каталог упражнений — без аккаунта, без истории.',
  introLede: 'Полный каталог: ищи по названию, фильтруй по части тела, целевой мышце и инвентарю и открывай технику выполнения по шагам. Ссылка на фильтр делится как есть.',

  catalogueHeading: 'Каталог упражнений',
  searchLabel: 'Поиск упражнения',
  searchPlaceholder: 'Поиск: жим, присед, гантель, пресс…',
  filterBodyPart: 'Часть тела',
  filterMuscle: 'Целевая мышца',
  filterEquipment: 'Инвентарь',
  all: 'Все',
  anyMuscle: 'Любая мышца',
  anyEquipment: 'Любой инвентарь',
  clearAll: 'Сбросить фильтры',
  activeFilters: 'Активные фильтры',
  removeFilter: 'Убрать фильтр',
  showMore: 'Показать ещё',
  emptyTitle: 'Ни хуя не нашлось',
  emptyHint: 'Сбрось фильтры или попробуй другое слово.',
  resultCount: 'Найдено',
  totalCount: 'Всего в каталоге',

  exerciseFallback: 'Упражнение',
  notFoundTitle: 'Упражнение не найдено',
  notFoundHint: 'Проверь ссылку или вернись в каталог.',
  backToCatalogue: 'К каталогу',
  howTo: 'Как выполнять',
  targetMuscles: 'Целевые мышцы',
  secondaryMuscles: 'Вспомогательные мышцы',
  equipmentLabel: 'Инвентарь',
  bodyPartLabel: 'Часть тела',
  mediaShowAnimation: 'Анимация',
  mediaShowStill: 'Кадр',
  mediaUnavailable: 'Медиа недоступно',
  mediaUnavailableHint: 'Источник медиа не отвечает. Текстовая техника ниже остаётся доступной.',
  mediaNoAnimation: 'Для этого упражнения нет анимации.',
  mediaRetry: 'Повторить',
  shareLink: 'Скопировать ссылку',
  shareCopied: 'Ссылка скопирована',
  shareFailed: 'Не удалось скопировать',
  loading: 'Загрузка…',
  exerciseId: 'ID',
  installedOfflineHint: 'Офлайн доступен только интерфейс — медиа требует сети.'
}

/** Translate a phrase key; falls back to the key itself so a missing string is visible. */
export const t = key => (key in PHRASES ? PHRASES[key] : key)

/** Russian plural picker: plural(1,'упражнение','упражнения','упражнений'). */
export function plural(n, one, few, many) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

export const exercisesWord = n => plural(n, 'упражнение', 'упражнения', 'упражнений')
