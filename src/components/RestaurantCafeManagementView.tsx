import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Bike,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Search,
  DollarSign,
  CreditCard,
  ChefHat,
  AlertCircle,
  Receipt,
  FileText,
  Landmark,
  ShieldCheck,
  Flame,
  Info,
  ExternalLink,
  Edit3,
  Settings,
  RotateCcw,
  Eye,
  X,
  Save,
} from 'lucide-react';
import {
  FoundationDataResponse,
  RestaurantTableRecord,
  RestaurantOrderRecord,
  RestaurantOrderLine,
  RestaurantOrderType,
  TableStatus,
} from '../types/foundation';
import { printHtmlContent } from '../utils/printUtils';
import { Card, Button } from './ui';

interface RestaurantCafeManagementViewProps {
  foundationData: FoundationDataResponse;
  onRefresh: () => Promise<void>;
}

export interface MenuItem {
  id: number;
  category: 'IRANIAN' | 'FAST_FOOD' | 'PASTA_BURGER' | 'APPETIZER' | 'CAFE_BAR' | 'DESSERT';
  categoryFa: string;
  titleFa: string;
  descriptionFa: string;
  priceIrr: number;
  prepTimeMinutes: number;
  iconText: string;
  imageUrl: string;
  badgeFa?: string;
  calories?: number;
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // کباب و غذاهای اصیل ایرانی
  {
    id: 101,
    category: 'IRANIAN',
    categoryFa: 'کباب و ایرانی اصیل',
    titleFa: 'چلو کباب کوبیده مخصوص زعفرانی (۲ سیخ)',
    descriptionFa: 'گوشت راسته و قلوه‌گاه گوسفندی، برنج صدری هاشمی اعلا، کره محلی و گوجه کبابی',
    priceIrr: 2200000,
    prepTimeMinutes: 20,
    iconText: '🍢',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'پرفروش‌ترین',
    calories: 680,
  },
  {
    id: 102,
    category: 'IRANIAN',
    categoryFa: 'کباب و ایرانی اصیل',
    titleFa: 'چلو جوجه کباب فیله زعفرانی ممتاز',
    descriptionFa: 'فیله مرغ مرینیت زعفرانی و آب‌لیمو، برنج زعفرانی اصیل، دورچین ترشی و فلفل',
    priceIrr: 2100000,
    prepTimeMinutes: 18,
    iconText: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80',
    calories: 590,
  },
  {
    id: 103,
    category: 'IRANIAN',
    categoryFa: 'کباب و ایرانی اصیل',
    titleFa: 'چلو کباب برگ گوسفندی اعلا',
    descriptionFa: 'راسته تازه گوسفندی نرم و آبدار، پخت روی زغال طبیعی با کره ارگانیک',
    priceIrr: 3800000,
    prepTimeMinutes: 25,
    iconText: '🥩',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'ویژه سرآشپز',
    calories: 720,
  },
  {
    id: 104,
    category: 'IRANIAN',
    categoryFa: 'کباب و ایرانی اصیل',
    titleFa: 'چلو کباب شیشلیک شاندیز ۶ تکه',
    descriptionFa: 'دنده‌های بره اعلا با مرینیت مخصوص سرآشپز، گوجه کبابی و فلفل تند',
    priceIrr: 4200000,
    prepTimeMinutes: 25,
    iconText: '🍖',
    imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'پیشنهاد ویژه',
    calories: 810,
  },

  // فست‌فود و پیتزا
  {
    id: 201,
    category: 'FAST_FOOD',
    categoryFa: 'پیتزا و فست‌فود',
    titleFa: 'پیتزا سیر و استیک مخصوص سرآشپز',
    descriptionFa: 'فیله گوساله ریش‌ریش، سیر تازه، قارچ بلانچ، سس خامه و پنیر موزارلا کشسانی ایتالیایی',
    priceIrr: 2900000,
    prepTimeMinutes: 22,
    iconText: '🍕',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'ایتالیایی اصل',
    calories: 850,
  },
  {
    id: 202,
    category: 'FAST_FOOD',
    categoryFa: 'پیتزا و فست‌فود',
    titleFa: 'پیتزا پپرونی با پنیر موزارلا کشسانی',
    descriptionFa: 'پپرونی تند دودی اصل، سس مارینارا تازه، فلفل هالوپینو و پنیر دوبل',
    priceIrr: 2400000,
    prepTimeMinutes: 18,
    iconText: '🍕',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
    calories: 790,
  },
  {
    id: 203,
    category: 'FAST_FOOD',
    categoryFa: 'پیتزا و فست‌فود',
    titleFa: 'چیکن استریپس سوخاری کریسپی (۴ تکه)',
    descriptionFa: 'فیله مرغ تازه سوخاری‌شده با روکش پولکی ترد، همراه با سیب‌زمینی و دیپ سیر',
    priceIrr: 1950000,
    prepTimeMinutes: 15,
    iconText: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'کریسپی و ترد',
    calories: 620,
  },

  // پاستا و برگر
  {
    id: 301,
    category: 'PASTA_BURGER',
    categoryFa: 'پاستا و برگر دست‌ساز',
    titleFa: 'پاستا پنه آلفردو با فیله مرغ گریل و قارچ',
    descriptionFa: 'پاستا پنه ریگاته، سس آلفردوی خامه‌ای با پنیر پارمزان ۲۴ ماهه، مرغ گریل و جعفری تازه',
    priceIrr: 2300000,
    prepTimeMinutes: 15,
    iconText: '🍝',
    imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80',
    calories: 640,
  },
  {
    id: 302,
    category: 'PASTA_BURGER',
    categoryFa: 'پاستا و برگر دست‌ساز',
    titleFa: 'برگر کلاسیک زغالی با سیب‌زمینی و دیپ پنیر',
    descriptionFa: '۱۸۰ گرم گوشت گرم گوساله دست‌ساز، نان بریوش، پنیر چدار آب‌شده، کاهو فرانسوی و بیکن',
    priceIrr: 2200000,
    prepTimeMinutes: 15,
    iconText: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'نان بریوش',
    calories: 750,
  },
  {
    id: 303,
    category: 'PASTA_BURGER',
    categoryFa: 'پاستا و برگر دست‌ساز',
    titleFa: 'دوبل چیزبرگر ویژه آمریکایی ۲۵۰ گرم',
    descriptionFa: 'دو پتی گوشت گریل، ورقه‌های پنیر گودا و چدار هلندی، سس باربیکیو دودی و پیاز کاراملی',
    priceIrr: 2850000,
    prepTimeMinutes: 18,
    iconText: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=400&q=80',
    calories: 920,
  },

  // سالاد و پیش‌غذا
  {
    id: 401,
    category: 'APPETIZER',
    categoryFa: 'پیش‌غذا و سالاد',
    titleFa: 'سالاد سزار سوخاری با سس دست‌ساز اصل',
    descriptionFa: 'کاهو پیچ تازه، فیله مرغ سوخاری، کروتان نان سیر، پنیر پارمزان و سس دست‌ساز سرآشپز',
    priceIrr: 1400000,
    prepTimeMinutes: 10,
    iconText: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'سس اصل',
    calories: 380,
  },
  {
    id: 402,
    category: 'APPETIZER',
    categoryFa: 'پیش‌غذا و سالاد',
    titleFa: 'سیب‌زمینی سرخ‌کرده ویژه با پنیر گودا و بیکن',
    descriptionFa: 'خلال سیب‌زمینی ترد با ادویه مخصوص، سس پنیر چدار ذوب‌شده گرم و بیکن خردشده',
    priceIrr: 950000,
    prepTimeMinutes: 12,
    iconText: '🍟',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80',
    calories: 490,
  },

  // بار کافه و نوشیدنی
  {
    id: 501,
    category: 'CAFE_BAR',
    categoryFa: 'بار کافه و نوشیدنی',
    titleFa: 'اسپرسو دوبل ۱۰۰٪ عربیکا کلمبیا',
    descriptionFa: 'عصاره‌گیری استاندارد با دستگاه صنعتی La Marzocco، نت‌های شکلاتی و آجیلی قوی',
    priceIrr: 650000,
    prepTimeMinutes: 5,
    iconText: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'تک‌خاستگاه',
    calories: 5,
  },
  {
    id: 502,
    category: 'CAFE_BAR',
    categoryFa: 'بار کافه و نوشیدنی',
    titleFa: 'کافه لاته با شیر فوم‌دار ارگانیک و آرت',
    descriptionFa: 'ترکیب اسپرسو کلمبیا با شیر بخار داده شده و میکروفوم لطیف همراه با لاته آرت',
    priceIrr: 850000,
    prepTimeMinutes: 6,
    iconText: '🥛',
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80',
    calories: 140,
  },
  {
    id: 503,
    category: 'CAFE_BAR',
    categoryFa: 'بار کافه و نوشیدنی',
    titleFa: 'ماکتل موهیتو طبیعی با یخ پودری و نعناع تازه',
    descriptionFa: 'لیموترش تازه، نعناع معطر، سیروپ شکر نیشکر دست‌ساز و سودا خنک گازدار',
    priceIrr: 900000,
    prepTimeMinutes: 7,
    iconText: '🍹',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'طبیعی و خنک',
    calories: 120,
  },

  // دسر و شیرینی
  {
    id: 601,
    category: 'DESSERT',
    categoryFa: 'دسر و کیک تازه',
    titleFa: 'چیز کیک سن‌سباستین با سس شکلات بلژیکی',
    descriptionFa: 'چیز کیک سوخته اسپانیایی بسیار خامه‌ای و لطیف همراه با گاناش شکلات گرم کالیباوت',
    priceIrr: 1100000,
    prepTimeMinutes: 5,
    iconText: '🍰',
    imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
    badgeFa: 'بسیار محبوب',
    calories: 420,
  },
];

const PRESET_IMAGES = [
  { name: 'کباب کوبیده', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80' },
  { name: 'جوجه کباب', url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80' },
  { name: 'پیتزا سیر و استیک', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { name: 'برگر کلاسیک', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { name: 'پاستا آلفردو', url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80' },
  { name: 'سالاد سزار', url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80' },
  { name: 'اسپرسو دوبل', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
  { name: 'چیزکیک سن‌سباستین', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80' },
];

export const RestaurantCafeManagementView: React.FC<RestaurantCafeManagementViewProps> = ({
  foundationData,
  onRefresh,
}) => {
  const [tables, setTables] = useState<RestaurantTableRecord[]>(
    foundationData.restaurantTables || []
  );
  const [orders, setOrders] = useState<RestaurantOrderRecord[]>(
    foundationData.restaurantOrders || []
  );

  // Active Tab
  const [activeTabSection, setActiveTabSection] = useState<
    'POS_ORDER' | 'FINANCIAL_CARDEX' | 'MENU_CUSTOMIZATION' | 'ACCOUNTING_MAP' | 'TABLES_VIEW'
  >('POS_ORDER');

  // Dynamic Menu Items from localStorage or Default
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const stored = localStorage.getItem('mehregan_restaurant_menu_custom');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_MENU_ITEMS;
  });

  // Save menu items whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('mehregan_restaurant_menu_custom', JSON.stringify(menuItems));
    } catch {
      // ignore
    }
  }, [menuItems]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [menuSearch, setMenuSearch] = useState<string>('');

  // Cart & Order Form
  const [orderType, setOrderType] = useState<RestaurantOrderType>('DINE_IN');
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('T-01');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'POS' | 'CASH' | 'OPEN_CREDIT'>('POS');
  const [cartLines, setCartLines] = useState<RestaurantOrderLine[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Table filter
  const [tableSectionFilter, setTableSectionFilter] = useState<string>('ALL');

  // Inspection Modal for Order Accounting & Sales Record
  const [inspectedOrder, setInspectedOrder] = useState<RestaurantOrderRecord | null>(null);

  // Cardex Order Editing Modal
  const [editingOrder, setEditingOrder] = useState<RestaurantOrderRecord | null>(null);
  const [editCustomerName, setEditCustomerName] = useState<string>('');
  const [editCustomerPhone, setEditCustomerPhone] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'POS' | 'CASH' | 'OPEN_CREDIT'>('POS');
  const [editStatus, setEditStatus] = useState<'PENDING_KITCHEN' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED'>('PAID');
  const [editTableNumber, setEditTableNumber] = useState<string>('');
  const [isSavingEditOrder, setIsSavingEditOrder] = useState<boolean>(false);

  // Cardex Order Deleting Confirmation Modal
  const [deletingOrder, setDeletingOrder] = useState<RestaurantOrderRecord | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState<boolean>(false);

  // Menu Management Modal (Add/Edit Menu Item)
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAddingNewMenuItem, setIsAddingNewMenuItem] = useState<boolean>(false);
  const [menuFormTitle, setMenuFormTitle] = useState<string>('');
  const [menuFormCategory, setMenuFormCategory] = useState<MenuItem['category']>('IRANIAN');
  const [menuFormDescription, setMenuFormDescription] = useState<string>('');
  const [menuFormPriceToman, setMenuFormPriceToman] = useState<string>('');
  const [menuFormPrepTime, setMenuFormPrepTime] = useState<string>('15');
  const [menuFormIcon, setMenuFormIcon] = useState<string>('🍽');
  const [menuFormImageUrl, setMenuFormImageUrl] = useState<string>('');
  const [menuFormBadge, setMenuFormBadge] = useState<string>('');
  const [menuFormCalories, setMenuFormCalories] = useState<string>('500');

  // Cardex Search & Filters
  const [cardexSearchQuery, setCardexSearchQuery] = useState<string>('');
  const [cardexPaymentFilter, setCardexPaymentFilter] = useState<string>('ALL');

  const fetchTablesAndOrders = async () => {
    try {
      const [tRes, oRes] = await Promise.all([
        fetch('/api/restaurant/tables'),
        fetch('/api/restaurant/orders'),
      ]);
      const tJson = await tRes.json();
      const oJson = await oRes.json();
      if (tJson.ok) setTables(tJson.tables);
      if (oJson.ok) setOrders(oJson.orders);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchTablesAndOrders();
  }, []);

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    let list = menuItems;
    if (selectedCategory !== 'ALL') {
      list = list.filter((m) => m.category === selectedCategory);
    }
    if (menuSearch.trim()) {
      const q = menuSearch.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.titleFa.toLowerCase().includes(q) ||
          m.categoryFa.toLowerCase().includes(q) ||
          m.descriptionFa.toLowerCase().includes(q)
      );
    }
    return list;
  }, [menuItems, selectedCategory, menuSearch]);

  // Filtered Cardex Orders
  const filteredCardexOrders = useMemo(() => {
    let list = orders;
    if (cardexPaymentFilter !== 'ALL') {
      list = list.filter((o) => o.paymentMethod === cardexPaymentFilter);
    }
    if (cardexSearchQuery.trim()) {
      const q = cardexSearchQuery.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          (o.salesInvoiceNumber && o.salesInvoiceNumber.toLowerCase().includes(q)) ||
          (o.accountingDocNumber && o.accountingDocNumber.toLowerCase().includes(q)) ||
          (o.customerNameFa && o.customerNameFa.toLowerCase().includes(q)) ||
          (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
          (o.dateJalali && o.dateJalali.includes(q))
      );
    }
    return list;
  }, [orders, cardexPaymentFilter, cardexSearchQuery]);

  // Cardex Statistics
  const cardexStats = useMemo(() => {
    const totalCount = orders.length;
    const totalAmountIrr = orders.reduce((acc, o) => acc + o.totalPayableIrr, 0);
    const totalAmountToman = Math.round(totalAmountIrr / 10);
    const avgAmountToman = totalCount > 0 ? Math.round(totalAmountToman / totalCount) : 0;
    const posCount = orders.filter((o) => o.paymentMethod === 'POS').length;
    const cashCount = orders.filter((o) => o.paymentMethod === 'CASH').length;
    const openCreditCount = orders.filter((o) => o.paymentMethod === 'OPEN_CREDIT').length;
    return {
      totalCount,
      totalAmountIrr,
      totalAmountToman,
      avgAmountToman,
      posCount,
      cashCount,
      openCreditCount,
    };
  }, [orders]);

  // Cart Calculations
  const subtotalIrr = useMemo(() => {
    return cartLines.reduce((acc, l) => acc + l.quantity * l.unitPriceIrr, 0);
  }, [cartLines]);

  const serviceChargeIrr = orderType === 'DINE_IN' ? Math.round(subtotalIrr * 0.05) : 0;
  const vatAmountIrr = Math.round((subtotalIrr + serviceChargeIrr) * 0.1);
  const totalPayableIrr = subtotalIrr + serviceChargeIrr + vatAmountIrr;
  const totalPayableToman = Math.round(totalPayableIrr / 10);

  // Direct Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          itemId: item.id,
          itemTitleFa: item.titleFa,
          quantity: 1,
          unitPriceIrr: item.priceIrr,
        },
      ];
    });
  };

  const handleUpdateQty = (itemId: number, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((l) => {
          if (l.itemId === itemId) {
            const nextQty = l.quantity + delta;
            return nextQty > 0 ? { ...l, quantity: nextQty } : null;
          }
          return l;
        })
        .filter(Boolean) as RestaurantOrderLine[]
    );
  };

  const handleRemoveLine = (itemId: number) => {
    setCartLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const handleUpdateNote = (itemId: number, note: string) => {
    setCartLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, notesFa: note } : l))
    );
  };

  const handleSubmitOrder = async () => {
    if (cartLines.length === 0) {
      setOrderFeedback({
        type: 'error',
        message: 'سبد سفارش خالی است. لطفاً حداقل یک غذای خوشمزه یا نوشیدنی از منو انتخاب کنید.',
      });
      return;
    }

    setIsSubmittingOrder(true);
    setOrderFeedback(null);

    try {
      const res = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'DINE_IN' ? selectedTableNumber : undefined,
          customerNameFa: customerName.trim() || undefined,
          phone: customerPhone.trim() || undefined,
          lines: cartLines,
          paymentMethod,
          isPaid: paymentMethod !== 'OPEN_CREDIT',
          dateJalali: '1405/01/25',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.messageFa || 'خطا در ثبت سفارش رستوران.');
      }

      setOrderFeedback({
        type: 'success',
        message: `سفارش ${json.order.orderNumber} با موفقیت ثبت شد! فاکتور رسمی [${json.order.salesInvoiceNumber}] صادر و سند دوبل حسابداری [${json.order.accountingDocNumber}] در سرفصل‌های فروش و خزانه‌داری منظور گردید.`,
      });

      // Auto print kitchen thermal ticket
      await handlePrintKitchenTicket(json.order.id);

      setCartLines([]);
      setCustomerName('');
      setCustomerPhone('');
      await fetchTablesAndOrders();
      await onRefresh();
    } catch (err: unknown) {
      setOrderFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطای ارتباط با سرور',
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Kitchen Ticket Print - Premium Thermal Formatting
  const handlePrintKitchenTicket = async (orderId: number) => {
    try {
      const res = await fetch(`/api/restaurant/kitchen-ticket/${orderId}`);
      const json = await res.json();
      if (!json.ok) return;

      const t = json.ticket;
      const linesHtml = t.items
        .map(
          (i: { titleFa: string; quantity: number; notesFa?: string }) => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; border-bottom: 1px dashed #334155; padding: 7px 0; align-items: center;">
          <div style="text-align: right; flex: 1; padding-left: 8px;">
            <span style="color: #0f172a; font-size: 14px;">${i.titleFa}</span>
            ${i.notesFa ? `<div style="color: #ea580c; font-size: 11px; font-weight: bold; margin-top: 2px;">👈 توضیحات: ${i.notesFa}</div>` : ''}
          </div>
          <div style="font-family: monospace, Tahoma; font-size: 18px; font-weight: 900; background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 6px; min-width: 32px; text-align: center;">
            ×${i.quantity}
          </div>
        </div>
      `
        )
        .join('');

      const html = `
        <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; width: 300px; margin: 0 auto; padding: 8px; color: #0f172a;">
          <div style="text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 8px; margin-bottom: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">مجموعه رستوران و کافه مهرگان</div>
            <h2 style="margin: 4px 0 0; font-size: 19px; font-weight: 900; color: #c2410c;">🔥 بن پخت آشپزخانه و بار</h2>
            <div style="margin-top: 6px; font-size: 15px; font-weight: 900; background: #fff7ed; border: 1px solid #fdba74; padding: 4px; border-radius: 8px; color: #9a3412;">
              شماره سفارش: ${t.orderNumber}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <span>نوع سفارش: <strong style="color: #0369a1;">${t.orderTypeFa}</strong></span>
            <span>موقعیت / میز: <strong style="font-size: 16px; color: #c2410c;">${t.tableNumber}</strong></span>
          </div>

          <div style="font-size: 11px; margin-bottom: 10px; color: #475569; text-align: center;">
            📅 تاریخ: ${t.dateJalali} | ⏰ ساعت: ${t.time}
          </div>

          <div style="border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 4px 0; margin-bottom: 12px;">
            ${linesHtml}
          </div>

          <div style="text-align: center; border-top: 2px dashed #0f172a; padding-top: 8px; font-size: 10px; color: #475569; space-y: 2px;">
            <strong>سرآشپز محترم:</strong> لطفاً طبق توضیحات و ترجیحات میهمان آماده‌سازی نمایید.<br/>
            سامانه یکپارچه مدیریت رستوران مهرگان
          </div>
        </div>
      `;

      await printHtmlContent({ title: `بن آشپزخانه ${t.orderNumber}`, bodyHtml: html, isThermal: true });
    } catch {
      // ignore
    }
  };

  // Customer Receipt Print - High Quality Styled Invoice Layout
  const handlePrintCustomerReceipt = async (order: RestaurantOrderRecord) => {
    const linesHtml = order.lines
      .map(
        (l) => `
      <tr>
        <td style="padding: 7px 5px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">
          ${l.itemTitleFa}
          ${l.notesFa ? `<div style="font-size: 9px; color: #64748b; font-weight: normal;">${l.notesFa}</div>` : ''}
        </td>
        <td style="padding: 7px 5px; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; font-size: 13px;">${l.quantity}</td>
        <td style="padding: 7px 5px; text-align: left; border-bottom: 1px solid #e2e8f0; color: #475569;">${l.unitPriceIrr.toLocaleString('fa-IR')}</td>
        <td style="padding: 7px 5px; text-align: left; border-bottom: 1px solid #e2e8f0; font-weight: 900; color: #0f172a;">${(l.quantity * l.unitPriceIrr).toLocaleString('fa-IR')}</td>
      </tr>
    `
      )
      .join('');

    const totalToman = Math.round(order.totalPayableIrr / 10);

    const html = `
      <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; width: 340px; margin: 0 auto; padding: 12px; color: #0f172a; background: #ffffff;">
        {/* Header Branding */}
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #c2410c; text-transform: uppercase;">MEHREGAN RESTAURANT & CAFE</div>
          <h2 style="margin: 2px 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">مجموعه رستوران و کافه مهرگان</h2>
          <p style="margin: 3px 0 0; font-size: 11px; color: #64748b; font-weight: bold;">صورت‌حساب رسمی فروش غذا و خدمات پذیرایی</p>
          
          <div style="margin-top: 10px; font-size: 11px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 8px; display: flex; justify-content: space-between;">
            <span>شماره فاکتور: <strong style="color: #0284c7;">${order.salesInvoiceNumber || order.orderNumber}</strong></span>
            <span>میز / بخش: <strong>${order.tableNumber || 'بیرون‌بر'}</strong></span>
          </div>

          <div style="font-size: 11px; text-align: right; margin-top: 6px; color: #334155; display: flex; justify-content: space-between;">
            <span>مشتری: <strong>${order.customerNameFa || 'میهمان گرامی'}</strong></span>
            <span>تاریخ: <strong>${order.dateJalali}</strong></span>
          </div>
        </div>

        {/* Items Table */}
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #334155;">
              <th style="padding: 6px 5px; text-align: right; border: none;">شرح غذا / نوشیدنی</th>
              <th style="padding: 6px 5px; text-align: center; border: none;">تعداد</th>
              <th style="padding: 6px 5px; text-align: left; border: none;">فی (ریال)</th>
              <th style="padding: 6px 5px; text-align: left; border: none;">جمع (ریال)</th>
            </tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
        </table>

        {/* Price Totals Breakdown */}
        <div style="border-top: 2px solid #0f172a; padding-top: 8px; font-size: 11px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>جمع اقلام غذا و نوشیدنی:</span>
            <span style="font-weight: bold;">${order.subtotalIrr.toLocaleString('fa-IR')} ریال</span>
          </div>
          ${
            order.serviceChargeIrr > 0
              ? `<div style="display: flex; justify-content: space-between; color: #475569;">
                  <span>حق سرویس پذیرایی سالن (۵٪):</span>
                  <span style="font-weight: bold;">${order.serviceChargeIrr.toLocaleString('fa-IR')} ریال</span>
                </div>`
              : ''
          }
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>مالیات بر ارزش افزوده قانونی (۱۰٪):</span>
            <span style="font-weight: bold;">${order.vatAmountIrr.toLocaleString('fa-IR')} ریال</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 8px; border-top: 2px solid #0f172a; padding-top: 8px; background: #fff7ed; padding: 8px; border-radius: 8px; color: #7c2d12; border: 1px solid #ffedd5;">
            <span>مبلغ قابل پرداخت:</span>
            <span>${order.totalPayableIrr.toLocaleString('fa-IR')} ریال</span>
          </div>

          <div style="text-align: left; font-size: 11px; font-weight: 900; color: #c2410c; margin-top: 4px; padding-left: 4px;">
            (معادل ${totalToman.toLocaleString('fa-IR')} تومان)
          </div>
        </div>

        {/* Footer Info */}
        <div style="text-align: center; border-top: 1px dashed #cbd5e1; margin-top: 14px; padding-top: 10px; font-size: 10px; color: #64748b; line-height: 1.6;">
          روش تسویه: <strong style="color: #0f172a;">${
            order.paymentMethod === 'POS'
              ? 'کارتخوان بانکی'
              : order.paymentMethod === 'CASH'
              ? 'نقدی'
              : 'حساب دفتری اعتباری'
          }</strong><br/>
          کد رهگیری سند حسابداری: <strong style="color: #4f46e5;">${
            order.accountingDocNumber || 'DOC-REST-AUTO'
          }</strong><br/>
          آدرس: تهران، خیابان ولیعصر، بالاتر از پارک وی، پلاک ۱۲۸۸<br/>
          <span style="font-weight: bold; color: #0f172a; display: block; margin-top: 4px;">از حضور گرم و انتخاب شما صمیمانه سپاسگزاریم! ❤️</span>
        </div>
      </div>
    `;

    await printHtmlContent({ title: `فاکتور فروش ${order.orderNumber}`, bodyHtml: html, isThermal: true });
  };

  // Toggle table status
  const handleToggleTableStatus = async (tableId: number, currentStatus: TableStatus) => {
    const nextStatus: TableStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE';
    try {
      await fetch(`/api/restaurant/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await fetchTablesAndOrders();
    } catch {
      // ignore
    }
  };

  // Handle Edit Order Submit
  const handleOpenEditOrderModal = (order: RestaurantOrderRecord) => {
    setEditingOrder(order);
    setEditCustomerName(order.customerNameFa || '');
    setEditCustomerPhone(order.phone || '');
    setEditPaymentMethod(order.paymentMethod || 'POS');
    setEditStatus(order.status || 'PAID');
    setEditTableNumber(order.tableNumber || '');
  };

  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return;
    setIsSavingEditOrder(true);
    try {
      const res = await fetch(`/api/restaurant/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNameFa: editCustomerName.trim(),
          phone: editCustomerPhone.trim(),
          paymentMethod: editPaymentMethod,
          status: editStatus,
          tableNumber: editTableNumber.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.messageFa || 'خطا در ویرایش سفارش.');
      }

      setOrderFeedback({
        type: 'success',
        message: `سفارش ${editingOrder.orderNumber} با موفقیت ویرایش و اصلاح گردید.`,
      });

      setEditingOrder(null);
      await fetchTablesAndOrders();
      await onRefresh();
    } catch (err: unknown) {
      setOrderFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در ویرایش سفارش',
      });
    } finally {
      setIsSavingEditOrder(false);
    }
  };

  // Handle Delete Order Submit
  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    setIsDeletingOrder(true);
    try {
      const res = await fetch(`/api/restaurant/orders/${deletingOrder.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.messageFa || 'خطا در حذف سفارش.');
      }

      setOrderFeedback({
        type: 'success',
        message: `سفارش ${deletingOrder.orderNumber} با موفقیت از سیستم حذف گردید.`,
      });

      setDeletingOrder(null);
      await fetchTablesAndOrders();
      await onRefresh();
    } catch (err: unknown) {
      setOrderFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'خطا در حذف سفارش',
      });
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Menu Management Handlers
  const handleOpenAddMenuModal = () => {
    setEditingMenuItem(null);
    setIsAddingNewMenuItem(true);
    setMenuFormTitle('');
    setMenuFormCategory('IRANIAN');
    setMenuFormDescription('');
    setMenuFormPriceToman('250000');
    setMenuFormPrepTime('15');
    setMenuFormIcon('🍢');
    setMenuFormImageUrl(PRESET_IMAGES[0].url);
    setMenuFormBadge('');
    setMenuFormCalories('600');
  };

  const handleOpenEditMenuModal = (item: MenuItem) => {
    setEditingMenuItem(item);
    setIsAddingNewMenuItem(false);
    setMenuFormTitle(item.titleFa);
    setMenuFormCategory(item.category);
    setMenuFormDescription(item.descriptionFa);
    setMenuFormPriceToman(String(Math.round(item.priceIrr / 10)));
    setMenuFormPrepTime(String(item.prepTimeMinutes));
    setMenuFormIcon(item.iconText);
    setMenuFormImageUrl(item.imageUrl);
    setMenuFormBadge(item.badgeFa || '');
    setMenuFormCalories(String(item.calories || 500));
  };

  const handleSaveMenuItem = () => {
    if (!menuFormTitle.trim()) {
      alert('لطفاً عنوان غذا یا نوشیدنی را وارد کنید.');
      return;
    }

    const priceTomanNum = Number(menuFormPriceToman) || 0;
    const priceIrrNum = priceTomanNum * 10;
    const categoryFaMap: Record<MenuItem['category'], string> = {
      IRANIAN: 'کباب و ایرانی اصیل',
      FAST_FOOD: 'پیتزا و فست‌فود',
      PASTA_BURGER: 'پاستا و برگر دست‌ساز',
      APPETIZER: 'پیش‌غذا و سالاد',
      CAFE_BAR: 'بار کافه و نوشیدنی',
      DESSERT: 'دسر و کیک تازه',
    };

    if (isAddingNewMenuItem) {
      const newId = menuItems.reduce((max, i) => Math.max(max, i.id), 100) + 1;
      const newItem: MenuItem = {
        id: newId,
        category: menuFormCategory,
        categoryFa: categoryFaMap[menuFormCategory],
        titleFa: menuFormTitle.trim(),
        descriptionFa: menuFormDescription.trim(),
        priceIrr: priceIrrNum,
        prepTimeMinutes: Number(menuFormPrepTime) || 15,
        iconText: menuFormIcon || '🍽',
        imageUrl: menuFormImageUrl.trim() || PRESET_IMAGES[0].url,
        badgeFa: menuFormBadge.trim() || undefined,
        calories: Number(menuFormCalories) || undefined,
      };
      setMenuItems((prev) => [newItem, ...prev]);
    } else if (editingMenuItem) {
      setMenuItems((prev) =>
        prev.map((i) =>
          i.id === editingMenuItem.id
            ? {
                ...i,
                category: menuFormCategory,
                categoryFa: categoryFaMap[menuFormCategory],
                titleFa: menuFormTitle.trim(),
                descriptionFa: menuFormDescription.trim(),
                priceIrr: priceIrrNum,
                prepTimeMinutes: Number(menuFormPrepTime) || 15,
                iconText: menuFormIcon || '🍽',
                imageUrl: menuFormImageUrl.trim() || i.imageUrl,
                badgeFa: menuFormBadge.trim() || undefined,
                calories: Number(menuFormCalories) || undefined,
              }
            : i
        )
      );
    }

    setIsAddingNewMenuItem(false);
    setEditingMenuItem(null);
  };

  const handleDeleteMenuItem = (itemId: number) => {
    if (confirm('آیا از حذف این آیتم از منو اطمینان دارید؟')) {
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleResetToDefaultMenu = () => {
    if (confirm('آیا مایلید منو به حالت پیش‌فرض اولیه بازگردانی شود؟')) {
      setMenuItems(DEFAULT_MENU_ITEMS);
      localStorage.removeItem('mehregan_restaurant_menu_custom');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden border border-amber-600/40">
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/70 text-orange-200 text-xs font-bold border border-orange-400/30 backdrop-blur-md">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-300" />
              <span>کاردکس تخصصی تصویری، شخصی‌سازی منو و مدیریت سفارشات رستوران</span>
            </div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              <span>منوی تصویری لمسی، مدیریت غذاها و اصلاح کامل کاردکس</span>
              <span className="text-xs font-normal px-2.5 py-1 rounded-lg bg-white/15 text-orange-100">فاز ۷ و ۸</span>
            </h1>
            <p className="text-xs md:text-sm text-orange-100/90 leading-relaxed max-w-3xl">
              امکان شخصی‌سازی کامل غذاها و قیمت‌ها، ثبت و ویرایش سفارشات، حذف و چاپ مجدد رسید حرارتی با کیفیت چاپ تخصصی.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-orange-200 block font-medium">آیتم‌های فعال منو</span>
              <span className="text-xl font-black text-amber-100">{menuItems.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-orange-200 block font-medium">میزهای اشغال سالن</span>
              <span className="text-xl font-black text-amber-100">
                {tables.filter((t) => t.status === 'OCCUPIED').length} / {tables.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-inner">
              <span className="text-[10px] text-orange-200 block font-medium">کل سفارشات ثبت‌شده</span>
              <span className="text-xl font-black text-amber-100">{orders.length}</span>
            </div>
          </div>
        </div>

        {/* Sub Nav Tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-orange-500/40">
          <button
            type="button"
            onClick={() => setActiveTabSection('POS_ORDER')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTabSection === 'POS_ORDER'
                ? 'bg-white text-orange-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-orange-950/60 text-orange-100 hover:bg-orange-900/80 border border-orange-500/30'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
            <span>منوی تصویری و ثبت سریع POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('FINANCIAL_CARDEX')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTabSection === 'FINANCIAL_CARDEX'
                ? 'bg-white text-orange-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-orange-950/60 text-orange-100 hover:bg-orange-900/80 border border-orange-500/30'
            }`}
          >
            <Receipt className="w-4 h-4 text-orange-600" />
            <span>کاردکس سفارشات (ویرایش، حذف و چاپ) ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('MENU_CUSTOMIZATION')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTabSection === 'MENU_CUSTOMIZATION'
                ? 'bg-white text-orange-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-orange-950/60 text-orange-100 hover:bg-orange-900/80 border border-orange-500/30'
            }`}
          >
            <Settings className="w-4 h-4 text-orange-600" />
            <span>مدیریت و شخصی‌سازی منو</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('ACCOUNTING_MAP')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTabSection === 'ACCOUNTING_MAP'
                ? 'bg-white text-orange-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-orange-950/60 text-orange-100 hover:bg-orange-900/80 border border-orange-500/30'
            }`}
          >
            <Landmark className="w-4 h-4 text-amber-500" />
            <span>ردپای حسابداری و چرخه فروش غذا</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSection('TABLES_VIEW')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTabSection === 'TABLES_VIEW'
                ? 'bg-white text-orange-950 shadow-md ring-2 ring-white/50 scale-[1.02]'
                : 'bg-orange-950/60 text-orange-100 hover:bg-orange-900/80 border border-orange-500/30'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-orange-600" />
            <span>مدیریت سالن و نقشه میزها ({tables.length})</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {orderFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs ${
            orderFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {orderFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="leading-relaxed">{orderFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setOrderFeedback(null)}
            className="hover:opacity-75 cursor-pointer font-black text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: POS TOUCH ORDER & VISUAL MENU (کاردکس تصویری غذا و نوشیدنی) */}
      {/* ========================================================================= */}
      {activeTabSection === 'POS_ORDER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visual Food Menu (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Category Filter Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    placeholder="جستجوی سریع غذا، نوشیدنی، کباب، برگر، قهوه، پیتزا..."
                    className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  />
                </div>

                <div className="text-xs text-slate-500 font-bold shrink-0 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span>نمایش {filteredMenuItems.length} آیتم فعال در منو</span>
                  <button
                    type="button"
                    onClick={() => setActiveTabSection('MENU_CUSTOMIZATION')}
                    className="text-orange-700 hover:underline font-black text-[11px] flex items-center gap-1 cursor-pointer mr-2"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>ویرایش منو</span>
                  </button>
                </div>
              </div>

              {/* Category Pills with Icons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: 'همه آیتم‌ها', icon: '🍽' },
                  { id: 'IRANIAN', label: 'کباب و ایرانی', icon: '🍢' },
                  { id: 'FAST_FOOD', label: 'پیتزا و فست‌فود', icon: '🍕' },
                  { id: 'PASTA_BURGER', label: 'پاستا و برگر', icon: '🍔' },
                  { id: 'APPETIZER', label: 'سالاد و پیش‌غذا', icon: '🥗' },
                  { id: 'CAFE_BAR', label: 'بار کافه و نوشیدنی', icon: '☕' },
                  { id: 'DESSERT', label: 'دسر و کیک', icon: '🍰' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400/40'
                        : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-950 border border-slate-200/50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => {
                const countInCart = cartLines.find((l) => l.itemId === item.id)?.quantity || 0;
                return (
                  <div
                    key={item.id}
                    className={`group relative bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between hover:shadow-lg ${
                      countInCart > 0
                        ? 'border-orange-500 ring-2 ring-orange-300 shadow-md'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    {/* Top Image Banner */}
                    <div
                      className="relative h-36 w-full overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => handleAddToCart(item)}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.titleFa}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Badges */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <span>{item.iconText}</span>
                          <span>{item.categoryFa}</span>
                        </span>
                      </div>

                      {item.badgeFa && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                          {item.badgeFa}
                        </span>
                      )}

                      {/* Prep time & calories */}
                      <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between text-white text-[10px] font-bold">
                        <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          <Clock className="w-3 h-3 text-amber-300" />
                          <span>{item.prepTimeMinutes} دقیقه</span>
                        </span>
                        {item.calories && (
                          <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span>{item.calories} کالری</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content & Action */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <h4
                          onClick={() => handleAddToCart(item)}
                          className="text-xs font-black text-slate-900 group-hover:text-orange-700 transition-colors leading-snug cursor-pointer line-clamp-1"
                        >
                          {item.titleFa}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.descriptionFa}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="font-black text-slate-900 text-xs">
                            {item.priceIrr.toLocaleString('fa-IR')}{' '}
                            <span className="text-[10px] font-normal text-slate-500">ریال</span>
                          </div>
                          <div className="text-[10px] text-orange-700 font-bold">
                            {Math.round(item.priceIrr / 10).toLocaleString('fa-IR')} تومان
                          </div>
                        </div>

                        {countInCart > 0 ? (
                          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-300 p-1 rounded-2xl shadow-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQty(item.id, -1);
                              }}
                              className="w-6 h-6 rounded-xl bg-white text-orange-700 hover:bg-orange-600 hover:text-white flex items-center justify-center font-black transition-colors shadow-xs cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-xs px-1.5 text-orange-950">
                              {countInCart}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateQty(item.id, 1);
                              }}
                              className="w-6 h-6 rounded-xl bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center font-black transition-colors shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white font-black text-xs transition-all shadow-xs cursor-pointer border border-orange-200"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>افزودن</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar POS Order Cart (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 border-orange-200 shadow-xl space-y-4 sticky top-4 rounded-3xl bg-white/95 backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">
                      کاردکس زنده فاکتور و صدور سفارش
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      {cartLines.length > 0 ? `${cartLines.length} قلم در سبد انتخاب شده` : 'در انتظار انتخاب غذا'}
                    </span>
                  </div>
                </div>

                {cartLines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCartLines([])}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer hover:underline"
                  >
                    پاک کردن
                  </button>
                )}
              </div>

              {/* Order Type Toggle */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    orderType === 'DINE_IN'
                      ? 'bg-white text-orange-950 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>سالن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-white text-orange-950 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>بیرون‌بر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    orderType === 'DELIVERY'
                      ? 'bg-white text-orange-950 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>پیک</span>
                </button>
              </div>

              {/* Table or Customer selector */}
              {orderType === 'DINE_IN' ? (
                <div className="space-y-1 text-xs">
                  <label className="block font-bold text-slate-700">انتخاب شماره میز سالن:</label>
                  <select
                    value={selectedTableNumber}
                    onChange={(e) => setSelectedTableNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white"
                  >
                    {tables.map((t) => (
                      <option key={t.id} value={t.tableNumber}>
                        {t.titleFa} - {t.capacity} نفره ({t.sectionFa}) {t.status === 'OCCUPIED' ? '⚠️ اشغال' : '✔ آزاد'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">نام مشتری:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="آقای احمدی"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">شماره تماس:</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-left font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cartLines.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 space-y-2.5 border-2 border-dashed border-slate-200 rounded-2xl">
                    <UtensilsCrossed className="w-9 h-9 mx-auto opacity-30 text-orange-600" />
                    <p className="text-xs font-bold text-slate-600">سبد سفارش در حال حاضر خالی است.</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                      روی هر کدام از تصاویر یا کارت‌های منو کلیک کنید تا بلافاصله افزوده شود.
                    </p>
                  </div>
                ) : (
                  cartLines.map((line) => (
                    <div
                      key={line.itemId}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-orange-50/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800 line-clamp-1">{line.itemTitleFa}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.itemId)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                          title="حذف قلم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(line.itemId, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black px-1 text-slate-900">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(line.itemId, 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-left font-black text-slate-900">
                          {(line.quantity * line.unitPriceIrr).toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-normal text-slate-500">ریال</span>
                        </div>
                      </div>

                      {/* Kitchen Note */}
                      <input
                        type="text"
                        value={line.notesFa || ''}
                        onChange={(e) => handleUpdateNote(line.itemId, e.target.value)}
                        placeholder="یادداشت آشپزخانه (مثلاً: کم‌نمک، سس اضافه...)"
                        className="w-full text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
                <span className="block font-bold text-slate-700">روش تسویه فاکتور:</span>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('POS')}
                    className={`py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'POS'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-300 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>کارتخوان</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-400 ring-2 ring-emerald-300 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>نقدی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('OPEN_CREDIT')}
                    className={`py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      paymentMethod === 'OPEN_CREDIT'
                        ? 'bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-300 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>حساب باز</span>
                  </button>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>جمع اقلام غذا و نوشیدنی:</span>
                  <span className="font-bold">{subtotalIrr.toLocaleString('fa-IR')} ریال</span>
                </div>
                {serviceChargeIrr > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>حق سرویس سالن (۵٪):</span>
                    <span className="font-bold">{serviceChargeIrr.toLocaleString('fa-IR')} ریال</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                  <span className="font-bold">{vatAmountIrr.toLocaleString('fa-IR')} ریال</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>جمع کل فاکتور:</span>
                  <span className="text-orange-950 font-black">
                    {totalPayableIrr.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
                <div className="text-left text-[11px] font-black text-orange-700">
                  معادل {totalPayableToman.toLocaleString('fa-IR')} تومان
                </div>
              </div>

              {/* Submit & Send to Kitchen Button */}
              <Button
                variant="primary"
                onClick={handleSubmitOrder}
                disabled={isSubmittingOrder || cartLines.length === 0}
                className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-800 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {isSubmittingOrder ? 'در حال ثبت فاکتور و ارسال به آشپزخانه...' : 'ثبت فاکتور، کسر انبار و ارسال به آشپزخانه'}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: FINANCIAL CARDEX (کاردکس سفارشات: اصلاح، حذف، نمایش و چاپ) */}
      {/* ========================================================================= */}
      {activeTabSection === 'FINANCIAL_CARDEX' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md">
          {/* Top Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1">
              <span className="text-xs font-bold text-amber-800 block">کل فروش کاردکس رستوران</span>
              <div className="text-xl font-black">{cardexStats.totalAmountToman.toLocaleString('fa-IR')} تومان</div>
              <span className="text-[10px] text-amber-700 font-mono block">({cardexStats.totalAmountIrr.toLocaleString('fa-IR')} ریال)</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1">
              <span className="text-xs font-bold text-blue-800 block">تعداد فاکتورهای ثبت‌شده</span>
              <div className="text-xl font-black">{cardexStats.totalCount} فاکتور</div>
              <span className="text-[10px] text-blue-700 font-medium block">میانگین: {cardexStats.avgAmountToman.toLocaleString('fa-IR')} تومان</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
              <span className="text-xs font-bold text-emerald-800 block">تفکیک تسویه خزانه‌داری</span>
              <div className="text-sm font-black flex items-center justify-between pt-1">
                <span>💳 کارتخوان: {cardexStats.posCount}</span>
                <span>💵 نقدی: {cardexStats.cashCount}</span>
              </div>
              <span className="text-[10px] text-emerald-700 block">تسویه آنی بانک و صندوق</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-1">
              <span className="text-xs font-bold text-indigo-800 block">حساب‌های دفتری باز</span>
              <div className="text-xl font-black">{cardexStats.openCreditCount} فاکتور</div>
              <span className="text-[10px] text-indigo-700 block">منظور شده به بدهکار مشتریان</span>
            </div>
          </div>

          {/* Header Controls & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-700" />
                <h3 className="text-base font-black text-slate-900">
                  کاردکس سفارشات و تراکنش‌های فروش رستوران
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                امکان کامل اصلاح مشخصات معامله، حذف، مشاهده جزئیات حسابداری و چاپ مجدد فاکتور/بن حرارتی.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={cardexSearchQuery}
                  onChange={(e) => setCardexSearchQuery(e.target.value)}
                  placeholder="جستجوی شماره سفارش، فاکتور، سند، نام..."
                  className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <select
                value={cardexPaymentFilter}
                onChange={(e) => setCardexPaymentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="ALL">همه روش‌های پرداخت</option>
                <option value="POS">کارتخوان (POS)</option>
                <option value="CASH">نقدی (CASH)</option>
                <option value="OPEN_CREDIT">حساب باز / اعتباری</option>
              </select>
            </div>
          </div>

          {/* Cardex Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-black">
                  <th className="py-3 px-3">شماره سفارش</th>
                  <th className="py-3 px-3">شماره فاکتور فروش</th>
                  <th className="py-3 px-3">سند حسابداری</th>
                  <th className="py-3 px-3">مشتری / میز</th>
                  <th className="py-3 px-3">تاریخ و زمان</th>
                  <th className="py-3 px-3 text-center">اقلام</th>
                  <th className="py-3 px-3 text-left">مبلغ کل (ریال)</th>
                  <th className="py-3 px-3 text-center">پرداخت</th>
                  <th className="py-3 px-3 text-center">عملیات (ویرایش، حذف، چاپ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCardexOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      هیچ سفارشی مطابق با فیلتر یا جستجوی شما یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredCardexOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-3 px-3 font-black text-orange-900">{order.orderNumber}</td>
                      <td className="py-3 px-3 font-mono text-teal-800 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 inline-block">
                          {order.salesInvoiceNumber || `INV-REST-1405-${order.id}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-indigo-800 font-bold">
                        <button
                          type="button"
                          onClick={() => setInspectedOrder(order)}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 inline-flex items-center gap-1 hover:bg-indigo-100 cursor-pointer"
                          title="مشاهده سند حسابداری"
                        >
                          <span>{order.accountingDocNumber || 'DOC-REST-AUTO'}</span>
                          <ExternalLink className="w-3 h-3 text-indigo-600" />
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{order.customerNameFa}</div>
                        <div className="text-[10px] text-slate-500">
                          {order.tableNumber ? `سالن - میز ${order.tableNumber}` : 'بیرون‌بر / پیک'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {order.dateJalali}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {order.lines.length} قلم
                        </span>
                      </td>
                      <td className="py-3 px-3 text-left font-black text-emerald-800">
                        {order.totalPayableIrr.toLocaleString('fa-IR')}{' '}
                        <span className="text-[10px] font-normal text-slate-400">ریال</span>
                        <div className="text-[10px] font-bold text-orange-700">
                          {Math.round(order.totalPayableIrr / 10).toLocaleString('fa-IR')} تومان
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            order.paymentMethod === 'POS'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : order.paymentMethod === 'CASH'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {order.paymentMethod === 'POS'
                            ? 'کارتخوان'
                            : order.paymentMethod === 'CASH'
                            ? 'نقدی'
                            : 'حساب باز'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => setInspectedOrder(order)}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            title="مشاهده جزئیات معامله"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Transaction Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditOrderModal(order)}
                            className="p-1.5 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                            title="اصلاح و ویرایش معامله"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Transaction Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            className="p-1.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                            title="حذف معامله"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Kitchen Ticket Print */}
                          <button
                            type="button"
                            onClick={() => handlePrintKitchenTicket(order.id)}
                            className="p-1.5 rounded-xl bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer"
                            title="چاپ بن پخت آشپزخانه"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                          </button>

                          {/* Customer Receipt Print */}
                          <button
                            type="button"
                            onClick={() => handlePrintCustomerReceipt(order)}
                            className="p-1.5 rounded-xl bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer"
                            title="چاپ فاکتور رسمی مشتری"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: MENU CUSTOMIZATION & MANAGEMENT (مدیریت و شخصی‌سازی منوی غذا) */}
      {/* ========================================================================= */}
      {activeTabSection === 'MENU_CUSTOMIZATION' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-700" />
                <h3 className="text-base font-black text-slate-900">
                  مدیریت، تغییر و شخصی‌سازی منوی غذایی و نوشیدنی‌ها
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                افزودن غذا و نوشیدنی جدید، تغییر قیمت، تصاویر، زمان پخت و توضیحات سرآشپز با اعمال آنی در صندوق لمسی POS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefaultMenu}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-600" />}
              >
                بازنشانی به منوی اولیه
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddMenuModal}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                افزودن غذا / نوشیدنی جدید
              </Button>
            </div>
          </div>

          {/* Menu Items Admin Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.titleFa}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-slate-900 truncate">{item.titleFa}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.categoryFa}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{item.descriptionFa}</p>
                    <div className="font-black text-orange-900 text-xs pt-1">
                      {Math.round(item.priceIrr / 10).toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">تومان</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                    <span>⏱ {item.prepTimeMinutes} دقیقه</span>
                    {item.calories && <span>🔥 {item.calories} کالری</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditMenuModal(item)}
                      className="p-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer font-bold text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer font-bold text-xs"
                      title="حذف غذا"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: ACCOUNTING & SALES FLOW MAP (پاسخ بصری حسابداری) */}
      {/* ========================================================================= */}
      {activeTabSection === 'ACCOUNTING_MAP' && (
        <Card className="p-6 space-y-6 rounded-3xl border-slate-200 shadow-lg">
          <div className="pb-4 border-b border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <Landmark className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-black text-slate-900">
                ردپای حسابداری: وقتی فاکتور غذا ثبت و ارسال به آشپزخانه می‌شود، حسابش کجا ثبت می‌شود؟
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              توضیح کامل چرخه یکپارچگی خودکار ۴ گانه بین صندوق رستوران، دفتر کل فروش، خزانه‌داری بانکی، انبار مواد غذایی و اسناد دوبل حسابداری.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۱
              </div>
              <h4 className="text-xs font-black text-teal-950">۱. ثبت در فاکتورهای فروش (Sales)</h4>
              <p className="text-[11px] text-teal-900/80 leading-relaxed">
                بلافاصله یک فاکتور فروش رسمی با کد <code className="bg-teal-100 px-1 rounded font-bold">INV-REST-1405-xxx</code> در تب «فروش» سیستم صادر می‌شود.
              </p>
              <div className="text-[10px] text-teal-800 font-bold bg-white p-2 rounded-xl border border-teal-200">
                ✔ افزایش فوری کل فروش روزانه و ماهانه در داشبورد مدیران
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۲
              </div>
              <h4 className="text-xs font-black text-blue-950">۲. ثبت در خزانه‌داری (Treasury)</h4>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                مبلغ فاکتور به عنوان تراکنش دریافتی <code className="bg-blue-100 px-1 rounded font-bold">TRX-REST-1405-xxx</code> مستقیم به حساب بانکی کارتخوان (POS) یا صندوق واریز می‌شود.
              </p>
              <div className="text-[10px] text-blue-800 font-bold bg-white p-2 rounded-xl border border-blue-200">
                ✔ موجودی بانک و صندوق نقد در لحظه به‌روز می‌شود
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۳
              </div>
              <h4 className="text-xs font-black text-amber-950">۳. سند دوبل در دفتر روزنامه</h4>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                یک سند رسمی حسابداری دوبل با شماره <code className="bg-amber-100 px-1 rounded font-bold">DOC-REST-xxx</code> ثبت می‌شود:
              </p>
              <div className="text-[10px] text-amber-950 font-mono bg-white p-2 rounded-xl border border-amber-200 space-y-1">
                <div>بد: بانک / کارتخوان (کد ۱۰۲۰)</div>
                <div>بس: درآمد فروش غذا (کد ۶۰۱۰)</div>
                <div>بس: مالیات ارزش افزوده (کد ۳۰۴۰)</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                ۴
              </div>
              <h4 className="text-xs font-black text-orange-950">۴. چاپ بن و کسر مواد انبار</h4>
              <p className="text-[11px] text-orange-900/80 leading-relaxed">
                فیش حرارتی سفارش به پرینتر پخت سرآشپز ارسال می‌شود و بر مبنای فرمول غذا، بهای تمام شده کالای فروش رفته (COGS) در کاردکس انبار محاسبه می‌گردد.
              </p>
              <div className="text-[10px] text-orange-800 font-bold bg-white p-2 rounded-xl border border-orange-200">
                ✔ میز در نقشه سالن بلافاصله قرمز و اشغال می‌گردد
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: TABLES & SECTIONS VIEW (مدیریت سالن و نقشه میزها) */}
      {/* ========================================================================= */}
      {activeTabSection === 'TABLES_VIEW' && (
        <Card className="p-6 space-y-4 rounded-3xl border-slate-200 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800">
                نقشه وضعیت میزهای سالن و فضاهای پذیرایی
              </h3>
              <p className="text-xs text-slate-500">
                مشاهده بلادرنگ میزهای اشغال، جاری، رزرو و امکان تغییر سریع وضعیت میز پس از خروج مشتری
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">فیلتر بخش:</span>
              <select
                value={tableSectionFilter}
                onChange={(e) => setTableSectionFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
              >
                <option value="ALL">همه بخش‌های رستوران</option>
                <option value="سالن اصلی">سالن اصلی</option>
                <option value="تراس و بالکن">تراس و بالکن</option>
                <option value="سالن VIP">سالن VIP اختصاصی</option>
                <option value="طبقه دوم">طبقه دوم</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {tables
              .filter((t) => tableSectionFilter === 'ALL' || t.sectionFa === tableSectionFilter)
              .map((table) => {
                const isOccupied = table.status === 'OCCUPIED';
                const isReserved = table.status === 'RESERVED';
                return (
                  <div
                    key={table.id}
                    className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                      isOccupied
                        ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200 shadow-sm'
                        : isReserved
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-800">{table.tableNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isOccupied
                            ? 'bg-rose-100 text-rose-800'
                            : isReserved
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOccupied ? 'اشغال' : isReserved ? 'رزرو' : 'آماده پذیرش'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{table.titleFa}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ظرفیت: {table.capacity} نفر | {table.sectionFa}
                      </div>
                      {table.currentOrderAmountIrr && (
                        <div className="mt-2 text-xs font-black text-orange-900 bg-orange-100/70 px-2.5 py-1 rounded-xl">
                          سفارش جاری: {table.currentOrderAmountIrr.toLocaleString('fa-IR')} ریال
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant={isOccupied ? 'outline' : 'secondary'}
                        onClick={() => handleToggleTableStatus(table.id, table.status)}
                      >
                        {isOccupied ? 'تخلیه و تسویه' : 'اشغال میز'}
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedTableNumber(table.tableNumber);
                          setOrderType('DINE_IN');
                          setActiveTabSection('POS_ORDER');
                        }}
                      >
                        ثبت سفارش
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: View Order Accounting & Line Details */}
      {/* ========================================================================= */}
      {inspectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-700" />
                <h3 className="text-sm font-black text-slate-900">
                  ردپای مالی و جزئیات فاکتور {inspectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">شماره فاکتور در فروش:</span>
                  <span className="font-mono font-bold text-teal-800">
                    {inspectedOrder.salesInvoiceNumber || `INV-REST-1405-${inspectedOrder.id}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">شماره سند روزنامه:</span>
                  <span className="font-mono font-bold text-indigo-800">
                    {inspectedOrder.accountingDocNumber || 'DOC-REST-AUTO'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">مبلغ کل تسویه شده:</span>
                  <span className="font-black text-emerald-800">
                    {inspectedOrder.totalPayableIrr.toLocaleString('fa-IR')} ریال
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">روش پرداخت:</span>
                  <span className="font-bold text-slate-800">
                    {inspectedOrder.paymentMethod === 'POS' ? 'کارتخوان بانک' : inspectedOrder.paymentMethod === 'CASH' ? 'صندوق نقد' : 'حساب دفتری'}
                  </span>
                </div>
              </div>

              {/* Items in this order */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">اقلام غذایی سفارش:</span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                  {inspectedOrder.lines.map((l, i) => (
                    <div key={i} className="p-2.5 flex justify-between items-center bg-white text-xs">
                      <span className="font-bold text-slate-800">
                        {l.itemTitleFa} {l.notesFa ? <small className="text-slate-400">({l.notesFa})</small> : ''}
                      </span>
                      <span className="font-mono">
                        {l.quantity} × {l.unitPriceIrr.toLocaleString('fa-IR')} ریال
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePrintCustomerReceipt(inspectedOrder);
                }}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                چاپ فاکتور
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setInspectedOrder(null)}>
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Order Transaction Modal (اصلاح معامله) */}
      {/* ========================================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-amber-800">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  اصلاح و ویرایش معامله سفارش {editingOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">نام و عنوان مشتری:</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">شماره تماس مشتری:</label>
                <input
                  type="text"
                  value={editCustomerPhone}
                  onChange={(e) => setEditCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">شماره میز / بخش:</label>
                  <input
                    type="text"
                    value={editTableNumber}
                    onChange={(e) => setEditTableNumber(e.target.value)}
                    placeholder="T-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">روش پرداخت:</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="POS">کارتخوان (POS)</option>
                    <option value="CASH">نقدی (CASH)</option>
                    <option value="OPEN_CREDIT">حساب باز / اعتباری</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">وضعیت سفارش در آشپزخانه:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="PENDING_KITCHEN">ارسال به آشپزخانه</option>
                  <option value="PREPARING">در حال پخت</option>
                  <option value="SERVED">سرو شد</option>
                  <option value="PAID">تسویه شد</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditingOrder(null)}>
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEditedOrder}
                disabled={isSavingEditOrder}
                className="bg-amber-600 hover:bg-amber-700 text-white font-black"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                {isSavingEditOrder ? 'در حال ثبت اصلاحات...' : 'ذخیره اصلاحات'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Delete Order Confirmation Modal (حذف معامله) */}
      {/* ========================================================================= */}
      {deletingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-700 pb-2 border-b border-slate-200">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <h3 className="text-sm font-black text-slate-900">
                تأیید حذف معامله سفارش {deletingOrder.orderNumber}
              </h3>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-slate-700">
              <p>
                آیا از حذف کامل این سفارش از کاردکس رستوران اطمینان دارید؟
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-[11px] font-bold">
                مبلغ فاکتور: {deletingOrder.totalPayableIrr.toLocaleString('fa-IR')} ریال ({Math.round(deletingOrder.totalPayableIrr / 10).toLocaleString('fa-IR')} تومان)<br/>
                مشتری: {deletingOrder.customerNameFa}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeletingOrder(null)}>
                انصراف
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteOrder}
                disabled={isDeletingOrder}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {isDeletingOrder ? 'در حال حذف معامله...' : 'تأیید و حذف نهایی'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Add / Edit Menu Item Modal (فرم مجزا شخصی‌سازی منو) */}
      {/* ========================================================================= */}
      {(isAddingNewMenuItem || editingMenuItem) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-orange-800">
                <Settings className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {isAddingNewMenuItem ? 'افزودن غذا / نوشیدنی جدید به منو' : `ویرایش ${editingMenuItem?.titleFa}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNewMenuItem(false);
                  setEditingMenuItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-black cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">عنوان غذا / نوشیدنی:</label>
                  <input
                    type="text"
                    value={menuFormTitle}
                    onChange={(e) => setMenuFormTitle(e.target.value)}
                    placeholder="مثلاً: چلو کباب سلطانی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">دسته منو:</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(e.target.value as MenuItem['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="IRANIAN">کباب و ایرانی اصیل</option>
                    <option value="FAST_FOOD">پیتزا و فست‌فود</option>
                    <option value="PASTA_BURGER">پاستا و برگر دست‌ساز</option>
                    <option value="APPETIZER">پیش‌غذا و سالاد</option>
                    <option value="CAFE_BAR">بار کافه و نوشیدنی</option>
                    <option value="DESSERT">دسر و کیک تازه</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">شرح و محتویات غذا:</label>
                <textarea
                  value={menuFormDescription}
                  onChange={(e) => setMenuFormDescription(e.target.value)}
                  placeholder="محتویات، نوع مرینیت، دورچین و..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">قیمت (تومان):</label>
                  <input
                    type="number"
                    value={menuFormPriceToman}
                    onChange={(e) => setMenuFormPriceToman(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left font-bold text-orange-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">زمان پخت (دقیقه):</label>
                  <input
                    type="number"
                    value={menuFormPrepTime}
                    onChange={(e) => setMenuFormPrepTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">شعار / نشان (Badge):</label>
                  <input
                    type="text"
                    value={menuFormBadge}
                    onChange={(e) => setMenuFormBadge(e.target.value)}
                    placeholder="مخصوص، پرفروش..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">آدرس تصویر غذا (IMAGE URL):</label>
                <input
                  type="text"
                  value={menuFormImageUrl}
                  onChange={(e) => setMenuFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-left font-mono text-[11px]"
                />

                {/* Preset image suggestions */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">انتخاب سریع تصویر آماده:</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_IMAGES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMenuFormImageUrl(p.url)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-900 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddingNewMenuItem(false);
                  setEditingMenuItem(null);
                }}
              >
                انصراف
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveMenuItem}
                className="bg-orange-600 hover:bg-orange-700 text-white font-black"
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                ذخیره آیتم در منو
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
