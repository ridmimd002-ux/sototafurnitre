import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Category } from '../../types';
import { ShopPage } from './ShopPage';

interface CategoryPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug, onNavigate }) => {
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const q = query(collection(db, 'categories'), where('slug', '==', slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setCategory({ id: snap.docs[0].id, ...snap.docs[0].data() } as Category);
        }
      } catch {
        // Safe fallback
      }
    };
    fetchCategory();
  }, [slug]);

  return (
    <div>
      {category && (
        <div className="bg-[#0f2c59] text-white py-8 px-4 border-b border-[#1e40af]/30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#f59e0b] font-bold">Category</span>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">{category.name}</h1>
              {category.description && (
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">{category.description}</p>
              )}
            </div>
            {category.image && (
              <div className="hidden sm:block w-20 h-20 rounded-xl overflow-hidden bg-white/10 p-1 border border-white/20">
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ShopPage 
        initialCategory={slug}
        onNavigate={onNavigate}
      />
    </div>
  );
};
