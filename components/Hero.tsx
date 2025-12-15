import React from 'react';
import { ArrowRight, UtensilsCrossed, ChefHat } from 'lucide-react';
import Button from './Button';

interface HeroProps {
  onRegisterClick: () => void;
  onExploreClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onRegisterClick, onExploreClick }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-28 lg:pb-32">
      {/* Modern Gradient Background (Matching Landing Page) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 pointer-events-none">
         <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-yellow-200/40 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-red-100/50 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-orange-100 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-md transition-all cursor-default select-none">
          <ChefHat className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-bold text-slate-700 tracking-tight">Today's Special Menu</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-5 duration-700">
          오늘은 어떤 <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 animate-gradient-x bg-[length:200%_auto]">맛있는 프로젝트</span>를<br/>
          찾으시나요?
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-12 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          셰프(개발자)들의 정성이 담긴 사이드 프로젝트를 맛보고,<br className="hidden md:block" />
          당신의 솔직한 미식평을 남겨주세요.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <Button 
            variant="primary" 
            className="w-full sm:w-auto px-10 py-4 text-lg h-16 rounded-full shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-orange-600 to-red-500 border-none"
            onClick={onExploreClick}
          >
            메뉴판(프로젝트) 둘러보기
          </Button>
          <Button 
            variant="ghost" 
            className="w-full sm:w-auto px-10 py-4 text-lg h-16 rounded-full bg-white text-slate-600 shadow-lg hover:shadow-xl hover:text-orange-600 transition-all duration-300 border border-slate-100 hover:border-orange-100"
            onClick={onRegisterClick}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            내 요리 등록하기
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;