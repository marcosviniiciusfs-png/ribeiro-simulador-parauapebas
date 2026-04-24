import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import InputMask from "react-input-mask";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SimulatorData {
  propertyType: string;
  creditAmount: string;
  hasDownPayment: string;
  downPaymentAmount: string;
  monthlyPayment: string;
  city: string;
  fullName: string;
  whatsapp: string;
}

const Simulator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<SimulatorData>({
    propertyType: "",
    creditAmount: "",
    hasDownPayment: "",
    downPaymentAmount: "",
    monthlyPayment: "",
    city: "",
    fullName: "",
    whatsapp: ""
  });

  const totalSteps = 7;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = Number(numbers) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(amount);
  };

  const handleCurrencyChange = (field: keyof SimulatorData, value: string) => {
    const formatted = formatCurrency(value);
    setFormData({ ...formData, [field]: formatted });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.propertyType !== "";
      case 1: return formData.creditAmount !== "";
      case 2: 
        if (formData.hasDownPayment === "Sim") {
          return formData.downPaymentAmount !== "";
        }
        return formData.hasDownPayment !== "";
      case 3: return formData.monthlyPayment !== "";
      case 4: return formData.city.trim() !== "";
      case 5: return formData.fullName.trim() !== "";
      case 6: return formData.whatsapp.replace(/\D/g, "").length === 11;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && formData.hasDownPayment === "Não") {
      setFormData({ ...formData, downPaymentAmount: "" });
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Formatar data no formato DD-MM-YYYY
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dataEntrada = `${day}-${month}-${year}`;
      
      // Preparar dados para envio
      const webhookData = {
        "Data de Entrada": dataEntrada,
        "Nome Completo": formData.fullName,
        "WhatsApp": formData.whatsapp,
        "Tipo de Bem": formData.propertyType,
        "Valor Pretendido (R$)": formData.creditAmount,
        "Valor de Entrada (R$)": formData.hasDownPayment === "Sim" ? formData.downPaymentAmount : "Não",
        "Parcela Ideal (R$)": formData.monthlyPayment,
        "Cidade": formData.city
      };

      // Enviar para os dois webhooks em paralelo
      const webhookUrls = [
        "https://hook.us1.make.com/n17eiuxj1wybbp2mhy6o64lmv1fbjd3c",
        "https://n8n.marcoshurtz.com.br/webhook/cf5de4dc-895b-4e2b-926d-620dbc980231",
        "https://uxttihjsxfowursjyult.supabase.co/functions/v1/form-webhook/be0b7e9fe0b8d86072f6aa0c27e379dcc45e20cb6a0a6e018c1103245cc47606"
      ];

      await Promise.all(
        webhookUrls.map((url) =>
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookData),
            mode: "no-cors",
          }).catch((err) => {
            console.warn(`Falha ao enviar para ${url}:`, err);
          })
        )
      );

      toast({
        title: "Simulação enviada!",
        description: "Em breve entraremos em contato via WhatsApp.",
      });

      // Redirecionar para página de agradecimento
      navigate("/obrigado");
    } catch (error) {
      console.error("Erro ao enviar simulação:", error);
      toast({
        title: "Erro ao enviar simulação",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary text-center block mb-6">
              Qual tipo de bem você deseja adquirir?
            </Label>
            <div className="max-w-md mx-auto">
              <Select
                value={formData.propertyType}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
              >
                <SelectTrigger className="w-full text-lg p-6">
                  <SelectValue placeholder="Selecione o tipo de bem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Imóvel">Imóvel</SelectItem>
                  <SelectItem value="Veículo">Veículo</SelectItem>
                  <SelectItem value="Moto">Moto</SelectItem>
                  <SelectItem value="Caminhão">Caminhão</SelectItem>
                  <SelectItem value="Maquinário">Maquinário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="creditAmount" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual o valor do crédito que deseja simular?
            </Label>
            <Input
              id="creditAmount"
              value={formData.creditAmount}
              onChange={(e) => handleCurrencyChange("creditAmount", e.target.value)}
              placeholder="R$ 0,00"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-primary text-center block mb-6">
              Tem valor de entrada?
            </Label>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                onClick={() => setFormData({ ...formData, hasDownPayment: "Sim" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.hasDownPayment === "Sim"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <span className="text-base font-normal">Sim</span>
              </button>
              <button
                onClick={() => setFormData({ ...formData, hasDownPayment: "Não" })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.hasDownPayment === "Não"
                    ? "border-foreground bg-foreground/5 text-foreground"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <span className="text-base font-normal">Não</span>
              </button>
            </div>
            
            {formData.hasDownPayment === "Sim" && (
              <div className="space-y-3 mt-6">
                <Label htmlFor="downPayment" className="text-sm text-muted-foreground">
                  Qual valor de entrada disponível?
                </Label>
                <Input
                  id="downPayment"
                  value={formData.downPaymentAmount}
                  onChange={(e) => handleCurrencyChange("downPaymentAmount", e.target.value)}
                  placeholder="R$ 0,00"
                  className="text-lg p-6 text-center max-w-md mx-auto"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="monthlyPayment" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual a parcela mensal ideal pra você?
            </Label>
            <Input
              id="monthlyPayment"
              value={formData.monthlyPayment}
              onChange={(e) => handleCurrencyChange("monthlyPayment", e.target.value)}
              placeholder="R$ 0,00"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="city" className="text-lg font-semibold text-primary text-center block mb-6">
              Qual cidade você reside?
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Digite sua cidade"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="fullName" className="text-lg font-semibold text-primary text-center block mb-6">
              Nome completo
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Digite seu nome completo"
              className="text-lg p-6 text-center max-w-md mx-auto"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="whatsapp" className="text-lg font-semibold text-primary text-center block mb-6">
              WhatsApp para contato
            </Label>
            <InputMask
              mask="(99) 99999-9999"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            >
              {/* @ts-ignore */}
              {(inputProps: any) => (
                <Input
                  {...inputProps}
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  className="text-lg p-6 text-center max-w-md mx-auto"
                />
              )}
            </InputMask>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="simulador" className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
              SIMULE AGORA
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Responda as perguntas para fazer sua simulação
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-foreground mb-1">
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="min-h-[220px]">
              {renderStep()}
            </div>

            <div className="flex justify-between gap-4 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-6 text-base"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-6 text-base font-semibold"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-primary hover:bg-primary-hover px-8 py-6 text-base font-semibold"
                >
                  {isSubmitting ? "Enviando..." : "Finalizar Simulação"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Simulator;
