import { ActivityCardProps } from "@/components/dashboard/ActivityCard";
import { Badge, Button, Modal, ModalFooter } from "@/components/ui";
import { ArrowRight, ChevronRight, Rocket, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

interface ActivityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityCardProps | null;
}

function formatFullDate(dateStr: string): string {
  
  if (!dateStr) return "";

  const today = new Date();
  const currentYear = today.getFullYear();

  const monthMap: Record<string, number> = {
    JAN: 0, JANEIRO: 0,
    FEV: 1, FEVEREIRO: 1,
    MAR: 2, MARÇO: 2,
    ABR: 3, ABRIL: 3,
    MAI: 4, MAIO: 4,
    JUN: 5, JUNHO: 5,
    JUL: 6, JULHO: 6,
    AGO: 7, AGOSTO: 7,
    SET: 8, SETEMBRO: 8,
    OUT: 9, OUTUBRO: 9,
    NOV: 10, NOVEMBRO: 10,
    DEZ: 11, DEZEMBRO: 11
  };

  try {
     const parts = dateStr.trim().split(" ").filter(p => p);
     let day = 1;
     let month = 0;

     if (parts.length >= 2) {
        
         const num = parseInt(parts[0]);
         if (!isNaN(num)) day = num;

         const monthStr = parts[parts.length - 1].toUpperCase();
         if (monthMap[monthStr] !== undefined) {
             month = monthMap[monthStr];
         }
     }

     const dateObj = new Date(currentYear, month, day);
     
     // FORMATADA AS DATAS NESSE ITEM "SÁBADO, 13 DE DEZEMBRO"'
     const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
     const fullMonth = dateObj.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
     
     return `${weekday}, ${day} DE ${fullMonth}`;
  } catch (e) {
      return dateStr.toUpperCase();
  }
}

export function ActivityDetailsModal({
  isOpen,
  onClose,
  activity,
}: ActivityDetailsModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
 console.log(activity,'dados')
  useLayoutEffect(() => {
    if (descriptionRef.current && isOpen) {
     
      setIsOverflowing(descriptionRef.current.scrollHeight > 80);
    }
  }, [activity, isOpen]);

  useLayoutEffect(() => {
      if(!isOpen) setIsExpanded(false);
  }, [isOpen]);

  if (!activity) return null;

  const fullDate = formatFullDate(activity.date);
 
 //imagem background fixo
  const bannerImage = "/assets/lists.png"; 

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg" 
      showCloseButton={false} 
      contentClassName="p-0 overflow-hidden bg-[var(--rocket-gray-850)] border-0" 
    >
      <div className="flex flex-col h-full relative overflow-y-auto max-h-[85vh]">
        
 
        <button 
           onClick={onClose}
           className="absolute top-4 right-4 z-30 text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-1"
        >
            <X className="w-5 h-5" />
        </button>

       
        <div className="relative w-full aspect-video sm:aspect-2/1 md:h-[300px] bg-[#121214] overflow-hidden">
             <img 
                src={activity.banner_image || bannerImage}
                alt="Banner do evento"
                className="object-cover w-full h-full"
             />
             
             <div className="absolute inset-0  bottom-0 h-1/3" />
        </div>

       
        <div className="p-6 md:p-8 space-y-6">
            
           
            <div>
                 <p className="text-[#8257e5] font-bold text-sm tracking-wide mb-2 uppercase">
                    {fullDate || "SÁBADO, 18 DE DEZEMBRO"}
                 </p>
                 <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {activity.title}
                 </h2>
            </div>
            
          
            <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[--rocket-gray-850] border border-[--rocket-gray-500]">
                     <Rocket className="w-3 h-3 text-[var(--rocket-green-dark)]" />
                     <span className="text-[10px] font-medium text-white tracking-wide uppercase">ASSINANTES</span>
                 </div>
            </div>

          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-t border-[#29292e] border-b">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500 p-[1px]">
                        <div className="w-full h-full rounded-full bg-[#202024] flex items-center justify-center overflow-hidden">
                            <span className="text-xs">FS</span> 
                        </div>
                     </div>
                     <div>
                         <p className="text-white font-bold text-sm">Fernando Sorrentino</p>
                         <p className="text-[#a8a8b3] text-xs">Co-founder & Software Engineer</p>
                     </div>
                 </div>
                  
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 p-[1px]">
                        <div className="w-full h-full rounded-full bg-[#202024] flex items-center justify-center overflow-hidden">
                             <span className="text-xs">JL</span>
                        </div>
                     </div>
                     <div className="flex-1">
                         <p className="text-white font-bold text-sm">Jonadab Leite</p>
                         <p className="text-[#a8a8b3] text-xs">Co-founder & Tech Director</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-[#737380]" />
                 </div>
            </div>

          
            <div className="relative">
                <div 
                    ref={descriptionRef}
                    className={cn(
                        "text-[#a8a8b3] mb-10 leading-relaxed text-sm md:text-base transition-all duration-300",
                        !isExpanded && "max-h-[80px] overflow-hidden" 
                    )}
                >
                     {activity.description || "Aprenda com especialistas de mercado a dominar IA aplicada, MCPs e agentes de automação para evoluir sua carreira com eficiência real."}
                </div>

               
                {!isExpanded && isOverflowing && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--rocket-gray-850)] via-[var(--rocket-gray-850)]/80 to-transparent flex items-end justify-start">
                         {/* Button placed relatively or absolutely, here we just cover text */}
                    </div>
                )}
                
               
                {!isExpanded && isOverflowing && (
                    <button 
                        onClick={() => setIsExpanded(true)}
                        className="relative z-10 mt-2 text-[#8257e5] hover:text-[#9466ff] text-xs font-bold uppercase hover:underline flex items-center gap-1 transition-colors"
                    >
                        Continuar lendo
                        <ChevronDown className="w-3 h-3" />
                    </button>
                )}
            </div>
            
            
            <div className="pt-2 border-t border-transparent">
                 {activity.actionButtons?.primary ? (
                     <Button 
                        onClick={activity.actionButtons.primary.onClick}
                        className="w-full md:w-auto md:ml-auto bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold h-12 px-8 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wide float-right"
                     >
                        {activity.actionButtons.primary.label}
                        <ArrowRight className="w-4 h-4" />
                     </Button>
                 ) : (
                     <Button 
                        className="w-full md:w-auto md:ml-auto bg-[#8257e5] hover:bg-[#9466ff] text-white font-bold h-12 px-8 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wide float-right"
                     >
                        Quero assinar
                        <ArrowRight className="w-4 h-4" />
                     </Button>
                 )}
            </div>

        </div>
      </div>
    </Modal>
  );
}
