import {
  AppOutline,
  CollectMoneyOutline,
  FileOutline,
  HeartOutline,
  PayCircleOutline,
  ShopbagOutline,
  TravelOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons';
import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface CategoryVisual {
  Icon: IconComponent;
  tone: 'gold' | 'apricot' | 'cream' | 'blush';
}

const categoryVisualMap: Record<string, CategoryVisual> = {
  food: {
    Icon: PayCircleOutline,
    tone: 'gold',
  },
  transport: {
    Icon: TravelOutline,
    tone: 'apricot',
  },
  shopping: {
    Icon: ShopbagOutline,
    tone: 'cream',
  },
  housing: {
    Icon: AppOutline,
    tone: 'blush',
  },
  entertainment: {
    Icon: CollectMoneyOutline,
    tone: 'gold',
  },
  medical: {
    Icon: HeartOutline,
    tone: 'apricot',
  },
  study: {
    Icon: FileOutline,
    tone: 'cream',
  },
  other: {
    Icon: UnorderedListOutline,
    tone: 'blush',
  },
};

export function getCategoryVisual(categoryId: string): CategoryVisual {
  return (
    categoryVisualMap[categoryId] ?? {
      Icon: UnorderedListOutline,
      tone: 'cream',
    }
  );
}
