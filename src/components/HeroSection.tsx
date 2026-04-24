import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.png";

interface HeroSectionProps {
  onSimulateClick: () => void;
}

const HeroSection = ({ onSimulateClick }: HeroSectionProps) => {
  const benefits = [
    "100% Gratuito",
    "Sem consulta ao SPC",
    "Resultado no WhatsApp",
    "Lojas em parceria"
  ];

  return (
    <section id="inicio" className="pt-24 pb-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                + DE 1000 SIMULAÇÕES REALIZADAS
              </p>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Simule um plano de financiamento ou consórcio ideal para a sua conquista
            </h1>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <Button 
              onClick={onSimulateClick}
              size="lg"
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-lg px-10 py-7 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Simular crédito agora →
            </Button>
          </div>

          <div className="relative animate-scale-in">
            <img 
              src={heroBanner} 
              alt="Imóveis e Veículos - Casa, Carro e Trator" 
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
