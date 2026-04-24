import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Obrigado = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-20 h-20 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Obrigado!
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Sua solicitação foi enviada com sucesso! Em breve entraremos em contato.
          </p>
          
          <Button 
            onClick={() => navigate("/")}
            size="lg"
            className="mt-8"
          >
            Voltar para o início
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Obrigado;
