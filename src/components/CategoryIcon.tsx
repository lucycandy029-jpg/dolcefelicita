import React from 'react';
import { 
  Sparkles, 
  Cookie, 
  Cake, 
  Coffee, 
  ChefHat, 
  Gift 
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  categoryId?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  categoryId,
  className = 'w-5 h-5'
}) => {
  const icon = (iconName || '').toLowerCase().trim();
  const id = (categoryId || '').toLowerCase().trim();

  // "Todos os Doces" / id: 'all' / 'sparkles'
  if (id === 'all' || icon === 'sparkles' || icon === 'auto_awesome') {
    return <Sparkles className={className} />;
  }

  // Cookies Artesanais
  if (id === 'cookies' || icon === 'cookie') {
    return <Cookie className={className} />;
  }

  // Brownies & Fudges / bakery_dining
  if (id === 'brownies' || icon === 'bakery_dining' || icon.includes('bakery') || icon.includes('brownie')) {
    return <ChefHat className={className} />;
  }

  // Doces Finos & Bombons / lunch_dining
  if (id === 'doces-finos' || icon === 'lunch_dining' || icon.includes('fino') || icon.includes('bombom')) {
    return <Gift className={className} />;
  }

  // Bebidas & Cafés / coffee
  if (id === 'bebidas-cafes' || icon === 'coffee' || icon.includes('cafe') || icon.includes('bebida')) {
    return <Coffee className={className} />;
  }

  // Bolos & Tortas / cake
  if (id === 'bolos-tortas' || icon === 'cake' || icon.includes('bolo') || icon.includes('torta')) {
    return <Cake className={className} />;
  }

  // Fallback default
  return <Cake className={className} />;
};
