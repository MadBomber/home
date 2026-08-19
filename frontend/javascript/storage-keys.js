// Reader data that belongs to the reader rather than to one study: the
// settings object and the study group. Both are global, so neither key carries
// a storage_prefix — journal and progress are the per-study ones, and those
// keys are built from the prefix where they are used.
//
// Every module reads these from here. A second copy of the literal is how the
// group list came to be written under one key and read under another.
//
// NOTE: the FOUC-prevention script in src/_partials/_head.erb runs before the
// bundle loads and cannot import this module, so it repeats "bst_settings".
// That one copy has to be changed by hand.

export const SETTINGS_KEY = "bst_settings"
export const GROUP_KEY = "bst_group"

// The announcement banner's dismissed-state marker. Stores the announcement's
// own front-matter date, not a dismissal timestamp — bumping that date in
// announcement.md resurfaces the banner for readers who already dismissed it.
export const BANNER_KEY = "bst_banner_dismissed"
