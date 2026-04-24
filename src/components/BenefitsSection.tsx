import { MessageCircle, DollarSign, FileText } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: MessageCircle,
      title: "Receba direto no WhatsApp",
      description: "Sua simulação de crédito é enviada rapidamente para o seu WhatsApp com todas as informações necessárias."
    },
    {
      icon: DollarSign,
      title: "Parcelas que cabem no seu bolso",
      description: "Encontramos as melhores condições de financiamento com parcelas que se adequam ao seu orçamento."
    },
    {
      icon: FileText,
      title: "Simulação sem compromisso",
      description: "Faça quantas simulações quiser, totalmente grátis e sem consulta ao SPC ou Serasa."
    }
  ];

  return (
    <section id="beneficios" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-5 mx-auto">
                <benefit.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
