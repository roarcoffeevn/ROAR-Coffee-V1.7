export type CategoryBannerKey =
  | 'all'
  | 'roasted'
  | 'roasted_beans'
  | 'green_bean'
  | 'instant'
  | 'gift_voucher';

export interface CmsCategoryBanner {
  categoryKey: CategoryBannerKey;
  eyebrowVi: string;
  eyebrowEn: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  imageUrl: string;
  ctaLabelVi: string;
  ctaLabelEn: string;
  ctaPath: string;
  visible: boolean;
}

export const CATEGORY_BANNER_META: Record<
  CategoryBannerKey,
  { labelVi: string; labelEn: string; route: string }
> = {
  all: { labelVi: 'Tất cả sản phẩm', labelEn: 'All Products', route: '/shop' },
  roasted: { labelVi: 'Cà phê Rang Xay', labelEn: 'Roasted Coffee', route: '/coffee/roasted' },
  roasted_beans: { labelVi: 'Cà phê Hạt Rang (kg)', labelEn: 'Roasted Beans (kg)', route: '/coffee/roasted-beans' },
  green_bean: { labelVi: 'Cà phê Nhân Xanh', labelEn: 'Green Coffee Beans', route: '/coffee/green-coffee' },
  instant: { labelVi: 'Cà phê Hòa Tan', labelEn: 'Instant Coffee', route: '/coffee/instant' },
  gift_voucher: { labelVi: 'Thẻ Quà Tặng Gift Voucher', labelEn: 'Gift Vouchers', route: '/coffee/gift-vouchers' },
};

export const DEFAULT_CATEGORY_BANNERS: CmsCategoryBanner[] = [
  {
    categoryKey: 'all',
    eyebrowVi: 'TOÀN BỘ HỆ SINH THÁI ROAR COFFEE®',
    eyebrowEn: 'COMPLETE ROAR COFFEE® CATALOG',
    titleVi: 'Tinh hoa Cà phê Việt từ Nông trại đến Quầy bar',
    titleEn: 'Vietnamese Coffee Mastery From Highland Farm to Bar',
    subtitleVi:
      'Khám phá trọn vẹn các dòng rang xay 7 cá tính, hạt rang 5 mốc giá kg cho quán, 27 cấu hình nhân xanh B2B và thẻ quà tặng sang trọng.',
    subtitleEn:
      'Explore signature roasted collections, 5-tier kg roasted beans for cafés, 27-SKU commercial green lots, instant blends, and executive gift vouchers.',
    imageUrl: 'hero_roar_coffee',
    ctaLabelVi: 'Trải nghiệm 7 Cá tính',
    ctaLabelEn: 'Explore 7 Personalities',
    ctaPath: '/personalities',
    visible: true,
  },
  {
    categoryKey: 'roasted',
    eyebrowVi: 'RANG MỘC 100% · BẢN SẮC PHIN & ESPRESSO',
    eyebrowEn: '100% PURE ROAST · PHIN & ESPRESSO SIGNATURES',
    titleVi: 'Bộ Sưu Tập Cà Phê Rang Xay & Hộp Quà Signature Reserve',
    titleEn: 'Roasted Coffee Collections & Signature Reserve',
    subtitleVi:
      'Từ vị đậm bản lĩnh của Hổ & Sư Tử đến hương cân bằng của Cáo, Đại Bàng và tuyệt phẩm Báo Đen 60% Robusta – 20% Culi – 20% Arabica.',
    subtitleEn:
      'From the bold intensity of Tiger & Lion to balanced Espresso profiles of Fox & Eagle, crowned by Black Panther Signature Reserve.',
    imageUrl: 'hero_signature_reserve_banner',
    ctaLabelVi: 'Khám phá Signature Reserve',
    ctaLabelEn: 'Discover Signature Reserve',
    ctaPath: '/signature-reserve',
    visible: true,
  },
  {
    categoryKey: 'roasted_beans',
    eyebrowVi: 'CHUYÊN BIỆT CHO QUÁN CÀ PHÊ · HORECA · VĂN PHÒNG',
    eyebrowEn: 'DEDICATED TO CAFÉS · HORECA · WORKPLACES',
    titleVi: 'Cà Phê Hạt Rang S18 & Robusta CBU — Tối Ưu Chi Phí Theo 5 Bậc Kg',
    titleEn: 'Screen 18 Roasted Coffee Beans — Transparent 5-Tier Kg Pricing',
    subtitleVi:
      '6 mã hạt rang chuẩn sàng 18 đồng đều (Arabica Cầu Đất, Robusta CBU, Honey & House Blends). Tự động áp dụng giá ưu đãi từ 1kg đến 100kg+.',
    subtitleEn:
      '6 precision-roasted bean lines including Cầu Đất Arabica, CBU Washed Fine Robusta, and Honey lots with automatic tiered pricing from 1kg to 100kg+.',
    imageUrl: 'product_roasting_drum_clean',
    ctaLabelVi: 'Mở Cẩm nang Pha chế',
    ctaLabelEn: 'Open Brewing Handbook',
    ctaPath: '/brewing-handbook',
    visible: true,
  },
  {
    categoryKey: 'green_bean',
    eyebrowVi: 'THƯƠNG MẠI NHÂN XANH B2B · S14 / S16 / S18',
    eyebrowEn: 'COMMERCIAL GREEN COFFEE TRADE · S14 / S16 / S18',
    titleVi: '27 Cấu Hình Nhân Xanh Chuẩn Xuất Khẩu — Natural · Honey · CBU Washed',
    titleEn: '27 Standardized Green Coffee Lots — Natural · Honey · CBU Washed',
    subtitleVi:
      'Nguồn cung minh bạch độ ẩm 10.5–12.5%, tỷ lệ hạt đen vỡ và niên vụ mới nhất từ Đắk Lắk & Lâm Đồng. Hỗ trợ mẫu xanh đánh giá thử nếm.',
    subtitleEn:
      'Traceable highland Robusta, Arabica, and Culi green lots with verified moisture, screen grading, and defect tolerances. Pre-contract green samples available.',
    imageUrl: 'hero_highland_harvest_banner',
    ctaLabelVi: 'Mở Bảng Ma Trận 27 SKUs',
    ctaLabelEn: 'Open 27-SKU Matrix',
    ctaPath: '/coffee/green-beans',
    visible: true,
  },
  {
    categoryKey: 'instant',
    eyebrowVi: 'CHIẾT XUẤT SẤY LẠNH GIỮ TRỌN HƯƠNG RANG',
    eyebrowEn: 'FREEZE-DRIED AROMA RETENTION',
    titleVi: 'Bộ Sưu Tập Hòa Tan Silver & Gold — Chuẩn Gu Mọi Lúc Mọi Nơi',
    titleEn: 'Instant Coffee Silver & Gold — Café Quality in Seconds',
    subtitleVi:
      'Hòa tan tinh khiết tiện lợi cho nhịp sống bận rộn, công tác và văn phòng hiện đại mà vẫn giữ được hậu vị sô-cô-la và độ thơm đặc trưng của ROAR.',
    subtitleEn:
      'Crafted for modern offices, travel, and brisk mornings—delivering crisp espresso depth and lingering roasted aromatics in an instant pour.',
    imageUrl: '/assets/instant/instant-gold.jpg',
    ctaLabelVi: 'Xem Công thức Pha nhanh',
    ctaLabelEn: 'View Quick Brew Recipes',
    ctaPath: '/brewing-handbook',
    visible: true,
  },
  {
    categoryKey: 'gift_voucher',
    eyebrowVi: 'QUÀ TẶNG DOANH NGHIỆP & ĐẶC QUYỀN TRI ÂN',
    eyebrowEn: 'EXECUTIVE GIFTING & CURATED VOUCHERS',
    titleVi: 'Thẻ Quà Tặng ROAR Gift Voucher (50.000₫ – 1.000.000₫)',
    titleEn: 'ROAR COFFEE Gift Vouchers (50k – 1,000,000 VND)',
    subtitleVi:
      'Trao quyền tự do chọn gu cà phê đúng cá tính với phiên bản E-Voucher gửi nhanh hoặc Thẻ cứng ép kim vàng kèm hộp quà sang trọng.',
    subtitleEn:
      'Let recipients choose their exact roast and brew ritual with instant digital E-Vouchers or gold-foil physical cards inside our signature keepsake box.',
    imageUrl: '/assets/vouchers/gift-voucher-1m.jpg',
    ctaLabelVi: 'Quà tặng Doanh nghiệp B2B',
    ctaLabelEn: 'Corporate Gifting Portal',
    ctaPath: '/signature-reserve',
    visible: true,
  },
];

export function parseCategoryBanners(rawJson?: string | null): CmsCategoryBanner[] {
  if (!rawJson) return DEFAULT_CATEGORY_BANNERS;
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORY_BANNERS;
    const byKey = new Map<string, Partial<CmsCategoryBanner>>();
    for (const item of parsed) {
      if (item && typeof item.categoryKey === 'string') {
        byKey.set(item.categoryKey, item);
      }
    }
    return DEFAULT_CATEGORY_BANNERS.map((def) => {
      const override = byKey.get(def.categoryKey);
      if (!override) return def;
      return {
        ...def,
        ...override,
        categoryKey: def.categoryKey,
        visible: typeof override.visible === 'boolean' ? override.visible : def.visible,
      };
    });
  } catch {
    return DEFAULT_CATEGORY_BANNERS;
  }
}
