import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InputMask from "react-input-mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  fullName: string;
  whatsapp: string;
  interest: string;
}

const totalSteps = 3;

const Simulator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({ fullName: "", whatsapp: "", interest: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    if (currentStep === 0) return formData.fullName.trim() !== "";
    if (currentStep === 1) return formData.whatsapp.replace(/\D/g, "").length === 11;
    return formData.interest !== "";
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const webhookData = {
        "Data de Entrada": new Intl.DateTimeFormat("pt-BR").format(new Date()),
        "Nome Completo": formData.fullName,
        WhatsApp: formData.whatsapp,
        Interesse: formData.interest,
      };
      const webhookUrls = [
        "https://hook.us1.make.com/n17eiuxj1wybbp2mhy6o64lmv1fbjd3c",
        "https://n8n.marcoshurtz.com.br/webhook/cf5de4dc-895b-4e2b-926d-620dbc980231",
        "https://uxttihjsxfowursjyult.supabase.co/functions/v1/form-webhook/be0b7e9fe0b8d86072f6aa0c27e379dcc45e20cb6a0a6e018c1103245cc47606",
      ];

      await Promise.all(webhookUrls.map((url) => fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData),
        mode: "no-cors",
      }).catch((error) => console.warn(`Falha ao enviar para ${url}:`, error))));

      toast({ title: "Solicitação enviada!", description: "Em breve entraremos em contato pelo WhatsApp." });
      navigate("/obrigado");
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({ title: "Erro ao enviar formulário", description: "Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return <div className="space-y-4">
        <Label htmlFor="fullName" className="text-lg font-semibold text-primary text-center block mb-6">Nome completo</Label>
        <Input id="fullName" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} placeholder="Digite seu nome completo" className="text-lg p-6 text-center max-w-md mx-auto" />
      </div>;
    }

    if (currentStep === 1) {
      return <div className="space-y-4">
        <Label htmlFor="whatsapp" className="text-lg font-semibold text-primary text-center block mb-6">Telefone para contato</Label>
        <InputMask mask="(99) 99999-9999" value={formData.whatsapp} onChange={(event) => setFormData({ ...formData, whatsapp: event.target.value })}>
          {/* @ts-ignore react-input-mask uses a render callback. */}
          {(inputProps: any) => <Input {...inputProps} id="whatsapp" placeholder="(00) 00000-0000" className="text-lg p-6 text-center max-w-md mx-auto" />}
        </InputMask>
      </div>;
    }

    return <div className="space-y-4">
      <Label htmlFor="interest" className="text-lg font-semibold text-primary text-center block mb-6">Qual é o seu interesse?</Label>
      <div className="max-w-md mx-auto">
        <Select value={formData.interest} onValueChange={(interest) => setFormData({ ...formData, interest })}>
          <SelectTrigger id="interest" className="w-full text-lg p-6"><SelectValue placeholder="Selecione uma opção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Imóvel">Imóvel</SelectItem>
            <SelectItem value="Veículo">Veículo</SelectItem>
            <SelectItem value="Moto">Moto</SelectItem>
            <SelectItem value="Caminhão">Caminhão</SelectItem>
            <SelectItem value="Maquinário">Maquinário</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>;
  };

  return <section id="simulador" className="py-20 bg-gradient-to-b from-white to-blue-50">
    <div className="container mx-auto px-4"><div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">SIMULE AGORA</p>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Preencha seus dados para fazer sua simulação</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 space-y-8">
        <div className="space-y-3"><div className="flex justify-between text-sm font-medium text-foreground mb-1"><span>{Math.round(progress)}%</span></div><Progress value={progress} className="h-3" /></div>
        <div className="min-h-[220px]">{renderStep()}</div>
        <div className="flex justify-between gap-4 pt-6">
          <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 0} className="flex items-center gap-2 px-6 py-6 text-base"><ChevronLeft className="w-4 h-4" />Voltar</Button>
          {currentStep < totalSteps - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-6 text-base font-semibold">Próximo<ChevronRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canProceed() || isSubmitting} className="bg-primary hover:bg-primary-hover px-8 py-6 text-base font-semibold">{isSubmitting ? "Enviando..." : "Finalizar simulação"}</Button>
          )}
        </div>
      </div>
    </div></div>
  </section>;
};

export default Simulator;
