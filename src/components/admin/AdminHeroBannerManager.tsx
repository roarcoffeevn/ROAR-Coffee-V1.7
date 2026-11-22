import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';
import { MediaImage } from '../MediaImage';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';
import {
  CATEGORY_BANNER_META,
  DEFAULT_CATEGORY_BANNERS,
  parseCategoryBanners,
  type CategoryBannerKey,
  type CmsCategoryBanner,
} from '../../lib/categoryBanners';
import {
  DEFAULT_HERO_METRICS,
  DEFAULT_HERO_SLIDES,
  parseHeroMetrics,
  parseHeroSlides,
  type HeroMetricConfig,
  type HeroSlideConfig,
} from '../../lib/heroBanners';

export type CmsHeroSlide = HeroSlideConfig;
export type CmsHeroMetric = HeroMetricConfig;
export const DEFAULT_CMS_HERO_SLIDES = DEFAULT_HERO_SLIDES;
export const DEFAULT_CMS_HERO_METRICS = DEFAULT_HERO_METRICS;

interface AdminHeroBannerManagerProps {
  settings: Record<string, string>;
  onSaved?: (next: Record<string, string>) => void;
  mediaAssets?: MediaAssetRecord[];
  onMediaUploaded?: () => Promise<void> | void;
}

const SURFACE_PRESETS = [
  { value: 'bg-[#003D25]', labelVi: 'Xanh Emerald ROAR (#003D25)', labelEn: 'ROAR Emerald (#003D25)' },
  { value: 'bg-[#0D1913]', labelVi: 'Đen Obsidian Reserve (#0D1913)', labelEn: 'Obsidian Reserve (#0D1913)' },
  { value: 'bg-[#062C1B]', labelVi: 'Rừng sâu Tây Nguyên (#062C1B)', labelEn: 'Highland Forest (#062C1B)' },
  { value: 'bg-[#111312]', labelVi: 'Đen Tuyền Báo Đen (#111312)', labelEn: 'Black Panther (#111312)' },
];

export const AdminHeroBannerManager: React.FC<AdminHeroBannerManagerProps> = ({
  settings,
  onSaved,
  mediaAssets = [],
  onMediaUploaded = () => {},
}) => {
  const { t } = useI18n();
  const { apiFetch, showToast, refreshBootstrap } = useStore();
  const [subTab, setSubTab] = useState<'category_banners' | 'slides' | 'carousel'>('slides');
  const [slides, setSlides] = useState<HeroSlideConfig[]>(() =>
    parseHeroSlides(settings.cms_hero_slides_json)
  );
  const [metrics, setMetrics] = useState<HeroMetricConfig[]>(() =>
    parseHeroMetrics(settings.cms_hero_metrics_json)
  );
  const [categoryBanners, setCategoryBanners] = useState<CmsCategoryBanner[]>(() =>
    parseCategoryBanners(settings.cms_category_banners_json)
  );
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    | { kind: 'slide'; slideId: string }
    | { kind: 'category'; categoryKey: CategoryBannerKey }
    | null
  >(null);

  useEffect(() => {
    setSlides(parseHeroSlides(settings.cms_hero_slides_json));
    setMetrics(parseHeroMetrics(settings.cms_hero_metrics_json));
    setCategoryBanners(parseCategoryBanners(settings.cms_category_banners_json));
  }, [settings.cms_hero_slides_json, settings.cms_hero_metrics_json, settings.cms_category_banners_json]);

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setSlides(copy);
  };

  const updateSlide = (id: string, patch: Partial<HeroSlideConfig>) => {
    setSlides((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const moveMetric = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= metrics.length) return;
    const copy = [...metrics];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setMetrics(copy);
  };

  const updateCategoryBanner = (
    categoryKey: CategoryBannerKey,
    patch: Partial<CmsCategoryBanner>
  ) => {
    setCategoryBanners((prev) =>
      prev.map((b) => (b.categoryKey === categoryKey ? { ...b, ...patch } : b))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        cms_hero_slides_json: JSON.stringify(slides),
        cms_hero_metrics_json: JSON.stringify(metrics),
        cms_category_banners_json: JSON.stringify(categoryBanners),
      };
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved?.({ ...settings, ...payload });
        await refreshBootstrap();
        showToast(
          t(
            'Đã lưu Banner Danh mục Sản phẩm, 4 Slide Hero & Carousel Trang chủ!',
            'Saved Category Banners, Homepage Hero Slides & Carousel!'
          )
        );
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu cấu hình Banner.', 'Failed to save Banner settings.'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Quản lý Banner Danh Mục, Hero & Carousel', 'Category Banners, Hero & Carousel Manager')}
          </h2>
          <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-1">
            {t(
              'Thay thế hình ảnh, tiêu đề song ngữ và CTA cho 4 Slide Hero Trang chủ, Carousel chỉ số và Banner từng danh mục sản phẩm (/shop).',
              'Customize artwork, bilingual headlines, and CTAs for all 4 Homepage Hero Slides, Metrics Carousel, and Product Category Banners.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSlides(DEFAULT_HERO_SLIDES);
              setMetrics(DEFAULT_HERO_METRICS);
              setCategoryBanners(DEFAULT_CATEGORY_BANNERS);
              showToast(t('Đã khôi phục mặc định 4 Slide & 8 Thẻ (bấm Lưu để áp dụng)', 'Reset to 4 default slides & 8 metrics (click Save to apply)'));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('Mặc định', 'Reset')}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('Đang lưu...', 'Saving...') : t('Lưu tất cả Banner', 'Save All Banners')}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('slides')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'slides' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{t('Slide Hero Trang Chủ', 'Homepage Hero Slides')} ({slides.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('carousel')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'carousel' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('Carousel Thẻ Chỉ Số', 'Metrics Carousel')} ({metrics.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('category_banners')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'category_banners' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>{t('Banner Danh Mục Sản Phẩm', 'Product Category Banners')} ({categoryBanners.length})</span>
        </button>
      </div>

      {/* TAB 0: HERO SLIDES (4 SLIDES MATCHING HOMEPAGE) */}
      {subTab === 'slides' && (
        <div className="space-y-4">
          {slides.map((s, idx) => (
            <div key={s.id} className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                    Slide #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-[#202020]/60 dark:text-[#F1EFEA]/60">
                    · {s.tabLabelVi || s.titleVi}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSlide(idx, -1)}
                    title={t('Đưa lên', 'Move up')}
                    className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => moveSlide(idx, 1)}
                    title={t('Đưa xuống', 'Move down')}
                    className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={slides.length <= 1}
                    onClick={() => setSlides((prev) => prev.filter((x) => x.id !== s.id))}
                    title={t('Xóa slide', 'Delete slide')}
                    className="p-1.5 rounded text-red-500 hover:bg-red-500/10 disabled:opacity-25 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Live Thumbnail + Image Picker + Surface Theme */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#0D1B14] border border-[#202020]/15 dark:border-white/15">
                    <MediaImage
                      imageKey={s.imageKey}
                      alt={s.titleVi}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={s.imageKey}
                      onChange={(e) => updateSlide(s.id, { imageKey: e.target.value })}
                      placeholder="hero_roar_coffee hoặc https://..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ kind: 'slide', slideId: s.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00552B] text-white text-[11px] font-semibold hover:bg-[#004422] shrink-0 cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>{t('Chọn ảnh', 'Pick')}</span>
                    </button>
                  </div>
                  <div className="text-xs">
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                      {t('Màu nền Hero', 'Hero Surface Theme')}
                    </label>
                    <select
                      value={s.surfaceClass}
                      onChange={(e) => updateSlide(s.id, { surfaceClass: e.target.value })}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                    >
                      {SURFACE_PRESETS.map((sp) => (
                        <option key={sp.value} value={sp.value}>
                          {t(sp.labelVi, sp.labelEn)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Editorial Fields */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tên Tab Chọn nhanh (VI)', 'Selector Tab Label (VI)')}</label>
                    <input
                      value={s.tabLabelVi}
                      onChange={(e) => updateSlide(s.id, { tabLabelVi: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tên Tab Chọn nhanh (EN)', 'Selector Tab Label (EN)')}</label>
                    <input
                      value={s.tabLabelEn}
                      onChange={(e) => updateSlide(s.id, { tabLabelEn: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nhãn phụ (VI)', 'Badge (VI)')}</label>
                    <input
                      value={s.badgeVi}
                      onChange={(e) => updateSlide(s.id, { badgeVi: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nhãn phụ (EN)', 'Badge (EN)')}</label>
                    <input
                      value={s.badgeEn}
                      onChange={(e) => updateSlide(s.id, { badgeEn: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tiêu đề chính (VI)', 'Title (VI)')}</label>
                    <input
                      value={s.titleVi}
                      onChange={(e) => updateSlide(s.id, { titleVi: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tiêu đề chính (EN)', 'Title (EN)')}</label>
                    <input
                      value={s.titleEn}
                      onChange={(e) => updateSlide(s.id, { titleEn: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Mô tả ngắn (VI)', 'Description (VI)')}</label>
                    <textarea
                      rows={2}
                      value={s.descVi}
                      onChange={(e) => updateSlide(s.id, { descVi: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Mô tả ngắn (EN)', 'Description (EN)')}</label>
                    <textarea
                      rows={2}
                      value={s.descEn}
                      onChange={(e) => updateSlide(s.id, { descEn: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Chú thích ảnh (VI)', 'Image Caption (VI)')}</label>
                    <input
                      value={s.captionVi}
                      onChange={(e) => updateSlide(s.id, { captionVi: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Chú thích ảnh (EN)', 'Image Caption (EN)')}</label>
                    <input
                      value={s.captionEn}
                      onChange={(e) => updateSlide(s.id, { captionEn: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút chính (VI)', 'Primary CTA (VI)')}</label>
                      <input
                        value={s.primaryCtaVi}
                        onChange={(e) => updateSlide(s.id, { primaryCtaVi: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút chính (EN)', 'Primary CTA (EN)')}</label>
                      <input
                        value={s.primaryCtaEn}
                        onChange={(e) => updateSlide(s.id, { primaryCtaEn: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Link nút chính', 'Primary Link')}</label>
                      <input
                        value={s.primaryTo}
                        onChange={(e) => updateSlide(s.id, { primaryTo: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút phụ (VI)', 'Secondary CTA (VI)')}</label>
                      <input
                        value={s.secondaryCtaVi}
                        onChange={(e) => updateSlide(s.id, { secondaryCtaVi: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút phụ (EN)', 'Secondary CTA (EN)')}</label>
                      <input
                        value={s.secondaryCtaEn}
                        onChange={(e) => updateSlide(s.id, { secondaryCtaEn: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Link nút phụ', 'Secondary Link')}</label>
                      <input
                        value={s.secondaryTo}
                        onChange={(e) => updateSlide(s.id, { secondaryTo: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setSlides((prev) => [
                ...prev,
                {
                  id: `slide-${Date.now()}`,
                  imageKey: 'hero_roar_coffee',
                  badgeVi: 'ROAR COFFEE®',
                  badgeEn: 'ROAR COFFEE®',
                  titleVi: 'Banner Hero mới',
                  titleEn: 'New Hero Slide',
                  descVi: 'Mô tả ngắn cho slide hero banner mới.',
                  descEn: 'Short description for this new hero slide.',
                  captionVi: 'ROAR COFFEE — Khơi bản lĩnh. Đậm chất riêng.',
                  captionEn: 'ROAR COFFEE — Igniting Courage. Defining Character.',
                  primaryCtaVi: 'Khám phá ngay',
                  primaryCtaEn: 'Explore Now',
                  primaryTo: '/shop',
                  secondaryCtaVi: 'Xem thêm',
                  secondaryCtaEn: 'Learn More',
                  secondaryTo: '/about',
                  tabLabelVi: `${String(prev.length + 1).padStart(2, '0')} · Banner mới`,
                  tabLabelEn: `${String(prev.length + 1).padStart(2, '0')} · New Slide`,
                  surfaceClass: 'bg-[#003D25]',
                },
              ])
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[#00552B] text-[#00552B] dark:text-[#C6A667] dark:border-[#C6A667] text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Thêm Slide Hero Banner mới', 'Add New Hero Slide')}</span>
          </button>
        </div>
      )}

      {/* TAB 1: METRICS CAROUSEL */}
      {subTab === 'carousel' && (
        <div className="space-y-3">
          {metrics.map((m, idx) => (
            <div key={m.id} className="bg-white dark:bg-[#16221C] p-4 rounded-xl border border-[#202020]/10 dark:border-white/10 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <button type="button" disabled={idx === 0} onClick={() => moveMetric(idx, -1)} className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" disabled={idx === metrics.length - 1} onClick={() => moveMetric(idx, 1)} className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <input
                  value={m.value}
                  onChange={(e) => setMetrics((prev) => prev.map((x) => (x.id === m.id ? { ...x, value: e.target.value } : x)))}
                  placeholder="7 / 27+ SKUs"
                  className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono font-bold"
                />
                <input
                  value={m.titleVi}
                  onChange={(e) => setMetrics((prev) => prev.map((x) => (x.id === m.id ? { ...x, titleVi: e.target.value } : x)))}
                  placeholder="Tiêu đề thẻ (VI)"
                  className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                />
                <input
                  value={m.subVi}
                  onChange={(e) => setMetrics((prev) => prev.map((x) => (x.id === m.id ? { ...x, subVi: e.target.value } : x)))}
                  placeholder="Chú thích nhỏ (VI)"
                  className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                />
                <input
                  value={m.to}
                  onChange={(e) => setMetrics((prev) => prev.map((x) => (x.id === m.id ? { ...x, to: e.target.value } : x)))}
                  placeholder="/shop"
                  className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                />
              </div>
              <button
                type="button"
                disabled={metrics.length <= 1}
                onClick={() => setMetrics((prev) => prev.filter((x) => x.id !== m.id))}
                className="p-1.5 rounded text-red-500 hover:bg-red-500/10 disabled:opacity-25 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setMetrics((prev) => [
                ...prev,
                {
                  id: `hm-${Date.now()}`,
                  value: '100%',
                  dot: 'bg-[#C6A667]',
                  titleVi: 'Thẻ chỉ số mới',
                  titleEn: 'New Metric Card',
                  subVi: 'Mô tả ngắn',
                  subEn: 'Short caption',
                  to: '/shop',
                },
              ])
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[#00552B] text-[#00552B] dark:text-[#C6A667] dark:border-[#C6A667] text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Thêm thẻ Carousel mới', 'Add Carousel Card')}</span>
          </button>
        </div>
      )}

      {/* TAB 2: PRODUCT CATEGORY BANNERS */}
      {subTab === 'category_banners' && (
        <div className="space-y-4">
          {categoryBanners.map((b) => {
            const meta = CATEGORY_BANNER_META[b.categoryKey];
            return (
              <div
                key={b.categoryKey}
                className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202020]/10 dark:border-white/10 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                      {t(meta.labelVi, meta.labelEn)}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
                      {meta.route}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateCategoryBanner(b.categoryKey, { visible: !b.visible })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      b.visible
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {b.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{b.visible ? t('Đang hiển thị', 'Visible') : t('Đang ẩn', 'Hidden')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Live Thumbnail + Image Picker */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#0D1B14] border border-[#202020]/15 dark:border-white/15">
                      <MediaImage
                        imageKey={b.imageUrl}
                        alt={b.titleVi}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={b.imageUrl}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { imageUrl: e.target.value })}
                        placeholder="hero_roar_coffee hoặc /assets/..."
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ kind: 'category', categoryKey: b.categoryKey })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00552B] text-white text-[11px] font-semibold hover:bg-[#004422] shrink-0 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{t('Thay ảnh', 'Pick Image')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Bilingual Editorial Inputs */}
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Nhãn phụ Eyebrow (VI)', 'Eyebrow (VI)')}
                      </label>
                      <input
                        value={b.eyebrowVi}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { eyebrowVi: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Nhãn phụ Eyebrow (EN)', 'Eyebrow (EN)')}
                      </label>
                      <input
                        value={b.eyebrowEn}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { eyebrowEn: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Tiêu đề Banner (VI)', 'Headline (VI)')}
                      </label>
                      <input
                        value={b.titleVi}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { titleVi: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Tiêu đề Banner (EN)', 'Headline (EN)')}
                      </label>
                      <input
                        value={b.titleEn}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { titleEn: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Mô tả ngắn (VI)', 'Subtitle (VI)')}
                      </label>
                      <textarea
                        rows={2}
                        value={b.subtitleVi}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { subtitleVi: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Mô tả ngắn (EN)', 'Subtitle (EN)')}
                      </label>
                      <textarea
                        rows={2}
                        value={b.subtitleEn}
                        onChange={(e) => updateCategoryBanner(b.categoryKey, { subtitleEn: e.target.value })}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Chữ nút CTA (VI)', 'CTA Label (VI)')}
                        </label>
                        <input
                          value={b.ctaLabelVi}
                          onChange={(e) => updateCategoryBanner(b.categoryKey, { ctaLabelVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Chữ nút CTA (EN)', 'CTA Label (EN)')}
                        </label>
                        <input
                          value={b.ctaLabelEn}
                          onChange={(e) => updateCategoryBanner(b.categoryKey, { ctaLabelEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Đường dẫn CTA', 'CTA Path')}
                        </label>
                        <input
                          value={b.ctaPath}
                          onChange={(e) => updateCategoryBanner(b.categoryKey, { ctaPath: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        mediaAssets={mediaAssets}
        onMediaUploaded={onMediaUploaded}
        title={t('Chọn hoặc tải lên ảnh Banner', 'Select or Upload Banner Image')}
        onSelect={(keyOrUrl) => {
          if (!pickerTarget) return;
          if (pickerTarget.kind === 'category') {
            updateCategoryBanner(pickerTarget.categoryKey, { imageUrl: keyOrUrl });
          } else {
            updateSlide(pickerTarget.slideId, { imageKey: keyOrUrl });
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
};
